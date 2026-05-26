<template>
  <div class="kb-editor">
    <header class="kb-editor__top">
      <div class="kb-editor__top-left">
        <n-button quaternary circle @click="goBack">
          <template #icon>
            <n-icon><component :is="ArrowBack" /></n-icon>
          </template>
        </n-button>
        <span class="kb-editor__brand">知识库</span>
        <n-divider vertical />
        <n-input
          v-model:value="title"
          class="kb-editor__title-input"
          placeholder="文档标题"
          :maxlength="200"
          clearable
        />
        <n-tag size="small" :bordered="false" round type="info">块编辑</n-tag>
        <n-tag v-if="isNewRoute" size="small" :bordered="false" round type="warning">未保存</n-tag>
      </div>
      <div class="kb-editor__top-right">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button quaternary circle @click="toggleAside">
              <template #icon>
                <n-icon><component :is="ListOutline" /></n-icon>
              </template>
            </n-button>
          </template>
          {{ showAside ? '隐藏目录' : '显示目录' }}
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button quaternary circle @click="openPreview">
              <template #icon>
                <n-icon><component :is="EyeOutline" /></n-icon>
              </template>
            </n-button>
          </template>
          预览
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button quaternary circle :loading="saving" @click="saveDraft">
              <template #icon>
                <n-icon><component :is="SaveOutline" /></n-icon>
              </template>
            </n-button>
          </template>
          保存草稿
        </n-tooltip>
        <n-button type="primary" :loading="publishing" :disabled="!doc" @click="publish">
          <template #icon>
            <n-icon><component :is="RocketOutline" /></n-icon>
          </template>
          发布
        </n-button>
      </div>
    </header>

    <div class="kb-editor__body" :class="{ 'kb-editor__body--aside-hidden': !showAside }">
      <aside
        class="kb-editor__aside"
        :class="{ 'kb-editor__aside--hidden': !showAside }"
        aria-label="侧栏"
        :aria-hidden="!showAside"
      >
        <n-tabs v-model:value="asideTab" type="line" animated size="small">
          <n-tab-pane name="navRefs" tab="导航-菜单树">
            <n-spin :show="navRefTreeLoading" class="kb-editor__aside-spin">
              <n-scrollbar class="kb-editor__aside-scroll" trigger="hover">
                <div class="kb-editor__aside-empty" v-if="!navMenuTreeOptions.length">
                  暂无引用关系
                </div>
                <div v-else class="kb-nav-ref-section">
                  <div class="kb-nav-ref-hd">导航 → 菜单（按 treesByNavId 绑定）</div>
                  <n-tree
                    block-line
                    default-expand-all
                    selectable
                    :data="navMenuTreeOptions"
                    :selected-keys="navMenuTreeSelectedKeys"
                    :render-prefix="renderNavMenuPrefix"
                    :render-suffix="renderNavMenuSuffix"
                    @update:selected-keys="onNavMenuTreeSelectKeys"
                  />
                </div>

                <div v-if="navTreeError" class="kb-editor__aside-empty" style="margin-top: 12px">
                  {{ navTreeError }}
                </div>
              </n-scrollbar>
            </n-spin>
          </n-tab-pane>
          <n-tab-pane name="outline" tab="大纲">
            <n-scrollbar class="kb-editor__aside-scroll" trigger="hover">
              <ul v-if="outline.length" class="kb-outline">
                <li
                  v-for="(item, idx) in outline"
                  :key="idx"
                  class="kb-outline__item"
                  :style="{ paddingLeft: `${(item.level - 1) * 12}px` }"
                  @click="scrollToOutline(item)"
                >
                  <span class="kb-outline__lv">H{{ item.level }}</span>
                  <span class="kb-outline__text">{{ item.text }}</span>
                </li>
              </ul>
              <div v-else class="kb-editor__aside-empty">暂无标题，输入「/」插入标题或正文块</div>
            </n-scrollbar>
          </n-tab-pane>
          <n-tab-pane name="meta" tab="详情">
            <n-scrollbar class="kb-editor__aside-scroll" trigger="hover">
              <n-descriptions v-if="doc" :column="1" label-placement="left" size="small" bordered>
                <n-descriptions-item label="ID">{{ doc.id }}</n-descriptions-item>
                <n-descriptions-item label="Slug">{{ doc.slug || '—' }}</n-descriptions-item>
                <n-descriptions-item label="状态">
                  <n-tag v-if="doc.status === 'PUBLISHED'" type="success" size="small">已发布</n-tag>
                  <n-tag v-else type="warning" size="small">草稿</n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="版本">v{{ doc.version }}</n-descriptions-item>
                <n-descriptions-item v-if="doc.publishedAt" label="发布时间">
                  {{ formatTime(doc.publishedAt) }}
                </n-descriptions-item>
                <n-descriptions-item v-if="doc.updatedAt" label="更新时间">
                  {{ formatTime(doc.updatedAt) }}
                </n-descriptions-item>
              </n-descriptions>
              <div v-else class="kb-editor__aside-empty">尚未写入数据库。填写标题后点击「保存草稿」即可创建文档。</div>
            </n-scrollbar>
          </n-tab-pane>
        </n-tabs>
      </aside>

      <div class="kb-editor__canvas-wrap">
        <n-spin :show="docContentLoading" class="kb-editor__canvas-spin" description="加载文档内容…">
          <div ref="editorScrollRef" class="kb-editor__cm">
            <editor-content v-if="editor" :editor="editor" />
          <bubble-menu
            v-if="editor"
            :editor="editor"
            :should-show="shouldShowBubble"
            :options="bubbleOptions"
            :append-to="bubbleAppendTo"
          >
            <div class="kb-bubble-menu">
              <n-button-group size="small">
                <n-popover trigger="click" placement="bottom-start">
                  <template #trigger>
                    <n-button quaternary>{{ headingLabel }}</n-button>
                  </template>
                  <div class="kb-bubble-pop">
                    <div class="kb-bubble-pop__row">
                      <n-button size="small" quaternary @click="bubble.h1">H1</n-button>
                      <n-button size="small" quaternary @click="bubble.h2">H2</n-button>
                      <n-button size="small" quaternary @click="bubble.h3">H3</n-button>
                      <n-button size="small" quaternary @click="bubble.p">正文</n-button>
                    </div>
                  </div>
                </n-popover>

                <n-popover trigger="click" placement="bottom-start">
                  <template #trigger>
                    <n-button quaternary>{{ alignLabel }}</n-button>
                  </template>
                  <div class="kb-bubble-pop">
                    <div class="kb-align-list">
                      <button type="button" class="kb-align-item" @mousedown.prevent @click="setAlign('left')">
                        <span class="kb-align-item__txt">左对齐</span>
                        <span v-if="currentAlign === 'left'" class="kb-align-item__check">✓</span>
                      </button>
                      <button type="button" class="kb-align-item" @mousedown.prevent @click="setAlign('center')">
                        <span class="kb-align-item__txt">居中对齐</span>
                        <span v-if="currentAlign === 'center'" class="kb-align-item__check">✓</span>
                      </button>
                      <button type="button" class="kb-align-item" @mousedown.prevent @click="setAlign('right')">
                        <span class="kb-align-item__txt">右对齐</span>
                        <span v-if="currentAlign === 'right'" class="kb-align-item__check">✓</span>
                      </button>

                      <div class="kb-align-sep" />

                      <button
                        type="button"
                        class="kb-align-item"
                        :disabled="!canIndentMore"
                        @mousedown.prevent
                        @click="indentMore"
                      >
                        <span class="kb-align-item__txt">增加缩进</span>
                        <span class="kb-align-item__hint">{{ indentHint }}</span>
                      </button>
                      <button
                        type="button"
                        class="kb-align-item"
                        :disabled="!canIndentLess"
                        @mousedown.prevent
                        @click="indentLess"
                      >
                        <span class="kb-align-item__txt">减少缩进</span>
                        <span class="kb-align-item__hint">{{ indentHint }}</span>
                      </button>
                    </div>
                  </div>
                </n-popover>

                <n-popover trigger="click" placement="bottom-start">
                  <template #trigger>
                    <n-button quaternary class="kb-font-size-trigger">
                      <span class="kb-font-size-trigger__lbl" :style="fontSizeTriggerPreviewStyle">{{ fontSizeLabel }}</span>
                    </n-button>
                  </template>
                  <div class="kb-bubble-pop">
                    <div class="kb-bubble-pop__title">字号</div>
                    <div class="kb-font-size-grid">
                      <button
                        v-for="opt in fontSizeOptions"
                        :key="opt.key"
                        type="button"
                        class="kb-font-size-btn"
                        :class="{ 'kb-font-size-btn--active': isFontSizeActive(opt) }"
                        @mousedown.prevent
                        @click="setFontSizePx(opt.value)"
                      >
                        <span class="kb-font-size-btn__lbl" :style="fontSizeOptionPreviewStyle(opt)">{{ opt.label }}</span>
                      </button>
                    </div>
                  </div>
                </n-popover>

                <n-button quaternary :class="btnClass('bold')" @click="bubble.bold">B</n-button>
                <n-button quaternary :class="btnClass('strike')" @click="bubble.strike">S</n-button>
                <n-button quaternary :class="btnClass('italic')" @click="bubble.italic">I</n-button>
                <n-button quaternary :class="btnClass('underline')" @click="bubble.underline">U</n-button>
                <n-button quaternary :class="btnClass('link')" @click="openLinkModal">链接</n-button>
                <n-button quaternary :class="btnClass('code')" @click="bubble.code">代码</n-button>

                <n-popover trigger="click" placement="bottom-end">
                  <template #trigger>
                    <n-button quaternary class="kb-font-btn" :style="fontBtnStyle">A</n-button>
                  </template>
                  <div class="kb-bubble-pop">
                    <div class="kb-bubble-pop__title">字体颜色</div>
                    <div class="kb-color-grid">
                      <button
                        v-for="c in textColors"
                        :key="c"
                        type="button"
                        class="kb-color-swatch"
                        :style="{ color: c }"
                        :class="{ 'kb-color-swatch--active': currentTextColor === c }"
                        @click="setTextColor(c)"
                        title="字体颜色"
                      >
                        A
                      </button>
                      <button type="button" class="kb-color-swatch kb-color-swatch--clear" @click="clearTextColor">
                        ×
                      </button>
                    </div>

                    <div class="kb-bubble-pop__title kb-mt">背景颜色</div>
                    <div class="kb-color-grid">
                      <button
                        v-for="c in bgColors"
                        :key="c"
                        type="button"
                        class="kb-color-swatch"
                        :style="{ background: c }"
                        :class="{ 'kb-color-swatch--active': currentBgColor === c || (c === 'transparent' && !currentBgColor) }"
                        @click="setBgColor(c)"
                        title="背景颜色"
                      />
                      <button type="button" class="kb-color-swatch kb-color-swatch--clear" @click="clearBgColor">
                        ×
                      </button>
                    </div>
                  </div>
                </n-popover>
              </n-button-group>
            </div>
          </bubble-menu>

          <bubble-menu
            v-if="editor"
            :editor="editor"
            plugin-key="kbTableBubbleMenu"
            :should-show="shouldShowTableBubble"
            :options="bubbleOptions"
            :append-to="bubbleAppendTo"
          >
            <div class="kb-table-bubble" @mousedown.prevent>
              <div class="kb-table-bubble__head">
                <span class="kb-table-bubble__title">表格</span>
              </div>

              <div class="kb-table-bubble__section">
                <div class="kb-table-bubble__label">行列</div>
                <div class="kb-table-bubble__tools">
                  <n-tooltip trigger="hover" placement="top">
                    <template #trigger>
                      <button type="button" class="kb-table-bubble__icon-btn" @click="tableBubble.addRowBefore">
                        <n-icon size="18"><component :is="IconTbRowUp" /></n-icon>
                      </button>
                    </template>
                    在上方插入行
                  </n-tooltip>
                  <n-tooltip trigger="hover" placement="top">
                    <template #trigger>
                      <button type="button" class="kb-table-bubble__icon-btn" @click="tableBubble.addRowAfter">
                        <n-icon size="18"><component :is="IconTbRowDown" /></n-icon>
                      </button>
                    </template>
                    在下方插入行
                  </n-tooltip>
                  <n-tooltip trigger="hover" placement="top">
                    <template #trigger>
                      <button type="button" class="kb-table-bubble__icon-btn kb-table-bubble__icon-btn--warn" @click="tableBubble.deleteRow">
                        <n-icon size="18"><component :is="IconTbRowDel" /></n-icon>
                      </button>
                    </template>
                    删除当前行
                  </n-tooltip>
                  <span class="kb-table-bubble__sep" />
                  <n-tooltip trigger="hover" placement="top">
                    <template #trigger>
                      <button type="button" class="kb-table-bubble__icon-btn" @click="tableBubble.addColBefore">
                        <n-icon size="18"><component :is="IconTbColLeft" /></n-icon>
                      </button>
                    </template>
                    在左侧插入列
                  </n-tooltip>
                  <n-tooltip trigger="hover" placement="top">
                    <template #trigger>
                      <button type="button" class="kb-table-bubble__icon-btn" @click="tableBubble.addColAfter">
                        <n-icon size="18"><component :is="IconTbColRight" /></n-icon>
                      </button>
                    </template>
                    在右侧插入列
                  </n-tooltip>
                  <n-tooltip trigger="hover" placement="top">
                    <template #trigger>
                      <button type="button" class="kb-table-bubble__icon-btn kb-table-bubble__icon-btn--warn" @click="tableBubble.deleteCol">
                        <n-icon size="18"><component :is="IconTbColDel" /></n-icon>
                      </button>
                    </template>
                    删除当前列
                  </n-tooltip>
                  <span class="kb-table-bubble__sep" />
                  <n-tooltip trigger="hover" placement="top">
                    <template #trigger>
                      <button type="button" class="kb-table-bubble__icon-btn kb-table-bubble__icon-btn--danger" @click="tableBubble.deleteTable">
                        <n-icon size="18"><component :is="IconTbTrash" /></n-icon>
                      </button>
                    </template>
                    删除整个表格
                  </n-tooltip>
                </div>
              </div>

              <div class="kb-table-bubble__section">
                <div class="kb-table-bubble__label">单元格对齐</div>
                <div class="kb-table-bubble__segment">
                  <button
                    type="button"
                    class="kb-table-bubble__seg"
                    :class="{ 'kb-table-bubble__seg--active': tableCellAlign === 'left' }"
                    @click="setTableCellAlign('left')"
                  >
                    左
                  </button>
                  <button
                    type="button"
                    class="kb-table-bubble__seg"
                    :class="{ 'kb-table-bubble__seg--active': tableCellAlign === 'center' }"
                    @click="setTableCellAlign('center')"
                  >
                    中
                  </button>
                  <button
                    type="button"
                    class="kb-table-bubble__seg"
                    :class="{ 'kb-table-bubble__seg--active': tableCellAlign === 'right' }"
                    @click="setTableCellAlign('right')"
                  >
                    右
                  </button>
                  <button
                    type="button"
                    class="kb-table-bubble__seg kb-table-bubble__seg--ghost"
                    :class="{ 'kb-table-bubble__seg--active': tableCellAlign === null }"
                    @click="setTableCellAlign(null)"
                  >
                    默认
                  </button>
                </div>
                <p class="kb-table-bubble__hint">默认：表头居中、表体居左（与样式一致）</p>
              </div>

              <div class="kb-table-bubble__section">
                <div class="kb-table-bubble__label">单元格底色</div>
                <div class="kb-table-bubble__palette">
                  <button
                    v-for="c in tableCellBgPresets"
                    :key="c.key"
                    type="button"
                    class="kb-table-bubble__dot"
                    :class="{ 'kb-table-bubble__dot--clear': c.clear }"
                    :style="c.value ? { background: c.value } : undefined"
                    :title="c.label"
                    @click="setTableCellBg(c.value)"
                  >
                    <span v-if="c.clear" class="kb-table-bubble__dot-x">×</span>
                  </button>
                </div>
              </div>

              <div class="kb-table-bubble__section">
                <div class="kb-table-bubble__label">文字颜色</div>
                <div class="kb-table-bubble__palette">
                  <button
                    v-for="c in tableCellTextPresets"
                    :key="c.key"
                    type="button"
                    class="kb-table-bubble__dot kb-table-bubble__dot--letter"
                    :class="{ 'kb-table-bubble__dot--clear': c.value == null }"
                    :style="c.value != null ? { color: c.value } : undefined"
                    :title="c.label"
                    @click="setTableCellTextColor(c.value)"
                  >
                    <span v-if="c.value == null" class="kb-table-bubble__dot-x">×</span>
                    <span v-else class="kb-table-bubble__letter">A</span>
                  </button>
                </div>
              </div>
            </div>
          </bubble-menu>

          <bubble-menu
            v-if="editor"
            :editor="editor"
            plugin-key="kbTipLayoutBubble"
            :should-show="shouldShowTipLayoutBubble"
            :options="bubbleOptions"
            :append-to="bubbleAppendTo"
          >
            <div class="kb-tip-bubble" @mousedown.prevent>
              <div class="kb-tip-bubble__head">
                <span class="kb-tip-bubble__title">提示框</span>
              </div>
              <div class="kb-tip-bubble__section">
                <div class="kb-tip-bubble__label">左侧条</div>
                <div class="kb-tip-bubble__palette">
                  <button
                    v-for="c in tipAccentPresets"
                    :key="c.key"
                    type="button"
                    class="kb-tip-bubble__dot"
                    :style="{ background: c.value }"
                    :class="{ 'kb-tip-bubble__dot--active': tipLayoutAccentActive === c.value }"
                    :title="c.label"
                    @click="setTipLayoutAccent(c.value)"
                  />
                  <button
                    type="button"
                    class="kb-tip-bubble__dot kb-tip-bubble__dot--clear"
                    title="默认"
                    @click="setTipLayoutAccent(null)"
                  >
                    <span class="kb-tip-bubble__dot-x">×</span>
                  </button>
                </div>
              </div>
              <div class="kb-tip-bubble__section">
                <div class="kb-tip-bubble__label">背景</div>
                <div class="kb-tip-bubble__palette">
                  <button
                    v-for="c in tipBgPresets"
                    :key="c.key"
                    type="button"
                    class="kb-tip-bubble__dot"
                    :style="{ background: c.value }"
                    :class="{ 'kb-tip-bubble__dot--active': tipLayoutBgActive === c.value }"
                    :title="c.label"
                    @click="setTipLayoutBg(c.value)"
                  />
                  <button
                    type="button"
                    class="kb-tip-bubble__dot kb-tip-bubble__dot--clear"
                    title="默认"
                    @click="setTipLayoutBg(null)"
                  >
                    <span class="kb-tip-bubble__dot-x">×</span>
                  </button>
                </div>
              </div>
            </div>
          </bubble-menu>

          <bubble-menu
            v-if="editor"
            :editor="editor"
            plugin-key="kbGridBubble"
            :should-show="shouldShowGridBubble"
            :options="gridBubbleOptions"
            :append-to="bubbleAppendTo"
          >
            <div class="kb-grid-bubble" @mousedown.prevent>
              <div class="kb-grid-bubble__head">
                <span class="kb-grid-bubble__title">多列布局</span>
              </div>
              <div class="kb-grid-bubble__row">
                <span class="kb-grid-bubble__lbl">列</span>
                <n-input-number
                  size="small"
                  :min="1"
                  :max="6"
                  :step="1"
                  :show-button="true"
                  :value="gridCols"
                  style="width: 110px"
                  @update:value="setGridCols"
                />
                <span class="kb-grid-bubble__lbl">列间距</span>
                <n-input-number
                  size="small"
                  :min="0"
                  :max="80"
                  :step="2"
                  :show-button="true"
                  :value="gridXGap"
                  style="width: 120px"
                  @update:value="setGridXGap"
                />
                <span class="kb-grid-bubble__lbl">行间距</span>
                <n-input-number
                  size="small"
                  :min="0"
                  :max="80"
                  :step="2"
                  :show-button="true"
                  :value="gridYGap"
                  style="width: 120px"
                  @update:value="setGridYGap"
                />
              </div>
              <div class="kb-grid-bubble__hint">
                删除：用鼠标选中整个布局器，然后按 Delete。
              </div>
            </div>
          </bubble-menu>
          </div>
        </n-spin>
      </div>
    </div>

    <n-modal
      v-model:show="showLinkModal"
      preset="dialog"
      title="插入或编辑链接"
      :show-icon="false"
      style="width: 420px"
      positive-text="确定"
      negative-text="取消"
      @positive-click="applyLink"
      @negative-click="cancelLinkModal"
    >
      <n-input v-model:value="linkHref" placeholder="https://  留空则移除链接" clearable />
    </n-modal>

    <n-modal
      v-model:show="showMediaModal"
      preset="dialog"
      :title="mediaModalTitle"
      :show-icon="false"
      style="width: 480px"
      positive-text="插入"
      negative-text="取消"
      @positive-click="onMediaPositive"
      @negative-click="onMediaNegative"
    >
      <n-input
        v-model:value="mediaUrlInput"
        type="textarea"
        :placeholder="
          pendingMedia?.kind === 'gallery'
            ? '每行一个图片 URL，插入后同一行并排显示多张'
            : pendingMedia?.kind === 'image'
              ? '图片 URL（https://...）'
              : pendingMedia?.kind === 'video'
                ? '视频页或嵌入地址（支持 YouTube 链接）'
                : '允许嵌入的网页 HTTPS 地址'
        "
        :autosize="pendingMedia?.kind === 'gallery' ? { minRows: 5, maxRows: 14 } : { minRows: 2, maxRows: 6 }"
        clearable
      />
    </n-modal>

    <n-modal
      v-model:show="showPreviewModal"
      preset="card"
      title="预览"
      style="width: min(960px, 96vw); max-height: 90vh"
      :bordered="false"
      :segmented="{ content: true }"
    >
      <template #header-extra>
        <n-button size="small" quaternary @click="openPreviewInNewTab">新窗口打开</n-button>
      </template>
      <n-scrollbar style="max-height: min(72vh, 720px)">
        <KbDocBody
          :doc="previewKbDoc"
          :loading="false"
          :prefer-inline="true"
          empty-text="暂无内容"
        />
      </n-scrollbar>
    </n-modal>

    <n-modal
      v-model:show="showBindDocModal"
      preset="card"
      title="绑定文档"
      style="width: min(860px, 96vw); max-height: 84vh"
      :bordered="false"
      :segmented="{ content: true }"
    >
      <template #header-extra>
        <n-button
          size="small"
          type="primary"
          :loading="saving"
          :disabled="!pendingBindNavNodeId"
          @click="onBindModalCreate"
        >
          创建并绑定
        </n-button>
      </template>
      <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px">
        <n-input
          v-model:value="bindDocKeyword"
          clearable
          placeholder="搜索文档标题 / ID"
        />
      </div>
      <n-scrollbar style="max-height: min(60vh, 560px)">
        <n-data-table
          :columns="bindDocColumns"
          :data="bindDocRows"
          :row-key="(r: any) => r.id"
          size="small"
          striped
          :bordered="false"
          :max-height="520"
          @row-click="onBindDocRowClick"
        />
      </n-scrollbar>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import 'highlight.js/styles/github.css'
