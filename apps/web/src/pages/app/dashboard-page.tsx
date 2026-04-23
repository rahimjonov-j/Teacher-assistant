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
    ? Math.min(
        100,
        Math.max(
          0,
          (data.subscription.creditsRemaining / Math.max(data.subscription.creditsTotal, 1)) * 100,
        ),
      )
    : 0

  return (
    <div className="space-y-8 px-4 animate-in sm:px-0 sm:space-y-10">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Assalomu alaykum,{' '}
            <span className="text-primary">{data.profile.fullName?.split(' ')[0] || "Ustoz"}!</span>
          </h1>
          <p className="text-base font-medium text-muted-foreground/70 sm:text-lg">Bugun qanday material tayyorlaymiz?</p>
        </div>

        <Card className="w-full border-none bg-gradient-to-tr from-primary to-sky-500 text-white shadow-2xl shadow-primary/20 sm:max-w-sm">
          <CardContent className="p-5 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Qolgan kreditlar</p>
                <p className="text-3xl font-black tracking-tight sm:text-4xl">{data.subscription?.creditsRemaining ?? 0}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 p-3 backdrop-blur-sm sm:h-14 sm:w-14">
                <Zap className="h-full w-full fill-white" />
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full bg-white transition-[width] duration-500" style={{ width: `${creditsPercent}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-70">
                <span>{data.subscription?.creditsUsed ?? 0} sarflandi</span>
                <span>{data.subscription?.planName ?? "Obuna yo'q"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black tracking-tight">Tezkor amallar</h2>
          <Button asChild variant="ghost" className="font-bold text-primary">
            <Link to="/app/generator">Hammasini ko'rish</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.quickActions.map((feature, i) => (
            <Link key={feature.key} to={`/app/generator?feature=${feature.key}`}>
              <Card className="h-full cursor-pointer overflow-hidden bg-card/85">
                <CardContent className="p-4 sm:p-6">
                  <div className={cn(
                    'mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border text-primary shadow-sm sm:h-12 sm:w-12',
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
                  <CardContent className="flex items-center justify-between p-4 sm:p-6">
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
