<template>
  <div class="kb-inspector-section">
    <div class="kb-section-title">菜单数据</div>
    <label class="kb-field">
      <span>菜单树</span>
      <n-select v-model:value="config.navMenuCode" size="small" :options="navSourceOptions" />
    </label>
    <div class="kb-static-note">左侧菜单树既可独立配置，也可作为 Footer 的翻页顺序来源。</div>
    <label class="kb-field">
      <span>左侧栏宽度: {{ config.width }}px</span>
      <input v-model.number="config.width" class="kb-range-input" type="range" min="180" max="340" />
    </label>
    <label class="kb-check-row"><input v-model="config.sticky" type="checkbox" /><span>模拟吸顶侧栏</span></label>
  </div>
</template>

<script setup lang="ts">
import type { BuilderDataSourceOption, NavMenuCode, SidebarAreaConfig } from '../../../types/siteBuilder'
defineProps<{ config: SidebarAreaConfig; navSourceOptions: Array<{ label: string; value: NavMenuCode }>; dataSourceOptions?: BuilderDataSourceOption[] }>()
</script>
