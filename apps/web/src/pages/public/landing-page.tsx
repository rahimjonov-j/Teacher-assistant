import { ArrowRight, Bot, CheckCircle2, FileText, LineChart, ShieldCheck, Sparkles, Zap } from 'lucide-react'
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
    description: 'Bir xil hisob, bir xil imkoniyatlar - brauzerda ham, Telegramda ham.',
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
      <section className="relative overflow-hidden px-4 pb-20 pt-10 md:pb-28 md:pt-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[10%] top-0 h-[520px] w-[520px] rounded-full bg-sky-400/15 blur-[120px]" />
          <div className="absolute right-0 top-1/3 h-[460px] w-[460px] rounded-full bg-amber-300/20 blur-[120px]" />
        </div>

        <div className="container relative grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="text-center lg:text-left">
            <div className="animate-in mx-auto flex max-w-fit items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary shadow-sm ring-1 ring-primary/10 backdrop-blur lg:mx-0">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              AI yordamida dars tayyorlash
            </div>

            <h1 className="animate-in mt-7 text-4xl font-black tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl">
              Dars materiali tayyorlashni{' '}
              <span className="bg-gradient-to-r from-primary via-sky-500 to-cyan-500 bg-clip-text text-transparent">
                bir necha daqiqaga
              </span>{' '}
              qisqartiring
            </h1>

            <p className="animate-in mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-muted-foreground sm:text-xl lg:mx-0">
              Test, dars rejasi, speaking savollari va yozma ish feedbackini bitta joyda yarating.
              O'qituvchi vaqtini hujjatga emas, o'quvchiga sarflashi kerak.
            </p>

            <div className="animate-in mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild size="lg" variant="gradient" className="h-16 w-full rounded-[22px] px-9 text-lg font-black shadow-xl shadow-primary/20 sm:w-auto">
                <Link to="/register">
                  Bepul material yaratish
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Karta talab qilinmaydi
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2 text-left sm:max-w-xl">
              {['50 kredit', 'PDF eksport', 'Telegram bot'].map((item) => (
                <div key={item} className="rounded-2xl bg-white/65 p-3 text-sm font-black shadow-sm ring-1 ring-white/70 backdrop-blur dark:bg-white/5 dark:ring-white/10">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="animate-in relative">
            <div className="absolute left-4 top-4 z-10 rounded-3xl bg-white/92 p-4 shadow-xl backdrop-blur dark:bg-slate-950/88">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black">10 soniyada draft</div>
                  <div className="text-xs font-medium text-muted-foreground">Mavzudan tayyor reja</div>
                </div>
              </div>
            </div>

            <div
              aria-label="Sinfxonadagi o'qituvchi va o'quvchilar"
              className="relative min-h-[420px] overflow-hidden rounded-[36px] bg-cover bg-center shadow-2xl shadow-slate-900/10 sm:min-h-[500px]"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0.52)), url('https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80')",
              }}
            >
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <div className="max-w-sm text-2xl font-black tracking-tight sm:text-3xl">
                  Reja, test va feedback bitta ish oqimida
                </div>
                <div className="mt-2 text-sm font-medium text-white/80">
                  O'qituvchi uchun tez, sodda va amaliy yordamchi.
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 right-3 rounded-3xl bg-slate-950 px-5 py-4 text-white shadow-xl dark:bg-white dark:text-slate-950">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">Bugungi natija</div>
              <div className="mt-1 text-2xl font-black">3 material</div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Nima uchun <span className="text-primary">Teacher Assistant?</span>
          </h2>
          <p className="mt-4 text-base font-medium text-muted-foreground/70">
            Hamma narsani bir joyda - tez, qulay va professional.
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

      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-tr from-primary to-sky-500 p-10 text-center text-white shadow-2xl shadow-primary/25 md:p-16">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
              <Zap className="h-8 w-8 fill-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Birinchi materialingizni bugun yarating
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
