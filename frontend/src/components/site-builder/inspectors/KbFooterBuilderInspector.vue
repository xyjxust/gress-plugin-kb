<template>
  <div class="kb-inspector-section">
    <div class="kb-section-title">翻页数据</div>
    <label class="kb-field">
      <span>上一篇 / 下一篇来源</span>
      <n-select v-model:value="config.pagerSource" size="small" :options="footerSourceOptions" />
    </label>
    <div class="kb-static-note">默认跟随左侧菜单树顺序生成上一篇和下一篇，这样 Header / Sidebar / Footer 可以构成联动导航体系。</div>
    <label class="kb-field">
      <span>辅助文案</span>
      <input v-model="config.note" class="kb-native-input" type="text" />
    </label>
    <label class="kb-check-row"><input v-model="config.showPager" type="checkbox" /><span>显示上一篇 / 下一篇导航</span></label>
  </div>
</template>

<script setup lang="ts">
import type { BuilderDataSourceOption, FooterAreaConfig, FooterPagerSource } from '../../../types/siteBuilder'
defineProps<{ config: FooterAreaConfig; footerSourceOptions: Array<{ label: string; value: FooterPagerSource }>; dataSourceOptions?: BuilderDataSourceOption[] }>()
</script>
