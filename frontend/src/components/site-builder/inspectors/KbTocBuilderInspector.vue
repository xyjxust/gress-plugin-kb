<template>
  <div class="kb-inspector-section">
    <div class="kb-section-title">目录数据</div>
    <div class="kb-static-note">目录区实时解析当前正文的 Markdown 标题结构，无需手工维护；它天然依赖正文组件当前预览的文档。</div>
    <label class="kb-field">
      <span>目录栏宽度: {{ config.width }}px</span>
      <input v-model.number="config.width" class="kb-range-input" type="range" min="180" max="340" />
    </label>
    <label class="kb-check-row"><input v-model="config.sticky" type="checkbox" /><span>模拟吸顶目录</span></label>
  </div>
</template>

<script setup lang="ts">
import type { BuilderDataSourceOption, TocAreaConfig } from '../../../types/siteBuilder'
defineProps<{ config: TocAreaConfig; dataSourceOptions?: BuilderDataSourceOption[] }>()
</script>
