import { useQuery } from '@tanstack/react-query'
import { FEATURE_DEFINITIONS, PLAN_DEFINITIONS, type TeacherDashboardPayload } from '@teacher-assistant/shared'
import { Link } from 'react-router-dom'
import { Zap, MessageCircleMore, CheckCircle2 } from 'lucide-react'
import { CardLoader } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { env } from '@/lib/env'
import { formatDate, getPlanName } from '@/lib/format'
import { cn } from '@/lib/utils'

export function BillingPage() {
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiRequest<TeacherDashboardPayload>('/teacher/dashboard'),
  })

  const subscription = query.data?.subscription

  if (query.isLoading) {
    return <CardLoader />
  }

  return (
    <div className="space-y-10 animate-in pb-12">
      <PageHeader
        eyebrow="Moliyaviy holat"
        title="Obuna va Tariflar"
        description="Joriy tarifingizni boshqaring va yangi kreditlar oling."
      />

      {/* Current Subscription Card */}
      <Card className="overflow-hidden border-none bg-gradient-to-tr from-primary to-sky-500 text-white shadow-2xl shadow-primary/20">
        <CardContent className="p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Joriy tarif</p>
              <p className="mt-2 text-4xl font-black tracking-tight">
                {subscription ? getPlanName(subscription.planKey) : 'Obuna yo\'q'}
              </p>
              {subscription && (
                <div className="mt-3 flex items-center gap-4 text-sm font-medium opacity-80">
                  <span>{subscription.creditsRemaining} kredit qolgan</span>
                  {subscription.renewsAt && (
                    <span>· Yangilanish: {formatDate(subscription.renewsAt)}</span>
                  )}
                </div>
              )}
            </div>
            <div className="h-20 w-20 rounded-3xl bg-white/20 p-4 backdrop-blur-sm">
              <Zap className="h-full w-full fill-white" />
            </div>
          </div>
          {subscription && (
            <div className="mt-6 space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full bg-white transition-all duration-1000"
                  style={{
                    width: `${Math.max(0, Math.min(100, (subscription.creditsRemaining / (subscription.creditsRemaining + subscription.creditsUsed)) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-70">
                <span>{subscription.creditsUsed} sarflandi</span>
                <span>{subscription.creditsRemaining} qoldi</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <section>
        <h2 className="mb-6 text-2xl font-black tracking-tight">Tariflar</h2>
        <div className="grid gap-5 lg:grid-cols-4">
          {PLAN_DEFINITIONS.map((plan) => {
            const isCurrent = subscription?.planKey === plan.key
            const upgradeLink = env.telegramBotUsername
              ? `https://t.me/${env.telegramBotUsername}?start=upgrade_${plan.key}`
              : null

            return (
              <Card
                key={plan.key}
                className={cn(
                  'relative overflow-hidden bg-card/85',
                  isCurrent ? "border-primary/40 ring-2 ring-primary/20" : "border-border/40"
                )}
              >
                {isCurrent && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-sky-500" />
                )}
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-black tracking-tight">{plan.name}</h3>
                    {isCurrent ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest">
                        Joriy
                      </Badge>
                    ) : null}
                  </div>
                  <div>
                    <span className="text-4xl font-black tracking-tight">${plan.priceMonthlyUsd}</span>
                    <span className="text-sm font-medium text-muted-foreground">/oy</span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground/70">{plan.description}</p>
                  <ul className="space-y-2 text-sm font-medium">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      {plan.monthlyCredits} oylik kredit
                    </li>
                  </ul>
                  {isCurrent ? (
                    <Button className="w-full rounded-2xl font-bold" disabled>
                      Joriy tarif
                    </Button>
                  ) : upgradeLink ? (
                    <Button asChild className="w-full rounded-2xl font-bold" variant="outline">
                      <a href={upgradeLink} target="_blank" rel="noreferrer">
                        <MessageCircleMore className="mr-2 h-4 w-4" />
                        So'rov yuborish
                      </a>
                    </Button>
                  ) : (
                    <Button asChild className="w-full rounded-2xl font-bold" variant="outline">
                      <Link to="/app/settings">Qanday olish</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Feature credit cost */}
      <Card className="border-none bg-card/85 shadow-xl backdrop-blur-xl">
        <CardContent className="space-y-5 p-8">
          <h2 className="text-xl font-black tracking-tight">Funksiyalar kredit narxi</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {FEATURE_DEFINITIONS.map((feature) => (
              <div key={feature.key} className="rounded-2xl border border-border/50 bg-secondary/40 p-4">
                <div className="font-bold">{feature.label}</div>
                <div className="mt-2 flex items-center gap-1 text-sm font-black text-primary">
                  <Zap className="h-3.5 w-3.5" />
                  {feature.creditCost} kredit
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
