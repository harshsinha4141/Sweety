import { createFileRoute } from '@tanstack/react-router'
import CtaBand from '../components/landing/CtaBand'
import Features from '../components/landing/Features'
import Footer from '../components/landing/Footer'
import ForDoctors from '../components/landing/ForDoctors'
import Hero from '../components/landing/Hero'
import HowItWorks from '../components/landing/HowItWorks'
import Navbar from '../components/landing/Navbar'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <ForDoctors />
        <CtaBand />
      </main>
      <Footer />
    </>
  )
}
