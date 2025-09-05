'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle, ArrowRight, ArrowLeft, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { 
  leadFormSchema, 
  type LeadFormData, 
  setorOptions, 
  funcionariosOptions, 
  desafioOptions, 
  orcamentoOptions,
  formatWhatsApp 
} from '@/lib/validations/landing'
import { submitLeadToAPI } from '@/services/api/landing'

const FORM_STEPS = [
  { id: 1, title: 'Informações Básicas', description: 'Seus dados de contato' },
  { id: 2, title: 'Sobre sua Empresa', description: 'Conte-nos sobre seu negócio' },
  { id: 3, title: 'Necessidades', description: 'Seus desafios e objetivos' },
  { id: 4, title: 'Finalização', description: 'Últimos detalhes' }
]

export function LeadForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showExitIntent, setShowExitIntent] = useState(false)

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      nome: '',
      whatsapp: '',
      email: '',
      nome_empresa: '',
      setor_empresa: '',
      numero_funcionarios: '',
      principal_desafio: [],
      experiencia_crm: false,
      faixa_orcamento: '',
      necessidade_especifica: ''
    },
    mode: 'onChange'
  })

  // Auto-save to localStorage
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem('nano-sync-lead-form', JSON.stringify(value))
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nano-sync-lead-form')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        Object.keys(data).forEach(key => {
          if (data[key]) {
            form.setValue(key as keyof LeadFormData, data[key])
          }
        })
      } catch (error) {
        console.error('Error loading saved form data:', error)
      }
    }
  }, [form])

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !isSuccess && currentStep > 1) {
        setShowExitIntent(true)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [isSuccess, currentStep])

  const progress = (currentStep / FORM_STEPS.length) * 100

  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsToValidate: Record<number, (keyof LeadFormData)[]> = {
      1: ['nome', 'whatsapp', 'email'],
      2: ['nome_empresa', 'setor_empresa', 'numero_funcionarios'],
      3: ['principal_desafio', 'faixa_orcamento'],
      4: []
    }

    const fields = fieldsToValidate[step] || []
    const isValid = await form.trigger(fields)
    return isValid
  }

  const nextStep = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < FORM_STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true)
    try {
      const result = await submitLeadToAPI(data)
      if (result.success) {
        setIsSuccess(true)
        localStorage.removeItem('nano-sync-lead-form')
        toast.success('Cadastro realizado com sucesso! Em breve entraremos em contato.')
        
        // Track conversion event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion', {
            send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
            value: 699.97,
            currency: 'BRL'
          })
        }
      } else {
        toast.error(result.error || 'Erro ao enviar formulário. Tente novamente.')
      }
    } catch (error) {
      toast.error('Erro ao enviar formulário. Tente novamente.')
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWhatsAppChange = (value: string) => {
    const formatted = formatWhatsApp(value)
    form.setValue('whatsapp', formatted)
  }

  const handleDesafioChange = (desafio: string, checked: boolean) => {
    const current = form.getValues('principal_desafio') || []
    if (checked) {
      form.setValue('principal_desafio', [...current, desafio])
    } else {
      form.setValue('principal_desafio', current.filter(d => d !== desafio))
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-2xl">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🎉 Parabéns! Cadastro Realizado
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Recebemos suas informações e nossa equipe entrará em contato em até 2 horas úteis 
            para agendar sua demonstração gratuita.
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 mb-8">
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
              🎁 Bônus Especial Desbloqueado!
            </h4>
            <p className="text-green-700 dark:text-green-400">
              Por ser um dos primeiros interessados, você ganhou acesso prioritário 
              à nossa demonstração personalizada e consultoria gratuita!
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Fique atento ao seu WhatsApp e email para não perder nossa mensagem.
          </div>
        </div>
      </div>
    )
  }

  return (
    <section id="lead-form" className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
            Comece sua
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Transformação Digital
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Preencha o formulário abaixo e receba uma demonstração personalizada 
            do Nano Sync CRM para o seu negócio.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Etapa {currentStep} de {FORM_STEPS.length}
            </span>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {Math.round(progress)}% concluído
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {FORM_STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  {step.id}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center max-w-20">
                  {step.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">
              {FORM_STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-lg">
              {FORM_STEPS[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      {...form.register('nome')}
                      placeholder="Seu nome completo"
                      className="mt-2"
                    />
                    {form.formState.errors.nome && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.nome.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">WhatsApp *</Label>
                    <Input
                      id="whatsapp"
                      value={form.watch('whatsapp')}
                      onChange={(e) => handleWhatsAppChange(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="mt-2"
                    />
                    {form.formState.errors.whatsapp && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.whatsapp.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register('email')}
                      placeholder="seu@email.com"
                      className="mt-2"
                    />
                    {form.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Company Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                    <Input
                      id="nome_empresa"
                      {...form.register('nome_empresa')}
                      placeholder="Nome da sua empresa"
                      className="mt-2"
                    />
                    {form.formState.errors.nome_empresa && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.nome_empresa.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="setor_empresa">Setor da Empresa *</Label>
                    <Select onValueChange={(value) => form.setValue('setor_empresa', value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent>
                        {setorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.setor_empresa && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.setor_empresa.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="numero_funcionarios">Número de Funcionários *</Label>
                    <Select onValueChange={(value) => form.setValue('numero_funcionarios', value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione a faixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionariosOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.numero_funcionarios && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.numero_funcionarios.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Needs Assessment */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label>Principal Desafio Atual * (selecione todos que se aplicam)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {desafioOptions.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={option.value}
                            onCheckedChange={(checked) => 
                              handleDesafioChange(option.value, checked as boolean)
                            }
                          />
                          <Label htmlFor={option.value} className="text-sm">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {form.formState.errors.principal_desafio && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.principal_desafio.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Experiência Anterior com CRM</Label>
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="experiencia_sim"
                          checked={form.watch('experiencia_crm')}
                          onCheckedChange={(checked) => 
                            form.setValue('experiencia_crm', checked as boolean)
                          }
                        />
                        <Label htmlFor="experiencia_sim">
                          Sim, já usei CRM antes
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="faixa_orcamento">Faixa de Orçamento Mensal *</Label>
                    <Select onValueChange={(value) => form.setValue('faixa_orcamento', value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione sua faixa de orçamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {orcamentoOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.faixa_orcamento && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.faixa_orcamento.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Final Details */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="necessidade_especifica">
                      Necessidade Específica (Opcional)
                    </Label>
                    <Textarea
                      id="necessidade_especifica"
                      {...form.register('necessidade_especifica')}
                      placeholder="Conte-nos mais sobre suas necessidades específicas, desafios únicos ou funcionalidades que considera essenciais..."
                      rows={4}
                      className="mt-2"
                    />
                    {form.formState.errors.necessidade_especifica && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.necessidade_especifica.message}
                      </p>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-4">
                      🎁 Resumo da sua Oferta Especial:
                    </h4>
                    <ul className="space-y-2 text-blue-700 dark:text-blue-400">
                      <li>✅ Demonstração personalizada gratuita</li>
                      <li>✅ Consultoria especializada</li>
                      <li>✅ Suporte técnico incluído</li>
                      <li>✅ Migração de dados gratuita</li>
                      <li>✅ Desconto de R$ 300/mês por tempo limitado</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </Button>

                {currentStep < FORM_STEPS.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Próximo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        🚀 Solicitar Demonstração
                        <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Exit Intent Popup */}
        {showExitIntent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full">
              <div className="text-center">
                <Gift className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Espere! Oferta Especial
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Complete seu cadastro agora e ganhe <strong>acesso prioritário</strong> à demonstração personalizada. 
                  Consultoria gratuita incluída!
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => setShowExitIntent(false)}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600"
                  >
                    Aceitar Oferta e Continuar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowExitIntent(false)}
                    className="w-full"
                  >
                    Não, obrigado
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
