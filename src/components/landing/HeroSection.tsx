'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Star, Users, TrendingUp, Shield } from 'lucide-react'

export function HeroSection() {
  const scrollToForm = () => {
    const formElement = document.getElementById('lead-form')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' })
    }
  }
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)'}}>
      {/* Animated Background - Same as Login/Register */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 w-full h-full">
        <div className="absolute inset-0 opacity-20 w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-white text-sm font-medium">
            #1 CRM para Pequenas e Médias Empresas
          </span>
        </div>

        <div className="max-w-5xl mx-auto text-center text-white px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            O CRM Mais Completo
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              do Brasil
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
            <strong>Nano Sync CRM</strong> - Gestão completa de vendas, clientes, produtos, agendamentos, 
            propostas comerciais, relatórios avançados, IA integrada e muito mais. 
            <span className="text-yellow-300 font-bold">Aumente suas vendas em até 300%!</span>
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-white justify-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold">Gestão de Clientes</span>
            </div>
            <div className="flex items-center gap-2 text-white justify-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm font-semibold">Relatórios Avançados</span>
            </div>
            <div className="flex items-center gap-2 text-white justify-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-semibold">IA Integrada</span>
            </div>
            <div className="flex items-center gap-2 text-white justify-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-semibold">Automação Total</span>
            </div>
          </div>

        {/* Price and CTA */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 max-w-2xl mx-auto mb-8">
          <div className="text-center mb-6">
            <div className="text-white/80 text-lg mb-2">Oferta Especial por Tempo Limitado</div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-white/60 text-2xl line-through">R$ 999,97</span>
              <span className="text-4xl md:text-5xl font-black text-white">R$ 699,97</span>
              <span className="text-white/80 text-lg">/mês</span>
            </div>
            <div className="text-green-400 font-semibold text-lg">
              💰 Economize R$ 300 por mês
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={scrollToForm}
              size="lg" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              🚀 Solicitar Demonstração Gratuita
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <Button 
              size="lg"
              onClick={scrollToForm}
              className="w-full border-2 border-white/30 text-white bg-white/5 hover:bg-white/15 py-4 px-8 rounded-xl text-lg backdrop-blur-sm transition-all duration-200"
            >
              📅 Agendar Demonstração Gratuita
            </Button>
          </div>

          <div className="text-center mt-6 text-white/80 text-sm">
            ✅ Sem compromisso • ✅ Cancelamento gratuito • ✅ Suporte 24/7
          </div>
        </div>

        {/* Urgency */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-full px-4 py-2 text-red-200">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Oferta válida apenas até o final do mês!
            </span>
          </div>
        </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}
