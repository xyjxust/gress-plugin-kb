<template>
  <div class="kb-site-config-inspector">
    <n-alert v-if="nodeIssues.length" type="warning" :show-icon="false" class="kb-site-config-inspector__alert">
      <div v-for="issue in nodeIssues" :key="issue.id" class="kb-site-config-inspector__issue">
        <strong>{{ issue.level === 'error' ? '错误' : '提示' }}</strong>
        <span>{{ issue.message }}</span>
      </div>
    </n-alert>

    <n-tabs type="segment" animated>
      <n-tab-pane name="data" tab="数据配置">
        <div class="kb-site-config-inspector__sections">
          <template v-for="section in sections" :key="section.id">
            <n-card :title="section.title" size="small">
              <div class="kb-site-config-inspector__fields">
                <template v-for="field in section.fields" :key="field.key">
                  <label class="kb-site-config-inspector__field">
                    <span>{{ field.label }}</span>

                    <n-input
                      v-if="field.type === 'text'"
                      :value="String(getFieldValue(field.path || '') ?? '')"
                      :placeholder="field.placeholder"
                      @update:value="updateFieldValue(field.path || '', $event)"
                    />

                    <n-input
                      v-else-if="field.type === 'textarea'"
                      type="textarea"
                      :value="String(getFieldValue(field.path || '') ?? '')"
                      :placeholder="field.placeholder"
                      :autosize="{ minRows: 3, maxRows: 6 }"
                      @update:value="updateFieldValue(field.path || '', $event)"
                    />

                    <n-select
                      v-else-if="field.type === 'select'"
                      :value="getFieldValue(field.path || '') as any"
                      :options="field.options || []"
                      @update:value="updateFieldValue(field.path || '', $event)"
                    />

                    <div v-else-if="field.type === 'switch'" class="kb-site-config-inspector__switch">
                      <n-switch :value="Boolean(getFieldValue(field.path || ''))" @update:value="updateFieldValue(field.path || '', $event)" />
                    </div>

                    <n-slider
                      v-else-if="field.type === 'slider'"
                      :value="Number(getFieldValue(field.path || '') ?? field.min ?? 0)"
                      :min="field.min"
                      :max="field.max"
                      :step="field.step || 1"
                      @update:value="updateFieldValue(field.path || '', $event)"
                    />

                    <n-color-picker
                      v-else-if="field.type === 'color'"
                      :value="String(getFieldValue(field.path || '') ?? '#000000')"
                      :show-alpha="false"
                      @update:value="updateFieldValue(field.path || '', $event)"
                    />

                    <div v-else-if="field.type === 'custom'">
                      <slot :name="field.customEditorId || field.key" />
                    </div>
                  </label>
                </template>
              </div>
            </n-card>
          </template>

          <slot name="custom-content" />
        </div>
      </n-tab-pane>

      <n-tab-pane name="json" tab="模型预览">
        <pre class="kb-site-config-inspector__json">{{ serializedConfig }}</pre>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BuilderTreeNode, InspectorSectionSchema, PersistedSiteConfig, SiteConfigValidationIssue } from '../../types/siteConfig'
import { getValueByPath, setValueByPath } from '../../utils/siteConfig'

const props = defineProps<{
  config: PersistedSiteConfig
  selectedNode: BuilderTreeNode | null
  sections: InspectorSectionSchema[]
  issues: SiteConfigValidationIssue[]
}>()

const serializedConfig = computed(() => JSON.stringify(props.config, null, 2))
const nodeIssues = computed(() =>
  props.issues.filter((issue) => {
    if (!props.selectedNode?.targetPath) return false
    return issue.path.startsWith(props.selectedNode.targetPath) || issue.path.startsWith(props.selectedNode.paneId)
  })
)

function getFieldValue(path: string) {
  return getValueByPath(props.config as Record<string, any>, path)
}

function updateFieldValue(path: string, value: any) {
  setValueByPath(props.config as Record<string, any>, path, value)
}
</script>

<style scoped>
.kb-site-config-inspector {
  display: grid;
  gap: 12px;
}

.kb-site-config-inspector__alert {
  margin-bottom: 4px;
}

.kb-site-config-inspector__issue {
  display: grid;
  gap: 2px;
  font-size: 12px;
}

.kb-site-config-inspector__sections {
  display: grid;
  gap: 12px;
}

.kb-site-config-inspector__fields {
  display: grid;
  gap: 12px;
}

.kb-site-config-inspector__field {
  display: grid;
  gap: 8px;
}

.kb-site-config-inspector__field > span {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.kb-site-config-inspector__switch {
  display: flex;
  align-items: center;
  min-height: 34px;
}

.kb-site-config-inspector__json {
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  background: #0f172a;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.7;
}
</style>
