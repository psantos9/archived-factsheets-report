<template>
  <div>
    <div v-for="row in rows" :key="row.factSheetId">
    {{ row }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useReport } from '@/composables/useReport'
const { initReport, rows } = useReport()
initReport()
</script>
