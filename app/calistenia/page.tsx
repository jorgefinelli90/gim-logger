'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import { WorkoutSessionView } from '@/components/workout/WorkoutSessionView'
import { CalisthenicsEditor } from '@/components/workout/CalisthenicsEditor'
import { useStorageReady } from '@/hooks/useStorageReady'
import { todayIso } from '@/lib/date/date-utils'

export default function CalisteniaPage() {
  const { ready } = useStorageReady()
  const [tab, setTab] = useState('hoy')

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">PESO CORPORAL</p>
          <h1>
            <em>Calistenia.</em>
          </h1>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as string)} className="mt-6">
        <TabsList>
          <TabsTab value="hoy">Hoy</TabsTab>
          <TabsTab value="editar">Editar rutina</TabsTab>
        </TabsList>
        <TabsPanel value="hoy" className="mt-6">
          <WorkoutSessionView date={todayIso()} type="calistenia" title="Calistenia" subtitle="Completa tus ejercicios del día" typeBadge={{ label: 'PESO CORPORAL', tone: 'lime' }} />
        </TabsPanel>
        <TabsPanel value="editar" className="mt-6">
          <CalisthenicsEditor storageReady={ready} />
        </TabsPanel>
      </Tabs>
    </>
  )
}
