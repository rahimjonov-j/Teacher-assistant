import { useMemo } from 'react'
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
import { apiRequest } from '@/lib/api'

export function DatabasePage() {
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

  const rows = useMemo(
    () => [
      {
        icon: Users,
        title: 'Students',
        subtitle: 'No student records connected yet',
      },
      {
        icon: GraduationCap,
        title: 'Teachers',
        subtitle: profile?.fullName ? `1 linked teacher profile: ${profile.fullName}` : 'Teacher profile incomplete',
      },
      {
        icon: School,
        title: 'Groups / Classes',
        subtitle: profile?.gradeFocus ? `Primary class: ${profile.gradeFocus}` : 'No class or group added yet',
      },
      {
        icon: FileText,
        title: 'Tests',
        subtitle: `${items.filter((item) => item.featureKey === 'quiz').length} saved test items`,
      },
      {
        icon: FolderOpen,
        title: 'Homework',
        subtitle: `${items.filter((item) => item.featureKey === 'lesson_plan').length} lesson-plan based records`,
      },
      {
        icon: FileText,
        title: 'Documents',
        subtitle: `${items.filter((item) => Boolean(item.pdfUrl)).length} exported PDF documents`,
      },
    ],
    [items, profile?.fullName, profile?.gradeFocus],
  )

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
