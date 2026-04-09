<template>
  <div class="kbvb-schema">
    <div v-for="section in schema" :key="section.key" class="kbvb-schema__section">
      <div v-if="section.title || section.description" class="kbvb-schema__head">
        <strong v-if="section.title">{{ section.title }}</strong>
        <span v-if="section.description">{{ section.description }}</span>
      </div>

      <div class="kbvb-schema__fields">
        <div v-for="field in section.fields" :key="field.key" class="kbvb-schema__field" :class="{ 'full': field.fullWidth }">
          <template v-if="field.type === 'custom'">
            <slot :name="field.slot" :field="field" />
          </template>
          <template v-else>
            <label>{{ field.label }}</label>
            <n-input
              v-if="field.type === 'text' || field.type === 'textarea'"
              :value="readValue(field.path)"
              :type="field.type === 'textarea' ? 'textarea' : 'text'"
              :placeholder="field.placeholder"
              :autosize="field.type === 'textarea' ? { minRows: 3, maxRows: 10 } : undefined"
              @update:value="writeValue(field.path, $event)"
            />
            <n-select
              v-else-if="field.type === 'select'"
              :value="readValue(field.path)"
              :options="field.options || []"
              :clearable="field.clearable"
              @update:value="writeValue(field.path, $event)"
            />
            <n-switch
              v-else-if="field.type === 'switch'"
              :value="!!readValue(field.path)"
              @update:value="writeValue(field.path, $event)"
            />
            <n-color-picker
              v-else-if="field.type === 'color'"
              :value="readValue(field.path)"
              :show-alpha="false"
              @update:value="writeValue(field.path, $event)"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface SchemaOption {
  label: string
  value: string
}

export interface SchemaField {
  key: string
  label?: string
  path?: string
  type: 'text' | 'textarea' | 'select' | 'switch' | 'color' | 'custom'
  placeholder?: string
  options?: SchemaOption[]
  clearable?: boolean
  fullWidth?: boolean
  slot?: string
}

export interface SchemaSection {
  key: string
  title?: string
  description?: string
  fields: SchemaField[]
}

const props = defineProps<{
  model: Record<string, any>
  schema: SchemaSection[]
}>()

function readValue(path?: string): any {
  if (!path) return undefined
  return path.split('.').reduce((acc, key) => acc?.[key], props.model)
}

function writeValue(path: string | undefined, value: any) {
  if (!path) return
  const keys = path.split('.')
  const lastKey = keys.pop()
  if (!lastKey) return
  const parent = keys.reduce((acc, key) => acc?.[key], props.model)
  if (parent) parent[lastKey] = value
}
</script>

<style scoped>
.kbvb-schema {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.kbvb-schema__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.kbvb-schema__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.kbvb-schema__head strong {
  color: #eef4ff;
  font-size: 13px;
}
.kbvb-schema__head span {
  color: #72819d;
  font-size: 12px;
}
.kbvb-schema__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.kbvb-schema__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kbvb-schema__field.full {
  grid-column: 1 / -1;
}
.kbvb-schema__field label {
  color: #c9d4eb;
  font-size: 12px;
  font-weight: 600;
}
</style>
