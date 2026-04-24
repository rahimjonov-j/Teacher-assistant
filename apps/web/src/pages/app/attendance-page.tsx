import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { TeacherDashboardPayload } from '@teacher-assistant/shared'
import { CheckCircle2, Users } from 'lucide-react'
import { CardLoader } from '@/components/shared/loading-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { apiRequest } from '@/lib/api'

export function AttendancePage() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiRequest<TeacherDashboardPayload>('/teacher/dashboard'),
  })
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))

  const profile = dashboardQuery.data?.profile
  const groups = useMemo(
    () => (profile?.gradeFocus ? [profile.gradeFocus] : ['No group connected']),
    [profile?.gradeFocus],
  )
  const [selectedGroup, setSelectedGroup] = useState(groups[0] ?? 'No group connected')

  if (!dashboardQuery.data) {
    return <CardLoader />
  }

  return (
    <div className="space-y-4 animate-in pb-24">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="text-lg font-black tracking-tight">Attendance setup</div>
          <Select value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)}>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </Select>
          <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black">Student list</div>
              <div className="text-xs text-muted-foreground">No real student database is connected yet.</div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">
            Connect student records to start marking present and absent status for <span className="font-semibold text-foreground">{selectedGroup}</span> on {selectedDate}.
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
        <Button className="h-14 w-full" disabled>
          <CheckCircle2 className="h-4 w-4" />
          Save attendance
        </Button>
      </div>
    </div>
  )
}
