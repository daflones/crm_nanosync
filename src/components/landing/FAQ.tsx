'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, MessageCircle, Mail } from 'lucide-react'

const faqs = [
  {
    question: 'Quais são os 12 módulos do Nano Sync CRM?',
    answer: 'O sistema possui: 1) Gestão Completa de Clientes com pipeline, 2) Agendamentos com 9 tipos diferentes, 3) Propostas Comerciais automatizadas, 4) Catálogo de Produtos integrado, 5) Relatórios Avançados com IA, 6) Inteligência Artificial integrada, 7) Gestão de Arquivos com 6 categorias, 8) Log de Atividades completo, 9) Gestão de Vendedores, 10) Configurações Avançadas, 11) Segurança Empresarial, 12) Suporte Especializado.'
  },
  {
    question: 'Como funciona o sistema de agendamentos com 9 tipos?',
    answer: 'O sistema oferece 9 tipos de reuniões: Apresentação Comercial, Reunião de Negociação, Follow-up de Vendas, Demonstração de Produto, Reunião de Fechamento, Apresentação de Proposta, Reunião Técnica, Reunião de Planejamento e Reunião Geral. Cada tipo tem configurações específicas, lembretes automáticos e integração com calendário.'
  },
  {
    question: 'Como a IA está integrada no sistema?',
    answer: 'A Inteligência Artificial está presente em vários módulos: análise preditiva de vendas, sugestões de produtos para clientes, organização automática de arquivos em 6 categorias, insights inteligentes nos relatórios, otimização do pipeline de vendas e automação de respostas. A IA aprende com seus dados para oferecer sugestões cada vez mais precisas.'
  },
  {
    question: 'Como funciona o módulo de propostas comerciais?',
    answer: 'O sistema permite criação automática de propostas profissionais, controle de status em tempo real, alertas de vencimento, sistema de aprovações, templates personalizados, envio automático por email, acompanhamento de abertura e aceite, e integração completa com o pipeline de vendas.'
  },
  {
    question: 'O que inclui a gestão de arquivos com IA?',
    answer: 'O sistema organiza automaticamente seus arquivos em 6 categorias: Catálogos de Produtos, Apresentações Comerciais, Materiais de Promoção, Conteúdo de Marketing, Vídeos Institucionais e Propostas. A IA categoriza, indexa e permite busca inteligente por conteúdo, facilitando encontrar qualquer arquivo em segundos.'
  },
  {
    question: 'Como funciona o controle de segurança e LGPD?',
    answer: 'O sistema possui controle de acesso por níveis de usuário, criptografia de dados end-to-end, backups automáticos diários, servidores seguros no Brasil, auditoria completa de ações, conformidade total com LGPD, políticas de retenção de dados e ferramentas para exercício dos direitos dos titulares.'
  },
  {
    question: 'Quais relatórios e análises estão disponíveis?',
    answer: 'Dashboard em tempo real com métricas de vendas, taxa de conversão do pipeline, performance individual de vendedores, análises preditivas de fechamento, relatórios de produtos mais vendidos, análise de ROI por cliente, funil de vendas detalhado, e insights inteligentes gerados pela IA para otimizarção de resultados.'
  },
  {
    question: 'Como funciona o suporte brasileiro 24/7?',
    answer: 'Equipe técnica brasileira especializada disponível via chat ao vivo, email, telefone e WhatsApp. Oferecemos treinamento completo da equipe, onboarding personalizado, migração de dados de outros sistemas, configuração inicial, e suporte contínuo para maximizar o uso de todos os 12 módulos.'
  },
  {
    question: 'Meus dados ficam seguros?',
    answer: 'Absolutamente! Utilizamos criptografia de ponta a ponta, servidores seguros na AWS, backups automáticos diários e certificação ISO 27001. Seus dados são tratados com máxima segurança e privacidade, seguindo a LGPD brasileira.'
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
            Tudo sobre os
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              12 Módulos do CRM
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto">
            Entenda como cada funcionalidade do Nano Sync CRM pode transformar sua empresa. 
            Conheça todos os recursos disponíveis na plataforma mais completa do Brasil.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                <span className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Pronto para conhecer todos os 12 módulos?
            </h3>
            <p className="text-blue-100 mb-6 text-lg">
              Agende uma demonstração personalizada e veja como cada funcionalidade pode impactar seus resultados!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://wa.me/5511999999999?text=Olá! Quero agendar uma demonstração do Nano Sync CRM" 
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-5 h-5" />
                Demonstração via WhatsApp
              </a>
              <a 
                href="mailto:contato@nanosync.com.br?subject=Solicitação de Demonstração" 
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
              >
                <Mail className="w-5 h-5" />
                Demonstração via Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