import 'prosemirror-tables/style/tables.css'
import { computed, h, nextTick, onBeforeUnmount, onMounted, onDeactivated, ref, watch } from 'vue'
import type { EditorState } from '@tiptap/pm/state'
import { NodeSelection } from '@tiptap/pm/state'
import type { Editor, Range } from '@tiptap/core'
import { isNodeSelection, isTextSelection } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontSize } from '@tiptap/extension-text-style/font-size'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table/table'
import { TableRow } from '@tiptap/extension-table/row'
import { KbTableCell } from '@keqi.gress/plugin-ui'
import { KbTableHeader } from '@keqi.gress/plugin-ui'
import { useMessage, useIcon, useRoute, useRouter } from '@keqi.gress/plugin-bridge'
import { KbSlashCommands } from '@keqi.gress/plugin-ui'
import type { KbSlashHandlers } from '@keqi.gress/plugin-ui'
import { KbIframe } from '@keqi.gress/plugin-ui'
import { KbImageGallery } from '@keqi.gress/plugin-ui'
import { KbLayoutSection } from '@keqi.gress/plugin-ui'
import { sanitizeKbTipColor } from '@keqi.gress/plugin-ui'
import { KbTabbedPanel } from '@keqi.gress/plugin-ui'
import { KbCodeBlock } from '@keqi.gress/plugin-ui'
import { KbImage } from '@keqi.gress/plugin-ui'
import { KbIndent } from '@keqi.gress/plugin-ui'
import { KbGrid, KbGridColumn } from '@keqi.gress/plugin-ui'
import { normalizeImageUrl, normalizeVideoEmbedUrl, normalizeWebEmbedUrl } from '@keqi.gress/plugin-ui'
import { kbApi } from '../api/kb'
import { htmlToMarkdown, markdownToHtml } from '@keqi.gress/plugin-ui'
import { outlineFromEditor, type OutlineItem } from '@keqi.gress/plugin-ui'
import type { KbDoc, KbNavNode, KbTreeNode } from '../types/kb'
import type { SiteRendererConfig } from '../types/siteRenderer'
import { NButton, NDataTable, NIcon, NInput, type TreeOption, useDialog } from 'naive-ui'
import KbDocBody from '../components/KbDocBody.vue'

const ArrowBack = useIcon('ArrowBackOutline')
const ListOutline = useIcon('ListOutline')
const EyeOutline = useIcon('EyeOutline')
const SaveOutline = useIcon('SaveOutline')
const RocketOutline = useIcon('RocketOutline')
const IconTbRowUp = useIcon('ArrowUpOutline')
const IconTbRowDown = useIcon('ArrowDownOutline')
const IconTbRowDel = useIcon('RemoveOutline')
const IconTbColLeft = useIcon('ArrowBackOutline')
const IconTbColRight = useIcon('ArrowForwardOutline')
const IconTbColDel = useIcon('CloseOutline')
const IconTbTrash = useIcon('TrashOutline')
const IconNav = useIcon('NavigateOutline')
const IconMenuGroup = useIcon('FolderOutline')
const IconMenuLeaf = useIcon('DocumentTextOutline')
const IconBound = useIcon('CheckmarkCircleOutline')
const IconUnbound = useIcon('AlertCircleOutline')
const IconAdd = useIcon('AddOutline')
const IconUnbind = useIcon('CloseCircleOutline')

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const siteKey = computed(() => {
  const fromParam = route.value.params?.siteKey
  if (typeof fromParam === 'string' && fromParam.trim()) return fromParam.trim()
  const raw = route.value.query?.siteKey
  return typeof raw === 'string' && raw.trim() ? raw.trim() : ''
})

