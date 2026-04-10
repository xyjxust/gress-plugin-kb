<template>
  <component
    :is="resolvedComponent"
    v-if="resolvedComponent"
    v-bind="instance.props"
    @close="$emit('close')"
  />
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { SlotComponentInstance } from '../../types/siteRenderer'
import { getSlotComponent } from './slotRegistry'

const props = defineProps<{
  instance: SlotComponentInstance
}>()

defineEmits<{ close: [] }>()

const resolvedComponent = computed(() => {
  const key = props.instance.componentKey
  if (!key) return null
  return (getSlotComponent(key) as Component | undefined) || null
})
</script>
