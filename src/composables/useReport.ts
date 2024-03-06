import { ref, unref, computed, watch } from 'vue'
import { print } from 'graphql/language/printer'
import Bottleneck from 'bottleneck'
import FetchFactSheetArchivedEventQuery from '@/graphql/FetchFactSheetArchivedEventQuery.gql'
import { getInstance } from '@/worker'
import '@leanix/reporting'
import type { IRow, IFactSheetArchivedEvent } from '@/types'

; (async () => {
  // @ts-ignore
  const instance = getInstance()
  setInterval(() => {
    instance.logSomething()
  }, 1000)
})()

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
  const data = await fetchFactSheetArchivationEvent(factSheetId)
  const row = unref(factSheetIndex)?.[factSheetId] ?? null
  if (row === null) throw new Error(`FactSheet ${factSheetId} is not indexed`)
  const { createdAt: archivedAt, user: { id: userId, displayName: userName, email: userEmail }, comment } = data
  Object.assign(row, { userId, userName, userEmail, comment, archivedAt })
}

const initReport = async () => {
  await lx.init()
  await lx.ready({
    facets: [
      {
        key: 'Filter',
        label: 'Deleted factsheets',
        attributes: ['displayName'],
        callback: (data) => {
          data.forEach((factSheet) => {
            const { id: factSheetId, type: factSheetType, name: factSheetName } = factSheet
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
        },
        defaultFilters: [
          {
            facetKey: 'TrashBin', keys: ['archived']
          }
        ]
      }
    ]
  })
}

export const useReport = () => {
  return {
    initReport,
    rows: computed(() => Object.values(unref(factSheetIndex)))
  }
}
