import { ArrowRight, Bot, CheckCircle2, FileText, GraduationCap, LineChart, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import heroImage from '@/assets/hero.png'
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight">Teacher Assistant</div>
              <div className="text-[11px] font-medium text-muted-foreground">AI yordamchi</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Kirish</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Boshlash</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
      <section className="relative overflow-hidden border-b border-border/70 bg-secondary/35 px-4 pb-16 pt-10 md:pb-20 md:pt-16">
        <div className="container relative grid items-center gap-10 lg:grid-cols-[1fr_0.94fr]">
          <div className="text-center lg:text-left">
            <div className="animate-in mx-auto flex max-w-fit items-center gap-2 rounded-full bg-background px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary shadow-sm ring-1 ring-border lg:mx-0">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              AI yordamida dars tayyorlash
            </div>

            <h1 className="animate-in mt-7 text-4xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Dars materiali tayyorlashni{' '}
              <span className="text-sky-600 dark:text-sky-300">
                bir necha daqiqaga
              </span>{' '}
              qisqartiring
            </h1>

            <p className="animate-in mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-muted-foreground sm:text-xl lg:mx-0">
              Test, dars rejasi, speaking savollari va yozma ish feedbackini bitta joyda yarating.
              O'qituvchi vaqtini hujjatga emas, o'quvchiga sarflashi kerak.
            </p>

            <div className="animate-in mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="h-14 w-full rounded-xl px-8 text-base font-black shadow-lg shadow-primary/10 sm:w-auto">
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
                <div key={item} className="rounded-xl bg-background p-3 text-sm font-black shadow-sm ring-1 ring-border">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="animate-in relative">
            <div className="absolute left-4 top-4 z-10 rounded-xl bg-background/95 p-4 shadow-xl backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
              className="relative aspect-[4/3] min-h-[360px] overflow-hidden rounded-2xl shadow-2xl shadow-slate-900/10 sm:min-h-[480px]"
            >
              <img
                src={heroImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/5 to-slate-950/60" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <div className="max-w-sm text-2xl font-black tracking-tight sm:text-3xl">
                  Reja, test va feedback bitta ish oqimida
                </div>
                <div className="mt-2 text-sm font-medium text-white/80">
                  O'qituvchi uchun tez, sodda va amaliy yordamchi.
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 right-3 rounded-xl bg-slate-950 px-5 py-4 text-white shadow-xl dark:bg-white dark:text-slate-950">
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
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/10 bg-primary/10 text-primary">
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
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-10 text-center text-white shadow-2xl shadow-primary/15 md:p-16">
          <div className="relative">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-white/15">
              <Zap className="h-8 w-8 fill-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Birinchi materialingizni bugun yarating
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base font-medium opacity-80">
              Ro'yxatdan o'ting va darhol 50 ta bepul kredit oling. Hech qanday bank kartasi talab qilinmaydi.
            </p>
            <Button asChild size="lg" className="mt-8 h-14 rounded-xl bg-white px-10 text-base font-black text-slate-950 shadow-xl hover:bg-white/90">
              <Link to="/register">
                Hoziroq boshlash
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      </main>

      <SiteFooter variant="public" className="mt-auto" />
    </div>
  )
}
