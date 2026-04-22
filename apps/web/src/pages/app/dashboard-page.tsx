import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { FeatureKey, TeacherDashboardPayload } from '@teacher-assistant/shared'
import { Zap, Activity, Star, History, ChevronRight, FileText, MessageSquareText } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { CardLoader } from '@/components/shared/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { PLAN_MAP } from '@teacher-assistant/shared'
import { formatRelativeDate, getFeatureLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

const featureIcons: Record<FeatureKey, typeof FileText> = {
  quiz: FileText,
  lesson_plan: FileText,
  writing_feedback: MessageSquareText,
  speaking_questions: MessageSquareText,
  pdf_export: FileText,
}

export function DashboardPage() {
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiRequest<TeacherDashboardPayload>('/teacher/dashboard'),
  })

  const data = query.data

  if (!data) {
    return <CardLoader />
  }

  const creditsPercent = data.subscription 
    ? Math.min(100, Math.max(0, (data.subscription.creditsRemaining / (PLAN_MAP[data.subscription.planKey]?.monthlyCredits || 1)) * 100))
    : 0

  return (
    <div className="space-y-10 animate-in">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Assalomu alaykum, <br />
            <span className="text-primary">{data.profile.fullName?.split(' ')[0] || "Ustoz"}! 👋</span>
          </h1>
          <p className="text-lg font-medium text-muted-foreground/60">Bugun qanday material tayyorlaymiz?</p>
        </div>

        <Card className="w-full max-w-sm border-none bg-gradient-to-tr from-primary to-sky-500 text-white shadow-2xl shadow-primary/20">
          <CardContent className="p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Qolgan kreditlar</p>
                <p className="text-4xl font-black tracking-tight">{data.subscription?.creditsRemaining ?? 0}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                <Zap className="h-full w-full fill-white" />
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${creditsPercent}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-70">
                <span>{data.subscription?.creditsUsed ?? 0} sarflandi</span>
                <span>{PLAN_MAP[data.subscription?.planKey || 'free_trial']?.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          label="Bu oydagi so'rovlar" 
          value={data.usageSummary.totalRequestsThisMonth} 
          hint="Faollik yuqori"
          icon={Activity}
        />
        <StatCard 
          label="Eng ko'p ishlatilgan" 
          value={data.usageSummary.mostUsedFeature ? getFeatureLabel(data.usageSummary.mostUsedFeature) : '---'} 
          hint="Sizning sevimli vositangiz"
          icon={Star}
        />
        <StatCard 
          label="Saqlangan ishlar" 
          value={data.recentContent.length} 
          hint="Oxirgi 30 kun"
          icon={History}
        />
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight">Tezkor amallar</h2>
          <Button asChild variant="ghost" className="font-bold text-primary">
            <Link to="/app/generator">Hammasini ko'rish</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.quickActions.map((feature, i) => (
            <Link key={feature.key} to={`/app/generator?feature=${feature.key}`}>
              <Card className="h-full cursor-pointer overflow-hidden bg-card/85">
                <CardContent className="p-6">
                  <div className={cn(
                    'mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border text-primary shadow-sm',
                    i % 2 === 0 ? 'border-primary/10 bg-primary/10' : 'border-sky-500/15 bg-sky-500/10 text-sky-600 dark:text-sky-400',
                  )}>
                    {(() => {
                      const Icon = featureIcons[feature.key]
                      return <Icon className="h-6 w-6" />
                    })()}
                  </div>
                  <h3 className="font-black tracking-tight">{feature.label}</h3>
                  <p className="mt-1 text-xs font-medium text-muted-foreground/60">{feature.creditCost} kredit</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {data.recentContent.length > 0 ? (
        <section className="space-y-6 pb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Oxirgi materiallar</h2>
            <Button asChild variant="ghost" className="font-bold text-primary">
              <Link to="/app/history">Tarixga o'tish</Link>
            </Button>
          </div>
          <div className="grid gap-4">
            {data.recentContent.slice(0, 3).map((item) => (
              <Link key={item.id} to={`/app/history/${item.id}`}>
                <Card className="bg-card/85">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground">
                        <History className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold tracking-tight">{item.title}</h3>
                        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-muted-foreground/60">
                          <Badge variant="outline" className="h-5 px-1.5 text-[9px]">{getFeatureLabel(item.featureKey)}</Badge>
                          <span>{formatRelativeDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState 
          title="Hali material yo'q" 
          description="Yaratilgan natijalar shu yerda chiqadi."
          action={
            <Button asChild variant="gradient" className="rounded-xl font-bold">
              <Link to="/app/generator">Birinchi materialni yarating</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
