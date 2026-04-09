<template>
  <div class="kb-inspector-section">
    <div class="kb-section-title">正文数据</div>
    <label class="kb-field">
      <span>文档选择</span>
      <n-select
        :value="currentDocId"
        size="small"
        :options="docOptions"
        filterable
        clearable
        placeholder="选择用于内容区预演的文档"
        @update:value="emit('update:currentDocId', $event)"
      />
    </label>
    <div class="kb-static-note">内容区展示当前选中文档，目录和页脚翻页会跟随这个文档实时联动。</div>
    <label class="kb-field">
      <span>正文最大宽度: {{ config.maxWidth }}px</span>
      <input v-model.number="config.maxWidth" class="kb-range-input" type="range" min="720" max="1100" />
    </label>
  </div>
</template>

<script setup lang="ts">
import type { BuilderDataSourceOption, ContentAreaConfig } from '../../../types/siteBuilder'
defineProps<{ config: ContentAreaConfig; currentDocId: number | null; docOptions: Array<{ label: string; value: number }>; dataSourceOptions?: BuilderDataSourceOption[] }>()
const emit = defineEmits<{ 'update:currentDocId': [value: number | null] }>()
</script>
