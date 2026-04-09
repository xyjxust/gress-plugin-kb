<template>
  <div v-if="!closed" class="sr-slot-ad" :style="bannerStyle">
    <span>{{ icon }}</span>
    <span class="sr-slot-ad__text">{{ text }}</span>
    <span v-if="subtext" class="sr-slot-ad__sub">{{ subtext }}</span>
    <button v-if="closable" class="sr-slot-ad__close" @click="close">&times;</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    icon?: string
    text: string
    subtext?: string
    bg?: string
    color?: string
    closable?: boolean
  }>(),
  {
    icon: '📢',
    bg: '#fff7ed',
    color: '#92400e',
    closable: true,
  }
)

const emit = defineEmits<{ close: [] }>()

const closed = ref(false)

const bannerStyle = computed(() => ({
  background: props.bg,
  color: props.color,
}))

function close() {
  closed.value = true
  emit('close')
}
</script>

<style scoped>
.sr-slot-ad {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 12px;
  position: relative;
}
.sr-slot-ad__text {
  font-weight: 500;
}
.sr-slot-ad__sub {
  opacity: 0.7;
  margin-left: 4px;
}
.sr-slot-ad__close {
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
.sr-slot-ad__close:hover {
  opacity: 1;
}
</style>
