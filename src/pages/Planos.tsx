import React, { useState, useEffect } from 'react'
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePaymentStatus } from '../hooks/usePaymentStatus-webhook';
import { usePayment } from '../hooks/usePayment';
import { CardPaymentBrick } from '../components/payment/CardPaymentBrick';
import { CreditCard, Zap, Check, Smartphone, Clock, Star, Shield, AlertCircle } from 'lucide-react';

// Declaração de tipos para window.MercadoPago
declare global {
  interface Window {
    MercadoPago: any;
    mp: any;
  }
}

// Função generatePixCode removida - usando API oficial do Mercado Pago

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  description: string;
  maxClients: number;
  maxPets: number;
  maxUsers: number;
}

const plans: Plan[] = [
  {
    id: 'premium',
    name: 'NanoSync CRM Premium',
    price: 699.97,
    interval: 'monthly',
    popular: true,
    description: 'Solução completa de automação com IA para turbinar suas vendas',
    maxClients: -1,
    maxPets: -1,
    maxUsers: -1,
    features: [
      'IA WhatsApp 24/7 - Atendimento automático',
      'Captura de Leads Inteligente',
      'Aumento comprovado de 300% no ROI',
      'Automação completa de vendas',
      'Relatórios avançados de conversão',
      'Usuários ilimitados',
      'Integração com todas as plataformas',
      'Suporte VIP 24/7',
      'Configuração personalizada',
      'Atualizações prioritárias'
    ]
  }
];

