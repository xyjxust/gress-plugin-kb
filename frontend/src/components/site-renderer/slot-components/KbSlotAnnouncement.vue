<template>
  <div v-if="!closed" class="sr-slot-ann" :style="annStyle">
    <span class="sr-slot-ann__badge" :style="{ background: badgeBg, color: 'white' }">
      {{ badge }}
    </span>
    <strong>{{ title }}</strong>
    <span class="sr-slot-ann__text">{{ text }}</span>
    <span v-if="linkText" class="sr-slot-ann__link" @click="$emit('link-click')">
      {{ linkText }} &rarr;
    </span>
    <button v-if="closable" class="sr-slot-ann__close" @click="close">&times;</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    badge?: string
    badgeBg?: string
    title: string
    text?: string
    linkText?: string
    bg?: string
    color?: string
    closable?: boolean
  }>(),
  {
    badge: 'NEW',
    badgeBg: '#2563eb',
    bg: '#eff6ff',
    color: '#1d4ed8',
    closable: true,
  }
)

const emit = defineEmits<{
  close: []
  'link-click': []
}>()

const closed = ref(false)

const annStyle = computed(() => ({
  background: props.bg,
  color: props.color,
}))

function close() {
  closed.value = true
  emit('close')
}
</script>

<style scoped>
.sr-slot-ann {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  font-size: 13px;
  position: relative;
}
.sr-slot-ann__badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  flex-shrink: 0;
}
.sr-slot-ann__text {
  opacity: 0.8;
  margin-left: 4px;
}
.sr-slot-ann__link {
  margin-left: auto;
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
  opacity: 0.7;
  flex-shrink: 0;
}
.sr-slot-ann__link:hover {
  opacity: 1;
}
.sr-slot-ann__close {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.5;
  transition: opacity 0.12s;
  border: none;
  background: transparent;
  color: inherit;
}
.sr-slot-ann__close:hover {
  opacity: 1;
}
</style>
