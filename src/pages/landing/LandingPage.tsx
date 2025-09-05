import { HeroSection } from '@/components/landing/HeroSection'
import { BenefitsSection } from '@/components/landing/BenefitsSection'
import { LeadForm } from '@/components/landing/LeadForm'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { FAQ } from '@/components/landing/FAQ'

export function LandingPage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <BenefitsSection />
      <TestimonialsSection />
      <LeadForm />
      <FAQ />
    </main>
  )
}
