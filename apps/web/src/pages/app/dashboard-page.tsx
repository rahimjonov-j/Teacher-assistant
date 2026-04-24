import { useQuery } from '@tanstack/react-query'
import type { FeatureKey, TeacherDashboardPayload } from '@teacher-assistant/shared'
import {
  ArrowRight,
  Clock3,
  FileText,
  MessageSquareText,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard } from '@/components/dashboard/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { CardLoader } from '@/components/shared/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { formatRelativeDate, getFeatureLabel } from '@/lib/format'

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

  return (
    <div className="space-y-5 animate-in">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Welcome</div>
              <h1 className="mt-2 text-2xl font-black tracking-tight">
                {data.profile.fullName?.split(' ')[0] ?? 'Teacher'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {data.profile.schoolName ?? 'School profile not completed yet'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-secondary p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Current plan</div>
                <div className="mt-1 text-lg font-black">{data.subscription?.planName ?? 'No active plan'}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Credits left</div>
                <div className="mt-1 text-lg font-black">{data.subscription?.creditsRemaining ?? 0}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Requests"
          value={data.usageSummary.totalRequestsThisMonth}
          hint="This month"
          icon={Clock3}
        />
        <StatCard
          label="Stored"
          value={data.recentContent.length}
          hint="Recent outputs"
          icon={Wallet}
        />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-lg font-black tracking-tight">AI shortcuts</div>
              <p className="text-sm text-muted-foreground">Start the main tools in one tap.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/generator">Open</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {data.quickActions.map((feature) => {
              const Icon = featureIcons[feature.key]

              return (
                <Link key={feature.key} to={`/app/generator?feature=${feature.key}`}>
                  <div className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-sm font-black leading-5">{feature.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{feature.creditCost} credit</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-lg font-black tracking-tight">Recent activities</div>
              <p className="text-sm text-muted-foreground">Latest generated materials.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/messenger">View all</Link>
            </Button>
          </div>

          {data.recentContent.length > 0 ? (
            <div className="space-y-3">
              {data.recentContent.slice(0, 4).map((item) => (
                <Link key={item.id} to={`/app/history/${item.id}`} className="block rounded-2xl border border-border p-4 transition-colors hover:bg-secondary">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black">{item.title}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline">{getFeatureLabel(item.featureKey)}</Badge>
                        <span className="text-xs text-muted-foreground">{formatRelativeDate(item.createdAt)}</span>
                      </div>
                    </div>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No activity yet"
              description="Your generated materials will appear here."
              icon={Sparkles}
              action={
                <Button asChild>
                  <Link to="/app/generator">Create first item</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
