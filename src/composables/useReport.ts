import { ref, unref, computed } from 'vue'
import { print } from 'graphql/language/printer'
import Bottleneck from 'bottleneck'
import FetchFactSheetArchivedEventQuery from '@/graphql/FetchFactSheetArchivedEventQuery.gql'
import { CustomReportWorker } from '@/worker'
import InlineWorker from '@/worker?worker&inline'
import { wrap } from 'comlink'
import '@leanix/reporting'
import type { IRow, IFactSheetArchivedEvent } from '@/types'

export const getWorkerInstance = (): typeof CustomReportWorker => wrap<typeof CustomReportWorker>(new InlineWorker())

const worker = getWorkerInstance()
const factSheetIndex = ref<Record<string, IRow>>({})

const limiter = new Bottleneck({
  minTime: 100,
  maxConcurrent: 8
})

const commentCaptureRegex = /^Fact Sheet deleted. Comment: '(.+)'$/

const fetchFactSheetArchivationEvent = limiter.wrap(async (factSheetId: string) => {
  const query = print(FetchFactSheetArchivedEventQuery)
  const event = await lx.executeGraphQL(query, JSON.stringify({ factSheetId }))
    .then(({ allLogEvents: { edges } }) => {
      const event = edges?.[0]?.node ?? null
      if (event !== null) {
        const comment = commentCaptureRegex.exec(event.comment)
        event.createdAt = new Date(event.createdAt)
        event.comment = comment?.[1] ?? null
      }
      return event
    })
    .catch((err) => {
      if (err.message.includes('Not found')) return null
      else throw err
    })
  return event as IFactSheetArchivedEvent
})

const fetchFactSheetArchivationData = async (factSheetId: string) => {
  const workspaceId = lx.currentSetup.settings.workspace.id
  const row = unref(factSheetIndex)?.[factSheetId] ?? null
  if (row === null) throw new Error(`FactSheet ${factSheetId} is not indexed`)
  let event = import.meta.env.PROD ? await worker?.getFactSheetArchivedEvent({ workspaceId, factSheetId }) : null
  if (event === null) {
    event = await fetchFactSheetArchivationEvent(factSheetId)
    worker?.setFactSheetArchivedEvent({ workspaceId, factSheetId, event })
  }
  if (event == null) {
    console.warn(`Factsheet ${factSheetId} is not archived!`)
    return
  }
  const { createdAt: archivedAt, user: { id: userId, displayName: userName, email: userEmail }, comment } = event
  Object.assign(row, { userId, userName, userEmail, comment, archivedAt })
}

const openSidePane = async (params: { factSheetType: string, factSheetId: string }) => {
  const { factSheetId, factSheetType } = params
  lx.openSidePane({
    factSheet: {
      type: 'FactSheet',
      factSheetId,
      factSheetType,
      detailFields: ['name', 'externalId'],
      relations: [],
      pointOfView: { id: '1', changeSet: { type: 'dateOnly', date: new Date().toISOString().split('T')[0] } }
    }
  })
}

let facetKey = 0
const getReportConfiguration = (): lxr.ReportConfiguration => {
  facetKey++
  const config: lxr.ReportConfiguration = {
    facets: [
      {
        key: (facetKey + 1).toString(),
        label: 'Archived factsheets',
        attributes: ['displayName', 'status'],
        callback: (data) => {
          factSheetIndex.value = {}
          const excludedFactSheets: string[] = []
          data.forEach((factSheet) => {
            const { id: factSheetId, type: factSheetType, displayName: factSheetName, status } = factSheet
            if (status !== 'ARCHIVED') {
              excludedFactSheets.push(factSheetId)
              return
            }
            if (!unref(factSheetIndex)[factSheetId]) {
              const row: IRow = {
                factSheetId,
                factSheetType,
                factSheetName,
                userId: null,
                userName: null,
                userEmail: null,
                archivedAt: null,
                comment: null
              }
              unref(factSheetIndex)[factSheetId] = row
              fetchFactSheetArchivationData(factSheetId)
            }
          })
          if (excludedFactSheets.length) lx.sendExcludedFactSheets(excludedFactSheets)
        },
        facetFiltersChangedCallback: async (selection) => {
          const hasFacetTrashBin = selection.facets.findIndex(({ facetKey }) => facetKey === 'TrashBin') > -1
          // Race condition...
          if (!hasFacetTrashBin) lx.updateConfiguration(getReportConfiguration())
          // No race condition...
          // if (!hasFacetTrashBin) setTimeout(() => lx.updateConfiguration(getReportConfiguration()), 1000)
        },
        defaultFilters: [
          {
            facetKey: 'TrashBin', keys: ['archived']
          }
        ]
      }
    ]
  }
  return config
}

const initReport = async () => {
  await lx.init()
  await lx.ready(getReportConfiguration())
}

export const useReport = () => {
  return {
    initReport,
    openSidePane,
    rows: computed(() => Object.values(unref(factSheetIndex)))
  }
}
