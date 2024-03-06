<template>
  <div class="flex flex-col h-full relative">
    <div class="sticky top-0 px-8 bg-white font-bold border-b py-2">{{rows.length}} factsheet{{ rows.length === 1 ? '' : 's' }}</div>
    <div class="px-8 divide-y ">
      <list-item v-for="row in rows" :key="row.factSheetId" :row="row"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useReport } from '@/composables/useReport'
import ListItem from '@/components/ListItem.vue'

const { initReport, rows } = useReport()
initReport()
</script>
