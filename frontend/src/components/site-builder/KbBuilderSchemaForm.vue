<template>
  <div class="kb-schema-form">
    <template v-for="field in schema" :key="field.key">
      <label v-if="field.type === 'switch'" class="kb-check-row">
        <n-switch :value="Boolean(model[field.key])" @update:value="updateValue(field.key, $event)" />
        <span>{{ field.label }}</span>
      </label>

      <label v-else-if="field.type === 'select'" class="kb-field">
        <span>{{ field.label }}</span>
        <n-select
          :value="model[field.key] as any"
          size="small"
          :options="field.options || []"
          :placeholder="field.placeholder"
          @update:value="updateValue(field.key, $event)"
        />
      </label>

      <label v-else-if="field.type === 'range'" class="kb-field">
        <span>{{ field.label }}: {{ model[field.key] }}</span>
        <n-slider
          :min="field.min"
          :max="field.max"
          :step="field.step || 1"
          :value="Number(model[field.key] ?? field.min ?? 0)"
          @update:value="updateValue(field.key, $event)"
        />
      </label>

      <label v-else-if="field.type === 'color'" class="kb-color-field">
        <span>{{ field.label }}</span>
        <n-color-picker :value="String(model[field.key] || '#000000')" :show-alpha="false" @update:value="updateValue(field.key, $event)" />
      </label>

      <label v-else-if="field.type === 'textarea'" class="kb-field">
        <span>{{ field.label }}</span>
        <n-input
          type="textarea"
          :value="String(model[field.key] || '')"
          :placeholder="field.placeholder"
          :autosize="{ minRows: 4, maxRows: 8 }"
          @update:value="updateValue(field.key, $event)"
        />
      </label>

      <label v-else class="kb-field">
        <span>{{ field.label }}</span>
        <n-input
          :type="field.type === 'number' ? 'number' : 'text'"
          :value="model[field.key] as any"
          :placeholder="field.placeholder"
          @update:value="updateValue(field.key, field.type === 'number' ? Number($event) : $event)"
        />
      </label>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { SchemaField } from '../../types/siteBuilder'

const props = defineProps<{
  schema: SchemaField[]
  model: Record<string, any>
}>()

function updateValue(key: string, value: any) {
  props.model[key] = value
}
</script>

<style scoped>
.kb-schema-form {
  display: grid;
  gap: 12px;
}

.kb-field,
.kb-color-field {
  display: grid;
  gap: 8px;
}

.kb-field span,
.kb-color-field span {
  font-size: 13px;
  color: #475569;
}

.kb-check-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  color: var(--kb-studio-chip-text);
}

</style>
