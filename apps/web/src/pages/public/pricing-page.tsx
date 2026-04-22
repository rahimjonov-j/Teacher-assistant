import { PLAN_DEFINITIONS } from '@teacher-assistant/shared'
import { Check, Zap, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function PricingPage() {
  return (
    <div className="container py-24 animate-in">
      <div className="mx-auto mb-20 max-w-2xl text-center">
        <div className="mb-4 inline-flex rounded-xl bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Tariflar
        </div>
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Sizga mos tarifni tanlang</h1>
        <p className="mt-6 text-lg font-medium text-muted-foreground/60">
          Bepul boshlang va ehtiyojingizga qarab tarifni oshiring. Har bir tarif o'qituvchilar uchun maxsus moslashtirilgan.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {PLAN_DEFINITIONS.map((plan) => (
          <Card
            key={plan.key}
              className={cn(
                'relative flex flex-col overflow-hidden bg-card/85',
                plan.highlight
                  ? 'border-primary/40 bg-primary/5 shadow-2xl shadow-primary/15 ring-1 ring-primary/15'
                  : '',
              )}
          >
            {plan.highlight && (
              <div className="absolute right-0 top-0 rounded-bl-2xl bg-primary px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                Eng ommabop
              </div>
            )}

            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black tracking-tight">{plan.name}</CardTitle>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tight">${plan.priceMonthlyUsd}</span>
                <span className="text-sm font-bold text-muted-foreground/60">/ oyiga</span>
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-6 p-8 pt-0">
                <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/10 p-4 text-primary">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
                    <Zap className="h-5 w-5" />
                  </div>
                <div>
                  <div className="text-xl font-black">{plan.monthlyCredits}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Oylik kreditlar</div>
                </div>
              </div>

              <p className="text-sm font-medium leading-relaxed text-muted-foreground/70">
                {plan.description}
              </p>

              <ul className="flex-1 space-y-3">
                <li className="flex items-start gap-3 text-sm font-medium">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Tarix va PDF eksport
                </li>
                <li className="flex items-start gap-3 text-sm font-medium">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Web va Telegram
                </li>
                <li className="flex items-start gap-3 text-sm font-medium">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Barcha AI funksiyalar
                </li>
              </ul>

              <Button
                asChild
                className={cn(
                  "w-full rounded-2xl font-bold",
                  plan.highlight ? "" : "variant-outline"
                )}
                variant={plan.highlight ? 'gradient' : 'outline'}
              >
                <Link to="/register">
                  {plan.name} ni tanlash
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