/** 路由为 /edit/new：仅本地编辑，首次「保存草稿」才 POST 创建 */
const isNewRoute = computed(() => String(route.value.params.docId || '') === 'new')

const outline = ref<OutlineItem[]>([])
const editorScrollRef = ref<HTMLElement | null>(null)
/** 驱动表格气泡内对齐等状态随选区更新 */
const editorLayoutTick = ref(0)

const showAside = ref(true)
const asideTab = ref<'navRefs' | 'outline' | 'meta'>('navRefs')

type DraftBaseline = { title: string; editorJson: string }
const loadedBaseline = ref<DraftBaseline>({ title: '', editorJson: '' })

// kbGrid 配置面板（BubbleMenu）
const gridCols = ref<number>(2)
const gridXGap = ref<number>(16)
const gridYGap = ref<number>(12)

function syncGridPanelFromSelection() {
  const ed = editor.value
  if (!ed) return
  const sel = ed.state.selection
  let a: any = null
  if (isNodeSelection(sel) && sel.node?.type?.name === 'kbGrid') {
    a = sel.node.attrs
  } else {
    if (!ed.isActive('kbGrid')) return
    a = ed.getAttributes('kbGrid') as any
  }
  const cols = Number(a?.cols ?? 2)
  const xGap = Number(a?.xGap ?? 16)
  const yGap = Number(a?.yGap ?? 12)
  gridCols.value = Number.isFinite(cols) ? cols : 2
  gridXGap.value = Number.isFinite(xGap) ? xGap : 16
  gridYGap.value = Number.isFinite(yGap) ? yGap : 12
}

function updateGridAttrs(patch: Record<string, any>) {
  const ed = editor.value
  if (!ed) return
  ed.chain().focus().updateAttributes('kbGrid', patch).run()
  syncGridPanelFromSelection()
}

function syncGridColumnCount(targetCols: number) {
  const ed = editor.value
  if (!ed) return
  if (!ed.isActive('kbGrid')) return

  const $from = ed.state.selection.$from
  const gridType = ed.schema.nodes.kbGrid
  if (!gridType) return

  let depth = -1
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type === gridType) {
      depth = d
      break
    }
  }
  if (depth < 0) return

  const gridNode = $from.node(depth)
  const gridPos = $from.before(depth)
  const currentCols = gridNode.childCount
  const nextCols = Math.max(1, Math.min(6, Math.round(targetCols)))
  if (currentCols === nextCols) return

  // 计算 grid 内容区的结束位置（插入点）
  const gridEndPos = gridPos + gridNode.nodeSize - 1

  if (currentCols < nextCols) {
    const toAdd = nextCols - currentCols
    const content = Array.from({ length: toAdd }).map(() => ({
      type: 'kbGridColumn',
      content: [{ type: 'paragraph' }]
    }))
    ed.chain().focus().insertContentAt(gridEndPos, content).run()
    return
  }

  // 删除末尾多余列
  let childPos = gridPos + 1
  let fromPos = gridEndPos
  for (let i = 0; i < gridNode.childCount; i++) {
    if (i === nextCols) {
      fromPos = childPos
      break
    }
    childPos += gridNode.child(i).nodeSize
  }
  if (fromPos < gridEndPos) {
    ed.chain().focus().deleteRange({ from: fromPos, to: gridEndPos }).run()
  }
}

function setGridCols(v: number | null) {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.max(1, Math.min(6, Math.round(v))) : 2
  gridCols.value = n
  updateGridAttrs({ cols: n })
  syncGridColumnCount(n)
}
function setGridXGap(v: number | null) {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(80, Math.round(v))) : 16
  gridXGap.value = n
  updateGridAttrs({ xGap: n })
}
function setGridYGap(v: number | null) {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(80, Math.round(v))) : 12
  gridYGap.value = n
  updateGridAttrs({ yGap: n })
}

function getCurrentEditorJson(): string {
  const ed = editor.value
  if (!ed) return ''
  try {
    return JSON.stringify(ed.getJSON())
  } catch {
    return ''
  }
}

function refreshBaselineFromCurrent() {
  loadedBaseline.value = {
    title: (title.value || '').trim(),
    editorJson: getCurrentEditorJson()
  }
}

function isDirtyComparedToLoaded(): boolean {
  const base = loadedBaseline.value
  const curTitle = (title.value || '').trim()
  if (curTitle !== (base.title || '')) return true
  return getCurrentEditorJson() !== (base.editorJson || '')
}

function confirmDiscardIfDirty(thenDo: () => void) {
  if (!isDirtyComparedToLoaded()) {
    thenDo()
    return
  }
  dialog.warning({
    title: '文章有修改',
    content: '当前文章有未保存的修改，切换后将覆盖编辑器内容，是否继续？',
    positiveText: '继续切换',
    negativeText: '取消',
    onPositiveClick: thenDo
  })
}

function toggleAside() {
  showAside.value = !showAside.value
}

const showLinkModal = ref(false)
const linkHref = ref('')

const showMediaModal = ref(false)
const mediaUrlInput = ref('')
const pendingMedia = ref<{
  editor: Editor
  range: Range
  kind: 'image' | 'gallery' | 'video' | 'web'
} | null>(null)

const mediaModalTitle = computed(() => {
  const k = pendingMedia.value?.kind
  if (k === 'image') return '插入图片'
  if (k === 'gallery') return '图片集'
  if (k === 'video') return '嵌入视频'
  if (k === 'web') return '嵌入网页'
  return '嵌入内容'
})

const slashHandlers: KbSlashHandlers = {
  requestImage: ({ editor, range }) => {
    pendingMedia.value = { editor, range, kind: 'image' }
    mediaUrlInput.value = 'https://'
    showMediaModal.value = true
  },
  requestImageGallery: ({ editor, range }) => {
    pendingMedia.value = { editor, range, kind: 'gallery' }
    mediaUrlInput.value = ''
    showMediaModal.value = true
  },
  requestVideoEmbed: ({ editor, range }) => {
    pendingMedia.value = { editor, range, kind: 'video' }
    mediaUrlInput.value = ''
    showMediaModal.value = true
  },
  requestWebEmbed: ({ editor, range }) => {
    pendingMedia.value = { editor, range, kind: 'web' }
    mediaUrlInput.value = 'https://'
    showMediaModal.value = true
  }
}

/** 挂到 body，避免被 .kb-editor__cm overflow 裁切；shift 防止贴边溢出视口 */
const bubbleAppendTo = () => document.body

const bubbleOptions = computed(() => ({
  // 使用 *-start 保证选区左侧贴合时更容易在视口内显示
  placement: 'top-start' as const,
  strategy: 'fixed' as const,
  flip: true,
  offset: 8,
  shift: {
    padding: 12
  },
  // 监听编辑区滚动，保证媒体上方工具条跟随移动
  scrollTarget: editorScrollRef.value || window
}))

// Grid 配置面板：强制在光标下方展示，避免被顶部栏遮挡
const gridBubbleOptions = computed(() => ({
  ...bubbleOptions.value,
  placement: 'bottom-start' as const
}))

const textColors = [
  '#111827',
  '#6b7280',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6'
]

const bgColors = [
  'transparent',
  '#fee2e2',
  '#ffedd5',
  '#fef3c7',
  '#dcfce7',
  '#dbeafe',
  '#ede9fe',
  '#e2e8f0'
]

/** 气泡菜单：内联字号（textStyle + FontSize） */
const fontSizeOptions: Array<{ key: string; label: string; value: string | null }> = [
  { key: 'fs-def', label: '默认', value: null },
  { key: 'fs-12', label: '12', value: '12px' },
  { key: 'fs-13', label: '13', value: '13px' },
  { key: 'fs-14', label: '14', value: '14px' },
  { key: 'fs-16', label: '16', value: '16px' },
  { key: 'fs-18', label: '18', value: '18px' },
  { key: 'fs-20', label: '20', value: '20px' },
  { key: 'fs-24', label: '24', value: '24px' }
]

/** 表格气泡：单元格底色（null=清除内联，用默认样式） */
const tableCellBgPresets: Array<{ key: string; label: string; value: string | null; clear?: boolean }> = [
  { key: 'tb-clear', label: '默认底色', value: null, clear: true },
  { key: 'tb-h', label: '表头浅灰', value: '#f8f8f8' },
  { key: 'tb-w', label: '白色', value: '#ffffff' },
  { key: 'tb-r', label: '浅红', value: '#fee2e2' },
  { key: 'tb-o', label: '浅橙', value: '#ffedd5' },
  { key: 'tb-y', label: '浅黄', value: '#fef3c7' },
  { key: 'tb-g', label: '浅绿', value: '#dcfce7' },
  { key: 'tb-b', label: '浅蓝', value: '#dbeafe' },
  { key: 'tb-p', label: '浅紫', value: '#ede9fe' },
  { key: 'tb-z', label: '浅锌', value: '#e2e8f0' }
]

const tableCellTextPresets: Array<{ key: string; label: string; value: string | null }> = [
  { key: 'tt-clear', label: '默认字色', value: null },
  ...textColors.map((value, i) => ({ key: `tt-${i}`, label: value, value }))
]

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      codeBlock: false
    }),
    KbCodeBlock.configure({
      languageClassPrefix: 'language-',
      defaultLanguage: null
    }),
    Placeholder.configure({
      placeholder: '输入"/"快速插入内容'
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer nofollow'
      }
    }),
    TextStyle,
    FontSize,
    Color,
    Highlight.configure({ multicolor: true }),
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph', 'tableCell', 'tableHeader'] }),
    Table.configure({
      resizable: true,
      HTMLAttributes: { class: 'kb-editor-table' }
    }),
    TableRow,
    KbTableCell,
    KbTableHeader,
    KbIndent,
    KbImage.configure({
      allowBase64: true,
      resize: {
        enabled: true,
        minWidth: 120,
        minHeight: 60,
        alwaysPreserveAspectRatio: true
      },
      HTMLAttributes: { class: 'kb-editor-image' }
    }),
    KbImageGallery,
    KbLayoutSection,
    // 多列布局（Grid）
    KbGrid,
    KbGridColumn,
    KbTabbedPanel,
    KbIframe,
    KbSlashCommands.configure({
      slashHandlers
    })
  ],
  content: '<p></p>',
  editorProps: {
    attributes: {
      /* ProseMirror：与 prosemirror-tables 样式选择器一致，列宽/选区高亮才生效 */
      class: 'ProseMirror kb-tiptap-prose'
    }
  },
  onUpdate: ({ editor: ed }) => {
    outline.value = outlineFromEditor(ed)
    editorLayoutTick.value++
  },
  onSelectionUpdate: ({ editor: ed }) => {
    if (ed.isActive('table')) editorLayoutTick.value++
    if (ed.isActive('kbGrid')) syncGridPanelFromSelection()
  },
  onCreate: ({ editor: ed }) => {
    outline.value = outlineFromEditor(ed)
    editorLayoutTick.value++
    // 不在此强制 focus：已有文档由 loadDoc 注入内容后按是否为空再决定是否聚焦，避免抢标题等焦点
  }
})

const doc = ref<KbDoc | null>(null)
const title = ref('')
const saving = ref(false)
const publishing = ref(false)
/** 仅正文区：拉取单篇文档 API 时 */
const docContentLoading = ref(false)
/** 仅「文档」侧栏树：/kb/tree，与正文加载互不阻塞 */
const treeLoading = ref(false)
const docTree = ref<KbTreeNode[]>([])
const showPreviewModal = ref(false)

// 绑定文档弹窗
const showBindDocModal = ref(false)
const pendingBindNavNodeId = ref<number | null>(null)
const bindDocKeyword = ref('')

type BindDocRow = {
  id: number
  title: string
  status?: string
  slug?: string
  updatedAt?: string | null
  createdAt?: string | null
  publishedAt?: string | null
}

function flattenDocs(nodes: KbTreeNode[]): BindDocRow[] {
  const out: BindDocRow[] = []
  const walk = (arr: KbTreeNode[]) => {
    for (const n of arr) {
      const id = typeof (n as any).id === 'number' ? (n as any).id : Number((n as any).id)
      if (id && Number.isFinite(id)) {
        out.push({
          id,
          title: String((n as any).title ?? '').trim() || `文档 ${id}`,
          status: (n as any).status,
          slug: (n as any).slug,
          updatedAt: (n as any).updatedAt ?? null,
          createdAt: (n as any).createdAt ?? null,
          publishedAt: (n as any).publishedAt ?? null
        })
      }
      if ((n as any).children?.length) walk((n as any).children)
    }
  }
  walk(nodes)
  return out
}

const bindDocRows = computed<BindDocRow[]>(() => {
  const kw = (bindDocKeyword.value || '').trim().toLowerCase()
  const rows = flattenDocs(docTree.value)
  if (!kw) return rows
  return rows.filter((r) => String(r.id).includes(kw) || (r.title || '').toLowerCase().includes(kw))
})

