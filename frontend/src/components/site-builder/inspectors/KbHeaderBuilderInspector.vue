<template>
  <div class="kb-inspector-section">
    <div class="kb-section-title">导航数据</div>
    <label class="kb-field">
      <span>导航树</span>
      <n-select v-model:value="config.navMenuCode" size="small" :options="navSourceOptions" />
    </label>
    <div class="kb-static-note">Header 与 Sidebar 可共用导航树，Footer 也可以继续跟随侧栏树生成上一篇 / 下一篇。</div>
    <label class="kb-check-row"><input v-model="config.showLogo" type="checkbox" /><span>显示品牌 Logo</span></label>
    <label class="kb-check-row"><input v-model="config.showSearch" type="checkbox" /><span>显示搜索框</span></label>
    <label class="kb-check-row"><input v-model="config.showLanguage" type="checkbox" /><span>显示语言切换</span></label>
    <label class="kb-check-row"><input v-model="config.showTheme" type="checkbox" /><span>显示主题切换</span></label>
    <label class="kb-check-row"><input v-model="config.sticky" type="checkbox" /><span>模拟吸顶 Header</span></label>
  </div>
</template>

<script setup lang="ts">
import type { BuilderDataSourceOption, HeaderAreaConfig, NavMenuCode } from '../../../types/siteBuilder'
defineProps<{ config: HeaderAreaConfig; navSourceOptions: Array<{ label: string; value: NavMenuCode }>; dataSourceOptions?: BuilderDataSourceOption[] }>()
</script>
