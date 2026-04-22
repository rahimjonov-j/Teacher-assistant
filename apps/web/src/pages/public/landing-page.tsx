import { ArrowRight, Bot, FileText, LineChart, ShieldCheck, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SiteFooter } from '@/components/shared/site-footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: FileText,
    title: 'Tez material',
    description: 'Dars rejasi, test va yozma ish uchun feedback soniyalarda tayyor.',
  },
  {
    icon: Bot,
    title: 'Web + Telegram',
    description: 'Bir xil hisob, bir xil imkoniyatlar — brauzerda ham, Telegramda ham.',
  },
  {
    icon: LineChart,
    title: 'Oddiy nazorat',
    description: "Kredit sarfi va faollik statistikasi qulay ko'rinishda.",
  },
  {
    icon: ShieldCheck,
    title: 'Tayyor poydevor',
    description: 'Auth, tarix va PDF eksport imkoniyatlari allaqachon tayyor.',
  },
]

export function LandingPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-24 md:pb-40">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute right-0 top-1/2 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
        </div>

        <div className="container relative text-center">
          <div className="animate-in mx-auto flex max-w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            Yangi: AI Dars Rejalashtiruvchi 2.0
          </div>

          <h1 className="animate-in mt-8 text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl">
            O'qituvchilar uchun <br />
              <span className="bg-gradient-to-r from-primary via-sky-500 to-primary bg-clip-text text-transparent">
              Aqlli Yordamchi
            </span>
          </h1>

          <p className="animate-in mx-auto mt-8 max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground/80 sm:text-xl">
            Dars rejalarini 10 soniyada tuzing, testlar tayyorlang va o'quvchilarga professional
            fikr-mulohaza bildiring. Vaqtingizni eng muhim narsaga — ta'limga sarflang.
          </p>

          <div className="animate-in mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" variant="gradient" className="h-16 px-10 rounded-[20px] text-lg font-black shadow-lg">
              <Link to="/register">
                Bepul boshlash
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-16 px-10 rounded-[20px] text-lg font-bold">
              <Link to="/login">
                Kirish
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container pb-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Nima uchun <span className="text-primary">Teacher Assistant?</span>
          </h2>
          <p className="mt-4 text-base font-medium text-muted-foreground/70">
            Hamma narsani bir joyda — tez, qulay va professional.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-card/85">
              <CardContent className="space-y-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground/70">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-tr from-primary to-sky-500 p-10 text-center text-white shadow-2xl shadow-primary/25 md:p-16">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
              <Zap className="h-8 w-8 fill-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Bugun boshlang — bepul!
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base font-medium opacity-80">
              Ro'yxatdan o'ting va darhol 50 ta bepul kredit oling. Hech qanday bank kartasi talab qilinmaydi.
            </p>
            <Button asChild size="lg" className="mt-8 h-16 rounded-[20px] bg-white px-10 text-lg font-black text-primary shadow-xl hover:bg-white/90">
              <Link to="/register">
                Hoziroq boshlash
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter variant="public" className="mt-auto" />
    </div>
  )
}
