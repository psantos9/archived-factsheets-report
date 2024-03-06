<template>
  <div class="py-[10px] px-[22px] flex flex-col space-y-1">
    <div class="flex items-center space-x-2">
      <factsheet-type-tag :type="row.factSheetType"/>
      <div
        class="leading-[18px] font-bold text-[15.5px] pr-[10px] text-[#1666ee] hover:underline cursor-pointer"
        @click="openSidePane({ factSheetType: row.factSheetType, factSheetId: row.factSheetId })">
        {{ row.factSheetName }}
      </div>
      <div class="flex-1" />
      <div>
        <span class="font-bold">Archived at: </span>
        <span>{{ row.archivedAt ? new Date(row.archivedAt).toISOString().split('T')[0] : '?' }}</span>
      </div>
    </div>
    <div class="flex space-x-1">
      <span class="font-bold">Archived by:</span>
      <span>{{ row.userName }} ({{ row.userEmail }})</span>
    </div>
    <div class="flex space-x-1">
      <span class="font-bold">Comment:</span>
      <span>{{ row.comment }}</span>
    </div>

  </div>
</template>

<script lang="ts" setup>
import { useReport } from '@/composables/useReport'
import FactsheetTypeTag from '@/components/FactsheetTypeTag.vue'
import type { IRow } from '@/types'
defineProps<{ row: IRow }>()

const { openSidePane } = useReport()

</script>
