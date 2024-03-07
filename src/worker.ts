import { expose } from 'comlink'
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { IFactSheetArchivedEvent } from '@/types'

interface CustomReportDB extends DBSchema {
  events: {
    key: string
    value: {
      workspaceId: string
      factSheetId: string
      event: IFactSheetArchivedEvent
    }
  }
}

const getDb = async (): Promise<IDBPDatabase<CustomReportDB>> => openDB<CustomReportDB>(
  'archived-factsheets-report', 1, {
    upgrade(db) {
      db.createObjectStore('events')
    }
  }
)

const getItemKey = ({ workspaceId, factSheetId }: { workspaceId: string, factSheetId: string }) => `${workspaceId}:${factSheetId}`

export const CustomReportWorker = {
  async setFactSheetArchivedEvent(params: { workspaceId: string, factSheetId: string, event: IFactSheetArchivedEvent }) {
    const { workspaceId, factSheetId, event } = params
    const db = await getDb()
    await db.put('events', { workspaceId, factSheetId, event }, getItemKey({ workspaceId, factSheetId }))
  },
  async getFactSheetArchivedEvent(params: { workspaceId: string, factSheetId: string }): Promise<IFactSheetArchivedEvent | null> {
    const { workspaceId, factSheetId } = params
    const db = await getDb()
    const { event = null } = await db.get('events', getItemKey({ workspaceId, factSheetId })) ?? {}
    return event
  }
}

expose(CustomReportWorker)
