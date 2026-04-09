<template>
  <node-view-wrapper class="kb-image-gallery" contenteditable="false">
    <img
      v-for="(it, idx) in items"
      :key="idx"
      class="kb-image-gallery__img"
      :src="it.src"
      :alt="it.alt || ''"
      loading="lazy"
      draggable="false"
    />
    <div v-if="!items.length" class="kb-image-gallery__empty">空图片集</div>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import type { KbGalleryImageItem } from './kbImageGalleryExtension'

const props = defineProps(nodeViewProps)

const items = computed(() => {
  const raw = (props.node?.attrs?.items as KbGalleryImageItem[] | undefined) || []
  return Array.isArray(raw) ? raw.filter((x) => x && typeof x.src === 'string' && x.src) : []
})
</script>

<style scoped>
.kb-image-gallery__empty {
  padding: 12px;
  color: #94a3b8;
  font-size: 12px;
}
</style>

