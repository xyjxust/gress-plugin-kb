<template>
  <div v-if="open" class="kb-inspector-backdrop" @click="emit('update:open', false)" />

  <aside
    class="kb-studio-panel kb-studio-panel--inspector"
    :class="{ 'kb-studio-panel--inspector-open': open }"
    :style="siteThemeVars"
  >
    <div class="kb-studio-panel__header">
      <div>
        <span class="kb-studio-panel__eyebrow">Inspector</span>
        <h3>{{ areaMeta[selectedArea].label }}</h3>
      </div>
      <div class="kb-inspector-header-actions">
        <span class="kb-slot-badge">{{ currentSlotLabel }}</span>
        <n-button size="small" secondary round @click="emit('update:open', false)">关闭</n-button>
      </div>
    </div>

    <n-tabs v-model:value="activeTab" type="segment" animated class="kb-inspector-tabs">
      <n-tab-pane name="data" tab="数据配置">
        <KbBuilderSchemaForm :schema="registryEntry.dataSchema" :model="componentInstance.config" />
        <KbDataSourceBindingEditor
          v-for="bindingDef in registryEntry.bindings"
          :key="bindingDef.key"
          :definition="bindingDef"
          :binding="ensureBinding(bindingDef.key)"
          :data-sources="dataSources"
          :doc-options="docOptions"
          @update:binding="updateBinding(bindingDef.key, $event)"
          @save-source="emit('save-data-source', $event)"
        />
      </n-tab-pane>

      <n-tab-pane name="appearance" tab="页面配置">
        <div class="kb-inspector-section">
          <div class="kb-section-title">区域基础</div>
          <label class="kb-check-row">
            <n-switch v-model:value="componentInstance.config.visible" />
            <span>显示该区域</span>
          </label>
          <label class="kb-field">
            <span>区域标题</span>
            <n-input v-model:value="componentInstance.config.title" />
          </label>
        </div>

        <div class="kb-inspector-section">
          <div class="kb-section-title">区块主题</div>
          <label class="kb-field">
            <span>字体族</span>
            <n-input v-model:value="componentInstance.config.themeOverrides.fontFamily" />
          </label>
          <label class="kb-field">
            <span>标题字号: {{ componentInstance.config.themeOverrides.titleSize ?? siteTheme.blockBase.titleSize }}px</span>
            <n-slider v-model:value="componentInstance.config.themeOverrides.titleSize" :min="14" :max="60" />
          </label>
          <KbBuilderSchemaForm :schema="registryEntry.appearanceSchema" :model="componentInstance.config" />
          <div class="kb-color-grid">
            <label class="kb-color-field"><span>文字</span><n-color-picker v-model:value="componentInstance.config.themeOverrides.textColor" :show-alpha="false" /></label>
            <label class="kb-color-field"><span>弱化文字</span><n-color-picker v-model:value="componentInstance.config.themeOverrides.mutedColor" :show-alpha="false" /></label>
            <label class="kb-color-field"><span>强调色</span><n-color-picker v-model:value="componentInstance.config.themeOverrides.accentColor" :show-alpha="false" /></label>
            <label class="kb-color-field"><span>背景</span><n-color-picker v-model:value="componentInstance.config.themeOverrides.backgroundColor" :show-alpha="false" /></label>
            <label class="kb-color-field"><span>边框</span><n-color-picker v-model:value="componentInstance.config.themeOverrides.borderColor" :show-alpha="false" /></label>
          </div>
          <label class="kb-field">
            <span>圆角: {{ componentInstance.config.themeOverrides.borderRadius ?? siteTheme.blockBase.borderRadius }}px</span>
            <n-slider v-model:value="componentInstance.config.themeOverrides.borderRadius" :min="0" :max="32" />
          </label>
          <label class="kb-field">
            <span>水平内边距: {{ componentInstance.config.themeOverrides.paddingX ?? siteTheme.blockBase.paddingX }}px</span>
            <n-slider v-model:value="componentInstance.config.themeOverrides.paddingX" :min="0" :max="40" />
          </label>
          <label class="kb-field">
            <span>垂直内边距: {{ componentInstance.config.themeOverrides.paddingY ?? siteTheme.blockBase.paddingY }}px</span>
            <n-slider v-model:value="componentInstance.config.themeOverrides.paddingY" :min="0" :max="40" />
          </label>
        </div>

        <div class="kb-inspector-section">
          <div class="kb-section-title">站点主题</div>
          <label class="kb-field">
            <span>主题预设</span>
            <n-select :value="activeThemeSchemeId" size="small" :options="themePresetOptions" @update:value="emit('apply-preset', $event)" />
          </label>
          <div class="kb-theme-actions">
            <n-button size="small" secondary @click="emit('save-theme-scheme')">保存方案</n-button>
            <n-button size="small" secondary @click="emit('duplicate-theme-scheme')">复制方案</n-button>
            <n-button size="small" quaternary @click="emit('reset-theme-scheme')">重置方案</n-button>
          </div>
          <div class="kb-color-grid">
            <label class="kb-color-field"><span>页面背景</span><n-color-picker v-model:value="siteTheme.pageBackground" :show-alpha="false" /></label>
            <label class="kb-color-field"><span>画布背景</span><n-color-picker v-model:value="siteTheme.canvasBackground" :show-alpha="false" /></label>
            <label class="kb-color-field"><span>搜索底色</span><n-color-picker v-model:value="siteTheme.headerSearchBg" :show-alpha="false" /></label>
            <label class="kb-color-field"><span>目录悬浮</span><n-color-picker v-model:value="siteTheme.tocHoverBg" :show-alpha="false" /></label>
            <label class="kb-color-field"><span>翻页卡片背景</span><n-color-picker v-model:value="siteTheme.pageCardBg" :show-alpha="false" /></label>
            <label class="kb-color-field"><span>正文文字</span><n-color-picker v-model:value="siteTheme.contentProseColor" :show-alpha="false" /></label>
          </div>
          <label class="kb-field">
            <span>导航间距: {{ siteTheme.headerNavGap }}px</span>
            <n-slider v-model:value="siteTheme.headerNavGap" :min="8" :max="32" />
          </label>
          <label class="kb-field">
            <span>目录圆角: {{ siteTheme.tocItemRadius }}px</span>
            <n-slider v-model:value="siteTheme.tocItemRadius" :min="0" :max="20" />
          </label>
          <label class="kb-field">
            <span>翻页卡片圆角: {{ siteTheme.pageCardRadius }}px</span>
            <n-slider v-model:value="siteTheme.pageCardRadius" :min="0" :max="32" />
          </label>
        </div>
      </n-tab-pane>
    </n-tabs>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CSSProperties } from 'vue'
