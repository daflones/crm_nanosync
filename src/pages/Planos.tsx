import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePaymentStatus } from '../hooks/usePaymentStatus-webhook';
import { CreditCard, Zap, Check, AlertTriangle, Smartphone, Clock, Star, Shield } from 'lucide-react';

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
    id: 'basic',
    name: 'Básico',
    price: 29.90,
    interval: 'monthly',
    description: 'Ideal para clínicas pequenas',
    maxClients: 100,
    maxPets: 200,
    maxUsers: 2,
    features: [
      'Até 100 clientes',
      'Até 200 pets',
      'Agendamentos ilimitados',
      '2 usuários',
      'Relatórios básicos',
      'Suporte por email'
    ]
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: 59.90,
    interval: 'monthly',
    popular: true,
    description: 'Para clínicas em crescimento',
    maxClients: 1000,
    maxPets: 2000,
    maxUsers: 5,
    features: [
      'Até 1.000 clientes',
      'Até 2.000 pets',
      'Agendamentos ilimitados',
      '5 usuários',
      'Relatórios avançados',
      'Campos personalizados',
      'API de integração',
      'Suporte prioritário'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 119.90,
    interval: 'monthly',
    description: 'Para grandes clínicas',
    maxClients: -1,
    maxPets: -1,
    maxUsers: -1,
    features: [
      'Clientes ilimitados',
      'Pets ilimitados',
      'Usuários ilimitados',
      'Relatórios personalizados',
      'Integração completa',
      'Backup automático',
      'Suporte 24/7',
      'Gerente de conta dedicado'
    ]
  }
];