function Planos() {
  const { data: user } = useCurrentUser();
  const { isPaymentApproved, isLoading, error, startRealtimeListener } = usePaymentStatus();
  const { processCardPayment: handleCardPayment, isProcessing: isProcessingCard } = usePayment();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<'plans' | 'checkout' | 'payment-status'>('plans');
  const [paymentTimeout, setPaymentTimeout] = useState(false);
  const [planoExpiraEm, setPlanoExpiraEm] = useState<string | null>(null);

  // Dados do formulário
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    document: '',
    documentType: 'CPF'
  });

  // Estado para notificações de erro
  const [formErrors, setFormErrors] = useState({
    document: ''
  });

  // Flag para controlar se deve carregar dados automaticamente
  const [hasLoadedUserData, setHasLoadedUserData] = useState(false);

  // Preencher dados do usuário automaticamente (apenas uma vez)
  useEffect(() => {
    const loadUserData = async () => {
      if (user && !hasLoadedUserData) {
        try {
          // Buscar dados completos do perfil
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

          // Buscar dados do vendedor se existir
          const { data: vendedor } = await supabase
            .from('vendedores')
            .select('cpf')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            // Separar nome completo em primeiro nome e sobrenome
            const nameParts = profile.full_name?.split(' ') || [];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            setFormData(prev => ({
              ...prev,
              firstName,
              lastName,
              email: profile.email || user.email || '',
              document: vendedor?.cpf || ''
            }));
          }
          
          // Marcar como carregado para evitar sobrescrever edições do usuário
          setHasLoadedUserData(true);
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
          // Fallback para dados básicos
          setFormData(prev => ({
            ...prev,
            email: user.email || ''
          }));
          setHasLoadedUserData(true);
        }
      }
    };

    loadUserData();
  }, [user, hasLoadedUserData]);

  // Buscar data de expiração do plano quando pagamento for aprovado
  useEffect(() => {
    const fetchPlanoExpiracao = async () => {
      if (isPaymentApproved && user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('plano_expira_em')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Erro ao buscar data de expiração:', error);
            return;
          }

          if (data?.plano_expira_em) {
            setPlanoExpiraEm(data.plano_expira_em);
          }
        } catch (error) {
          console.error('Erro ao buscar plano:', error);
        }
      }
    };

    fetchPlanoExpiracao();
  }, [isPaymentApproved, user?.id]);

  const [cardData, setCardData] = useState({
    numero_cartao: '',
    validade: '',
    cvv: '',
    nome_cartao: '',
    banco_emissor: '',
    parcelas: '',
    cpf: ''
  });

  // Dados do cartão (para CardForm) - será implementado futuramente
  // const [cardFormReady, setCardFormReady] = useState(false);

  useEffect(() => {
    // Carregar script do Mercado Pago
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      // Inicializar Mercado Pago com a public key do ambiente
      const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
      if (publicKey) {
        window.mp = new window.MercadoPago(publicKey);
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setCurrentStep('checkout');
  };

  // Sincronizar com hook de status de pagamento e controlar timeout
  useEffect(() => {
    if (isPaymentApproved) {
      setPaymentTimeout(false);
    }
  }, [isPaymentApproved]);

  // Controlar timeout de 20 minutos para pagamento PIX
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (currentStep === 'payment-status' && paymentResult && !isPaymentApproved && !paymentTimeout) {
      // Iniciar contagem de 20 minutos (1200000ms)
      timeoutId = setTimeout(() => {
        setPaymentTimeout(true);
      }, 20 * 60 * 1000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentStep, paymentResult, isPaymentApproved, paymentTimeout]);

  // Controlar verificação de status baseado na página atual
  const [cleanupFunction, setCleanupFunction] = useState<(() => void) | null>(null);
  
  useEffect(() => {
    // Se saiu da página de payment-status, parar verificação
    if (currentStep !== 'payment-status' && cleanupFunction) {
      cleanupFunction();
      setCleanupFunction(null);
    }
  }, [currentStep, cleanupFunction]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan || !user) return;

    setIsProcessing(true);

    try {
      if (paymentMethod === 'pix') {
        await processPIXPayment();
      } else {
        await processCardPayment();
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para aplicar máscara de CPF
  const applyCPFMask = (value: string): string => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue.length <= 11) {
      return cleanValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  // Função para validar CPF
  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/[^0-9]/g, '');
    
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // CPF com todos os dígitos iguais
    
    // Validação do algoritmo do CPF
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  };

  // Função para lidar com mudanças no campo de documento
  const handleDocumentChange = (value: string) => {
    let maskedValue = value;
    
    if (formData.documentType === 'CPF') {
      maskedValue = applyCPFMask(value);
      
      // Validar CPF em tempo real apenas se tiver 11 dígitos
      const cleanValue = value.replace(/[^0-9]/g, '');
      if (cleanValue.length === 11) {
        if (!validateCPF(cleanValue)) {
          setFormErrors(prev => ({
            ...prev,
            document: 'CPF inválido. Verifique os números digitados.'
          }));
        } else {
          setFormErrors(prev => ({
            ...prev,
            document: ''
          }));
        }
      } else if (cleanValue.length > 0) {
        setFormErrors(prev => ({
          ...prev,
          document: cleanValue.length < 11 ? 'CPF deve ter 11 dígitos' : ''
        }));
      } else {
        setFormErrors(prev => ({
          ...prev,
          document: ''
        }));
      }
    }
    
    setFormData(prev => ({
      ...prev,
      document: maskedValue
    }));
  };

  const processPIXPayment = async () => {
    if (!selectedPlan || !user) {
      throw new Error('Dados incompletos');
    }

    // Validar campos obrigatórios
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.document) {
      throw new Error('Preencha todos os campos obrigatórios');
    }

    // Validar CPF
    const cleanDocument = formData.document.replace(/[^0-9]/g, '');
    if (!validateCPF(cleanDocument)) {
      setFormErrors(prev => ({
        ...prev,
        document: 'CPF inválido. Verifique o número informado.'
      }));
      throw new Error('CPF inválido. Verifique o número informado.');
    }

    try {
      // Chamar API do Mercado Pago diretamente
      const accessToken = import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN;
      
      if (!accessToken) {
        throw new Error('Token do Mercado Pago não configurado. Verifique VITE_MERCADOPAGO_ACCESS_TOKEN no arquivo .env');
      }

      // Chave de idempotência será gerada na função Supabase

      const mercadoPagoPayload = {
        transaction_amount: selectedPlan.price,
        description: `${selectedPlan.name} - NanoSync CRM com IA WhatsApp`,
        payment_method_id: "pix",
        payer: {
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          identification: {
            type: formData.documentType,
            number: cleanDocument // Usar CPF já validado e limpo
          }
        }
      };

      const response = await supabase.functions.invoke('create-payment', {
        body: {
          paymentData: mercadoPagoPayload,
          paymentMethod: 'pix'
        }
      });

      const { data, error } = response;

      if (error) {
        console.error('Erro na função Supabase:', error);
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (!data) {
        throw new Error('Resposta vazia da função');
      }

      // Usar QR Code em base64 diretamente da resposta do Mercado Pago
      const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;
      const qrCodeString = data.point_of_interaction?.transaction_data?.qr_code;

      setPaymentResult({
        ...data,
        qr_code_base64: qrCodeBase64,
        qr_code_string: qrCodeString
      });

      // Iniciar verificação de pagamento via webhook
      setCurrentStep('payment-status');
      
      // Aguardar confirmação via webhook (Supabase Realtime)
      if (data.id) {
        const cleanup = startRealtimeListener(data.id.toString());
        setCleanupFunction(() => cleanup);
      }

    } catch (error) {
      console.error('Erro completo:', error);
      throw error;
    }
  };

  const processCardPayment = async () => {
    if (!selectedPlan || !user) {
      throw new Error('Dados incompletos');
    }

    // Validar campos obrigatórios
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.document) {
      throw new Error('Preencha todos os campos obrigatórios');
    }

    // Validar campos do cartão
    if (!cardData.numero_cartao || !cardData.validade || !cardData.cvv || !cardData.nome_cartao) {
      throw new Error('Preencha todos os campos do cartão');
    }

    try {
      // Obter o usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Salvar dados do cartão no Supabase
      const { error } = await supabase
        .from('cards')
        .insert({
          user_id: user.id,
          numero_cartao: cardData.numero_cartao,
          validade: cardData.validade,
          cvv: cardData.cvv,
          nome_cartao: cardData.nome_cartao,
          banco_emissor: cardData.banco_emissor,
          parcelas: cardData.parcelas,
          cpf: cardData.cpf || formData.document
        });

      if (error) {
        console.error('Erro ao salvar dados do cartão:', error);
        throw new Error('Erro ao processar dados do cartão');
      }

      // Mostrar mensagem de indisponibilidade
      toast.error('Função Cartão de Crédito indisponível no momento. Por favor, use a forma de pagamento PIX ou tente novamente mais tarde!');
      
      // Resetar para método PIX
      setPaymentMethod('pix');
      
    } catch (error) {
      console.error('Erro no processamento do cartão:', error);
      throw error;
    }
  };

  // Inicializar CardForm quando método cartão for selecionado
  // useEffect(() => {
  //   if (paymentMethod === 'card' && window.mp && currentStep === 'checkout') {
  //     setTimeout(() => {
  //       try {
  //         // Inicializar CardForm (será usado quando implementado)
  //         window.mp.cardForm({
  //           amount: selectedPlan?.price.toString() || '0',
  //           iframe: true,
  //           form: {
  //             id: 'form-checkout',
  //             cardNumber: { id: 'form-checkout__cardNumber', placeholder: 'Número do cartão' },
  //             expirationDate: { id: 'form-checkout__expirationDate', placeholder: 'MM/YY' },
  //             securityCode: { id: 'form-checkout__securityCode', placeholder: 'CVV' },
  //             cardholderName: { id: 'form-checkout__cardholderName', placeholder: 'Nome no cartão' },
  //             issuer: { id: 'form-checkout__issuer', placeholder: 'Banco emissor' },
  //             installments: { id: 'form-checkout__installments', placeholder: 'Parcelas' },
  //             identificationType: { id: 'form-checkout__identificationType' },
  //             identificationNumber: { id: 'form-checkout__identificationNumber', placeholder: 'CPF' },
  //             cardholderEmail: { id: 'form-checkout__cardholderEmail', placeholder: 'Email' }
  //           },
  //           callbacks: {
  //             onFormMounted: (error: any) => {
  //               if (error) {
  //                 console.warn('Form Mounted handling error: ', error);
  //                 return;
  //               }
  //               console.log('CardForm montado com sucesso');
  //               // setCardFormReady(true); // Comentado até implementação completa
  //             },
  //             onSubmit: async (event: any) => {
  //               event.preventDefault();
  //               console.log('CardForm submetido');
  //               // Implementar processamento do cartão
  //             }
  //           }
  //         });
  //       } catch (error) {
  //         console.error('Erro ao inicializar CardForm:', error);
  //       }
  //     }, 100);
  //   }
  // }, [paymentMethod, currentStep, selectedPlan]);

  if (currentStep === 'checkout' && selectedPlan) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url(/background.png)'}}>
        <div className="min-h-screen bg-gradient-to-b from-purple-900/80 to-purple-800/70 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Plan Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 h-fit">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Resumo do Pedido</h2>
                <button
                  onClick={() => setCurrentStep('plans')}
                  className="text-gray-500 hover:text-gray-700 flex items-center text-sm"
                >
                  ← Voltar
                </button>
              </div>

              {/* Plan Details */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{selectedPlan.name}</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{selectedPlan.description}</p>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500 line-through">R$ 1.299,97</span>
                      <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        46% OFF
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Valor mensal:</span>
                    <span className="text-2xl font-bold text-gray-900">R$ {selectedPlan.price.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Cancele quando quiser</p>
                </div>
              </div>

              {/* Security Features */}
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 text-green-600 mr-2" />
                  <span>Pagamento 100% seguro</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-blue-600 mr-2" />
                  <span>Ativação imediata</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CreditCard className="h-4 w-4 text-purple-600 mr-2" />
                  <span>Garantia de 30 dias</span>
                </div>
              </div>
            </div>

            {/* Right Column - Payment Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dados de Pagamento</h2>

              {/* Payment Method Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Método de Pagamento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-4 border-2 rounded-xl flex items-center justify-center transition-all ${
                      paymentMethod === 'pix' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Smartphone className="h-5 w-5 mr-2" />
                    <span className="font-medium">PIX</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 border-2 rounded-xl flex items-center justify-center transition-all ${
                      paymentMethod === 'card' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    <span className="font-medium">Cartão</span>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                {/* Campos de dados pessoais - apenas para PIX */}
                {paymentMethod === 'pix' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Seu nome"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Sobrenome</label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Seu sobrenome"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="seu@email.com"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
                        <select
                          value={formData.documentType}
                          onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="CPF">CPF</option>
                          <option value="CNPJ">CNPJ</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Documento</label>
                        <input
                          type="text"
                          required
                          value={formData.document}
                          onChange={(e) => handleDocumentChange(e.target.value)}
                          placeholder={formData.documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            formErrors.document ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          maxLength={formData.documentType === 'CPF' ? 14 : 18}
                        />
                        {formErrors.document && (
                          <div className="mt-2 flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {formErrors.document}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Formulário de Cartão - Card Payment Brick */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-green-600 mr-2" />
                        <p className="text-sm text-green-800">
                          <strong>Pagamento 100% Seguro!</strong> Processado diretamente pelo Mercado Pago com criptografia de ponta.
                        </p>
                      </div>
                    </div>
                    
                    {/* Card Payment Brick do Mercado Pago */}
                    {selectedPlan && user && (
                      <CardPaymentBrick
                        amount={selectedPlan.price}
                        onSubmit={async (formData, additionalData) => {
                          const result = await handleCardPayment(
                            formData,
                            additionalData,
                            user.id,
                            selectedPlan.id,
                            selectedPlan.name
                          )
                          
                          if (result?.success) {
                            setPaymentResult(result.result)
                            setCurrentStep('payment-status')
                          }
                        }}
                        onReady={() => {
                          // Formulário pronto
                        }}
                        onError={(error) => {
                          console.error('Erro no formulário:', error)
                          toast.error('Erro ao carregar formulário de pagamento')
                        }}
                      />
                    )}
                  </div>
                )}

              {paymentMethod === 'pix' && (
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg"
                >
                  {isProcessing ? 'Processando...' : `Finalizar Pagamento - R$ ${selectedPlan.price.toFixed(2)}`}
                </button>
              )}
              </form>

              {/* Security Badges */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4 font-medium">Pagamento 100% Seguro e Protegido</p>
                  <div className="flex justify-center">
                    <img 
                      src="/seguranca.png" 
                      alt="Selos de Segurança - Pagamento Protegido" 
                      className="max-w-full h-auto"
                      style={{ maxHeight: '80px' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Seus dados são criptografados e processados com segurança bancária
                  </p>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar tela de status do pagamento
  if (currentStep === 'payment-status' && paymentResult) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url(/background.png)'}}>
        <div className="min-h-screen bg-gradient-to-b from-purple-900/80 to-purple-800/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Back Button */}
            <div className="mb-8">
              <button
                onClick={() => {
                  setCurrentStep('plans');
                  setPaymentResult(null);
                  setSelectedPlan(null);
                  // Parar verificação se estiver ativa
                  if (cleanupFunction) {
                    cleanupFunction();
                    setCleanupFunction(null);
                  }
                }}
                className="inline-flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white/95 transition-colors border border-purple-200 shadow-lg"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar aos Planos
              </button>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Left Column - Plan Summary */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl mb-4 shadow-lg">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedPlan?.name || 'NanoSync CRM Premium'}
                  </h2>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    R$ {selectedPlan?.price.toFixed(2) || '699,97'}
                  </div>
                  <p className="text-gray-600">Pagamento via PIX</p>
                </div>

                {/* Features Preview */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center text-gray-700">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm">IA WhatsApp 24/7 - Atendimento automático</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm">Aumento comprovado de 300% no ROI</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm">Usuários ilimitados</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm">Suporte VIP 24/7</span>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="text-center pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-4 font-medium">Pagamento 100% Seguro</p>
                  <div className="flex justify-center items-center space-x-4">
                    <div className="flex items-center bg-green-50 px-3 py-2 rounded-lg">
                      <Shield className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-xs font-medium text-green-700">Criptografado</span>
                    </div>
                    <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg">
                      <Clock className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-xs font-medium text-blue-700">Instantâneo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - PIX Payment */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full mb-4 shadow-lg">
                    <Smartphone className="h-5 w-5 mr-2" />
                    <span className="font-semibold text-sm">PIX GERADO</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Finalize seu Pagamento
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Escaneie o QR Code ou copie o código PIX
                  </p>
                </div>

                {/* QR Code */}
                {paymentResult.qr_code_base64 && (
                  <div className="text-center mb-8">
                    <div className="bg-white p-4 rounded-xl shadow-inner border-2 border-gray-100 inline-block">
                      <img 
                        src={`data:image/jpeg;base64,${paymentResult.qr_code_base64}`}
                        alt="QR Code PIX"
                        className="mx-auto"
                        style={{ width: '200px', height: '200px' }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-3 font-medium">
                      Abra o app do seu banco e escaneie
                    </p>
                  </div>
                )}

                {/* Código PIX */}
                {paymentResult.qr_code_string && (
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Código PIX (Copia e Cola):
                    </label>
                    <div className="relative">
                      <textarea
                        readOnly
                        value={paymentResult.qr_code_string}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl text-xs bg-gray-50 h-24 resize-none font-mono"
                        onClick={(e) => e.currentTarget.select()}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(paymentResult.qr_code_string);
                          // Feedback visual seria bom aqui
                        }}
                        className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Status */}
                <div className={`p-4 rounded-xl border-2 ${
                  isPaymentApproved 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center mb-2">
                    {isPaymentApproved ? (
                      <Check className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
                    )}
                    <p className={`font-semibold ${
                      isPaymentApproved ? 'text-green-800' : 'text-blue-800'
                    }`}>
                      {isPaymentApproved ? 'Pagamento Aprovado!' : 'Aguardando Pagamento'}
                    </p>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p className={isPaymentApproved ? 'text-green-700' : 'text-blue-700'}>
                      ID: {paymentResult.id}
                    </p>
                    {isPaymentApproved && planoExpiraEm && (
                      <p className="text-green-700">
                        Expira: {new Date(planoExpiraEm).toLocaleString('pt-BR')}
                      </p>
                    )}
                    {!isPaymentApproved && paymentResult.date_of_expiration && (
                      <p className="text-blue-700">
                        Expira: {new Date(paymentResult.date_of_expiration).toLocaleString('pt-BR')}
                      </p>
                    )}
                    {isLoading && (
                      <p className="text-blue-700 font-medium">
                        Verificando pagamento...
                      </p>
                    )}
                    {error && (
                      <p className="text-red-600 font-medium">
                        Erro: {error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Success Action */}
                {isPaymentApproved && (
                  <div className="mt-6">
                    <button
                      onClick={() => window.location.href = '/app/dashboard'}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold text-lg shadow-lg"
                    >
                      Acessar Dashboard
                    </button>
                  </div>
                )}

                {/* Timeout Action */}
                {paymentTimeout && (
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        setCurrentStep('checkout');
                        setPaymentResult(null);
                        setPaymentTimeout(false);
                        // Parar verificação se estiver ativa
                        if (cleanupFunction) {
                          cleanupFunction();
                          setCleanupFunction(null);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold text-lg shadow-lg"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url(/background.png)'}}>
      <div className="min-h-screen bg-gradient-to-b from-purple-900/80 to-purple-800/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white/95 transition-colors border border-purple-200 shadow-lg"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar ao Site
            </button>
          </div>

          {/* Header Section */}
          <div className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full mb-8 shadow-lg">
            <Zap className="h-5 w-5 mr-2" />
            <span className="font-semibold text-sm uppercase tracking-wide">Oferta Limitada</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
            Automatize Suas Vendas
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              com Inteligência Artificial
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-purple-100 mb-8 max-w-4xl mx-auto leading-relaxed">
            Transforme seu negócio com nossa plataforma de automação inteligente. 
            <strong className="text-white">Aumento comprovado de 300% no ROI</strong> através de 
            atendimento automatizado 24/7 no WhatsApp.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-purple-100">
            <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm border">
              <Clock className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-medium text-gray-700">Ativo em 5 minutos</span>
            </div>
            <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm border">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-gray-700">Garantia 30 dias</span>
            </div>
          </div>
        </div>

          {/* Plan Card Section */}
          <div className="max-w-4xl mx-auto mb-16">
            {plans.map((plan) => (
              <div key={plan.id} className="relative">
                {/* Popular Badge - Positioned with proper spacing */}
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    <Star className="h-4 w-4 mr-2 inline" />
                    MAIS ESCOLHIDO
                  </div>
                </div>
                
                {/* Plan Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 p-8 lg:p-12">
                  <div className="p-8 lg:p-12">
                    {/* Header */}
                    <div className="text-center mb-10 pt-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl mb-6 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      
                      <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">
                        {plan.name}
                      </h3>
                      
                      <div className="mb-8">
                        <div className="flex items-center justify-center mb-4">
                          <span className="text-xl text-gray-500 line-through mr-4">R$ 1.299,97</span>
                          <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                            46% OFF
                          </div>
                        </div>
                        <div className="text-5xl lg:text-6xl font-bold text-gray-900 mb-2">
                          R$ {plan.price.toFixed(2)}
                        </div>
                        <p className="text-lg text-gray-600 font-medium">/mês • Cancele quando quiser</p>
                      </div>
                      
                      <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
                        {plan.description}
                      </p>
                    </div>
                    
                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 gap-4 mb-10">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-gray-800 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* CTA Button */}
                    <div className="text-center">
                      <button
                        onClick={() => handleSelectPlan(plan)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] relative overflow-hidden"
                      >
                        <span className="relative flex items-center justify-center">
                          Começar Agora
                          <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </button>
                      
                      <div className="mt-6 flex items-center justify-center space-x-8 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-green-600 mr-2" />
                          <span>Garantia 30 dias</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-blue-600 mr-2" />
                          <span>Ativação imediata</span>
                        </div>
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 text-purple-600 mr-2" />
                          <span>Pagamento seguro</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Benefits Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 lg:p-12 border border-purple-200">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-purple-900 mb-4">
                Por que mais de 10.000 empresas confiam no NanoSync?
              </h2>
              <p className="text-xl text-purple-700 max-w-3xl mx-auto">
                A plataforma de automação mais completa e eficiente do mercado
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-bold text-purple-900 mb-3 text-xl">WhatsApp IA 24/7</h3>
                <p className="text-gray-700 leading-relaxed">
                  Atendimento inteligente que qualifica leads e agenda reuniões automaticamente
                </p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border border-pink-200">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="font-bold text-pink-900 mb-3 text-xl">ROI Comprovado</h3>
                <p className="text-gray-700 leading-relaxed">
                  Aumento médio de 300% nas vendas com nossa automação inteligente
                </p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-purple-900 mb-3 text-xl">Implementação Rápida</h3>
                <p className="text-gray-700 leading-relaxed">
                  Configure em minutos e comece a automatizar suas vendas hoje mesmo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Planos;
