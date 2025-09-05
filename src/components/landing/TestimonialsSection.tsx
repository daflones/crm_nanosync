'use client'

import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Carlos Silva',
    company: 'TechStart Soluções',
    role: 'CEO',
    content: 'O pipeline de vendas do Nano Sync é incrível! Com os 12 módulos integrados, conseguimos controlar todo o funil desde o primeiro contato até o pós-venda. A IA nos ajuda a identificar as melhores oportunidades.',
    rating: 5,
    result: '+300% Vendas',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    name: 'Marina Costa',
    company: 'Inovação Digital',
    role: 'Diretora Comercial',
    content: 'O sistema de agendamentos com 9 tipos diferentes revolucionou nossa operação. Reuniões, apresentações, negociações - tudo organizado automaticamente. O suporte brasileiro é excepcional!',
    rating: 5,
    result: '+250% Produtividade',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    name: 'Roberto Mendes',
    company: 'Crescer Consultoria',
    role: 'Gerente de Vendas',
    content: 'Os relatórios avançados e dashboard em tempo real são fantásticos! Análises preditivas, métricas de conversão, performance da equipe - tudo em uma tela. Tomamos decisões baseadas em dados reais.',
    rating: 5,
    result: '+180% Performance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    name: 'Ana Paula Santos',
    company: 'Estratégia & Resultados',
    role: 'Fundadora',
    content: 'O módulo de propostas comerciais é revolucionário! Criação automática, controle de status, vencimentos e aprovações. Nossas propostas ficaram profissionais e o fechamento disparou.',
    rating: 5,
    result: '+400% Fechamento',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  {
    name: 'Fernando Oliveira',
    company: 'Próxima Geração',
    role: 'Diretor',
    content: 'O catálogo de produtos integrado com controle de estoque e preços mudou nossa operação. Categorização inteligente, imagens, segmentos - tudo organizado. A IA nos sugere os melhores produtos para cada cliente.',
    rating: 5,
    result: 'ROI 500%',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  },
  {
    name: 'Juliana Ferreira',
    company: 'Expansão Comercial',
    role: 'Coordenadora',
    content: 'A gestão de arquivos com IA é impressionante! 6 categorias organizadas automaticamente: catálogos, apresentações, promoções, marketing, vídeos e propostas. Encontramos tudo em segundos.',
    rating: 5,
    result: '+200% Eficiência',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face'
  }
]

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
            Resultados Reais de
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Empresas Brasileiras
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto">
            Empresas de todos os segmentos estão crescendo com os <strong>12 módulos completos</strong> do Nano Sync CRM. 
            Veja como cada funcionalidade está gerando resultados extraordinários.
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="text-gray-600 dark:text-gray-300 font-semibold">
              4.9/5 (2.847 avaliações)
            </span>
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <strong>98%</strong> taxa de satisfação
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <strong>2.500+</strong> empresas ativas
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-12 h-12 text-blue-600" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              {/* Results Badge */}
              <div className="inline-flex items-center bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold mb-6">
                📈 {testimonial.result}
              </div>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role} • {testimonial.company}
                  </div>
                </div>
              </div>

              {/* Hover Effect Border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors duration-300"></div>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-3xl md:text-4xl font-black mb-2">12</div>
              <div className="text-blue-100">Módulos Integrados</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black mb-2">100%</div>
              <div className="text-blue-100">Brasileiro</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black mb-2">IA</div>
              <div className="text-blue-100">Integrada</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black mb-2">+400%</div>
              <div className="text-blue-100">Crescimento Médio</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