import type { AreaConfigMap, AreaKey, BuilderComponentBinding, BuilderComponentInstance, BuilderDataSource, CanvasSlot, FooterPagerSource, NavMenuCode, SiteThemeConfig } from '../../types/siteBuilder'
import KbBuilderSchemaForm from './KbBuilderSchemaForm.vue'
import KbDataSourceBindingEditor from './KbDataSourceBindingEditor.vue'
import { siteBuilderRegistry } from './siteBuilderRegistry'

const props = defineProps<{
  open: boolean
  selectedArea: AreaKey
  componentInstance: BuilderComponentInstance<any>
  currentSlotLabel: string
  activeThemeSchemeId: string
  docOptions: Array<{ label: string; value: number }>
  dataSources: BuilderDataSource[]
  themePresetOptions: Array<{ label: string; value: string }>
  areaMeta: Record<AreaKey, { label: string; description: string; slots: CanvasSlot[] }>
  siteTheme: SiteThemeConfig
  siteThemeVars: CSSProperties
}>()

const activeTab = ref<'data' | 'appearance'>('data')

const emit = defineEmits<{
  'update:open': [value: boolean]
  'apply-preset': [presetId: string]
  'save-theme-scheme': []
  'duplicate-theme-scheme': []
  'reset-theme-scheme': []
  'save-data-source': [source: BuilderDataSource]
}>()

const registryEntry = computed(() => siteBuilderRegistry[props.selectedArea])

function ensureBinding(key: string): BuilderComponentBinding {
  let found = props.componentInstance.bindings.find((item) => item.key === key)
  if (!found) {
    found = { key, sourceId: null }
    props.componentInstance.bindings.push(found)
  }
  return found
}

function updateBinding(key: string, sourceId: string | null) {
  const binding = ensureBinding(key)
  binding.sourceId = sourceId
}
</script>

<style scoped>
.kb-inspector-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.08); z-index: 30; }
.kb-studio-panel { background: var(--kb-studio-panel-bg); padding: 20px 18px 28px; }
.kb-studio-panel--inspector { position: fixed; top: 0; right: 0; width: min(360px, 92vw); height: 100vh; border-left: 1px solid var(--kb-studio-panel-border); z-index: 31; overflow-y: auto; transform: translateX(104%); transition: transform 0.22s ease; box-shadow: -20px 0 40px rgba(15, 23, 42, 0.06), var(--kb-studio-panel-shadow); }
.kb-studio-panel--inspector-open { transform: translateX(0); }
.kb-studio-panel__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.kb-studio-panel__eyebrow { display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 999px; background: var(--kb-studio-eyebrow-bg); color: var(--kb-studio-eyebrow-text); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
.kb-studio-panel__header h3 { margin: 10px 0 0; font-size: 20px; }
.kb-inspector-header-actions { display: flex; align-items: center; gap: 8px; }
.kb-slot-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 72px; height: 28px; padding: 0 10px; border-radius: 999px; background: var(--kb-studio-eyebrow-bg); color: var(--kb-studio-eyebrow-text); font-size: 12px; font-weight: 700; text-transform: uppercase; }
.kb-inspector-tabs { margin-top: 8px; }
.kb-inspector-section { display: grid; gap: 12px; padding-top: 14px; margin-top: 14px; border-top: 1px solid var(--kb-studio-panel-border); }
.kb-section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--kb-studio-eyebrow-text); }
.kb-field { display: grid; gap: 8px; }
.kb-field span { font-size: 13px; color: #475569; }
.kb-static-note { padding: 10px 12px; border-radius: 12px; background: color-mix(in srgb, var(--kb-studio-panel-bg) 92%, #ffffff 8%); color: var(--kb-studio-eyebrow-text); line-height: 1.6; font-size: 12px; }
.kb-color-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.kb-color-field { display: grid; gap: 8px; }
.kb-color-field span { font-size: 12px; color: var(--kb-studio-eyebrow-text); }
.kb-theme-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.kb-check-row { display: flex; align-items: center; gap: 10px; min-height: 36px; color: var(--kb-studio-chip-text); }
</style>
