'use client'

import { 
  Users, Calendar, FileText, Package, BarChart3, Bot, 
  Settings, Archive, Activity, Shield, Headphones, Target
} from 'lucide-react'

const benefits = [
  {
    icon: Users,
    title: 'Gestão Completa de Clientes',
    description: 'CRM completo com pipeline de vendas, histórico de interações, segmentação avançada e controle total do funil de vendas.',
    color: 'from-blue-500 to-cyan-500',
    features: ['Pipeline de vendas', 'Histórico completo', 'Segmentação', 'Controle de funil']
  },
  {
    icon: Calendar,
    title: 'Agendamentos Inteligentes',
    description: 'Sistema completo de agendamentos com 9 tipos diferentes: reuniões, apresentações, propostas, negociações, follow-ups e mais.',
    color: 'from-purple-500 to-pink-500',
    features: ['9 tipos de reunião', 'Integração calendário', 'Lembretes automáticos', 'Controle de presença']
  },
  {
    icon: FileText,
    title: 'Propostas Comerciais',
    description: 'Crie, envie e acompanhe propostas profissionais. Controle de status, vencimentos e aprovações automáticas.',
    color: 'from-green-500 to-emerald-500',
    features: ['Criação automática', 'Controle de status', 'Vencimentos', 'Aprovações']
  },
  {
    icon: Package,
    title: 'Catálogo de Produtos',
    description: 'Gestão completa de produtos com categorias, segmentos, preços, imagens e controle de estoque integrado.',
    color: 'from-orange-500 to-red-500',
    features: ['Categorização', 'Controle preços', 'Imagens', 'Estoque']
  },
  {
    icon: BarChart3,
    title: 'Relatórios Avançados',
    description: 'Dashboard completo com métricas de vendas, conversão, pipeline, performance de vendedores e análises preditivas.',
    color: 'from-indigo-500 to-purple-500',
    features: ['Dashboard em tempo real', 'Métricas de conversão', 'Performance', 'Análises preditivas']
  },
  {
    icon: Bot,
    title: 'Inteligência Artificial',
    description: 'IA integrada para análise de dados, sugestões de vendas, automação de respostas e insights inteligentes.',
    color: 'from-pink-500 to-rose-500',
    features: ['Análise inteligente', 'Sugestões de venda', 'Automação', 'Insights']
  },
  {
    icon: Archive,
    title: 'Gestão de Arquivos IA',
    description: 'Sistema completo de arquivos com IA: catálogos, apresentações, promoções, marketing, vídeos e propostas organizados.',
    color: 'from-teal-500 to-cyan-500',
    features: ['6 categorias', 'Organização IA', 'Busca inteligente', 'Versionamento']
  },
  {
    icon: Activity,
    title: 'Log de Atividades',
    description: 'Rastreamento completo de todas as ações: criações, edições, exclusões, envios. Auditoria total do sistema.',
    color: 'from-yellow-500 to-orange-500',
    features: ['Auditoria completa', 'Histórico ações', 'Rastreamento', 'Compliance']
  },
  {
    icon: Target,
    title: 'Gestão de Vendedores',
    description: 'Controle completo da equipe de vendas com metas, comissões, territórios e performance individual.',
    color: 'from-emerald-500 to-green-500',
    features: ['Controle de metas', 'Comissões', 'Territórios', 'Performance']
  },
  {
    icon: Settings,
    title: 'Configurações Avançadas',
    description: 'Personalização completa: perfis, notificações, aparência, configurações de IA e integração com sistemas externos.',
    color: 'from-slate-500 to-gray-500',
    features: ['Personalização total', 'Notificações', 'Temas', 'Integrações']
  },
  {
    icon: Shield,
    title: 'Segurança Empresarial',
    description: 'Controle de acesso por níveis, criptografia de dados, backups automáticos e conformidade com LGPD.',
    color: 'from-red-500 to-pink-500',
    features: ['Controle de acesso', 'Criptografia', 'Backups', 'LGPD']
  },
  {
    icon: Headphones,
    title: 'Suporte Especializado',
    description: 'Equipe técnica brasileira disponível via chat, email, telefone e WhatsApp. Treinamento completo incluído.',
    color: 'from-blue-500 to-indigo-500',
    features: ['Suporte brasileiro', 'Múltiplos canais', 'Treinamento', 'Onboarding']
  }
]

export function BenefitsSection() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
            Todas as Funcionalidades que
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sua Empresa Precisa
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto">
            O Nano Sync CRM possui <strong>12 módulos completos</strong> desenvolvidos especificamente 
            para pequenas e médias empresas brasileiras. Tudo integrado em uma única plataforma.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div 
                key={index}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 text-sm">
                  {benefit.description}
                </p>
                
                {/* Features List */}
                <div className="space-y-1">
                  {benefit.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Hover Effect Border */}
                <div className={`absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gradient-to-br group-hover:${benefit.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
              </div>
            )
          })}
        </div>

        {/* Bottom Stats */}
        <div className="text-center mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-8">
            <div className="text-center">
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-2">12</div>
              <div className="text-gray-600 dark:text-gray-300 text-sm">Módulos Completos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-2">100%</div>
              <div className="text-gray-600 dark:text-gray-300 text-sm">Desenvolvido no Brasil</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-300 text-sm">Suporte em Português</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-orange-600 dark:text-orange-400 mb-2">IA</div>
              <div className="text-gray-600 dark:text-gray-300 text-sm">Inteligência Integrada</div>
            </div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            A solução mais completa para gestão empresarial do mercado brasileiro
          </p>
        </div>
      </div>
    </section>
  )
}
