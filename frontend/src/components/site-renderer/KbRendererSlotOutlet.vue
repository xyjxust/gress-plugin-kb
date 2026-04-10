<template>
  <template v-for="inst in instances" :key="inst.instanceId">
    <KbRendererSlot :instance="inst" @close="$emit('close', inst.instanceId)" />
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PageData, SiteRendererConfig, SlotComponentInstance } from '../../types/siteRenderer'
import { resolveSlotInstances } from './extensions/slotResolver'
import KbRendererSlot from './KbRendererSlot.vue'

const props = defineProps<{
  config: SiteRendererConfig
  slotKey: string
  activePageId?: string
  activeNavId?: string
  page?: PageData | null
}>()

defineEmits<{ close: [instanceId: string] }>()

const instances = computed<SlotComponentInstance[]>(() => {
  return resolveSlotInstances(props.config, props.slotKey, {
    activePageId: props.activePageId || '',
    activeNavId: props.activeNavId || '',
    page: props.page || null,
  })
})
</script>

