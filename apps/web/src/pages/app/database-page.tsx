import { useQuery } from '@tanstack/react-query'
import type { GeneratedContentRecord, TeacherDashboardPayload } from '@teacher-assistant/shared'
import {
  ChevronRight,
  FileText,
  FolderOpen,
  GraduationCap,
  School,
  Users,
} from 'lucide-react'
import { CardLoader } from '@/components/shared/loading-state'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/hooks/use-i18n'
import { apiRequest } from '@/lib/api'

export function DatabasePage() {
  const { t } = useI18n()
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiRequest<TeacherDashboardPayload>('/teacher/dashboard'),
  })
  const historyQuery = useQuery({
    queryKey: ['database-history'],
    queryFn: () => apiRequest<{ items: GeneratedContentRecord[] }>('/teacher/history?search=&feature='),
  })

  const profile = dashboardQuery.data?.profile
  const items = historyQuery.data?.items ?? []
  const rows = [
    {
      icon: Users,
      title: t('database.students'),
      subtitle: t('database.studentsHint'),
    },
    {
      icon: GraduationCap,
      title: t('database.teachers'),
      subtitle: profile?.fullName ? `${t('database.teacherProfileLinked')}: ${profile.fullName}` : t('database.teacherProfileIncomplete'),
    },
    {
      icon: School,
      title: t('database.groups'),
      subtitle: profile?.gradeFocus ? `${t('settings.grade')}: ${profile.gradeFocus}` : t('database.groupsHint'),
    },
    {
      icon: FileText,
      title: t('database.tests'),
      subtitle: `${items.filter((item) => item.featureKey === 'quiz').length} ${t('database.savedTestItems')}`,
    },
    {
      icon: FolderOpen,
      title: t('database.homework'),
      subtitle: `${items.filter((item) => item.featureKey === 'lesson_plan').length} ${t('database.lessonPlanRecords')}`,
    },
    {
      icon: FileText,
      title: t('database.documents'),
      subtitle: `${items.filter((item) => Boolean(item.pdfUrl)).length} ${t('database.exportedDocs')}`,
    },
  ]

  if (!dashboardQuery.data || !historyQuery.data) {
    return <CardLoader />
  }

  return (
    <Card className="animate-in">
      <CardContent className="p-3">
        <div className="space-y-2">
          {rows.map((row) => (
            <button
              key={row.title}
              type="button"
              className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-colors hover:bg-secondary"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
                  <row.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black">{row.title}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">{row.subtitle}</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