const bindDocColumns = [
  {
    title: 'ID',
    key: 'id',
    width: 90
  },
  {
    title: '标题',
    key: 'title',
    ellipsis: { tooltip: true }
  },
  {
    title: '状态',
    key: 'status',
    width: 90
    ,
    render: (row: any) => {
      const s = String(row?.status || '').toUpperCase()
      if (s === 'PUBLISHED') return '已发布'
      if (s === 'DRAFT') return '草稿'
      return row?.status || '—'
    }
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    width: 180,
    render: (row: any) => formatTime(row?.updatedAt || row?.publishedAt || row?.createdAt || null)
  },
  {
    title: '操作',
    key: 'actions',
    width: 110,
    render: (row: any) => {
      const docId = Number(row?.id)
      return h(
        NButton as any,
        {
          size: 'small',
          type: 'primary',
          tertiary: true,
          onClick: (e: MouseEvent) => {
            e.stopPropagation()
            const nodeId = pendingBindNavNodeId.value
            if (!nodeId || !docId || Number.isNaN(docId)) return
            void bindExistingDocToNavNode(nodeId, docId)
          }
        },
        { default: () => '绑定' }
      )
    }
  }
] as any

async function openBindDocModal(nodeId: number) {
  pendingBindNavNodeId.value = nodeId
  bindDocKeyword.value = ''
  showBindDocModal.value = true
  if (!docTree.value.length && !treeLoading.value) {
    await loadDocTree()
  }
}

function closeBindDocModal() {
  showBindDocModal.value = false
  pendingBindNavNodeId.value = null
}

async function bindExistingDocToNavNode(nodeId: number, docId: number) {
  const bind = navNodeBindings.value[nodeId]
  const cfg = navRendererConfig.value
  const sk = siteKey.value
  if (!bind || !cfg || !sk) {
    message.warning('绑定上下文缺失，请刷新后重试')
    return
  }
  if (saving.value) {
    message.warning('正在保存，请稍候再试')
    return
  }
  const pageId = `doc-${docId}`
  if (!cfg.pages) cfg.pages = {}
  if (!(cfg.pages as any)[pageId]) {
    const row = bindDocRows.value.find((r) => r.id === docId)
    ;(cfg.pages as any)[pageId] = {
      id: pageId,
      slug: row?.slug || `doc-${docId}`,
      title: row?.title || `文档 ${docId}`,
      description: '页面内容将在此渲染',
      meta: {
        kbDocListSource: true,
        kbDoc: { id: docId },
        kbDocLoading: false
      }
    }
  }

  saving.value = true
  try {
    if (bind.kind === 'nav') {
      const links: any[] = (cfg.navbar?.links ?? []) as any[]
      const link = links.find((x) => String(x?.id || '') === bind.navId)
      if (!link) throw new Error('未找到对应导航项')
      link.pageId = pageId
    } else {
      if (
        bind.sectionIndex == null ||
        !Array.isArray(bind.nodePath) ||
        !setTreeNodePageIdByPath(cfg, bind.navId, bind.sectionIndex, bind.nodePath, pageId)
      ) {
        throw new Error('未找到对应菜单节点')
      }
    }

    await kbApi.saveSiteRendererDraft(JSON.stringify(cfg), sk)
    message.success('已绑定文档')
    navRefTreesLoadedForSiteKey = ''
    await loadNavReferenceTrees()
    closeBindDocModal()
  } catch (e: any) {
    message.error(e?.message || '绑定失败')
  } finally {
    saving.value = false
  }
}

async function unbindNavNode(nodeId: number) {
  const bind = navNodeBindings.value[nodeId]
  const cfg = navRendererConfig.value
  const sk = siteKey.value
  if (!bind || !cfg || !sk) {
    message.warning('绑定上下文缺失，请刷新后重试')
    return
  }
  if (saving.value) {
    message.warning('正在保存，请稍候再试')
    return
  }
  saving.value = true
  try {
    if (bind.kind === 'nav') {
      const links: any[] = (cfg.navbar?.links ?? []) as any[]
      const link = links.find((x) => String(x?.id || '') === bind.navId)
      if (!link) throw new Error('未找到对应导航项')
      link.pageId = null
    } else {
      if (bind.sectionIndex == null || !Array.isArray(bind.nodePath)) {
        throw new Error('未找到对应菜单节点')
      }
      const byNav = ((cfg.sidebar as any)?.treesByNavId || {}) as Record<string, any[]>
      const secs = byNav[bind.navId]
      if (!Array.isArray(secs) || !secs[bind.sectionIndex]) throw new Error('未找到对应菜单节点')
      let node: any = null
      let curList: any[] = secs[bind.sectionIndex].children || []
      for (let i = 0; i < bind.nodePath.length; i++) {
        const idx = bind.nodePath[i]
        if (!Array.isArray(curList) || idx < 0 || idx >= curList.length) throw new Error('未找到对应菜单节点')
        node = curList[idx]
        curList = node?.children || []
      }
      if (!node) throw new Error('未找到对应菜单节点')
      node.pageId = null
    }

    await kbApi.saveSiteRendererDraft(JSON.stringify(cfg), sk)
    message.success('已解绑')
    navRefTreesLoadedForSiteKey = ''
    await loadNavReferenceTrees()
  } catch (e: any) {
    message.error(e?.message || '解绑失败')
  } finally {
    saving.value = false
  }
}

function onBindDocRowClick() {
  // 仅用于行高亮/选择等；绑定走「操作」列按钮，避免误触
}

function onBindModalCreate() {
  const nodeId = pendingBindNavNodeId.value
  if (!nodeId) return
  closeBindDocModal()
  void createDocAndBindNavNode(nodeId)
}

/** 内联预览：与 KbDocBody 一致，存储文件链接走 /system/storage/download?url= */
const previewKbDoc = computed<KbDoc | null>(() => {
  if (!showPreviewModal.value || !editor.value) return null
  const bodyMd = htmlToMarkdown(editor.value.getHTML())
  return {
    id: doc.value?.id ?? 0,
    spaceId: doc.value?.spaceId ?? 0,
    parentId: doc.value?.parentId ?? null,
    slug: doc.value?.slug ?? '',
    title: title.value.trim() || '（无标题）',
    bodyMd,
    bodyHtml: undefined,
    status: 'DRAFT',
    version: doc.value?.version ?? 0,
    staticHtmlUrl: undefined,
  }
})

function cleanupFloatingUI() {
  // `/` 命令菜单是 append 到 body 的，防止切换路由/标签后残留
  if (typeof document !== 'undefined') {
    document.querySelectorAll('.kb-slash-menu').forEach((el) => el.remove())
  }
  // 模态弹窗也兜底关闭
  showLinkModal.value = false
  showMediaModal.value = false
  pendingMedia.value = null
}

function shouldShowTableBubble(props: { editor: Editor; state: EditorState; from: number; to: number }) {
  return props.editor.isActive('table')
}

function shouldShowTipLayoutBubble(props: {
  editor: Editor
  state: EditorState
  from: number
  to: number
}) {
  const { editor: ed, from, to } = props
  if (ed.isActive('table')) return false
  if (!ed.isActive('kbLayoutSection')) return false
  const v = ed.getAttributes('kbLayoutSection').variant
  if (v !== 'tip') return false
  if (from !== to) return false
  return true
}

function shouldShowGridBubble(props: { editor: Editor; state: EditorState; from: number; to: number }) {
  const { editor: ed, state, from, to } = props
  if (ed.isActive('table')) return false
  if (shouldShowTipLayoutBubble(props as any)) return false
  if (isNodeSelection(state.selection) && state.selection.node.type.name === 'kbGrid') return true
  if (from !== to) return false
  return ed.isActive('kbGrid')
}

function shouldShowBubble(props: {
  editor: Editor
  state: EditorState
  from: number
  to: number
}) {
  const { editor: ed, state, from, to } = props
  if (ed.isActive('table')) return false
  if (shouldShowTipLayoutBubble(props)) return false
  if (isNodeSelection(state.selection)) {
    const selNodeName = state.selection.node.type.name
    return selNodeName === 'image' || selNodeName === 'kbIframe' || selNodeName === 'kbImageGallery'
  }
  if (!isTextSelection(state.selection)) return false
  if (ed.isActive('codeBlock')) return false
  return from !== to
}

const tableBubble = {
  addRowBefore: () => editor.value?.chain().focus().addRowBefore().run(),
  addRowAfter: () => editor.value?.chain().focus().addRowAfter().run(),
  deleteRow: () => editor.value?.chain().focus().deleteRow().run(),
  addColBefore: () => editor.value?.chain().focus().addColumnBefore().run(),
  addColAfter: () => editor.value?.chain().focus().addColumnAfter().run(),
  deleteCol: () => editor.value?.chain().focus().deleteColumn().run(),
  deleteTable: () => editor.value?.chain().focus().deleteTable().run()
}

function setTableCellBg(color: string | null) {
  const ed = editor.value
  if (!ed) return
  ed.chain().focus().setCellAttribute('backgroundColor', color).run()
}

function setTableCellTextColor(color: string | null) {
  const ed = editor.value
  if (!ed) return
  ed.chain().focus().setCellAttribute('textColor', color).run()
}

function getTableCellAlign(ed: Editor): 'left' | 'center' | 'right' | null {
  const { $from } = ed.state.selection
  for (let d = $from.depth; d > 0; d--) {
    const n = $from.node(d)
    if (n.type.name === 'tableCell' || n.type.name === 'tableHeader') {
      const a = n.attrs.align as string | null | undefined
      if (a === 'left' || a === 'center' || a === 'right') return a
      const ta = n.attrs.textAlign as string | null | undefined
      if (ta === 'left' || ta === 'center' || ta === 'right') return ta
      return null
    }
  }
  return null
}

const tableCellAlign = computed<'left' | 'center' | 'right' | null>(() => {
  void editorLayoutTick.value
  const ed = editor.value
  if (!ed?.isActive('table')) return null
  return getTableCellAlign(ed)
})

const tipAccentPresets = [
  { key: 'blue', label: '蓝', value: '#1d4ed8' },
  { key: 'emerald', label: '绿', value: '#047857' },
  { key: 'amber', label: '琥珀', value: '#b45309' },
  { key: 'rose', label: '红', value: '#be123c' },
  { key: 'violet', label: '紫', value: '#6d28d9' }
] as const

const tipBgPresets = [
  { key: 'blue', label: '浅蓝', value: '#f0f7ff' },
  { key: 'emerald', label: '浅绿', value: '#ecfdf5' },
  { key: 'amber', label: '浅黄', value: '#fffbeb' },
  { key: 'rose', label: '浅红', value: '#fff1f2' },
  { key: 'violet', label: '浅紫', value: '#f5f3ff' }
] as const

const tipLayoutAccentActive = computed(() => {
  void editorLayoutTick.value
  const ed = editor.value
  if (!ed?.isActive('kbLayoutSection')) return null
  return (ed.getAttributes('kbLayoutSection').tipAccent as string | null) || null
})

const tipLayoutBgActive = computed(() => {
  void editorLayoutTick.value
  const ed = editor.value
  if (!ed?.isActive('kbLayoutSection')) return null
  return (ed.getAttributes('kbLayoutSection').tipBg as string | null) || null
})

function setTipLayoutAccent(value: string | null) {
  const ed = editor.value
  if (!ed?.isActive('kbLayoutSection')) return
  const v = value ? sanitizeKbTipColor(value) : null
  ed.chain().focus().updateAttributes('kbLayoutSection', { tipAccent: v }).run()
}

function setTipLayoutBg(value: string | null) {
  const ed = editor.value
  if (!ed?.isActive('kbLayoutSection')) return
  const v = value ? sanitizeKbTipColor(value) : null
  ed.chain().focus().updateAttributes('kbLayoutSection', { tipBg: v }).run()
}

function setTableCellAlign(align: 'left' | 'center' | 'right' | null) {
  const ed = editor.value
  if (!ed) return
  const type = ed.isActive('tableHeader') ? 'tableHeader' : 'tableCell'
  ed.chain().focus().setCellAttribute('align', align).updateAttributes(type, { textAlign: null }).run()
}

const bubble = {
  bold: () => editor.value?.chain().focus().toggleBold().run(),
  italic: () => editor.value?.chain().focus().toggleItalic().run(),
  underline: () => editor.value?.chain().focus().toggleUnderline().run(),
  strike: () => editor.value?.chain().focus().toggleStrike().run(),
  p: () => editor.value?.chain().focus().setParagraph().run(),
  h1: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run(),
  h2: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
  h3: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run(),
  ul: () => editor.value?.chain().focus().toggleBulletList().run(),
  ol: () => editor.value?.chain().focus().toggleOrderedList().run(),
  code: () => editor.value?.chain().focus().toggleCode().run()
}

const headingLabel = computed(() => {
  const ed = editor.value
  if (!ed) return 'H'
  if (ed.isActive('heading', { level: 1 })) return 'H1'
  if (ed.isActive('heading', { level: 2 })) return 'H2'
  if (ed.isActive('heading', { level: 3 })) return 'H3'
  return '正文'
})

const currentAlign = computed<'left' | 'center' | 'right'>(() => {
  const ed = editor.value
  if (!ed) return 'left'
  if (isNodeSelection(ed.state.selection)) {
    const node = ed.state.selection.node
    const a = String(node?.attrs?.align || '')
    if (a === 'center' || a === 'right') return a
    return 'left'
  }
  const type = ed.isActive('heading') ? 'heading' : 'paragraph'
  const ta = (ed.getAttributes(type).textAlign as string | undefined) || ''
  if (ta === 'center' || ta === 'right') return ta
  return 'left'
})

