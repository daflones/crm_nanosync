import { z } from 'zod'

// WhatsApp validation for Brazilian format
const whatsappRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/

// Lead form validation schema
export const leadFormSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome muito longo'),
  
  whatsapp: z.string()
    .regex(whatsappRegex, 'Formato de WhatsApp inválido. Use: (11) 99999-9999')
    .transform(val => val.replace(/\D/g, '')), // Remove non-digits for storage
  
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo'),
  
  nome_empresa: z.string()
    .min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
    .max(255, 'Nome da empresa muito longo'),
  
  setor_empresa: z.string()
    .min(1, 'Selecione o setor da empresa'),
  
  numero_funcionarios: z.string()
    .min(1, 'Selecione o número de funcionários'),
  
  principal_desafio: z.array(z.string())
    .min(1, 'Selecione pelo menos um desafio'),
  
  experiencia_crm: z.boolean(),
  
  faixa_orcamento: z.string()
    .min(1, 'Selecione a faixa de orçamento'),
  
  necessidade_especifica: z.string()
    .max(1000, 'Descrição muito longa (máximo 1000 caracteres)')
    .optional()
})

export type LeadFormData = z.infer<typeof leadFormSchema>

// Options for form dropdowns
export const setorOptions = [
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'saude', label: 'Saúde' },
  { value: 'educacao', label: 'Educação' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'varejo', label: 'Varejo' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'industria', label: 'Indústria' },
  { value: 'construcao', label: 'Construção' },
  { value: 'alimenticio', label: 'Alimentício' },
  { value: 'outro', label: 'Outro' }
]

export const funcionariosOptions = [
  { value: '1-5', label: '1-5 funcionários' },
  { value: '6-20', label: '6-20 funcionários' },
  { value: '21-50', label: '21-50 funcionários' },
  { value: '51-100', label: '51-100 funcionários' },
  { value: '101-500', label: '101-500 funcionários' },
  { value: '500+', label: 'Mais de 500 funcionários' }
]

export const desafioOptions = [
  { value: 'organizacao_clientes', label: 'Organização de clientes' },
  { value: 'controle_vendas', label: 'Controle de vendas' },
  { value: 'followup_leads', label: 'Follow-up de leads' },
  { value: 'relatorios_gestao', label: 'Relatórios de gestão' },
  { value: 'integracao_whatsapp', label: 'Integração com WhatsApp' },
  { value: 'automacao_processos', label: 'Automação de processos' },
  { value: 'gestao_equipe', label: 'Gestão de equipe de vendas' },
  { value: 'outro', label: 'Outro' }
]

export const orcamentoOptions = [
  { value: '0-200', label: 'Até R$ 200/mês' },
  { value: '200-500', label: 'R$ 200 - R$ 500/mês' },
  { value: '500-1000', label: 'R$ 500 - R$ 1.000/mês' },
  { value: '1000-2000', label: 'R$ 1.000 - R$ 2.000/mês' },
  { value: '2000+', label: 'Acima de R$ 2.000/mês' }
]

// WhatsApp formatting utility
export const formatWhatsApp = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}
