<template>
  <div class="border text-center rounded text-[12px] font-bold transition-all leading-[20px] w-[20px] hover:w-[140px] cursor-default" :style="style" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
    {{ label }}
  </div>
</template>

<script lang="ts" setup>
import { ref, unref, computed, toRefs } from 'vue'
import '@leanix/reporting'

const props = defineProps<{ type: string }>()
const { type } = toRefs(props)

const isHovered = ref(false)

const label = computed(() => {
  const factSheetType = unref(type)
  const label = unref(isHovered) ? lx.translateFactSheetType(factSheetType) : factSheetType[0]
  return label
})

const style = computed(() => {
  const factSheetType = unref(type)
  const { bgColor, color } = lx.currentSetup.settings.viewModel.factSheets.find(({ type }) => type === factSheetType) ?? { bgColor: 'black', color: 'white ' }
  return `background: ${bgColor}; color: ${color};`
})
</script>