const alignLabel = computed(() => {
  const a = currentAlign.value
  if (a === 'center') return '居中'
  if (a === 'right') return '右对齐'
  return '左对齐'
})

function setAlign(align: 'left' | 'center' | 'right') {
  const ed = editor.value
  if (!ed) return
  if (isNodeSelection(ed.state.selection)) {
    // NodeSelection 的 from 有时会落在 wrapper/边界上，做一次容错定位
    const sel = ed.state.selection
    const selNode = sel.node
    const candidates = [sel.from, sel.from - 1, sel.from + 1, sel.to, sel.to - 1, sel.to + 1].filter((n) => n >= 0)
    let pos: number | null = null
    let node: any = null
    for (const p of candidates) {
      const n = ed.state.doc.nodeAt(p)
      if (n && n.type === selNode.type) {
        pos = p
        node = n
        break
      }
    }
    // 兜底：直接用 selection.from
    if (pos == null) {
      pos = sel.from
      node = ed.state.doc.nodeAt(pos) || selNode
    }
    const selType = node?.type?.name || selNode.type.name
    if (pos != null && node && (selType === 'image' || selType === 'kbIframe' || selType === 'kbImageGallery')) {
      const tr = ed.state.tr
        .setSelection(NodeSelection.create(ed.state.doc, pos))
        .setNodeMarkup(pos, undefined, { ...node.attrs, align })
      ed.view.dispatch(tr)
      ed.view.focus()
    }
    const dom = ed.view.nodeDOM(ed.state.selection.from) as HTMLElement | null
    const host =
      (dom?.hasAttribute('data-resize-container') ? dom : dom?.closest('[data-resize-container], .kb-image-gallery')) as
        | HTMLElement
        | null
    if (host) {
      host.setAttribute('data-kb-align', align)
      if (align === 'left') {
        host.style.marginLeft = '0'
        host.style.marginRight = 'auto'
      } else if (align === 'center') {
        host.style.marginLeft = 'auto'
        host.style.marginRight = 'auto'
      } else {
        host.style.marginLeft = 'auto'
        host.style.marginRight = '0'
      }
      return
    }
  }
  if (align === 'left') {
    ed.chain().focus().unsetTextAlign().run()
  } else {
    ed.chain().focus().setTextAlign(align).run()
  }
}

const currentIndent = computed<number>(() => {
  const ed = editor.value
  if (!ed) return 0
  const type = ed.isActive('heading') ? 'heading' : 'paragraph'
  const ind = Number(ed.getAttributes(type).indent || 0)
  return Number.isFinite(ind) ? ind : 0
})

const isInListItem = computed(() => {
  const ed = editor.value
  if (!ed) return false
  return ed.isActive('listItem')
})

const canIndentMore = computed(() => {
  const ed = editor.value
  if (!ed) return false
  if (isInListItem.value) return ed.can().sinkListItem('listItem')
  return currentIndent.value < 6
})

const canIndentLess = computed(() => {
  const ed = editor.value
  if (!ed) return false
  if (isInListItem.value) return ed.can().liftListItem('listItem')
  return currentIndent.value > 0
})

const indentHint = computed(() => {
  if (isInListItem.value) return '列表'
  return `L${currentIndent.value}`
})

function indentMore() {
  const ed = editor.value
  if (!ed) return
  if (isInListItem.value) {
    ed.chain().focus().sinkListItem('listItem').run()
  } else {
    ed.chain().focus().indentMore().run()
  }
}

function indentLess() {
  const ed = editor.value
  if (!ed) return
  if (isInListItem.value) {
    ed.chain().focus().liftListItem('listItem').run()
  } else {
    ed.chain().focus().indentLess().run()
  }
}

function btnClass(kind: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'link') {
  const ed = editor.value
  if (!ed) return ''
  const active =
    kind === 'link'
      ? ed.isActive('link')
      : kind === 'code'
        ? ed.isActive('code')
        : ed.isActive(kind)
  return active ? 'kb-bubble-btn--active' : ''
}

const currentTextColor = computed<string>(() => {
  const ed = editor.value
  if (!ed) return ''
  const c = (ed.getAttributes('textStyle').color as string | undefined) || ''
  return c
})

/** 当前选区内联字号，如 14px；无则 null（优先从 $from.marks 读，避免与链接等叠放时 getAttributes 不准） */
const currentFontSize = computed<string | null>(() => {
  const ed = editor.value
  if (!ed) return null
  const ts = ed.schema.marks.textStyle
  let raw = ''
  if (ts) {
    const m = ed.state.selection.$from.marks().find((mk) => mk.type === ts)
    const fs = m?.attrs?.fontSize
    if (typeof fs === 'string' && fs.trim()) raw = fs.trim()
  }
  if (!raw) raw = String((ed.getAttributes('textStyle').fontSize as string | undefined) || '').trim()
  return raw || null
})

const fontSizeLabel = computed(() => {
  const s = currentFontSize.value
  if (!s) return '字号'
  const n = fontSizeOptions.find((o) => o.value === s)
  return n?.label ? `${n.label}px` : s
})

function isFontSizeActive(opt: { value: string | null }) {
  if (opt.value === null) return currentFontSize.value === null
  return currentFontSize.value === opt.value
}

/** 气泡内：触发按钮用当前字号显示文案（限制最大避免撑破工具条） */
const fontSizeTriggerPreviewStyle = computed(() => {
  const s = currentFontSize.value
  if (!s) return {}
  return {
    fontSize: `clamp(11px, ${s}, 22px)`,
    lineHeight: 1.25,
    fontWeight: 600
  } as Record<string, string | number>
})

function fontSizeOptionPreviewStyle(opt: { value: string | null; label: string }) {
  if (opt.value == null) return { fontSize: '13px', lineHeight: 1.25, fontWeight: 600 }
  return { fontSize: opt.value, lineHeight: 1.25, fontWeight: 600 }
}

function setFontSizePx(px: string | null) {
  const ed = editor.value
  if (!ed) return
  const ch = ed.chain().focus()
  if (!ed.state.selection.empty && ed.isActive('textStyle')) ch.extendMarkRange('textStyle')
  if (px == null) ch.unsetFontSize().run()
  else ch.setFontSize(px).run()
}

const currentBgColor = computed<string>(() => {
  const ed = editor.value
  if (!ed) return ''
  const c = (ed.getAttributes('highlight').color as string | undefined) || ''
  return c
})

const fontBtnStyle = computed(() => {
  const fg = currentTextColor.value
  const bg = currentBgColor.value
  return {
    color: fg || undefined,
    background: bg || undefined,
    borderColor: bg || fg ? '#cbd5e1' : undefined
  } as any
})

function setTextColor(color: string) {
  const ed = editor.value
  if (!ed) return
  ed.chain().focus().setColor(color).run()
}

function clearTextColor() {
  const ed = editor.value
  if (!ed) return
  ed.chain().focus().unsetColor().run()
}

function setBgColor(color: string) {
  const ed = editor.value
  if (!ed) return
  if (color === 'transparent') {
    ed.chain().focus().unsetHighlight().run()
  } else {
    ed.chain().focus().setHighlight({ color }).run()
  }
}

function clearBgColor() {
  const ed = editor.value
  if (!ed) return
  ed.chain().focus().unsetHighlight().run()
}

function openLinkModal() {
  const ed = editor.value
  if (!ed) return
  const prev = ed.getAttributes('link').href as string | undefined
  linkHref.value = typeof prev === 'string' ? prev : 'https://'
  showLinkModal.value = true
}

function cancelLinkModal() {
  showLinkModal.value = false
}

function applyLink() {
  const ed = editor.value
  if (!ed) return
  const href = linkHref.value.trim()
  if (href === '') {
    ed.chain().focus().extendMarkRange('link').unsetLink().run()
  } else {
    ed.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href, target: '_blank', rel: 'noopener noreferrer nofollow' })
      .run()
  }
  showLinkModal.value = false
}

function onMediaNegative() {
  pendingMedia.value = null
  showMediaModal.value = false
}

/** Naive dialog：返回 false 则不关闭 */
function onMediaPositive(): boolean {
  const p = pendingMedia.value
  if (!p) {
    showMediaModal.value = false
    return true
  }
  const ed = p.editor
  const range = p.range

  if (p.kind === 'gallery') {
    const lines = mediaUrlInput.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    const items = lines
      .map((line) => ({ src: normalizeImageUrl(line), alt: '' }))
      .filter((it) => it.src)
    if (items.length === 0) {
      message.warning('请至少填写一行有效的图片地址')
      return false
    }
    ed.chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: 'kbImageGallery',
        attrs: { items, align: 'left' }
      })
      .run()
    pendingMedia.value = null
    return true
  }

  const raw = mediaUrlInput.value.trim()
  if (!raw) {
    message.warning('请输入地址')
    return false
  }
  if (p.kind === 'image') {
    const src = normalizeImageUrl(raw)
    if (!src) {
      message.warning('无效的图片地址')
      return false
    }
    ed.chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: 'image',
        attrs: { src, align: 'left' }
      })
      .run()
  } else if (p.kind === 'video') {
    const src = normalizeVideoEmbedUrl(raw)
    if (!src) {
      message.warning('无效的视频地址')
      return false
    }
    ed.chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: 'kbIframe',
        attrs: { src, title: 'Video', align: 'left' }
      })
      .run()
  } else if (p.kind === 'web') {
    const src = normalizeWebEmbedUrl(raw)
    if (!src) {
      message.warning('无效的网页地址')
      return false
    }
    ed.chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: 'kbIframe',
        attrs: { src, title: 'Web', align: 'left' }
      })
      .run()
  }
  pendingMedia.value = null
  return true
}

function getBodyMd(): string {
  const html = editor.value?.getHTML() ?? ''
  return htmlToMarkdown(html)
}

watch(
  () => [route.value.params.docId, route.value.params.siteKey, route.value.query.siteKey],
  () => {
    const fullPath = route.value.fullPath || ''
    if (!fullPath.includes('/plugins/kb/docs/') || !fullPath.includes('/edit/')) return
    void loadDoc()
  }
)

watch(siteKey, () => {
  void loadNavReferenceTrees()
})

