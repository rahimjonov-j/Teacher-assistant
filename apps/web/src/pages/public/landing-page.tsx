import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  GraduationCap,
  LineChart,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import heroImage from '@/assets/hero.png'
import { SiteFooter } from '@/components/shared/site-footer'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: FileText,
    tone: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200',
    title: 'Materiallar tez tayyor',
    description: 'Dars rejasi, test, speaking savollari va feedback bir ish oqimida.',
  },
  {
    icon: Bot,
    tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200',
    title: 'Telegram bilan birga',
    description: 'Webdagi hisobingiz bot bilan ulanadi, kredit va tarix bir joyda qoladi.',
  },
  {
    icon: LineChart,
    tone: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
    title: 'Sarflar nazoratda',
    description: "Kredit, aktivlik va eng ko'p ishlatilgan funksiyalar ko'rinib turadi.",
  },
  {
    icon: ShieldCheck,
    tone: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200',
    title: 'Tayyor platforma',
    description: 'Auth, saqlash, PDF eksport va admin panel allaqachon ulangan.',
  },
]

const stats = [
  { value: '50', label: 'bepul kredit' },
  { value: '4', label: 'AI vosita' },
  { value: 'PDF', label: 'eksport' },
  { value: '24/7', label: 'web va bot' },
]

const steps = [
  'Mavzu va sinfni kiriting',
  'AI tayyor draft yaratadi',
  'Natijani saqlang yoki PDF qiling',
]

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="container flex min-h-16 items-center justify-between gap-3 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-black tracking-tight">Teacher Assistant</div>
              <div className="truncate text-[11px] font-medium text-muted-foreground">AI yordamchi</div>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="px-3">
              <Link to="/login">Kirish</Link>
            </Button>
            <Button asChild size="sm" className="px-3">
              <Link to="/register">Boshlash</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative isolate min-h-[calc(100svh-9rem)] overflow-hidden border-b border-border/70">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-slate-950/60" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.25),rgba(2,6,23,0.78))]" />

          <div className="container relative flex min-h-[calc(100svh-9rem)] flex-col justify-end pb-7 pt-12 text-white sm:pb-10 lg:pb-12">
            <div className="max-w-4xl">
              <div className="inline-flex max-w-full items-center gap-2 rounded-lg bg-white/12 px-3 py-2 text-[10px] font-extrabold uppercase text-white/90 ring-1 ring-white/18 backdrop-blur sm:text-xs">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                AI yordamida dars tayyorlash
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
                O'qituvchi uchun dars materiali bir necha daqiqada
              </h1>

              <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-white/82 sm:text-xl sm:leading-8">
                Test, dars rejasi, speaking savollari va yozma ish feedbackini webda yoki Telegram botda yarating.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-13 w-full rounded-lg bg-white px-6 text-base font-black text-slate-950 hover:bg-white/90 sm:w-auto"
                >
                  <Link to="/register">
                    Bepul boshlash
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-13 w-full rounded-lg border-white/30 bg-white/10 px-6 text-base font-black text-white backdrop-blur hover:bg-white/18 hover:text-white sm:w-auto"
                >
                  <Link to="/login">Hisobga kirish</Link>
                </Button>
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm font-bold text-white/80">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                Ro'yxatdan o'tish uchun bank kartasi shart emas
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((item) => (
                <div key={item.label} className="rounded-lg bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur">
                  <div className="text-xl font-black sm:text-2xl">{item.value}</div>
                  <div className="mt-1 text-xs font-bold text-white/70">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/70 bg-background py-14 sm:py-20">
          <div className="container grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-black text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                Har kuni ishlatiladigan vositalar
              </div>
              <h2 className="mt-4 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">
                Dars tayyorlashdagi mayda ishlarni AIga topshiring
              </h2>
              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-muted-foreground">
                Platforma o'qituvchi ritmiga mos: tez kirish, aniq forma, saqlangan tarix va Telegram orqali davom ettirish.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <article key={feature.title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${feature.tone}`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-black">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary/45 py-14 sm:py-20">
          <div className="container grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-muted/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="space-y-4 p-4 sm:p-6">
                <div className="rounded-lg bg-secondary p-4">
                  <div className="text-xs font-black uppercase text-muted-foreground">So'rov</div>
                  <p className="mt-2 text-sm font-bold leading-6">
                    7-sinf biologiya, fotosintez mavzusi uchun 10 ta test va qisqa dars rejasi.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-black">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Tayyor natija
                  </div>
                  <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                    <p>1. Dars maqsadi va kutilgan natijalar.</p>
                    <p>2. Qisqa tushuntirish, amaliy mashq va mustahkamlash.</p>
                    <p>3. Javob kaliti bilan test savollari.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Ishlash tartibi juda oddiy</h2>
              <div className="mt-6 space-y-3">
                {steps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-lg border border-border bg-card p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-sm font-black text-background">
                      {index + 1}
                    </div>
                    <div className="pt-1 text-sm font-bold sm:text-base">{step}</div>
                  </div>
                ))}
              </div>
              <Button asChild size="lg" className="mt-6 h-13 w-full rounded-lg text-base font-black sm:w-auto">
                <Link to="/register">
                  Material yaratish
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
