<template>
  <component
    :is="resolvedComponent"
    v-if="resolvedComponent"
    v-bind="instance.props"
    @close="$emit('close')"
  />
</template>

<script setup lang="ts">
import { computed, markRaw, type Component } from 'vue'
import type { SlotComponentInstance } from '../../types/siteRenderer'
import KbSlotAdBanner from './slot-components/KbSlotAdBanner.vue'
import KbSlotAnnouncement from './slot-components/KbSlotAnnouncement.vue'

const props = defineProps<{
  instance: SlotComponentInstance
}>()

defineEmits<{ close: [] }>()

const BUILTIN_MAP: Record<string, Component> = {
  AdBanner: markRaw(KbSlotAdBanner),
  Announcement: markRaw(KbSlotAnnouncement),
}

const resolvedComponent = computed(() => {
  return BUILTIN_MAP[props.instance.componentKey] || null
})
</script>