function formatTime(iso?: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function listPath(): string {
  const fullPath = route.value.fullPath
  const idx = fullPath.indexOf('/plugins/kb/docs')
  const prefix = idx >= 0 ? fullPath.slice(0, idx) : ''
  if (siteKey.value) return `${prefix}/plugins/kb/docs/${encodeURIComponent(siteKey.value)}`
  return `${prefix}/plugins/kb/docs`
}

function editPathForId(docId: number): string {
  const fullPath = route.value.fullPath
  const idx = fullPath.indexOf('/plugins/kb/docs')
  const prefix = idx >= 0 ? fullPath.slice(0, idx) : ''
  if (siteKey.value) return `${prefix}/plugins/kb/docs/${encodeURIComponent(siteKey.value)}/edit/${docId}`
  return `${prefix}/plugins/kb/docs/edit/${docId}`
}

// 侧栏已去掉「文档」Tab：不再需要 docTreeOptions / docTreeSelectedKeys

const currentEditingDocIdNumber = computed<number | null>(() => {
  const id = Number(doc.value?.id || 0)
  if (!id || Number.isNaN(id)) return null
  return id
})

/** 仅当编辑区仍为空时再聚焦到开头，已有内容时不抢光标（便于先改标题等） */
function focusEditorStartIfEmpty() {
  const ed = editor.value
  if (!ed?.isEmpty) return
  ed.commands.focus('start')
}

async function loadDocIntoEditorById(id: number) {
  if (!id || Number.isNaN(id)) return
  docContentLoading.value = true
  try {
    const d = await kbApi.getDoc(id, siteKey.value || undefined)
    doc.value = d
    title.value = d.title
    const html = markdownToHtml(d.bodyMd || '')
    for (let i = 0; i < 30 && !editor.value; i++) {
      await nextTick()
    }
    editor.value?.commands.setContent(html, { emitUpdate: false })
    if (editor.value) outline.value = outlineFromEditor(editor.value)
    nextTick(() => {
      focusEditorStartIfEmpty()
      refreshBaselineFromCurrent()
    })
  } catch (e: any) {
    message.error(e?.message || '加载文档失败')
  } finally {
    docContentLoading.value = false
  }
}

/** 导航引用关系（从站点 header/sidebar 找到哪些节点引用了当前 doc） */
const navRefTreeLoading = ref(false)
const navTreeError = ref('')
const navMenuTree = ref<KbNavNode[]>([])
const navRendererConfig = ref<SiteRendererConfig | null>(null)
const navNodeBindings = ref<Record<number, {
  kind: 'nav' | 'menu'
  navId: string
  label: string
  boundDocId: number | null
  sectionIndex?: number
  nodePath?: number[]
}>>({})
let navRefTreesLoadedForSiteKey = ''

function toNavTreeOptions(nodes: KbNavNode[]): TreeOption[] {
  return nodes.map((n) => {
    const hasChildren = !!n.children?.length
    const title = (n.title || '').trim() || (n.docId != null ? `文档 ${n.docId}` : '未命名')
    const iconType: 'nav' | 'group' | 'leaf' =
      n.menuCode === 'header' ? 'nav' : n.nodeType === 'GROUP' ? 'group' : 'leaf'
    const status: 'bound' | 'unbound' | null = !hasChildren ? (n.docId != null ? 'bound' : 'unbound') : null
    return {
      key: String(n.id),
      label: title,
      iconType,
      status,
      children: hasChildren ? toNavTreeOptions(n.children) : undefined
    } as TreeOption
  })
}

const navMenuTreeOptions = computed(() => toNavTreeOptions(navMenuTree.value))

function collectNavNodeKeysByDocId(nodes: KbNavNode[], docId: number): string[] {
  const out: string[] = []
  const walk = (arr: KbNavNode[]) => {
    for (const n of arr) {
      if (n.docId != null && n.docId === docId) out.push(String(n.id))
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return out
}

const navMenuTreeSelectedKeys = computed<(string | number)[]>(() => {
  const id = currentEditingDocIdNumber.value
  if (!id) return []
  return collectNavNodeKeysByDocId(navMenuTree.value, id)
})

function findDocIdByNavNodeId(nodes: KbNavNode[], navNodeId: number): number | null {
  let found: number | null = null
  const walk = (arr: KbNavNode[]) => {
    for (const n of arr) {
      if (found != null) return
      if (Number(n.id) === navNodeId) {
        if (typeof n.docId === 'number' && !Number.isNaN(n.docId)) found = n.docId
        return
      }
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return found
}

function findNavNodeById(nodes: KbNavNode[], navNodeId: number): KbNavNode | null {
  let found: KbNavNode | null = null
  const walk = (arr: KbNavNode[]) => {
    for (const n of arr) {
      if (found) return
      if (Number(n.id) === navNodeId) {
        found = n
        return
      }
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return found
}

function onNavRefSelectKeys(keys: Array<string | number>) {
  const k = keys[0]
  if (k == null) return
  if (saving.value) {
    message.warning('正在保存，请稍候再切换')
    return
  }
  const navNodeId = Number(k)
  if (!navNodeId || Number.isNaN(navNodeId)) return

  const did = findDocIdByNavNodeId(navMenuTree.value, navNodeId)
  if (!did) {
    const node = findNavNodeById(navMenuTree.value, navNodeId)
    const isLeaf = !node?.children?.length
    const isDocLeaf = node?.nodeType === 'DOC'
    if (isLeaf && isDocLeaf) message.info('该节点未绑定文档，请点击添加创建文档')
    return
  }

  // 已在当前编辑器：不重复加载
  if (String(doc.value?.id || '') === String(did)) return
  confirmDiscardIfDirty(() => void loadDocIntoEditorById(did))
}

function onNavMenuTreeSelectKeys(keys: Array<string | number>) {
  onNavRefSelectKeys(keys)
}

function setTreeNodePageIdByPath(
  cfg: SiteRendererConfig,
  navId: string,
  sectionIndex: number,
  nodePath: number[],
  pageId: string
): boolean {
  const byNav = ((cfg.sidebar as any)?.treesByNavId || {}) as Record<string, any[]>
  const secs = byNav[navId]
  if (!Array.isArray(secs) || !secs[sectionIndex]) return false
  let node: any = null
  let curList: any[] = secs[sectionIndex].children || []
  for (let i = 0; i < nodePath.length; i++) {
    const idx = nodePath[i]
    if (!Array.isArray(curList) || idx < 0 || idx >= curList.length) return false
    node = curList[idx]
    curList = node?.children || []
  }
  if (!node) return false
  node.pageId = pageId
  return true
}

async function createDocAndBindNavNode(nodeId: number) {
  const bind = navNodeBindings.value[nodeId]
  const cfg = navRendererConfig.value
  const sk = siteKey.value
  if (!bind || !cfg || !sk) {
    message.warning('绑定上下文缺失，请刷新后重试')
    return
  }
  if (bind.boundDocId != null) {
    message.info('该节点已绑定文档')
    return
  }
  if (saving.value) {
    message.warning('正在保存，请稍候再试')
    return
  }

  saving.value = true
  try {
    const created = await kbApi.createDoc(
      {
        title: bind.label || '新页面',
        bodyMd: '',
        slug: `draft-${Date.now()}`
      },
      sk
    )
    const createdDocId =
      typeof (created as any)?.id === 'number'
        ? (created as any).id
        : typeof (created as any)?.id === 'string' && /^\d+$/.test(String((created as any).id))
          ? Number((created as any).id)
          : null
    if (createdDocId == null || !Number.isFinite(createdDocId) || createdDocId <= 0) {
      throw new Error('创建文档成功但未返回有效文档ID，已中止绑定以避免写入 doc-null')
    }
    const pageId = `doc-${createdDocId}`
    if (!cfg.pages) cfg.pages = {}
    ;(cfg.pages as any)[pageId] = {
      id: pageId,
      slug: created.slug || `draft-${createdDocId}`,
      title: created.title || bind.label || '新页面',
      description: '页面内容将在此渲染',
      updatedAt: created.updatedAt || undefined,
      meta: {
        kbDocListSource: true,
        kbDoc: created,
        kbDocLoading: false
      }
    }

    if (bind.kind === 'nav') {
      const links: any[] = (cfg.navbar?.links ?? []) as any[]
      const link = links.find((x) => String(x?.id || '') === bind.navId)
      if (!link) throw new Error('未找到对应导航项')
      link.pageId = pageId
      link.href = created.slug || link.href || '/'
    } else {
      if (
        bind.sectionIndex == null ||
        !Array.isArray(bind.nodePath) ||
        !setTreeNodePageIdByPath(cfg, bind.navId, bind.sectionIndex, bind.nodePath, pageId)
      ) {
        throw new Error('未找到对应菜单节点')
      }
    }

    await kbApi.saveSiteRendererDraft(JSON.stringify(cfg), sk)
    message.success('已创建文档并完成绑定')
    navRefTreesLoadedForSiteKey = ''
    await loadNavReferenceTrees()
    void loadDocTree()
    void router.push(editPathForId(createdDocId))
  } catch (e: any) {
    message.error(e?.message || '创建并绑定失败')
  } finally {
    saving.value = false
  }
}

function renderNavMenuSuffix({ option }: { option: any }) {
  const id = Number(option?.key)
  if (!id || Number.isNaN(id)) return null
  const bind = navNodeBindings.value[id]
  const hasChildren = Array.isArray(option?.children) && option.children.length > 0
  const status = option?.status as 'bound' | 'unbound' | null
  const canBind =
    !!bind &&
    bind.boundDocId == null &&
    !hasChildren &&
    (bind.kind === 'menu' || bind.kind === 'nav')
  const canUnbind =
    !!bind &&
    bind.boundDocId != null &&
    !hasChildren &&
    (bind.kind === 'menu' || bind.kind === 'nav')
  const statusIcon =
    status === 'bound'
      ? h('span', { class: 'kb-nav-node-state', style: { color: '#16a34a', display: 'inline-flex' } }, [
          h(NIcon as any, { size: 16 }, { default: () => h(IconBound as any) })
        ])
      : status === 'unbound' && !canBind
        ? h('span', { class: 'kb-nav-node-state', style: { color: '#eab308', display: 'inline-flex' } }, [
            h(NIcon as any, { size: 16 }, { default: () => h(IconUnbound as any) })
          ])
        : null

  const bindBtn = canBind
    ? h(
        NButton as any,
        {
          class: 'kb-nav-bind-icon',
          size: 'small',
          quaternary: true,
          circle: true,
          title: '绑定已有文档 / 创建并绑定',
          onClick: (e: MouseEvent) => {
            e.stopPropagation()
            void openBindDocModal(id)
          }
        },
        {
          icon: () => h(NIcon as any, { size: 16 }, { default: () => h(IconAdd as any) })
        }
      )
    : null

  const unbindBtn = canUnbind
    ? h(
        NButton as any,
        {
          class: 'kb-nav-bind-icon',
          size: 'small',
          quaternary: true,
          circle: true,
          title: '解绑',
          onClick: (e: MouseEvent) => {
            e.stopPropagation()
            void unbindNavNode(id)
          }
        },
        {
          icon: () => h(NIcon as any, { size: 16 }, { default: () => h(IconUnbind as any) })
        }
      )
    : null

  if (!statusIcon && !bindBtn && !unbindBtn) return null
  return h('span', { class: 'kb-nav-node-suffix' }, [statusIcon, unbindBtn, bindBtn])
}

function renderNavMenuPrefix({ option }: { option: any }) {
  const iconType = option?.iconType as 'nav' | 'group' | 'leaf' | undefined
  const iconComp =
    iconType === 'nav' ? IconNav : iconType === 'group' ? IconMenuGroup : IconMenuLeaf
  const color = iconType === 'nav' ? '#2563eb' : iconType === 'group' ? '#0f766e' : '#6b7280'
  return h('span', { class: 'kb-nav-node-kind', style: { color, display: 'inline-flex' } }, [
    h(NIcon as any, { size: 16 }, { default: () => h(iconComp as any) })
  ])
}

async function loadNavReferenceTrees() {
  const sk = siteKey.value
  if (!sk) return
  if (navRefTreesLoadedForSiteKey === sk && navMenuTree.value.length) return

  navRefTreeLoading.value = true
  navTreeError.value = ''
  try {
    const draftJson = await kbApi.getSiteRendererConfig(sk || undefined, 'draft')
    let cfg: SiteRendererConfig | null = null
    try {
      cfg = JSON.parse(String(draftJson)) as SiteRendererConfig
    } catch {
      cfg = null
    }

    if (!cfg) {
      const publishedJson = await kbApi.getSiteRendererConfig(sk || undefined, 'published')
      cfg = JSON.parse(String(publishedJson)) as SiteRendererConfig
    }

    if (!cfg || !cfg.navbar || !cfg.sidebar) {
      throw new Error('站点渲染配置为空')
    }
    navRendererConfig.value = cfg
    navNodeBindings.value = {}

    let idSeq = 1
    const nextId = () => idSeq++

    const resolveKbDocIdFromPageId = (pageId?: string | null): number | null => {
      const pid = (pageId ?? '').toString().trim()
      if (!pid) return null

      // Builder 对 kb-doc 使用约定：doc-<numericId>
      const m = /^doc-(\d+)$/.exec(pid)
      if (m) return Number(m[1])

      const kbDocId = (cfg.pages as any)?.[pid]?.meta?.kbDoc?.id
      const n = typeof kbDocId === 'string' ? Number(kbDocId) : kbDocId
      return typeof n === 'number' && Number.isFinite(n) ? n : null
    }

    const makeNode = (args: {
      menuCode: string
      title: string
      nodeType: string
      docId?: number | null
      linkUrl?: string | null | undefined
      children?: KbNavNode[]
    }): KbNavNode => {
      return {
        id: nextId(),
        parentId: null,
        menuCode: args.menuCode,
        title: args.title,
        nodeType: args.nodeType,
        docId: args.docId ?? null,
        linkUrl: args.linkUrl ? String(args.linkUrl) : undefined,
        sortOrder: undefined,
        status: 'PUBLISHED',
        visibility: undefined,
        roles: undefined,
        children: args.children ?? []
      }
    }

    const convertSidebarMenuNode = (mn: any, navId: string, sectionIndex: number, nodePath: number[]): KbNavNode => {
      const children: KbNavNode[] = Array.isArray(mn?.children)
        ? mn.children
            .map((c: any, idx: number) => convertSidebarMenuNode(c, navId, sectionIndex, [...nodePath, idx]))
            .filter((x: KbNavNode) => x != null)
        : []

      const did = resolveKbDocIdFromPageId(mn?.pageId)
      if (children.length === 0) {
        const node = makeNode({
          menuCode: 'sidebar',
          title: String(mn?.label ?? '').trim() || (did != null ? `文档 ${did}` : '未绑定页面'),
          nodeType: 'DOC',
          docId: did
        })
        navNodeBindings.value[node.id] = {
          kind: 'menu',
          navId,
          label: String(mn?.label ?? '').trim() || '新页面',
          boundDocId: did,
          sectionIndex,
          nodePath
        }
        return node
      }

      return makeNode({
        menuCode: 'sidebar',
        title: String(mn?.label ?? '').trim() || '（未命名）',
        nodeType: 'GROUP',
        docId: null,
        children
      })
    }

    const treesByNavId = ((cfg.sidebar as any)?.treesByNavId || {}) as Record<string, any[]>
    const navbarLinks: any[] = (cfg.navbar?.links ?? []) as any[]

    const roots: KbNavNode[] = navbarLinks.map((nav) => {
      const navDid = resolveKbDocIdFromPageId(nav?.pageId)
      const navId = String(nav?.id || '')
      const sections = Array.isArray(treesByNavId[navId]) ? treesByNavId[navId] : []
      const secNodes: KbNavNode[] = sections
        .map((sec: any, sectionIndex: number) => {
          const kids: KbNavNode[] = (sec?.children ?? []).map((n: any, idx: number) =>
            convertSidebarMenuNode(n, navId, sectionIndex, [idx])
          )
          if (!kids.length) return null
          return makeNode({
            menuCode: 'sidebar',
            title: String(sec?.groupLabel ?? sec?.id ?? '菜单'),
            nodeType: 'GROUP',
            docId: null,
            children: kids
          })
        })
        .filter((x: KbNavNode | null): x is KbNavNode => x != null)

      const navNode = makeNode({
        menuCode: 'header',
        title: String(nav?.label || '未命名导航'),
        nodeType: 'GROUP',
        docId: navDid,
        children: secNodes
      })
      navNodeBindings.value[navNode.id] = {
        kind: 'nav',
        navId,
        label: String(nav?.label || '新页面'),
        boundDocId: navDid
      }
      return navNode
    })

    navMenuTree.value = roots
  } catch (e: any) {
    navMenuTree.value = []
    navRendererConfig.value = null
    navNodeBindings.value = {}
    navTreeError.value = e?.message || '引用关系加载失败'
  } finally {
    navRefTreeLoading.value = false
    navRefTreesLoadedForSiteKey = sk
  }
}

function onDocTreeSelectKeys(keys: Array<string | number>) {
  const k = keys[0]
  if (k == null) return
  const id = Number(k)
  if (!id || Number.isNaN(id)) return
  if (String(route.value.params.docId) === String(k)) return
  if (saving.value) {
    message.warning('正在保存，请稍候再切换')
    return
  }
  confirmDiscardIfDirty(() => void router.push(editPathForId(id)))
}

async function loadDocTree() {
  treeLoading.value = true
  try {
    docTree.value = await kbApi.tree(siteKey.value || undefined, 'full')
  } catch (e: any) {
    docTree.value = []
    message.warning(e?.message || '文档目录加载失败')
  } finally {
    treeLoading.value = false
  }
}

function goBack() {
  void router.push(listPath())
}

function previewPath(): string {
  const fullPath = route.value.fullPath
  const idx = fullPath.indexOf('/plugins/kb/docs')
  const prefix = idx >= 0 ? fullPath.slice(0, idx) : ''
  const id = Number(route.value.params.docId || doc.value?.id || 0)
  if (siteKey.value) return `${prefix}/plugins/kb/docs/${encodeURIComponent(siteKey.value)}/preview/${id}`
  return `${prefix}/plugins/kb/docs/preview/${id}`
}

function openPreview() {
  if (!editor.value) {
    message.warning('编辑器未就绪')
    return
  }
  showPreviewModal.value = true
}

/** 仍支持独立预览页（需已保存且路由中有数字 id） */
function openPreviewInNewTab() {
  const id = Number(route.value.params.docId || doc.value?.id || 0)
  if (!id || Number.isNaN(id)) {
    message.info('请先保存文档后再使用「新窗口打开」（需要文档 ID）')
    return
  }
  showPreviewModal.value = false
  const path = previewPath()
  const isHashMode = window.location.hash.includes('#/')
  const url = isHashMode
    ? `${window.location.origin}${window.location.pathname}#${path}`
    : `${window.location.origin}${path}`
  window.open(url, '_blank')
}

function scrollToOutline(item: OutlineItem) {
  const ed = editor.value
  if (!ed) return
  ed.chain().focus().setTextSelection(item.pos + 1).scrollIntoView().run()
}

async function loadDoc() {
  const fullPath = route.value.fullPath || ''
  // 兼容 hash 路由与带 siteKey 的路径：如 /plugins/kb/docs/<siteKey>/edit/<id>
  // 只要在 docs 编辑页且有 docId 参数，就允许加载
  if (!fullPath.includes('/plugins/kb/docs/') || !fullPath.includes('/edit/')) return
  const raw = String(route.value.params.docId || '')

  if (raw === 'new') {
    docContentLoading.value = false
    doc.value = null
    title.value = ''
    try {
      for (let i = 0; i < 30 && !editor.value; i++) {
        await nextTick()
      }
      editor.value?.commands.setContent('<p></p>', { emitUpdate: false })
      if (editor.value) outline.value = outlineFromEditor(editor.value)
      nextTick(() => {
        focusEditorStartIfEmpty()
        refreshBaselineFromCurrent()
      })
    } finally {
      docContentLoading.value = false
    }
    return
  }

  const id = Number(raw)
  if (!id || Number.isNaN(id)) {
    message.error('无效的文档 ID')
    docContentLoading.value = false
    return
  }
  docContentLoading.value = true
  try {
    const d = await kbApi.getDoc(id, siteKey.value || undefined)
    doc.value = d
    title.value = d.title
    const html = markdownToHtml(d.bodyMd || '')
    for (let i = 0; i < 30 && !editor.value; i++) {
      await nextTick()
    }
    editor.value?.commands.setContent(html, { emitUpdate: false })
    if (editor.value) outline.value = outlineFromEditor(editor.value)
    nextTick(() => {
      focusEditorStartIfEmpty()
      refreshBaselineFromCurrent()
    })
  } catch (e: any) {
    message.error(e?.message || '加载文档失败')
  } finally {
    docContentLoading.value = false
  }
}

async function saveDraft() {
  const t = (title.value || '').trim()
  if (!t) {
    message.warning('请先填写文档标题后再保存')
    return
  }
  const html = editor.value?.getHTML() ?? ''
  const bodyMd = htmlToMarkdown(html)
  saving.value = true
  try {
    if (isNewRoute.value) {
      const slug = `draft-${Date.now()}`
      const d = await kbApi.createDoc({
        title: t,
        bodyMd,
        slug
      }, siteKey.value || undefined)
      doc.value = d
      // 以本次保存的内容为基线（避免 API 返回内容与编辑器序列化差异导致误判 dirty）
      loadedBaseline.value = { title: t, editorJson: getCurrentEditorJson() }
      await router.replace(editPathForId(d.id))
      void loadDocTree()
      message.success('已创建并保存草稿')
    } else if (doc.value) {
      const d = await kbApi.updateDoc(doc.value.id, {
        title: t,
        bodyMd
      }, siteKey.value || undefined)
      doc.value = d
      loadedBaseline.value = { title: t, editorJson: getCurrentEditorJson() }
      message.success('已保存')
    } else {
      message.error('文档未加载，请返回列表重试')
    }
  } catch (e: any) {
    message.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function publish() {
  if (!doc.value) {
    message.warning('请先保存草稿后再发布')
    return
  }
  publishing.value = true
  try {
    const d = await kbApi.publish(doc.value.id, siteKey.value || undefined)
    doc.value = d
    message.success('已发布')
  } catch (e: any) {
    message.error(e?.message || '发布失败')
  } finally {
    publishing.value = false
  }
}

onDeactivated(() => {
  cleanupFloatingUI()
})

onBeforeUnmount(() => {
  cleanupFloatingUI()
  editor.value?.destroy()
})

watch(
  () => [String(route.value.params?.docId ?? ''), siteKey.value],
  () => {
    void loadDoc()
  }
)

onMounted(async () => {
  void loadDocTree()
  void loadNavReferenceTrees()
  await loadDoc()
})
</script>

<style scoped>
.kb-editor {
  --kb-e-bg: #f8f7f4;
  --kb-e-border: #e0ddd6;
  --kb-e-ink: #1c1917;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--kb-e-bg);
  color: var(--kb-e-ink);
}

.kb-editor__top {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: #fff;
  border-bottom: 1px solid var(--kb-e-border);
  box-shadow: 0 1px 0 rgba(28, 25, 23, 0.04);
  z-index: 20;
}

.kb-editor__top-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.kb-editor__brand {
  font-size: 13px;
  font-weight: 600;
  color: #57534e;
}

.kb-editor__title-input {
  max-width: 420px;
  min-width: 160px;
}

.kb-editor__top-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.kb-editor__body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 0;
  min-width: 0;
  overflow-x: hidden;
}

.kb-editor__body--aside-hidden {
  grid-template-columns: 0 1fr;
}

.kb-editor__canvas-wrap {
  min-height: 0;
  min-width: 0;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.kb-editor__canvas-spin {
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.kb-editor__canvas-spin :deep(.n-spin-content) {
  min-height: 280px;
}

.kb-editor__aside-spin {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.kb-editor__aside-spin :deep(.n-spin-content) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.kb-bubble-menu {
  padding: 4px 6px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow:
    0 10px 40px rgba(15, 23, 42, 0.12),
    0 2px 8px rgba(15, 23, 42, 0.06);
}

.kb-table-bubble {
  min-width: 260px;
  max-width: min(92vw, 360px);
  padding: 10px 12px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow:
    0 12px 48px rgba(15, 23, 42, 0.14),
    0 2px 10px rgba(15, 23, 42, 0.06);
}

.kb-table-bubble__head {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.kb-table-bubble__title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #0f172a;
}

.kb-table-bubble__section {
  margin-top: 10px;
}

.kb-table-bubble__section:first-of-type {
  margin-top: 0;
}

.kb-table-bubble__label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 6px;
  text-transform: none;
}

.kb-table-bubble__tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.kb-table-bubble__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  transition:
    background 0.12s ease,
    border-color 0.12s ease,
    color 0.12s ease;
}

.kb-table-bubble__icon-btn:hover {
  background: #fff;
  border-color: #cbd5e1;
  color: #0f172a;
}

.kb-table-bubble__icon-btn--warn {
  color: #b45309;
  background: #fffbeb;
  border-color: #fde68a;
}

.kb-table-bubble__icon-btn--warn:hover {
  background: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
}

.kb-table-bubble__icon-btn--danger {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fecaca;
}

.kb-table-bubble__icon-btn--danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
}

.kb-table-bubble__sep {
  width: 1px;
  height: 22px;
  margin: 0 2px;
  background: #e2e8f0;
  flex-shrink: 0;
}

.kb-table-bubble__segment {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  padding: 2px;
  background: #f1f5f9;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.kb-table-bubble__seg {
  flex: 1;
  min-width: 44px;
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.12s ease,
    color 0.12s ease;
}

.kb-table-bubble__seg:hover {
  color: #0f172a;
  background: rgba(255, 255, 255, 0.65);
}

.kb-table-bubble__seg--active {
  background: #fff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.kb-table-bubble__seg--ghost.kb-table-bubble__seg--active {
  color: #64748b;
}

.kb-table-bubble__hint {
  margin: 6px 0 0;
  font-size: 10px;
  line-height: 1.35;
  color: #94a3b8;
}

.kb-table-bubble__palette {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.kb-table-bubble__dot {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease;
}

.kb-table-bubble__dot:hover {
  transform: scale(1.06);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
}

.kb-table-bubble__dot--letter {
  border-color: #cbd5e1;
  font-weight: 800;
}

.kb-table-bubble__dot-x {
  font-size: 14px;
  line-height: 1;
  color: #94a3b8;
  font-weight: 600;
}

.kb-table-bubble__letter {
  font-size: 13px;
  line-height: 1;
}

.kb-tip-bubble {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 220px;
  padding: 8px 10px 10px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow:
    0 10px 40px rgba(15, 23, 42, 0.12),
    0 2px 8px rgba(15, 23, 42, 0.06);
}

.kb-tip-bubble__head {
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f1f5f9;
}

.kb-tip-bubble__title {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

.kb-tip-bubble__section {
  padding-top: 8px;
}

.kb-tip-bubble__section:first-of-type {
  padding-top: 0;
}

.kb-tip-bubble__label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 6px;
}

.kb-tip-bubble__palette {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.kb-tip-bubble__dot {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 0;
  cursor: pointer;
  box-sizing: border-box;
}

.kb-tip-bubble__dot:hover {
  transform: scale(1.06);
}

.kb-tip-bubble__dot--active {
  outline: 2px solid #0d9488;
  outline-offset: 1px;
}

.kb-tip-bubble__dot--clear {
  background: #fff !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.kb-tip-bubble__dot-x {
  font-size: 14px;
  line-height: 1;
  color: #94a3b8;
}

.kb-grid-bubble {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 340px;
  max-width: min(760px, calc(100vw - 24px));
  padding: 8px 10px 10px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow:
    0 10px 40px rgba(15, 23, 42, 0.12),
    0 2px 8px rgba(15, 23, 42, 0.06);
}

.kb-grid-bubble__head {
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f1f5f9;
}

.kb-grid-bubble__title {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

.kb-grid-bubble__row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.kb-grid-bubble__lbl {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}

.kb-grid-bubble__hint {
  margin-top: 8px;
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.4;
}

.kb-font-btn {
  font-weight: 800;
}

.kb-bubble-pop {
  padding: 8px;
  min-width: 220px;
}

.kb-bubble-pop__row {
  display: flex;
  gap: 6px;
}

.kb-font-size-trigger :deep(.kb-font-size-trigger__lbl) {
  display: inline-block;
  vertical-align: middle;
}

.kb-font-size-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 220px;
}

.kb-font-size-btn {
  min-width: 42px;
  padding: 5px 8px;
  font-size: unset;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #334155;
  cursor: pointer;
}

.kb-font-size-btn__lbl {
  display: inline-block;
  vertical-align: middle;
}

.kb-font-size-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.kb-font-size-btn--active {
  border-color: #0f766e;
  background: rgba(15, 118, 110, 0.08);
  color: #0f766e;
  font-weight: 600;
}

.kb-align-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kb-align-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  color: #334155;
  font-size: 13px;
  text-align: left;
}

.kb-align-item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.kb-align-item__hint {
  color: #94a3b8;
  font-size: 11px;
  font-family: ui-monospace, monospace;
}

.kb-align-sep {
  height: 1px;
  background: #e5e7eb;
  margin: 6px 2px;
}

.kb-align-item:hover {
  background: rgba(15, 118, 110, 0.08);
}

.kb-align-item:disabled:hover {
  background: transparent;
}

.kb-align-item__check {
  color: #0f766e;
  font-weight: 800;
}

.kb-bubble-pop__title {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 6px;
}

.kb-mt {
  margin-top: 10px;
}

.kb-color-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 6px;
}

.kb-color-swatch {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  font-weight: 800;
  line-height: 1;
}

.kb-color-swatch--active {
  outline: 2px solid #0f766e;
  outline-offset: 1px;
}

.kb-bubble-btn--active {
  background: rgba(15, 118, 110, 0.12);
  border-color: rgba(15, 118, 110, 0.22);
}

.kb-color-swatch--clear {
  color: #64748b;
}

.kb-editor__cm {
  height: 100%;
  min-height: 360px;
  /* 主编辑区禁止横向导致的整体布局溢出 */
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
  padding: 0 24px;
}

.kb-editor__cm :deep(.kb-tiptap-prose) {
  --default-cell-min-width: 80px;
  min-height: 360px;
  padding: 20px 0 48px;
  font-size: 15px;
  line-height: 1.65;
  outline: none;
  /* 飞书式：正文居中 + 两侧留白 */
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  /* 防止长英文/URL/连续字符撑破布局，挤出右侧大纲 */
  word-break: break-word;
  overflow-wrap: anywhere;
}

/* tiptap Placeholder 扩展只注入 data-placeholder / class，需要显式样式才能显示 */
.kb-editor__cm :deep(.kb-tiptap-prose p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: rgba(100, 116, 139, 0.8);
  pointer-events: none;
  height: 0;
}

/* 多列布局（kbGrid）：编辑器内使用 CSS Grid 展示；窄屏自动 1 列 */
.kb-editor__cm :deep(.kb-grid) {
  display: grid;
  grid-template-columns: repeat(var(--kb-grid-cols, 2), minmax(0, 1fr));
  column-gap: var(--kb-grid-x-gap, 16px);
  row-gap: var(--kb-grid-y-gap, 12px);
  padding: 10px 12px;
  border: 1px dashed rgba(148, 163, 184, 0.6);
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.7);
}

.kb-editor__cm :deep(.kb-grid.ProseMirror-selectednode) {
  border-style: solid;
  border-color: rgba(59, 130, 246, 0.8);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
}

.kb-editor__cm :deep(.kb-grid__content) {
  display: contents;
}
.kb-editor__cm :deep(.kb-grid__col) {
  min-width: 0;
}
@media (max-width: 640px) {
  .kb-editor__cm :deep(.kb-grid) {
    grid-template-columns: 1fr;
  }
}

.kb-editor__cm :deep(.kb-tiptap-prose h1) {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 1rem 0 0.5rem;
}
.kb-editor__cm :deep(.kb-tiptap-prose h2) {
  font-size: 1.4rem;
  font-weight: 650;
  margin: 0.9rem 0 0.45rem;
}
.kb-editor__cm :deep(.kb-tiptap-prose h3) {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0.75rem 0 0.35rem;
}
.kb-editor__cm :deep(.kb-tiptap-prose ul),
.kb-editor__cm :deep(.kb-tiptap-prose ol) {
  padding-left: 1.35rem;
  margin: 0.35rem 0;
}
/* 勿作用于 NodeView 代码块（.kb-code-block-view__pre），避免双层圆角/背景与内框感 */
.kb-editor__cm :deep(.kb-tiptap-prose pre:not(.kb-code-block-view__pre)) {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 12px 14px;
  overflow-x: auto;
  font-size: 13px;
}
.kb-editor__cm :deep(.kb-tiptap-prose blockquote) {
  border-left: 3px solid #cbd5e1;
  margin: 0.5rem 0;
  padding-left: 12px;
  color: #475569;
}
.kb-editor__cm :deep(.kb-tiptap-prose hr) {
  border: none;
  border-top: 1px solid var(--kb-e-border);
  margin: 1rem 0;
}

/* 占位段落后紧跟分割线：避免 p 与 hr 各算一遍外边距导致「双倍空隙」 */
.kb-editor__cm :deep(.kb-tiptap-prose p[data-kb-paragraph-spacer]:has(+ hr)) {
  margin-bottom: 0.35em;
}
.kb-editor__cm :deep(.kb-tiptap-prose p[data-kb-paragraph-spacer] + hr) {
  margin-top: 0;
}

.kb-editor__cm :deep(.kb-tiptap-prose .tableWrapper) {
  margin: 0.75rem 0;
}

.kb-editor__cm :deep(.kb-tiptap-prose .tableWrapper table),
.kb-editor__cm :deep(.kb-tiptap-prose table.kb-editor-table) {
  font-size: 14px;
  border-collapse: collapse;
}

.kb-editor__cm :deep(.kb-tiptap-prose .tableWrapper table td),
.kb-editor__cm :deep(.kb-tiptap-prose .tableWrapper table th),
.kb-editor__cm :deep(.kb-tiptap-prose table.kb-editor-table td),
.kb-editor__cm :deep(.kb-tiptap-prose table.kb-editor-table th) {
  border: 1px solid #e8e8e8;
  padding: 10px 12px;
}

/* 默认表头/表体样式（与参考图一致；单元格内联 style 优先级更高） */
.kb-editor__cm :deep(.kb-tiptap-prose .tableWrapper table th),
.kb-editor__cm :deep(.kb-tiptap-prose table.kb-editor-table th) {
  background: #f8f8f8;
  font-weight: 700;
  text-align: center;
}

.kb-editor__cm :deep(.kb-tiptap-prose .tableWrapper table td),
.kb-editor__cm :deep(.kb-tiptap-prose table.kb-editor-table td) {
  background: #fff;
  text-align: left;
}

.kb-editor__cm :deep(.kb-layout-section) {
  border-radius: 10px;
  margin: 0.75rem 0;
  padding: 12px 16px;
}

.kb-editor__cm :deep(.kb-layout-section[data-kb-variant='default']) {
  background: transparent;
}

.kb-editor__cm :deep(.kb-layout-section[data-kb-variant='muted']) {
  background: #f8fafc;
}

.kb-editor__cm :deep(.kb-layout-section[data-kb-variant='emphasis']) {
  background: #eff6ff;
}

/* 提示卡：浅蓝底 + 左侧强调条（文档站常见 callout） */
.kb-editor__cm :deep(.kb-layout-section[data-kb-variant='tip']) {
  position: relative;
  margin: 0.75rem 0;
  padding: 14px 18px 14px 20px;
  background: #f0f7ff;
  border-radius: 10px;
  box-shadow: inset 4px 0 0 #1d4ed8;
  color: #1e3a5f;
}

.kb-editor__cm :deep(.kb-layout-section[data-kb-variant='tip'] > p:first-child) {
  margin-top: 0;
  color: var(--kb-tip-title, #1d4ed8);
  font-weight: 600;
}

.kb-editor__cm :deep(.kb-layout-section[data-kb-variant='tip'] > p:first-child strong) {
  color: var(--kb-tip-title, #1d4ed8);
  font-weight: 700;
}

.kb-editor__cm :deep(.kb-layout-section[data-kb-variant='tip'] > p + p) {
  margin-top: 0.5rem;
  color: #1e3a5f;
  font-weight: 400;
}

.kb-editor__cm :deep(.kb-image-gallery) {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
  margin: 0.75rem 0;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.kb-editor__cm :deep(.kb-image-gallery__img) {
  flex: 1 1 0;
  min-width: 120px;
  max-width: min(320px, 45vw);
  height: auto;
  max-height: 280px;
  object-fit: cover;
  border-radius: 8px;
  vertical-align: middle;
}

.kb-editor__cm :deep(.kb-editor-image) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 0.5rem 0;
  display: block;
}

.kb-editor__cm :deep(.kb-embed-iframe) {
  display: block;
  margin: 0.75rem 0;
}

/* tiptap ResizableNodeView: 显示选中框与拖拽手柄 */
.kb-editor__cm :deep([data-resize-container]) {
  position: relative;
  width: fit-content;
  max-width: 100%;
  margin: 0.6rem 0;
  outline: 1px solid transparent;
  border-radius: 10px;
}

.kb-editor__cm :deep([data-resize-container][data-kb-align='center']),
.kb-editor__cm :deep(.kb-image-gallery[data-kb-align='center']) {
  margin-left: auto;
  margin-right: auto;
}

.kb-editor__cm :deep([data-resize-container][data-kb-align='right']),
.kb-editor__cm :deep(.kb-image-gallery[data-kb-align='right']) {
  margin-left: auto;
  margin-right: 0;
}

.kb-editor__cm :deep([data-resize-container].ProseMirror-selectednode),
.kb-editor__cm :deep([data-resize-container][data-resize-state='true']) {
  outline-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.kb-editor__cm :deep([data-resize-container] [data-resize-handle]) {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #fff;
  border: 2px solid #3b82f6;
  opacity: 0;
  transition: opacity 0.12s ease;
  z-index: 4;
}

.kb-editor__cm :deep([data-resize-container].ProseMirror-selectednode [data-resize-handle]),
.kb-editor__cm :deep([data-resize-container][data-resize-state='true'] [data-resize-handle]) {
  opacity: 1;
}

.kb-editor__cm :deep([data-resize-handle*='left']),
.kb-editor__cm :deep([data-resize-handle*='right']) {
  top: auto;
  bottom: -6px;
}

.kb-editor__cm :deep([data-resize-handle='bottom-left']) {
  cursor: sw-resize;
}
.kb-editor__cm :deep([data-resize-handle='bottom-right']) {
  cursor: se-resize;
}
.kb-editor__cm :deep([data-resize-handle='top-left']) {
  cursor: nw-resize;
}
.kb-editor__cm :deep([data-resize-handle='top-right']) {
  cursor: ne-resize;
}

/* 链接统一外观与手型 */
.kb-editor__cm :deep(.kb-tiptap-prose a) {
  color: #2563eb;
  text-decoration: underline;
  cursor: pointer;
}

/* 外链：文后 ↗（与正文工具条一致，阅读态见 KbDocBody） */
.kb-editor__cm :deep(.kb-tiptap-prose a[href^='http://']::after),
.kb-editor__cm :deep(.kb-tiptap-prose a[href^='https://']::after) {
  content: '\2197';
  display: inline-block;
  margin-left: 0.12em;
  font-size: 0.88em;
  line-height: 1;
  vertical-align: 0.08em;
  text-decoration: none;
  color: inherit;
}

.kb-editor__aside {
  height: 100%;
  min-height: 0;
  min-width: 0;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--kb-e-border);
}

.kb-editor__aside--hidden {
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  border-right: none;
}

.kb-editor__aside :deep(.n-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.kb-editor__aside :deep(.n-tabs-nav) {
  padding: 0 10px;
}

.kb-editor__aside :deep(.n-tab-pane) {
  flex: 1;
  min-height: 0;
  padding: 0.5rem 0 0;
}

.kb-editor__aside-scroll {
  max-height: calc(100vh - 200px);
  min-height: 200px;
}

.kb-outline {
  list-style: none;
  margin: 0;
  padding: 0 10px 12px;
}

.kb-outline__item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1.4;
}

.kb-outline__item:hover {
  background: rgba(15, 118, 110, 0.08);
}

.kb-outline__lv {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
}

.kb-outline__text {
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kb-editor__aside-empty {
  padding: 0 10px 12px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

.kb-nav-ref-section {
  padding: 0 10px 12px;
}

.kb-nav-ref-hd {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  margin: 6px 0;
  padding-left: 2px;
}

.kb-nav-node-kind {
  flex-shrink: 0;
}

.kb-nav-node-suffix {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 52px;
  justify-content: flex-end;
}

.kb-nav-node-state {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  line-height: 0;
  transform: translateY(-1px);
}

.kb-nav-node-state :deep(svg) {
  display: block;
}

.kb-nav-bind-icon {
  width: 24px;
  height: 24px;
  padding: 0 !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  line-height: 0;
}

.kb-nav-bind-icon :deep(svg) {
  display: block;
}



@media (max-width: 960px) {
  .kb-editor__body {
    grid-template-columns: 1fr;
  }
  .kb-editor__aside {
    border-top: 1px solid var(--kb-e-border);
    max-height: 240px;
  }

  .kb-editor__cm {
    padding: 0 12px;
  }

  .kb-editor__cm :deep(.kb-tiptap-prose) {
    max-width: 100%;
  }

  /* 小屏优先保证可见：媒体按容器宽度缩放 */
  .kb-editor__cm :deep([data-resize-container]) {
    width: 100% !important;
    max-width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  .kb-editor__cm :deep([data-resize-container] > [data-resize-wrapper]) {
    width: 100% !important;
    max-width: 100% !important;
  }

  /* 图片：只缩不撑，保持等比例（避免被强制拉满宽度） */
  .kb-editor__cm :deep(.kb-editor-image) {
    width: auto !important;
    max-width: 100% !important;
    height: auto !important;
  }

  /* iframe：移动端默认铺满容器宽度 */
  .kb-editor__cm :deep(.kb-embed-iframe) {
    width: 100% !important;
    max-width: 100% !important;
  }

  .kb-editor__cm :deep(.kb-embed-iframe) {
    aspect-ratio: 16 / 9;
    height: auto !important;
    min-height: 0 !important;
  }

  .kb-editor__cm :deep(.kb-image-gallery) {
    width: 100%;
    max-width: 100%;
    flex-wrap: wrap;
    overflow-x: hidden;
    gap: 6px;
  }

  .kb-editor__cm :deep(.kb-image-gallery__img) {
    flex: 1 1 calc(50% - 6px);
    min-width: min(180px, 44%);
    max-width: 100%;
    height: auto;
    max-height: 220px;
  }
}
</style>