function Planos() {
  const { data: user } = useCurrentUser();
  const { isPaymentApproved, isLoading, error, startRealtimeListener } = usePaymentStatus();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<'plans' | 'form' | 'success' | 'payment-status'>('plans');

  // Dados do formulário
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    document: '',
    documentType: 'CPF'
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
    setCurrentStep('form');
  };

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
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processPIXPayment = async () => {
    if (!selectedPlan || !user) {
      throw new Error('Dados incompletos');
    }

    // Validar campos obrigatórios
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.document) {
      throw new Error('Preencha todos os campos obrigatórios');
    }

    try {
      // Chamar API do Mercado Pago diretamente
      const accessToken = import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN;
      
      console.log('Verificando token:', accessToken ? 'Token encontrado' : 'Token não encontrado');
      console.log('Variáveis de ambiente disponíveis:', Object.keys(import.meta.env).filter(key => key.includes('MERCADO')));
      
      if (!accessToken) {
        throw new Error('Token do Mercado Pago não configurado. Verifique VITE_MERCADOPAGO_ACCESS_TOKEN no arquivo .env');
      }

      // Chave de idempotência será gerada na função Supabase

      const mercadoPagoPayload = {
        transaction_amount: selectedPlan.price,
        description: `Plano ${selectedPlan.name} - InovaPet CRM`,
        payment_method_id: "pix",
        payer: {
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          identification: {
            type: formData.documentType,
            number: formData.document.replace(/[^0-9]/g, '') // Remove formatação
          }
        }
      };

      console.log('Enviando para função Supabase:', mercadoPagoPayload);

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

      console.log('Resposta PIX Mercado Pago:', data);

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
        startRealtimeListener(data.id.toString());
      }

    } catch (error) {
      console.error('Erro completo:', error);
      throw error;
    }
  };

  const processCardPayment = async () => {
    throw new Error('Selecione o método PIX para continuar. Cartão será implementado em breve.');
  };

  // Inicializar CardForm quando método cartão for selecionado
  useEffect(() => {
    if (paymentMethod === 'card' && window.mp && currentStep === 'form') {
      setTimeout(() => {
        try {
          // Inicializar CardForm (será usado quando implementado)
          window.mp.cardForm({
            amount: selectedPlan?.price.toString() || '0',
            iframe: true,
            form: {
              id: 'form-checkout',
              cardNumber: { id: 'form-checkout__cardNumber', placeholder: 'Número do cartão' },
              expirationDate: { id: 'form-checkout__expirationDate', placeholder: 'MM/YY' },
              securityCode: { id: 'form-checkout__securityCode', placeholder: 'CVV' },
              cardholderName: { id: 'form-checkout__cardholderName', placeholder: 'Nome no cartão' },
              issuer: { id: 'form-checkout__issuer', placeholder: 'Banco emissor' },
              installments: { id: 'form-checkout__installments', placeholder: 'Parcelas' },
              identificationType: { id: 'form-checkout__identificationType' },
              identificationNumber: { id: 'form-checkout__identificationNumber', placeholder: 'CPF' },
              cardholderEmail: { id: 'form-checkout__cardholderEmail', placeholder: 'Email' }
            },
            callbacks: {
              onFormMounted: (error: any) => {
                if (error) {
                  console.warn('Form Mounted handling error: ', error);
                  return;
                }
                console.log('CardForm montado com sucesso');
                // setCardFormReady(true); // Comentado até implementação completa
              },
              onSubmit: async (event: any) => {
                event.preventDefault();
                console.log('CardForm submetido');
                // Implementar processamento do cartão
              }
            }
          });
        } catch (error) {
          console.error('Erro ao inicializar CardForm:', error);
        }
      }, 100);
    }
  }, [paymentMethod, currentStep, selectedPlan]);

  if (currentStep === 'form' && selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Finalizar Pagamento
              </h1>
              <button
                onClick={() => setCurrentStep('plans')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Voltar
              </button>
            </div>

            {/* Resumo do Plano */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-900">Plano {selectedPlan.name}</h3>
              <p className="text-blue-700">R$ {selectedPlan.price.toFixed(2)}/mês</p>
            </div>

            {/* Seletor de Método de Pagamento */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Método de Pagamento</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 border rounded-lg flex items-center justify-center ${
                    paymentMethod === 'pix' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Smartphone className="h-5 w-5 mr-2" />
                  PIX
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border rounded-lg flex items-center justify-center ${
                    paymentMethod === 'card' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Cartão
                </button>
              </div>
            </div>

            {/* Formulário de Dados */}
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sobrenome</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Documento</label>
                  <input
                    type="text"
                    required
                    value={formData.document}
                    onChange={(e) => setFormData({...formData, document: e.target.value})}
                    placeholder={formData.documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

                {/* Formulário de Cartão */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                        <p className="text-sm text-yellow-800">
                          <strong>Em desenvolvimento:</strong> O pagamento por cartão será implementado em breve. 
                          Use PIX para realizar pagamentos no momento.
                        </p>
                      </div>
                    </div>
                    
                    <div id="form-checkout" className="space-y-4 opacity-50 pointer-events-none">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número do Cartão
                          </label>
                          <div id="form-checkout__cardNumber" className="container border border-gray-300 rounded-md p-3 h-12 bg-gray-50"></div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Validade
                          </label>
                          <div id="form-checkout__expirationDate" className="container border border-gray-300 rounded-md p-3 h-12 bg-gray-50"></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CVV
                          </label>
                          <div id="form-checkout__securityCode" className="container border border-gray-300 rounded-md p-3 h-12 bg-gray-50"></div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome no Cartão
                          </label>
                          <input
                            type="text"
                            id="form-checkout__cardholderName"
                            className="w-full border border-gray-300 rounded-md p-3 h-12 bg-gray-50"
                            placeholder="Nome no cartão"
                            disabled
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Banco
                          </label>
                          <select id="form-checkout__issuer" className="w-full border border-gray-300 rounded-md p-3 h-12 bg-gray-50" disabled>
                            <option value="">Selecione o banco</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Parcelas
                          </label>
                          <select id="form-checkout__installments" className="w-full border border-gray-300 rounded-md p-3 h-12 bg-gray-50" disabled>
                            <option value="">Selecione as parcelas</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Documento
                          </label>
                          <select id="form-checkout__identificationType" className="w-full border border-gray-300 rounded-md p-3 h-12 bg-gray-50" disabled>
                            <option value="CPF">CPF</option>
                            <option value="CNPJ">CNPJ</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CPF
                          </label>
                          <input
                            type="text"
                            id="form-checkout__identificationNumber"
                            className="w-full border border-gray-300 rounded-md p-3 h-12 bg-gray-50"
                            placeholder="000.000.000-00"
                            disabled
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          id="form-checkout__cardholderEmail"
                          className="w-full border border-gray-300 rounded-md p-3 h-12 bg-gray-50"
                          placeholder="email@exemplo.com"
                          disabled
                        />
                      </div>
                      
                      <progress value="0" className="progress-bar w-full h-2 bg-gray-200 rounded hidden">
                        Carregando...
                      </progress>
                    </div>
                  </div>
                )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processando...' : `Pagar R$ ${selectedPlan.price.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar tela de status do pagamento
  if (currentStep === 'payment-status' && paymentResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Pagamento PIX Gerado
              </h2>
              <p className="text-gray-600">
                Escaneie o QR Code ou copie o código PIX para realizar o pagamento
              </p>
            </div>

            {/* QR Code */}
            {paymentResult.qr_code_base64 && (
              <div className="text-center mb-6">
                <img 
                  src={`data:image/jpeg;base64,${paymentResult.qr_code_base64}`}
                  alt="QR Code PIX"
                  className="mx-auto border rounded shadow-lg mb-4"
                  style={{ width: '250px', height: '250px' }}
                />
                <p className="text-sm text-gray-600">
                  Escaneie com o app do seu banco
                </p>
              </div>
            )}

            {/* Código PIX */}
            {paymentResult.qr_code_string && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código PIX (Copia e Cola):
                </label>
                <textarea
                  readOnly
                  value={paymentResult.qr_code_string}
                  className="w-full p-2 border rounded text-xs bg-white h-20 resize-none"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={() => navigator.clipboard.writeText(paymentResult.qr_code_string)}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  Copiar Código PIX
                </button>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-800 font-medium">
                Status: {isPaymentApproved ? 'Pagamento Aprovado!' : 'Aguardando Pagamento'}
              </p>
              <p className="text-sm text-blue-600">
                ID do Pagamento: {paymentResult.id}
              </p>
              {paymentResult.date_of_expiration && (
                <p className="text-sm text-blue-600">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Expira em: {new Date(paymentResult.date_of_expiration).toLocaleString()}
                </p>
              )}
              {isLoading && (
                <p className="text-sm text-blue-600 mt-2">
                  🔄 Aguardando confirmação do pagamento...
                </p>
              )}
              {error && (
                <p className="text-sm text-red-600 mt-2">
                  ❌ {error}
                </p>
              )}
            </div>

            {isPaymentApproved && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800 font-medium">
                  ✅ Pagamento confirmado! Sua assinatura foi ativada.
                </p>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Ir para Dashboard
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setCurrentStep('plans');
                  setPaymentResult(null);
                  setSelectedPlan(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Voltar para seleção de planos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-lg text-gray-600">
            Desbloqueie todo o potencial do NanoSync CRM
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-lg p-8 ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Mais Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  R$ {plan.price.toFixed(2)}
                  <span className="text-lg text-gray-500">/mês</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Escolher Plano
              </button>
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Por que escolher o NanoSync?
            </h2>
            <p className="text-gray-600">
              A solução completa para gestão da sua clínica veterinária
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Fácil de Usar</h3>
              <p className="text-gray-600 text-sm">
                Interface intuitiva que qualquer pessoa pode usar
              </p>
            </div>
            
            <div className="text-center">
              <Shield className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Seguro</h3>
              <p className="text-gray-600 text-sm">
                Seus dados protegidos com criptografia de ponta
              </p>
            </div>
            
            <div className="text-center">
              <Zap className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Rápido</h3>
              <p className="text-gray-600 text-sm">
                Performance otimizada para sua produtividade
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Planos };
