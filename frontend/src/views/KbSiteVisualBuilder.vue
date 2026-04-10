<template>
  <div class="gsb-app kb-visual-builder kb-visual-builder--fullscreen">
    <div class="page-header-wrapper">
      <PageHeader title="Wiki 站点搭建器" subtitle="全屏预览 · 仅 ⚙ 与工具条上的配置入口会打开右侧抽屉">
        <template #actions>
          <div class="kb-vb-toolbar">
            <div class="kb-vb-toolbar__meta">
              <span class="kb-vb-toolbar__chip">{{ activeManifest.name }}</span>
              <span class="kb-vb-toolbar__chip kb-vb-toolbar__chip--muted">{{ devLabel }}</span>
              <n-tag size="small" :type="siteCfgStatus.hasPublished ? 'success' : 'warning'" :bordered="false">
                {{ siteCfgStatus.hasPublished ? '已发布' : '未发布' }}
              </n-tag>
              <n-popover
                v-if="globalUnboundNavCount > 0"
                trigger="click"
                placement="bottom-start"
                :width="520"
                v-model:show="unboundPopoverOpen"
              >
                <template #trigger>
                  <n-tag size="small" type="error" :bordered="false">未绑定项 {{ globalUnboundNavCount }}</n-tag>
                </template>

                <div class="vb-modal-scroll rp-scroll" style="max-height: 56vh">
                  <div class="sec-hd">未绑定导航项：{{ unboundNavItemsAll.length }}</div>
                  <div v-if="unboundNavItemsShown.length" style="margin: 8px 0 14px 0">
                    <div v-for="it in unboundNavItemsShown" :key="it.id" style="padding: 4px 0">
                      {{ it.label }}
                    </div>
                  </div>
                  <div v-else class="vb-sidebar-ctx-hint">（无）</div>
                  <div v-if="unboundNavMore" class="vb-sidebar-ctx-hint" style="margin-top: 6px">
                    仅展示前 {{ UNBOUND_NAV_LIMIT }} 项
                  </div>

                  <div class="dv" />

                  <div class="sec-hd">未绑定侧栏叶子：{{ unboundSidebarLeafItemsAll.length }}</div>
                  <div v-if="unboundSidebarLeafItemsShown.length" style="margin: 8px 0 14px 0">
                    <div v-for="it in unboundSidebarLeafItemsShown" :key="it.navHostId + ':' + it.nodeId" style="padding: 4px 0">
                      {{ it.navHostLabel }} / {{ it.groupLabel }} / {{ it.nodeLabel }}
                    </div>
                  </div>
                  <div v-else class="vb-sidebar-ctx-hint">（无）</div>
                  <div v-if="unboundSidebarLeafMore" class="vb-sidebar-ctx-hint" style="margin-top: 6px">
                    仅展示前 {{ UNBOUND_LEAF_LIMIT }} 项
                  </div>

                  <div class="dv" />

                  <div class="vb-sidebar-ctx-hint" style="margin-top: 6px">
                    提示：未绑定节点点击无法跳转。请先在「导航栏」或「菜单树」中关联对应页面。
                  </div>
                </div>
              </n-popover>
            </div>
            <div class="kb-vb-toolbar__group">
              <n-button size="small" secondary :loading="loadingKb" @click="loadKbDocCatalog">同步目录</n-button>
              <n-button size="small" secondary @click="saveVisualState">保存</n-button>
            </div>
            <div class="kb-vb-toolbar__group kb-vb-toolbar__group--soft">
              <n-button size="small" quaternary @click="exportJson">导出</n-button>
              <n-button size="small" quaternary @click="openSiteCfgHistory">历史</n-button>
              <n-button size="small" quaternary :disabled="!siteCfgStatus.hasPublished" @click="unpublish">取消发布</n-button>
            </div>
            <div class="kb-vb-toolbar__group">
              <n-button size="small" type="primary" @click="publish">发布</n-button>
            </div>
          </div>
        </template>
      </PageHeader>
    </div>

    <div class="kb-visual-builder__stage">
      <div class="shell shell--fill" :class="device">
        <div class="gsb-hotspots-wrap gsb-canvas-stage gsb-canvas-stage--fill">
          <KbSitePreview
            class="gsb-canvas-preview"
            :site-config="siteRendererConfig"
            :site-key="siteKey"
            :active-page-id="activePage"
            :active-nav-id="activeNav"
            :show-demo-controls="false"
        
            @update:active-page-id="activePage = $event"
            @update:active-nav-id="activeNav = $event"
          />
          <div class="gsb-canvas-floating-toolbar">
            <n-tag v-if="canvasStatusLabel" size="small" :bordered="false" :type="canvasStatusTagType">
              {{ canvasStatusLabel }}
            </n-tag>
            <n-button size="small" secondary round @click="openThemeConfig">主题</n-button>
            <n-button size="small" quaternary round @click="openSeoConfig">SEO</n-button>
            <n-button
              v-for="s in activeSlots"
              :key="s.key"
              size="small"
              quaternary
              round
              @click="openSlotConfig(s.key)"
            >
              {{ s.label }}
            </n-button>
            <n-button size="small" secondary round :disabled="!selectedPage" @click="openCurrentPageConfig">当前页</n-button>
            <n-button size="small" secondary round @click="openConfigDrawer">配置</n-button>
            <n-button size="small" quaternary round @click="onCanvasDelete">删除</n-button>
          </div>
          <div class="gsb-hotspots" aria-hidden="true">
            <button
              type="button"
              class="gsb-hs gsb-hs--fab"
              title="配置导航栏"
              :style="navRegionFabStyle"
              @click="openRegionConfig('navbar')"
            >
              <span class="gsb-hs__fab" aria-hidden="true">⚙</span>
              <span class="gsb-hs__hint">导航</span>
            </button>
            <button
              v-if="cfg.themeId === 'docs'"
              type="button"
              class="gsb-hs gsb-hs--fab"
              title="配置侧栏菜单"
              :style="sidebarRegionFabStyle"
              @click="openRegionConfig('sidebar')"
            >
              <span class="gsb-hs__fab" aria-hidden="true">⚙</span>
              <span class="gsb-hs__hint">侧栏</span>
            </button>
            <button
              type="button"
              class="gsb-hs gsb-hs--fab"
              title="配置内容区"
              :style="contentRegionFabStyle"
              @click="openRegionConfig('content')"
            >
              <span class="gsb-hs__fab" aria-hidden="true">⚙</span>
              <span class="gsb-hs__hint">内容</span>
            </button>
            <button
              type="button"
              class="gsb-hs gsb-hs--fab"
              title="配置页脚"
              :style="footerRegionFabStyle"
              @click="openRegionConfig('footer')"
            >
              <span class="gsb-hs__fab" aria-hidden="true">⚙</span>
              <span class="gsb-hs__hint">页脚</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <n-drawer
      v-model:show="configDrawerOpen"
      :width="drawerBodyWidth"
      placement="right"
      display-directive="show"
      :trap-focus="false"
      :auto-focus="false"
      class="vb-config-drawer"
    >
      <n-drawer-content
        title="站点配置"
        closable
        :native-scrollbar="false"
        :body-content-style="{ padding: '0 16px 16px' }"
      >
        <div class="vb-modal-tabs-wrap">
        <n-tabs v-model:value="configTab" type="line" size="small" animated>
          <n-tab-pane name="navbar" tab="导航栏">
            <div class="vb-modal-scroll rp-scroll">
              <div class="field" style="margin-bottom: 12px">
                <div class="fl">品牌名称</div>
                <input v-model="cfg.navbar.brand" class="fi">
              </div>
              <div class="field">
                <div class="fl">背景风格</div>
                <select v-model="cfg.navbar.style" class="fi fi-sel">
                  <option value="solid">纯色</option>
                  <option value="blur">毛玻璃</option>
                  <option value="transparent">透明</option>
                </select>
              </div>
              <div class="field">
                <div class="toggle-row"><span class="fl" style="margin: 0">搜索框</span><div class="toggle" :class="{ on: cfg.navbar.showSearch }" @click="cfg.navbar.showSearch = !cfg.navbar.showSearch" /></div>
              </div>
              <div class="field">
                <div class="toggle-row"><span class="fl" style="margin: 0">固定顶部</span><div class="toggle" :class="{ on: cfg.navbar.sticky }" @click="cfg.navbar.sticky = !cfg.navbar.sticky" /></div>
              </div>
              <div class="dv" />
              <div class="sec-hd">导航项 · 关联页面</div>
              <div class="nav-chips">
                <div
                  v-for="(it, i) in cfg.navbar.links"
                  :key="it.id"
                  class="nav-chip"
                  :class="{ on: selNavItem === i }"
                  @click="selNavItem = i"
                >
                  <span class="dh">⠿</span>
                  <span>{{ it.icon }} {{ it.label }}</span>
                  <span v-if="it.pageId" class="nc-page">{{ getPage(it.pageId)?.slug }}</span>
                  <span
                    v-else-if="isEmptyNavSlot(it.id, it.pageId, it.type === 'dropdown' && !!it.children?.length)"
                    class="nc-unbound"
                  >
                    未绑定页面
                  </span>
                  <span class="nc-type">{{ it.type }}</span>
                </div>
              </div>
              <button class="add-btn" @click="addNavItem">+ 添加导航项</button>
              <div v-if="selNavItem !== null && cfg.navbar.links[selNavItem]" style="margin-top: 10px">
                <div class="dv" />
                <div class="sec-hd">编辑：{{ cfg.navbar.links[selNavItem].label }}</div>
                <div class="field"><div class="fl">标签</div><input v-model="cfg.navbar.links[selNavItem].label" class="fi"></div>
                <div class="field"><div class="fl">图标</div><input v-model="cfg.navbar.links[selNavItem].icon" class="fi" placeholder="🚀"></div>
                <div class="field">
                  <div class="fl">类型</div>
                  <select
                    class="fi fi-sel"
                    :value="cfg.navbar.links[selNavItem].type"
                    @change="onNavItemTypeChange(selNavItem!, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="link">普通链接</option>
                    <option value="dropdown">下拉菜单</option>
                    <option value="external">外部链接</option>
                  </select>
                </div>
                <template v-if="cfg.navbar.links[selNavItem].type !== 'dropdown'">
                  <div class="field">
                    <div class="fl">关联页面 <span class="fl-hint">→ Page.id</span></div>
                    <select
                      class="fi fi-sel"
                      :value="cfg.navbar.links[selNavItem].pageId || ''"
                      @change="onNavPageChange(selNavItem, ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="">— 不关联（外链或占位）</option>
                      <optgroup label="站点页面">
                        <option v-for="p in pages" :key="'s-' + p.id" :value="p.id">{{ p.title }} ({{ p.slug }})</option>
                      </optgroup>
                      <optgroup v-if="kbCatalogOnlyPages.length" label="知识库目录（选中后加入站点）">
                        <option v-for="p in kbCatalogOnlyPages" :key="'k-' + p.id" :value="p.id">{{ p.title }} ({{ p.slug }})</option>
                      </optgroup>
                    </select>
                  </div>
                  <div v-if="cfg.navbar.links[selNavItem].type === 'external'" class="field">
                    <div class="fl">打开方式</div>
                    <select
                      class="fi fi-sel"
                      :value="cfg.navbar.links[selNavItem].externalOpen ?? 'blank'"
                      @change="
                        cfg.navbar.links[selNavItem].externalOpen = ($event.target as HTMLSelectElement).value as
                          | 'same'
                          | 'blank'
                      "
                    >
                      <option value="blank">新标签页打开</option>
                      <option value="same">当前窗口打开</option>
                    </select>
                  </div>
                  <div v-if="!cfg.navbar.links[selNavItem].pageId" class="field">
                    <div class="fl">外部 href</div>
                    <input v-model="cfg.navbar.links[selNavItem].href" class="fi fi-mono" placeholder="https://...">
                  </div>
                  <div
                    v-if="cfg.navbar.links[selNavItem].pageId && cfg.navbar.links[selNavItem].type === 'link'"
                    style="font-size: 10.5px; color: var(--grn); padding: 5px 8px; border-radius: var(--r); background: var(--grn-g); border: 1px solid rgba(45, 212, 160, 0.2); margin-bottom: 8px"
                  >
                    ✓ 预览内点击将在下方内容区打开该页面（站内）
                  </div>
                  <div
                    v-if="cfg.navbar.links[selNavItem].pageId && cfg.navbar.links[selNavItem].type === 'link'"
                    style="font-size: 10.5px; color: var(--tx3); padding: 4px 8px; margin-bottom: 8px"
                  >
                    href 已同步为页面 slug
                  </div>
                </template>
                <template v-else>
                  <p class="vb-sidebar-ctx-hint" style="margin: 8px 0">
                    下拉菜单仅展示子导航；子项只能是普通链接或外部链接，不能再嵌套下拉。
                  </p>
                  <div class="sec-hd" style="font-size: 11px">子导航</div>
                  <div class="nav-chips">
                    <div
                      v-for="(ch, ci) in cfg.navbar.links[selNavItem].children || []"
                      :key="ch.id"
                      class="nav-chip"
                      :class="{ on: selNavSubIdx === ci }"
                      @click="selNavSubIdx = ci"
                    >
                      <span>{{ ch.icon }} {{ ch.label }}</span>
                      <span v-if="ch.pageId" class="nc-page">{{ getPage(ch.pageId)?.slug }}</span>
                      <span v-else-if="isEmptyNavSlot(ch.id, ch.pageId)" class="nc-unbound">未绑定页面</span>
                      <span class="nc-type">{{ ch.type }}</span>
                    </div>
                  </div>
                  <button type="button" class="add-btn" @click="addNavChild(selNavItem!)">+ 添加子导航</button>
                  <div v-if="selNavSubIdx !== null && cfg.navbar.links[selNavItem].children?.[selNavSubIdx!]" style="margin-top: 10px">
                    <div class="dv" />
                    <div class="sec-hd">编辑子项：{{ cfg.navbar.links[selNavItem].children![selNavSubIdx!].label }}</div>
                    <div class="field"><div class="fl">标签</div><input v-model="cfg.navbar.links[selNavItem].children![selNavSubIdx!].label" class="fi"></div>
                    <div class="field"><div class="fl">图标</div><input v-model="cfg.navbar.links[selNavItem].children![selNavSubIdx!].icon" class="fi"></div>
                    <div class="field">
                      <div class="fl">类型</div>
                      <select v-model="cfg.navbar.links[selNavItem].children![selNavSubIdx!].type" class="fi fi-sel">
                        <option value="link">普通链接</option>
                        <option value="external">外部链接</option>
                      </select>
                    </div>
                    <div class="field">
                      <div class="fl">关联页面</div>
                      <select
                        class="fi fi-sel"
                        :value="cfg.navbar.links[selNavItem].children![selNavSubIdx!].pageId || ''"
                        @change="onNavChildPageChange(selNavItem!, selNavSubIdx!, ($event.target as HTMLSelectElement).value)"
                      >
                        <option value="">— 不关联</option>
                        <optgroup label="站点页面">
                          <option v-for="p in pages" :key="'s-' + p.id" :value="p.id">{{ p.title }} ({{ p.slug }})</option>
                        </optgroup>
                        <optgroup v-if="kbCatalogOnlyPages.length" label="知识库目录（选中后加入站点）">
                          <option v-for="p in kbCatalogOnlyPages" :key="'k-' + p.id" :value="p.id">{{ p.title }} ({{ p.slug }})</option>
                        </optgroup>
                      </select>
                    </div>
                    <div
                      v-if="cfg.navbar.links[selNavItem].children![selNavSubIdx!].type === 'external'"
                      class="field"
                    >
                      <div class="fl">打开方式</div>
                      <select v-model="cfg.navbar.links[selNavItem].children![selNavSubIdx!].externalOpen" class="fi fi-sel">
                        <option value="blank">新标签页</option>
                        <option value="same">当前窗口</option>
                      </select>
                    </div>
                    <div
                      v-if="!cfg.navbar.links[selNavItem].children![selNavSubIdx!].pageId"
                      class="field"
                    >
                      <div class="fl">href</div>
                      <input v-model="cfg.navbar.links[selNavItem].children![selNavSubIdx!].href" class="fi fi-mono" placeholder="https://...">
                    </div>
                    <div
                      v-if="cfg.navbar.links[selNavItem].children![selNavSubIdx!].pageId && cfg.navbar.links[selNavItem].children![selNavSubIdx!].type === 'link'"
                      style="font-size: 10.5px; color: var(--grn); padding: 5px 8px; border-radius: var(--r); background: var(--grn-g); border: 1px solid rgba(45, 212, 160, 0.2); margin-bottom: 8px"
                    >
                      ✓ 预览内点击在下方打开该页面
                    </div>
                    <button
                      type="button"
                      class="add-btn"
                      style="border-color: var(--red); color: var(--red)"
                      @click="removeNavChild(selNavItem!, selNavSubIdx!)"
                    >
                      × 删除子导航
                    </button>
                  </div>
                </template>
                <div
                  v-if="navEditorSidebarHostId"
                  style="margin-top: 12px; padding: 10px; border-radius: var(--r); border: 1px solid var(--bd); background: var(--bg)"
                >
                  <div class="sec-hd" style="font-size: 11px">此导航的侧栏菜单树</div>
                  <p class="vb-sidebar-ctx-hint" style="margin: 6px 0">
                    已配置 {{ navEditorSidebarSectionCount }} 个分组，预览随当前选中的可绑定导航切换侧栏。
                  </p>
                  <button type="button" class="add-btn" @click="openSidebarForNavHost(navEditorSidebarHostId)">编辑菜单树</button>
                </div>
                <p
                  v-else-if="cfg.navbar.links[selNavItem].pageId || (selNavSubIdx !== null && cfg.navbar.links[selNavItem].children?.[selNavSubIdx!]?.pageId)"
                  class="vb-sidebar-ctx-hint"
                  style="margin-top: 10px; color: #b45309"
                >
                  此项已关联页面，侧栏菜单不能绑定到该节点；请在「菜单树」中选择未关联页面的导航项进行编辑。
                </p>
                <button class="add-btn" style="border-color: var(--red); color: var(--red)" @click="removeNavItemAt(selNavItem!)">× 删除此项</button>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="sidebar" tab="菜单树">
            <div class="vb-modal-scroll rp-scroll">
              <div class="field">
                <div class="fl">绑定到导航节点</div>
                <select v-model="sidebarEditNavId" class="fi fi-sel">
                  <option v-for="opt in sidebarNavTreeOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
              <p v-if="!sidebarNavTreeOptions.length" class="vb-sidebar-ctx-hint" style="color: var(--red)">
                当前所有导航项都已关联页面，没有可绑定菜单树的槽位。请添加未关联页面的顶层项，或在下拉菜单中增加未关联页面的子项。
              </p>
              <p v-else class="vb-sidebar-ctx-hint">
                仅「未关联页面」的顶层或子导航可拥有独立菜单树；已关联页面的项不会出现在列表中。预览随当前选中导航切换侧栏。
              </p>
              <div class="field"><div class="fl">宽度 <span class="fl-hint">px</span></div><input v-model.number="cfg.sidebar.width" class="fi" type="number" min="160" max="400"></div>
              <div class="field"><div class="toggle-row"><span class="fl" style="margin: 0">可折叠</span><div class="toggle" :class="{ on: cfg.sidebar.collapsible }" @click="cfg.sidebar.collapsible = !cfg.sidebar.collapsible" /></div></div>
              <div class="dv" />
              <div class="sec-hd">菜单树 · {{ sidebarCtxLabel }} · 关联页面</div>
              <div v-for="(sec, si) in editingSidebarTree" :key="sec.id" class="te-node">
                <div class="te-head" :class="{ on: selTreeNode === si + '.root' }" @click="selTreeNode = selTreeNode === si + '.root' ? null : si + '.root'">
                  <span>{{ sec.icon }}</span>
                  <span class="te-lbl">{{ sec.groupLabel }}</span>
                  <div class="te-acts">
                    <button type="button" class="ta" @click.stop="toggleSecExpanded(si)">{{ sec.expanded !== false ? '▾' : '▸' }}</button>
                    <button type="button" class="ta" @click.stop="addSideChildAt(si, [])" title="在本分组下添加项">+</button>
                    <button type="button" class="ta del" @click.stop="removeSidebarSection(si)">×</button>
                  </div>
                </div>
                <div v-if="sec.expanded !== false" class="te-children">
                  <KbVisualSidebarTreeRows
                    :nodes="sec.children"
                    :section-index="si"
                    :path-prefix="[]"
                    :sel-tree-node="selTreeNode"
                    :page-slug="sidebarPageSlug"
                    @update:sel-tree-node="onVsbSidebarSelect"
                    @add-child="onVsbSidebarAddChild"
                    @remove="onVsbSidebarRemove"
                  />
                  <button
                    type="button"
                    class="add-btn"
                    style="font-size: 10px; padding: 4px; margin: 2px 4px"
                    @click="addSideChildAt(si, [])"
                  >
                    + 子页面
                  </button>
                </div>
              </div>
              <button type="button" class="add-btn" @click="addSideSection">+ 添加分组</button>
              <div v-if="selTreeNode && getTreeNode()" style="margin-top: 10px">
                <div class="dv" />
                <div class="sec-hd">编辑节点</div>
                <div class="field"><div class="fl">标签</div><input v-model="(getTreeNode() as any).label" class="fi" @input="onTreeLabelInput"></div>
                <div v-if="selTreeNode && !selTreeNode.endsWith('.root')" class="field">
                  <div class="fl">关联页面 <span class="fl-hint">→ Page.id</span></div>
                  <select
                    class="fi fi-sel"
                    :value="(getTreeNode() as any).pageId || ''"
                    @change="setTreeNodePageId(($event.target as HTMLSelectElement).value)"
                  >
                    <option value="">— 未关联（可折叠父级 / 纯分组）</option>
                    <optgroup label="站点页面">
                      <option v-for="p in pages" :key="'s-' + p.id" :value="p.id">{{ p.title }} ({{ p.slug }})</option>
                    </optgroup>
                    <optgroup v-if="kbCatalogOnlyPages.length" label="知识库目录（选中后加入站点）">
                      <option v-for="p in kbCatalogOnlyPages" :key="'k-' + p.id" :value="p.id">{{ p.title }} ({{ p.slug }})</option>
                    </optgroup>
                  </select>
                </div>
                <div class="field">
                  <div class="fl">图标</div>
                  <select v-model="(getTreeNode() as any).icon" class="fi fi-sel">
                    <option v-for="ic in iconOpts" :key="ic" :value="ic">{{ ic }}</option>
                  </select>
                </div>
                <div v-if="selTreeNode && !selTreeNode.endsWith('.root')" class="field">
                  <div class="fl">徽标</div>
                  <select v-model="(getTreeNode() as any).badge" class="fi fi-sel">
                    <option value="">无</option>
                    <option value="NEW">NEW</option>
                    <option value="Beta">Beta</option>
                    <option value="Deprecated">Deprecated</option>
                  </select>
                </div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="content" tab="内容区">
            <div class="vb-modal-scroll rp-scroll">
              <div class="field"><div class="fl">最大宽度</div>
                <select v-model="cfg.content.maxWidth" class="fi fi-sel">
                  <option value="660px">窄 660px</option>
                  <option value="760px">标准 760px</option>
                  <option value="960px">宽 960px</option>
                  <option value="100%">全宽</option>
                </select>
              </div>
              <div class="field"><div class="toggle-row"><span class="fl" style="margin: 0">显示目录 TOC</span><div class="toggle" :class="{ on: cfg.content.showToc }" @click="cfg.content.showToc = !cfg.content.showToc" /></div></div>
              <div class="dv" />
              <div class="sec-hd">当前预览页面</div>
              <div v-if="currentPagePreview" style="padding: 10px; border-radius: var(--r); background: var(--bg); border: 1px solid var(--bd)">
                <div style="font-size: 12px; font-weight: 600; color: var(--tx); margin-bottom: 4px">{{ currentPagePreview.title }}</div>
                <div style="font-size: 10.5px; color: var(--acc); font-family: var(--mono)">{{ currentPageSlug }}</div>
                <div style="font-size: 10px; color: var(--tx3); margin-top: 4px">类型: {{ ptLabel(currentPagePreview.type) }}</div>
              </div>
              <div v-else style="font-size: 11px; color: var(--tx3)">从左侧列表或预览中选中页面</div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="footer" tab="页脚">
            <div class="vb-modal-scroll rp-scroll">
              <div class="field"><div class="toggle-row"><span class="fl" style="margin: 0">显示页脚</span><div class="toggle" :class="{ on: cfg.footer.visible }" @click="cfg.footer.visible = !cfg.footer.visible" /></div></div>
              <div class="field"><div class="fl">版权文字</div><input v-model="cfg.footer.copyright" class="fi"></div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="theme" tab="主题">
            <div class="vb-modal-scroll rp-scroll">
              <div style="margin-bottom: 14px">
                <div class="sec-hd">主色调</div>
                <div class="color-dots">
                  <div
                    v-for="c in colorPresets"
                    :key="c.v"
                    class="cdot-sel"
                    :class="{ on: cfg.theme.primary === c.v }"
                    :style="{ background: c.v }"
                    :title="c.n"
                    @click="cfg.theme.primary = c.v"
                  />
                </div>
                <div class="color-row">
                  <div class="swatch" :style="{ background: cfg.theme.primary }"><input type="color" @input="onPrimaryColorInput"></div>
                  <input v-model="cfg.theme.primary" class="fi fi-mono">
                </div>
              </div>
              <div class="field"><div class="toggle-row"><span class="fl" style="margin: 0">深色模式</span><div class="toggle" :class="{ on: cfg.theme.dark }" @click="cfg.theme.dark = !cfg.theme.dark" /></div></div>
              <div class="field"><div class="fl">字体</div>
                <select v-model="cfg.theme.font" class="fi fi-sel">
                  <option value="DM Sans">DM Sans</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Noto Sans SC">Noto Sans SC</option>
                  <option value="PingFang SC">PingFang SC</option>
                </select>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="seo" tab="SEO">
            <div class="vb-modal-scroll rp-scroll">
              <p class="vb-sidebar-ctx-hint" style="margin-bottom: 12px">
                以下字段写入导出 JSON 的 <code class="vb-code">siteConfig.seo</code> 与
                <code class="vb-code">renderer.seo</code>，供宿主注入 <code class="vb-code">&lt;head&gt;</code> 或 SSR。
              </p>
              <template v-if="cfg.seo">
                <div class="field"><div class="fl">站点名称 <span class="fl-hint">用于 &#123;siteName&#125;</span></div>
                  <input v-model="cfg.seo.siteName" class="fi" placeholder="留空则用导航品牌名"></div>
                <div class="field"><div class="fl">标题模板</div>
                  <input v-model="cfg.seo.titleTemplate" class="fi fi-mono" placeholder="{title} · {siteName}">
                </div>
                <div class="field"><div class="fl">全站默认 description</div>
                  <textarea v-model="cfg.seo.defaultDescription" class="fi fi-ta" rows="3" placeholder="meta description"></textarea>
                </div>
                <div class="field"><div class="fl">默认分享图 URL <span class="fl-hint">og:image</span></div>
                  <input v-model="cfg.seo.defaultOgImage" class="fi fi-mono" placeholder="https://..."></div>
                <div class="field"><div class="fl">Favicon URL</div>
                  <input v-model="cfg.seo.faviconUrl" class="fi fi-mono" placeholder="https://.../favicon.ico"></div>
                <div class="field"><div class="fl">Twitter @站点</div>
                  <input v-model="cfg.seo.twitterSite" class="fi fi-mono" placeholder="@your_site"></div>
              </template>
            </div>
          </n-tab-pane>

          <n-tab-pane name="pages" tab="页面排序">
            <div class="vb-modal-scroll rp-scroll">
              <p class="vb-sidebar-ctx-hint" style="margin-bottom: 10px">
                按「排序」升序展示；改数字或 ↑↓ 后自动重整为 0…n。点击行可在预览中打开该页。
              </p>
              <div class="vb-pages-head">
                <span class="vb-ph-order">序</span>
                <span class="vb-ph-title">页面</span>
                <span class="vb-ph-slug">Slug</span>
                <span class="vb-ph-act">操作</span>
              </div>
              <div
                v-for="(p, pi) in pagesSorted"
                :key="p.id"
                class="vb-pages-row"
                :class="{ on: activePage === p.id }"
                @click="activePage = p.id"
              >
                <input
                  class="fi vb-pi-order"
                  type="number"
                  :value="p.order"
                  @click.stop
                  @change="onPageOrderInput(p, ($event.target as HTMLInputElement).value)"
                >
                <span class="vb-pi-title">{{ p.title }}</span>
                <span class="vb-pi-slug fi-mono">{{ p.slug }}</span>
                <div class="vb-pi-act" @click.stop>
                  <button type="button" class="ta" title="上移" :disabled="pi === 0" @click="movePageInSortedList(pi, -1)">↑</button>
                  <button type="button" class="ta" title="下移" :disabled="pi >= pagesSorted.length - 1" @click="movePageInSortedList(pi, 1)">↓</button>
                </div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="slots" tab="插槽">
            <div class="vb-modal-scroll rp-scroll">
              <div class="field">
                <div class="fl">选择插槽</div>
                <select v-model="modalSlotKey" class="fi fi-sel">
                  <option v-for="s in activeSlots" :key="s.key" :value="s.key">{{ s.label }} ({{ s.key }})</option>
                </select>
              </div>
              <div class="field">
                <div class="toggle-row"><span class="fl" style="margin: 0">启用</span><div class="toggle" :class="{ on: !!cfg.slots[modalSlotKey] }" @click="toggleSlot(modalSlotKey)" /></div>
              </div>
              <template v-if="cfg.slots[modalSlotKey]">
                <div class="field"><div class="fl">组件</div>
                  <select v-model="cfg.slots[modalSlotKey]!.componentKey" class="fi fi-sel">
                    <option value="AdBanner">广告横幅 AdBanner</option>
                    <option value="Announcement">公告栏 Announcement</option>
                  </select>
                </div>
                <div class="dv" />
                <div class="sec-hd">组件属性</div>
                <template v-for="(schema, key) in slotSchemas[cfg.slots[modalSlotKey]!.componentKey] || {}" :key="String(key)">
                  <div class="field">
                    <div class="fl">{{ schema.label }}</div>
                    <input v-if="schema.type === 'string'" v-model="cfg.slots[modalSlotKey]!.props[key]" class="fi" :placeholder="schema.placeholder || ''">
                    <div v-else-if="schema.type === 'color'" class="color-row">
                      <div class="swatch" :style="{ background: cfg.slots[modalSlotKey]!.props[key] }"><input type="color" @input="setSlotProp(modalSlotKey, key, ($event.target as HTMLInputElement).value)"></div>
                      <input v-model="cfg.slots[modalSlotKey]!.props[key]" class="fi fi-mono">
                    </div>
                    <div v-else-if="schema.type === 'boolean'" class="toggle-row">
                      <span class="fl" style="margin: 0">{{ schema.description || '' }}</span>
                      <div class="toggle" :class="{ on: cfg.slots[modalSlotKey]!.props[key] }" @click="cfg.slots[modalSlotKey]!.props[key] = !cfg.slots[modalSlotKey]!.props[key]" />
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </n-tab-pane>

          <n-tab-pane name="extensions" tab="扩展">
            <div class="vb-modal-scroll rp-scroll">
              <p class="vb-sidebar-ctx-hint" style="margin-bottom: 10px">
                扩展 = Plugin（可插拔能力），通过稳定 Slot 注入到页面（登录入口、评论区、广告、埋点等）。
              </p>
              <div v-for="ext in availableExtensions" :key="ext.id" class="vb-ext-card">
                <div class="vb-ext-head">
                  <div class="vb-ext-title">
                    <div class="vb-ext-name">{{ ext.name }}</div>
                    <div v-if="ext.description" class="vb-ext-desc">{{ ext.description }}</div>
                  </div>
                  <div class="toggle" :class="{ on: isExtensionEnabled(ext.id) }" @click="toggleExtension(ext.id)" />
                </div>
                <div v-if="isExtensionEnabled(ext.id)" class="vb-ext-body">
                  <component
                    v-if="resolveExtensionPanel(ext)"
                    :is="resolveExtensionPanel(ext)"
                    :options="findExtensionCfg(ext.id)?.options || {}"
                    @update:options="(v: any) => { const c = ensureExtensionCfg(ext.id); c.options = v || {} }"
                  />

                  <template v-else v-for="(schema, key) in (ext.optionsSchema || {})" :key="String(key)">
                    <div class="field">
                      <div class="fl">{{ schema.label }}</div>
                      <input
                        v-if="schema.type === 'string'"
                        class="fi"
                        :placeholder="schema.placeholder || ''"
                        :value="String(getExtensionOption(ext.id, key) ?? '')"
                        @input="setExtensionOption(ext.id, key, ($event.target as HTMLInputElement).value)"
                      >
                      <input
                        v-else-if="schema.type === 'number'"
                        class="fi"
                        type="number"
                        :value="Number(getExtensionOption(ext.id, key) ?? 0)"
                        @input="setExtensionOption(ext.id, key, Number(($event.target as HTMLInputElement).value))"
                      >
                      <div v-else-if="schema.type === 'boolean'" class="toggle-row">
                        <span class="fl" style="margin: 0">{{ schema.placeholder || '' }}</span>
                        <div
                          class="toggle"
                          :class="{ on: !!getExtensionOption(ext.id, key) }"
                          @click="setExtensionOption(ext.id, key, !getExtensionOption(ext.id, key))"
                        />
                      </div>
                      <div v-else-if="schema.type === 'color'" class="color-row">
                        <div class="swatch" :style="{ background: String(getExtensionOption(ext.id, key) || '#000000') }">
                          <input
                            type="color"
                            :value="String(getExtensionOption(ext.id, key) || '#000000')"
                            @input="setExtensionOption(ext.id, key, ($event.target as HTMLInputElement).value)"
                          >
                        </div>
                        <input
                          class="fi fi-mono"
                          :value="String(getExtensionOption(ext.id, key) ?? '')"
                          @input="setExtensionOption(ext.id, key, ($event.target as HTMLInputElement).value)"
                        >
                      </div>
                      <select
                        v-else-if="schema.type === 'select'"
                        class="fi fi-sel"
                        :value="String(getExtensionOption(ext.id, key) ?? '')"
                        @change="setExtensionOption(ext.id, key, ($event.target as HTMLSelectElement).value)"
                      >
                        <option v-for="op in schema.options || []" :key="op.value" :value="op.value">{{ op.label }}</option>
                      </select>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane v-if="selectedPage" name="page" tab="当前页面">
            <div class="vb-modal-scroll rp-scroll">
              <div class="field"><div class="fl">标题</div><input v-model="selectedPage.title" class="fi"></div>
              <div class="field"><div class="fl">Slug <span class="fl-hint">URL</span></div><input v-model="selectedPage.slug" class="fi fi-mono" placeholder="/docs/..."></div>
              <div class="field"><div class="fl">描述</div><input v-model="selectedPage.description" class="fi" placeholder="页面摘要..."></div>
              <div class="field"><div class="fl">页面类型</div>
                <select v-model="selectedPage.type" class="fi fi-sel">
                  <option value="doc">📄 文档页</option>
                  <option value="home">🏠 首页</option>
                  <option value="blog">✍️ 博客</option>
                  <option value="api">🔌 API参考</option>
                  <option value="custom">⚙️ 自定义</option>
                </select>
              </div>
              <div class="field"><div class="fl">父页面</div>
                <select v-model="selectedPage.parentId" class="fi fi-sel">
                  <option value="">— 根页面</option>
                  <option v-for="p in pages.filter((p) => p.id !== activePage)" :key="p.id" :value="p.id">{{ p.title }}</option>
                </select>
              </div>
              <div class="dv" />
              <div class="sec-hd">关联引用</div>
              <div v-for="ref in getPageRefs(activePage)" :key="ref.id" class="ref-item">
                <span class="ref-ico">{{ ref.icon }}</span>
                <span class="ref-lbl">{{ ref.label }}</span>
                <span class="ref-loc">{{ ref.loc }}</span>
                <button type="button" class="ref-rm" @click="removeRef(ref)">×</button>
              </div>
              <div
                v-if="selectedPage && !getPageRefs(activePage).length"
                style="font-size: 11px; color: var(--red); padding: 6px 8px; border-radius: var(--r); background: var(--red-g); border: 1px solid rgba(245, 101, 101, 0.2)"
              >
                ⚠️ 孤立页面，未被任何导航引用
              </div>
              <div class="dv" />
              <div class="sec-hd">SEO（本页）</div>
              <p class="vb-sidebar-ctx-hint" style="margin-bottom: 8px">
                预览标题（按模板拼接）：<strong>{{ previewDocumentTitle(selectedPage) }}</strong>
              </p>
              <div class="field"><div class="fl">Meta 标题</div>
                <input v-model="ensurePageSeoMutable(selectedPage).metaTitle" class="fi" placeholder="留空则用页面标题"></div>
              <div class="field"><div class="fl">Meta description</div>
                <textarea v-model="ensurePageSeoMutable(selectedPage).metaDescription" class="fi fi-ta" rows="2" placeholder="留空则用页面描述或全站默认"></textarea>
              </div>
              <div class="field"><div class="fl">本页 og:image URL</div>
                <input v-model="ensurePageSeoMutable(selectedPage).ogImage" class="fi fi-mono" placeholder="https://..."></div>
              <div class="field"><div class="fl">Canonical</div>
                <input v-model="ensurePageSeoMutable(selectedPage).canonical" class="fi fi-mono" placeholder="https://... 或路径"></div>
              <div class="field"><div class="toggle-row"><span class="fl" style="margin: 0">noindex</span>
                <div class="toggle" :class="{ on: !!selectedPage.seo?.noindex }" @click="togglePageNoindex(selectedPage)" /></div>
              </div>
              <div class="dv" />
              <button type="button" class="add-btn" @click="quickAddToNav(selectedPage.id)">+ 快速添加到导航栏</button>
              <button type="button" class="add-btn" @click="quickAddToSide(selectedPage.id)">+ 快速添加到菜单树</button>
              <div class="dv" />
              <div class="sec-hd">正文编辑</div>
              <p class="vb-sidebar-ctx-hint" style="margin-bottom: 8px">
                正文内容在文档编辑器中维护；站点构建器负责导航、布局与页面组织。
              </p>
              <button
                type="button"
                class="add-btn"
                :disabled="!selectedPageKbDocId"
                @click="openSelectedPageDocEditor"
              >
                ✏️ 编辑正文（新标签）
              </button>
              <div class="dv" />
              <button type="button" class="add-btn" style="border-color: var(--red); color: var(--red)" @click="deletePage(selectedPage.id)">× 删除此页面</button>
            </div>
          </n-tab-pane>
        </n-tabs>
        </div>
      </n-drawer-content>
    </n-drawer>

    <div class="sbar">
      <div style="display:flex;align-items:center;gap:5px">
        <div class="sbar-dot" />
        <span class="sv">草稿</span>
      </div>
      <div>主题: <span class="sv">{{ activeManifest.name }}</span></div>
      <div>主色: <span class="sv">{{ cfg.theme.primary }}</span></div>
      <div>页面: <span class="sv">{{ pages.length }}</span></div>
      <div>导航: <span class="sv">{{ cfg.navbar.links.length }} 项</span></div>
      <div>历史: <span class="sv">{{ histIdx + 1 }}/{{ hist.length }}</span></div>
      <div style="margin-left:auto">{{ activeManifest.id }} · <span class="sv">{{ jsonSize }} B</span></div>
    </div>

    <div class="modal-bg" v-if="showNewPage" @click.self="showNewPage = false">
      <div class="modal">
        <div class="modal-t">从知识库关联到站点</div>
        <div class="field">
          <div class="fl">选择尚未加入站点的文档</div>
          <select v-model="np.pageId" class="fi fi-sel">
            <option value="">— 请先同步知识库目录后选择</option>
            <option v-for="p in kbDocsAvailableForLink" :key="p.id" :value="p.id">{{ p.title }} ({{ p.slug }})</option>
          </select>
          <div
            v-if="!loadingKb && !kbDocsAvailableForLink.length && kbDocCatalogTree.length"
            style="font-size: 11px; color: var(--text-tertiary, #94a3b8); margin-top: 6px"
          >
            知识库中的文档均已加入站点；删除站点内页面后可再次关联。
          </div>
          <div
            v-if="!loadingKb && !kbDocCatalogTree.length"
            style="font-size: 11px; color: var(--text-tertiary, #94a3b8); margin-top: 6px"
          >
            请点击工具栏「同步知识库目录」拉取文档列表。
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">
          <label class="np-check">
            <input v-model="np.addToNav" type="checkbox"> 同时添加到导航栏
          </label>
          <label class="np-check">
            <input v-model="np.addToSide" type="checkbox"> 同时添加到菜单树
          </label>
        </div>
        <div class="modal-ft">
          <button class="btn" @click="showNewPage = false">取消</button>
          <button class="btn btn-acc" @click="confirmNewPage">添加</button>
        </div>
      </div>
    </div>

    <div class="modal-bg" v-if="showSiteCfgHistory" @click.self="showSiteCfgHistory = false">
      <div class="modal" style="width: 720px; max-width: 92vw;">
        <div class="modal-t">站点配置历史</div>
        <div style="font-size:12px;color:#64748b;margin:6px 0 10px;">
          保存/发布/取消发布/回滚都会记录。可将任意快照回滚到草稿。
        </div>
        <div style="display:flex;gap:12px;align-items:center;margin:0 0 10px;">
          <label class="np-check">
            <input v-model="historyOnlyFailed" type="checkbox"> 只看失败
          </label>
          <label class="np-check">
            <input v-model="historyOnlyPublishRelated" type="checkbox"> 只看发布相关
          </label>
        </div>
        <div style="max-height: 360px; overflow:auto; border:1px solid #e2e8f0; border-radius:10px;">
          <div
            v-for="h in pagedSiteCfgHistory"
            :key="h.id"
            style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #f1f5f9;"
          >
            <span class="sv" style="min-width:72px;">{{ prettyHistoryAction(h.action) }}</span>
            <span :style="{ color: h.success ? '#16a34a' : '#dc2626', fontSize: '12px' }">{{ h.success ? '成功' : '失败' }}</span>
            <span style="font-size:12px;color:#64748b;">{{ prettyHistoryTime(h.createdAt) }}</span>
            <span style="font-size:12px;color:#64748b;">{{ prettyHistoryStage(h.stage) }}</span>
            <span v-if="h.errorMessage" style="font-size:12px;color:#dc2626;">{{ h.errorMessage }}</span>
            <button
              v-if="canRollbackFromHistory(h)"
              class="btn"
              style="margin-left:auto;"
              @click="rollbackToDraft(h.id)"
            >
              回滚到草稿
            </button>
          </div>
          <div v-if="!pagedSiteCfgHistory.length" style="padding:18px;text-align:center;color:#94a3b8;">暂无历史</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;margin-top:10px;">
          <span style="font-size:12px;color:#64748b;">第 {{ historyPage }} / {{ historyTotalPages }} 页</span>
          <button class="btn" :disabled="historyPage <= 1" @click="historyPage--">上一页</button>
          <button class="btn" :disabled="historyPage >= historyTotalPages" @click="historyPage++">下一页</button>
        </div>
        <div class="modal-ft">
          <button class="btn" @click="showSiteCfgHistory = false">关闭</button>
        </div>
      </div>
    </div>

    <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
  </div>
</template>

  <script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch, toRaw, inject } from 'vue'
import { useDialog } from 'naive-ui'
import { useMessage, useRoute } from '@keqi.gress/plugin-bridge'
import { PageHeader } from '@keqi.gress/plugin-ui'
import type {
  NavbarLinkItem,
  PageSeoConfig,
  SidebarMenuNode,
  SiteRendererConfig,
  SiteSeoConfig,
  SlotComponentInstance,
  ThemeLayoutId,
} from '../types/siteRenderer'
import type { Component } from 'vue'
import { listExtensions } from '../components/site-renderer/extensions/extensionRegistry'
import { initBuiltinExtensions } from '../components/site-renderer/extensions/builtinExtensions'
import { initBuiltinSlotComponents } from '../components/site-renderer/slotRegistry'
import KbVisualSidebarTreeRows from '../components/site-visual-builder/KbVisualSidebarTreeRows.vue'
import type { SidebarBuilderNode } from '../components/site-visual-builder/KbVisualSidebarTreeRows.vue'
import type { KbDoc } from '../types/kb'
import KbSitePreview from './KbSitePreview.vue'
import { sidebarTreeMapKeysForLookup } from '../utils/siteRenderer'
import { kbApi } from '../api/kb'
import type { KbTreeNode } from '../types/kb'
import AuthNavbarPanel from '../components/site-renderer/extensions/panels/AuthNavbarPanel.vue'
import DocCommentsPanel from '../components/site-renderer/extensions/panels/DocCommentsPanel.vue'

const message = useMessage()
const dialog = useDialog()
const route = useRoute()

// 确保内置 slots / extensions 已注册（构建器内需要读取 schema 清单）
initBuiltinSlotComponents()
initBuiltinExtensions()

// 内置扩展面板：通过 shared registry 暴露给构建器（与 SystemSettings.vue 相同模式）
;(window as any).__gress_shared_extension_panels__ = (window as any).__gress_shared_extension_panels__ || {}

// 宿主共享组件注册表 getter（与 gress-plugin-codegen/SystemSettings.vue 同款模式）
const SHARED_GET_REGISTRY_KEY = 'sharedComponentsGetRegistry'
const sharedGetRegistry = inject<((category: string) => Record<string, Component>) | undefined>(
  SHARED_GET_REGISTRY_KEY,
  undefined
)

// 如果宿主没有提供 shared registry，我们在构建器内提供一个最小 fallback（仅用于内置面板）
const FALLBACK_PANEL_CATEGORY = 'site-renderer.extension-panel'
function fallbackGetRegistry(category: string): Record<string, Component> {
  if (category !== FALLBACK_PANEL_CATEGORY) return {}
  return {
    AuthNavbarPanel,
    DocCommentsPanel,
  }
}
const siteKey = computed(() => {
  const fromParam = route.value.params?.siteKey
  if (typeof fromParam === 'string' && fromParam.trim()) return fromParam.trim()
  const raw = route.value.query?.siteKey
  return typeof raw === 'string' && raw.trim() ? raw.trim() : ''
})

const VISUAL_BUILDER_STORAGE_KEY = 'gress-kb-visual-builder-state-v1'

function getVisualStorageKey(): string {
  // 按 siteKey 维度隔离站点编辑状态；无 siteKey 时退回全局 demo key
  return siteKey.value ? `${VISUAL_BUILDER_STORAGE_KEY}:${siteKey.value}` : VISUAL_BUILDER_STORAGE_KEY
}

type ConfigModalTab = 'navbar' | 'sidebar' | 'content' | 'footer' | 'theme' | 'slots' | 'extensions' | 'page' | 'seo' | 'pages'

/** 与 gress-site-builder_3.html 一致的清单（slots 与注册表对齐） */
const THEME_MANIFESTS = [
  {
    id: 'docs' as ThemeLayoutId,
    name: '文档站',
    desc: '侧边栏+内容+TOC',
    preview: '📄',
    regions: ['navbar', 'sidebar', 'content', 'footer'],
    slots: ['sidebar-top', 'content-top'],
  },
  {
    id: 'blog' as ThemeLayoutId,
    name: '博客',
    desc: '居中单栏无侧边栏',
    preview: '✍️',
    regions: ['navbar', 'content', 'footer'],
    slots: ['content-top'],
  },
  {
    id: 'landing' as ThemeLayoutId,
    name: '落地页',
    desc: '全宽Hero+功能区',
    preview: '🚀',
    regions: ['navbar', 'hero', 'features', 'footer'],
    slots: ['content-top'],
  },
]

interface BuilderPage {
  id: string
  /** 来源于 kb 文档树时保留 docId，便于后续扩展到真实发布/跳转（JSON 可能为字符串） */
  docId?: number | string
  source?: 'kb-doc' | 'manual'
  status?: 'DRAFT' | 'PUBLISHED' | string
  title: string
  slug: string
  type: 'doc' | 'home' | 'blog' | 'api' | 'custom'
  parentId: string
  order: number
  description: string
  seo?: PageSeoConfig
}

/** 本地草稿可能丢 docId，页面 id 仍为 doc-{numericId} 时可还原；JSON 导入时 docId 可能为字符串 */
function resolveKbDocId(p: BuilderPage): number | undefined {
  if (typeof p.docId === 'number' && !Number.isNaN(p.docId)) return p.docId
  if (typeof p.docId === 'string' && /^\d+$/.test(p.docId.trim())) return Number(p.docId.trim())
  const m = /^doc-(\d+)$/.exec(p.id)
  return m ? Number(m[1]) : undefined
}

function normalizeBuilderPageDocId(p: BuilderPage) {
  if (typeof p.docId === 'string' && /^\d+$/.test(p.docId.trim())) {
    p.docId = Number(p.docId.trim())
    return
  }
  if (p.docId === undefined || typeof p.docId === 'number') return
  const m = /^doc-(\d+)$/.exec(p.id)
  if (m) p.docId = Number(m[1])
}

type SidebarTreeData = Array<{
  id: string
  groupLabel: string
  label: string
  icon: string
  expanded?: boolean
  children: SidebarBuilderNode[]
}>

interface BuilderCfg {
  themeId: ThemeLayoutId
  theme: { primary: string; dark: boolean; font: string }
  navbar: {
    brand: string
    style: 'solid' | 'blur' | 'transparent'
    showSearch: boolean
    sticky: boolean
    links: Array<{
      id: string
      label: string
      icon: string
      type: 'link' | 'dropdown' | 'external'
      pageId: string | null
      href: string
      /** 仅 external 类型 */
      externalOpen?: 'same' | 'blank'
      children?: Array<{
        id: string
        label: string
        icon: string
        type: 'link' | 'external'
        pageId: string | null
        href: string
        externalOpen: 'same' | 'blank'
      }>
    }>
  }
  sidebar: {
    width: number
    collapsible: boolean
    tree: SidebarTreeData
  }
  content: { maxWidth: string; showToc: boolean }
  footer: { visible: boolean; copyright: string; links: Array<{ label: string; href?: string }> }
  slots: Record<string, SlotComponentInstance | null | undefined>
  extensions?: SiteRendererConfig['extensions']
  landingExtras?: SiteRendererConfig['landingConfig']
  /** 每个导航项 id → 独立侧栏菜单树（预览随当前选中导航切换） */
  sidebarTreesByNavId?: Record<string, SidebarTreeData>
  seo?: SiteSeoConfig
}

const pages = reactive<BuilderPage[]>([
  { id: 'home', title: '首页', slug: '/', type: 'home', parentId: '', order: 0, description: 'Gress 平台首页' },
  { id: 'gs', title: '快速开始', slug: '/docs/getting-started', type: 'doc', parentId: '', order: 1, description: '五分钟完成安装和配置' },
  { id: 'install', title: '安装配置', slug: '/docs/installation', type: 'doc', parentId: 'gs', order: 2, description: '' },
  { id: 'plugin', title: '插件系统', slug: '/docs/plugin-system', type: 'doc', parentId: '', order: 3, description: 'ClassLoader 隔离机制详解' },
  { id: 'lifecycle', title: '生命周期', slug: '/docs/lifecycle', type: 'doc', parentId: 'plugin', order: 4, description: '' },
  { id: 'export', title: '@PluginExport', slug: '/docs/plugin-export', type: 'doc', parentId: 'plugin', order: 5, description: '' },
  { id: 'theme-sys', title: '主题系统', slug: '/docs/theme-system', type: 'doc', parentId: '', order: 6, description: 'ThemeManifest 设计规范' },
  { id: 'api-rest', title: 'REST API', slug: '/api/rest', type: 'api', parentId: '', order: 7, description: '' },
  { id: 'blog1', title: '插件架构深解', slug: '/blog/plugin-arch', type: 'blog', parentId: '', order: 8, description: '深入理解 ClassLoader 隔离' },
])

function mapKbType(slug: string): BuilderPage['type'] {
  if (slug === '/' || slug === '') return 'home'
  if (slug.startsWith('/blog')) return 'blog'
  if (slug.startsWith('/api')) return 'api'
  return 'doc'
}

function flattenKbTree(nodes: KbTreeNode[], parentId = ''): BuilderPage[] {
  const out: BuilderPage[] = []
  for (const n of nodes) {
    const id = `doc-${n.id}`
    const page: BuilderPage = {
      id,
      docId: n.id,
      source: 'kb-doc',
      status: n.status,
      title: n.title || `文档 ${n.id}`,
      slug: n.slug || `/docs/${n.id}`,
      type: mapKbType(n.slug || ''),
      parentId,
      order: out.length,
      description: '',
    }
    out.push(page)
    if (n.children?.length) out.push(...flattenKbTree(n.children, id))
  }
  return out
}

function isValidPageId(pid: string | null | undefined, pageIdSet: Set<string>): boolean {
  return !!pid && pageIdSet.has(pid)
}

function remapBuilderNodeIds(n: SidebarBuilderNode, suf: string): SidebarBuilderNode {
  return {
    ...n,
    id: n.id + suf,
    children: n.children?.map((c) => remapBuilderNodeIds(c, suf)),
  }
}

/** 为每套侧栏树追加导航 id 后缀，避免多份拷贝之间节点 id 冲突 */
function remapTreeIds(tree: SidebarTreeData, navId: string): SidebarTreeData {
  const suf = '__' + navId.replace(/[^a-zA-Z0-9]/g, '_')
  return tree.map((sec) => ({
    ...sec,
    id: sec.id + suf,
    children: sec.children.map((ch) => remapBuilderNodeIds(ch, suf)),
  }))
}

function defaultSidebarTemplate(): SidebarTreeData {
  if (cfg.sidebar.tree?.length) return JSON.parse(JSON.stringify(cfg.sidebar.tree))
  return [
    {
      id: 'sg-default',
      groupLabel: '菜单',
      label: '菜单',
      icon: '📚',
      expanded: true,
      children: [],
    },
  ]
}

/** 可绑定侧栏菜单树的导航节点：自身未关联页面（顶层或下拉子项） */
function collectSidebarHostNavIds(): string[] {
  const ids: string[] = []
  for (const l of cfg.navbar.links) {
    if (!l.pageId) ids.push(l.id)
    if (l.type === 'dropdown' && l.children?.length) {
      for (const c of l.children) {
        if (!c.pageId) ids.push(c.id)
      }
    }
  }
  return ids
}

/** 侧栏宿主解析与 utils 中 sidebarTreeMapKeysForLookup 一致（当前高亮 id → 父级 id）。 */

function getNavbarItemById(navItemId: string): { pageId: string | null } | null {
  for (const l of cfg.navbar.links) {
    if (l.id === navItemId) return l
    const ch = l.children?.find((c) => c.id === navItemId)
    if (ch) return ch
  }
  return null
}

function walkSidebarBuilderNodes(
  nodes: SidebarBuilderNode[] | undefined,
  fn: (n: SidebarBuilderNode) => void
) {
  if (!nodes) return
  for (const n of nodes) {
    fn(n)
    walkSidebarBuilderNodes(n.children, fn)
  }
}

function firstPageIdInSubtree(nodes: SidebarBuilderNode[] | undefined): string | null {
  if (!nodes) return null
  for (const n of nodes) {
    if (n.pageId && getPage(n.pageId)) return n.pageId
    const d = firstPageIdInSubtree(n.children)
    if (d) return d
  }
  return null
}

/** 侧栏树自上而下第一个可跳转的 pageId */
function firstPageIdInSidebarTree(tree: SidebarTreeData): string | null {
  for (const sec of tree) {
    const d = firstPageIdInSubtree(sec.children)
    if (d) return d
  }
  return null
}

/**
 * 切换顶栏后：有绑定页面用绑定页；无绑定但当前导航有菜单树时，打开树中第一项（避免仍停留在上一导航如「新链接」的正文）。
 */
function syncActivePageForNavContext(rawNavId: string) {
  if (!rawNavId) return
  const navItem = getNavbarItemById(rawNavId)
  if (navItem?.pageId && getPage(navItem.pageId)) {
    activePage.value = navItem.pageId
    return
  }
  ensurePerNavSidebars()
  const map = cfg.sidebarTreesByNavId!
  let tree: SidebarTreeData | undefined
  for (const k of sidebarTreeMapKeysForLookup(cfg.navbar.links as NavbarLinkItem[], rawNavId)) {
    if (Object.prototype.hasOwnProperty.call(map, k)) {
      tree = map[k]
      break
    }
  }
  const hasTree = tree?.some((sec) => (sec.children?.length ?? 0) > 0)
  if (!hasTree || !tree) return
  const firstPid = firstPageIdInSidebarTree(tree)
  if (firstPid) activePage.value = firstPid
}

function ensurePerNavSidebars() {
  if (!cfg.sidebarTreesByNavId) cfg.sidebarTreesByNavId = {}
  const map = cfg.sidebarTreesByNavId
  const hostIds = collectSidebarHostNavIds()
  if (!hostIds.length) {
    for (const k of Object.keys(map)) delete map[k]
    return
  }

  if (Object.keys(map).length === 0) {
    for (const id of hostIds) {
      map[id] = []
    }
    return
  }

  for (const id of hostIds) {
    if (!Object.prototype.hasOwnProperty.call(map, id)) {
      map[id] = []
    }
  }
  for (const k of Object.keys(map)) {
    if (!hostIds.includes(k)) delete map[k]
  }
}

function normalizeBindings() {
  const pageIdSet = new Set(pages.map((p) => p.id))
  cfg.navbar.links.forEach((l) => {
    if ((l as { type?: string }).type === 'cta') l.type = 'link'
    if (!l.children) l.children = []
    if (!isValidPageId(l.pageId, pageIdSet)) l.pageId = null
    if (l.pageId) {
      const p = getPage(l.pageId)
      if (p) l.href = p.slug
    }
    l.children.forEach((c) => {
      if (!isValidPageId(c.pageId, pageIdSet)) c.pageId = null
      if (c.pageId) {
        const p = getPage(c.pageId)
        if (p) c.href = p.slug
      }
      if (!c.externalOpen) c.externalOpen = 'blank'
    })
    if (l.type === 'external' && l.externalOpen !== 'same') l.externalOpen = 'blank'
  })
  ensurePerNavSidebars()
  const map = cfg.sidebarTreesByNavId!
  for (const tree of Object.values(map)) {
    tree.forEach((sec) =>
      walkSidebarBuilderNodes(sec.children, (it) => {
        if (!isValidPageId(it.pageId, pageIdSet)) it.pageId = null
      })
    )
  }
}

/** 导航、侧栏里出现的 pageId（含 doc-*） */
function collectReferencedPageIds(): Set<string> {
  const s = new Set<string>()
  for (const l of cfg.navbar.links) {
    if (l.pageId) s.add(l.pageId)
    l.children?.forEach((c) => {
      if (c.pageId) s.add(c.pageId)
    })
  }
  const trees: SidebarTreeData[] = []
  if (cfg.sidebar.tree?.length) trees.push(cfg.sidebar.tree)
  if (cfg.sidebarTreesByNavId) {
    for (const t of Object.values(cfg.sidebarTreesByNavId)) {
      if (t?.length) trees.push(t)
    }
  }
  for (const tree of trees) {
    for (const sec of tree) {
      walkSidebarBuilderNodes(sec.children, (n) => {
        if (n.pageId) s.add(n.pageId)
      })
    }
  }
  return s
}

const cfg = reactive<BuilderCfg>({
  themeId: 'docs',
  theme: { primary: '#4d8ef5', dark: false, font: 'DM Sans' },
  navbar: {
    brand: 'Gress Wiki',
    style: 'solid',
    showSearch: true,
    sticky: true,
    links: [
      { id: 'n1', label: '文档', icon: '', type: 'link', pageId: 'gs', href: '/docs/getting-started', children: [] },
      { id: 'n2', label: '插件市场', icon: '', type: 'link', pageId: null, href: '/plugins', children: [] },
      { id: 'n3', label: '博客', icon: '', type: 'link', pageId: 'blog1', href: '/blog/plugin-arch', children: [] },
      {
        id: 'n4',
        label: 'API',
        icon: '🔌',
        type: 'dropdown',
        pageId: null,
        href: '',
        children: [
          {
            id: 'n4a1',
            label: 'REST API',
            icon: '🔌',
            type: 'link',
            pageId: 'api-rest',
            href: '/api/rest',
            externalOpen: 'blank',
          },
        ],
      },
      { id: 'n5', label: '开始使用', icon: '🚀', type: 'link', pageId: 'gs', href: '/docs/getting-started', children: [] },
    ],
  },
  sidebar: {
    width: 240,
    collapsible: true,
    tree: [
      {
        id: 'sg1',
        groupLabel: '入门指南',
        label: '入门指南',
        icon: '📚',
        expanded: true,
        children: [
          { id: 'si1', label: '快速开始', icon: '🚀', pageId: 'gs', badge: 'NEW' },
          { id: 'si2', label: '安装配置', icon: '⚙️', pageId: 'install', badge: '' },
        ],
      },
      {
        id: 'sg2',
        groupLabel: '核心概念',
        label: '核心概念',
        icon: '🔧',
        expanded: true,
        children: [
          { id: 'si3', label: '插件系统', icon: '🧩', pageId: 'plugin', badge: '' },
          { id: 'si4', label: '生命周期', icon: '♻️', pageId: 'lifecycle', badge: 'NEW' },
          { id: 'si5', label: '@PluginExport', icon: '🔒', pageId: 'export', badge: 'Beta' },
          { id: 'si6', label: '主题系统', icon: '🎨', pageId: 'theme-sys', badge: '' },
        ],
      },
      {
        id: 'sg3',
        groupLabel: 'API 参考',
        label: 'API 参考',
        icon: '🔌',
        expanded: true,
        children: [{ id: 'si7', label: 'REST API', icon: '🔌', pageId: 'api-rest', badge: '' }],
      },
    ],
  },
  content: { maxWidth: '760px', showToc: true },
  footer: {
    visible: true,
    copyright: '© 2025 Gress Platform',
    links: [{ label: 'GitHub' }, { label: '文档' }, { label: '隐私' }],
  },
  slots: {
    'sidebar-top': {
      instanceId: 's1',
      componentKey: 'AdBanner',
      props: { icon: '🎉', text: 'Gress v2.0 发布', subtext: '查看新特性', bg: '#fff7ed', color: '#92400e', closable: true },
    },
    'content-top': {
      instanceId: 's2',
      componentKey: 'Announcement',
      props: {
        badge: 'NEW',
        title: '主题系统上线',
        text: '可视化切换主题',
        linkText: '了解',
        bg: '#eff6ff',
        color: '#1d4ed8',
        closable: true,
      },
    },
  },
  extensions: [],
  landingExtras: {
    badgeText: 'v2.0 发布',
    heroTitle: '',
    heroSubtitle: '',
    actions: [
      { id: 'start', label: '🚀 开始使用', type: 'primary' },
      { id: 'github', label: '⭐ GitHub', type: 'secondary' },
    ],
    features: [
      { icon: '🧩', name: '插件市场', desc: '企业级插件生态。', color: '#f0fdf4' },
      { icon: '🎨', name: '可视化构建', desc: '拖拽配置导航与菜单。', color: '#eff6ff' },
    ],
  },
  seo: {
    siteName: '',
    titleTemplate: '{title} · {siteName}',
    defaultDescription: '',
    defaultOgImage: '',
    faviconUrl: '',
    twitterSite: '',
  },
})

const sel = ref<string | null>(null)
const selNavItem = ref<number | null>(null)
const selNavSubIdx = ref<number | null>(null)
const selTreeNode = ref<string | null>(null)

watch(selNavItem, () => {
  selNavSubIdx.value = null
})
const configDrawerOpen = ref(false)
const configTab = ref<ConfigModalTab>('content')
const modalSlotKey = ref('sidebar-top')
const loadingKb = ref(false)
/** 初始化完成后才启用「未绑定项」弹窗，避免加载配置时误触发 */
const unboundDialogEnabled = ref(false)
const unboundPopoverOpen = ref(false)

const UNBOUND_NAV_LIMIT = 25
const UNBOUND_LEAF_LIMIT = 25
/** 知识库 tree 快照，仅用于「从文档库添加页面」等关联选择，不自动写入站点 pages/侧栏 */
const kbDocCatalogTree = ref<KbTreeNode[]>([])
const device = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const activePage = ref('gs')
const activeNav = ref('n1')
/** 抽屉「菜单树」里正在编辑的导航项（与预览 activeNav 同步）；仅可为「未关联页面」的导航节点 */
const sidebarEditNavId = ref('n2')
const showNewPage = ref(false)
const showSiteCfgHistory = ref(false)
const historyOnlyFailed = ref(false)
const historyOnlyPublishRelated = ref(false)
const historyPage = ref(1)
const historyPageSize = ref(20)
const siteCfgStatus = reactive({
  version: 0,
  hasDraft: false,
  hasPublished: false,
  publishedAt: '',
  updatedAt: '',
})
const siteCfgHistory = ref<Array<{
  id: number
  action: string
  stage?: string
  success: number
  errorMessage?: string
  createdAt?: string
}>>([])
const filteredSiteCfgHistory = computed(() =>
  siteCfgHistory.value.filter((h) => {
    if (historyOnlyFailed.value && h.success !== 0) return false
    if (historyOnlyPublishRelated.value) {
      const a = String(h.action || '').toUpperCase()
      if (!['PUBLISH', 'UNPUBLISH', 'ROLLBACK'].includes(a)) return false
    }
    return true
  })
)
const historyTotalPages = computed(() => Math.max(1, Math.ceil(filteredSiteCfgHistory.value.length / historyPageSize.value)))
const pagedSiteCfgHistory = computed(() => {
  const p = Math.min(Math.max(1, historyPage.value), historyTotalPages.value)
  const start = (p - 1) * historyPageSize.value
  return filteredSiteCfgHistory.value.slice(start, start + historyPageSize.value)
})
watch(filteredSiteCfgHistory, () => {
  if (historyPage.value > historyTotalPages.value) historyPage.value = historyTotalPages.value
  if (historyPage.value < 1) historyPage.value = 1
})
const toastShow = ref(false)
const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

const DEFAULT_SITE_SEO: SiteSeoConfig = {
  siteName: '',
  titleTemplate: '{title} · {siteName}',
  defaultDescription: '',
  defaultOgImage: '',
  faviconUrl: '',
  twitterSite: '',
}

function ensureCfgSeo() {
  if (!cfg.seo) {
    cfg.seo = { ...DEFAULT_SITE_SEO }
    return
  }
  const s = cfg.seo
  for (const key of Object.keys(DEFAULT_SITE_SEO) as (keyof SiteSeoConfig)[]) {
    if (s[key] === undefined) s[key] = DEFAULT_SITE_SEO[key]
  }
}

watch(activePage, (id) => {
  const p = pages.find((x) => x.id === id)
  if (p && p.seo === undefined) p.seo = {}
})

const pagesSorted = computed(() =>
  [...pages].sort((a, b) => (a.order !== b.order ? a.order - b.order : a.id.localeCompare(b.id)))
)

function normalizePageOrders() {
  const list = [...pages].sort((a, b) => (a.order !== b.order ? a.order - b.order : a.id.localeCompare(b.id)))
  list.forEach((x, i) => {
    x.order = i
  })
}

function movePageInSortedList(sortedIndex: number, delta: number) {
  const list = pagesSorted.value
  const j = sortedIndex + delta
  if (j < 0 || j >= list.length) return
  const oa = list[sortedIndex].order
  const ob = list[j].order
  list[sortedIndex].order = ob
  list[j].order = oa
  normalizePageOrders()
}

function onPageOrderInput(p: BuilderPage, raw: string) {
  const n = Number(raw)
  if (Number.isNaN(n)) return
  p.order = Math.max(0, Math.floor(n))
  normalizePageOrders()
}

function ensurePageSeoMutable(p: BuilderPage): PageSeoConfig {
  if (!p.seo) p.seo = {}
  return p.seo
}

function togglePageNoindex(p: BuilderPage) {
  const s = ensurePageSeoMutable(p)
  s.noindex = !s.noindex
}

function pickPageSeoForExport(p: BuilderPage): PageSeoConfig | undefined {
  const s = p.seo
  if (!s) return undefined
  const o: PageSeoConfig = {}
  if (s.metaTitle?.trim()) o.metaTitle = s.metaTitle.trim()
  if (s.metaDescription?.trim()) o.metaDescription = s.metaDescription.trim()
  if (s.ogImage?.trim()) o.ogImage = s.ogImage.trim()
  if (s.canonical?.trim()) o.canonical = s.canonical.trim()
  if (s.noindex === true) o.noindex = true
  return Object.keys(o).length ? o : undefined
}

function effectiveSiteNameForSeo(): string {
  return (cfg.seo?.siteName?.trim() || cfg.navbar.brand || 'Site').trim()
}

function previewDocumentTitle(p: BuilderPage): string {
  const title = p.seo?.metaTitle?.trim() || p.title
  const tpl = cfg.seo?.titleTemplate?.trim() || '{title} · {siteName}'
  return tpl.replace(/\{title\}/g, title).replace(/\{siteName\}/g, effectiveSiteNameForSeo())
}

const np = reactive({
  pageId: '',
  addToNav: false,
  addToSide: false,
})

const devices = [
  { id: 'desktop' as const, icon: '🖥' },
  { id: 'tablet' as const, icon: '📱' },
  { id: 'mobile' as const, icon: '📲' },
]

const hist = ref<string[]>([])
const histIdx = ref(0)
let histLock = false
let histTimer: ReturnType<typeof setTimeout> | null = null

const activeManifest = computed(() => THEME_MANIFESTS.find((m) => m.id === cfg.themeId) || THEME_MANIFESTS[0])

const activeSlots = computed(() =>
  (activeManifest.value.slots || []).map((key) => ({
    key,
    label:
      ({ 'sidebar-top': '侧边栏顶部', 'sidebar-bottom': '侧边栏底部', 'content-top': '内容区顶部', 'page-footer': '页面页脚' } as Record<string, string>)[key] ||
      key,
  }))
)

watch(
  activeSlots,
  (slots) => {
    if (!slots.length) return
    if (!slots.some((s) => s.key === modalSlotKey.value)) modalSlotKey.value = slots[0].key
  },
  { immediate: true }
)

const editingSidebarTree = computed(() => {
  ensurePerNavSidebars()
  const id = sidebarEditNavId.value || ''
  if (!id) return cfg.sidebar.tree
  const t = cfg.sidebarTreesByNavId![id]
  return t || []
})

function findNavNodeLabel(id: string): string {
  for (const l of cfg.navbar.links) {
    if (l.id === id) return l.label
    const ch = l.children?.find((c) => c.id === id)
    if (ch) return `${l.label} / ${ch.label}`
  }
  return '—'
}

function hasSidebarTreeBinding(navId: string): boolean {
  const tree = cfg.sidebarTreesByNavId?.[navId]
  if (!tree?.length) return false
  return tree.some((sec) => (sec.children?.length ?? 0) > 0)
}

function isEmptyNavSlot(navId: string, pageId?: string | null, hasChildren = false): boolean {
  // 下拉父级只作为容器且已有子项时，不视作“空导航项”
  if (hasChildren) return false
  return !pageId && !hasSidebarTreeBinding(navId)
}

type UnboundNavItem = { id: string; label: string; type: string }
type UnboundSidebarLeafItem = {
  navHostId: string
  navHostLabel: string
  groupLabel: string
  nodeId: string
  nodeLabel: string
}

function collectUnboundNavItems(): UnboundNavItem[] {
  const out: UnboundNavItem[] = []
  for (const l of cfg.navbar.links) {
    if (isEmptyNavSlot(l.id, l.pageId, l.type === 'dropdown' && !!l.children?.length)) {
      out.push({ id: l.id, label: l.label, type: l.type })
    }
    if (l.type === 'dropdown' && l.children?.length) {
      for (const c of l.children) {
        if (isEmptyNavSlot(c.id, c.pageId)) {
          out.push({ id: c.id, label: c.label, type: c.type })
        }
      }
    }
  }
  return out
}

function collectUnboundSidebarLeafItems(): UnboundSidebarLeafItem[] {
  const out: UnboundSidebarLeafItem[] = []

  const addTree = (navHostId: string, tree: SidebarTreeData | undefined) => {
    if (!tree?.length) return
    const navHostLabel = navHostId ? findNavNodeLabel(navHostId) : '主侧栏'
    for (const sec of tree) {
      const groupLabel = sec.groupLabel || sec.label || '菜单'

      const walk = (nodes: SidebarBuilderNode[] | undefined) => {
        if (!nodes?.length) return
        for (const n of nodes) {
          const isLeaf = !(n.children?.length ?? 0)
          if (isLeaf && !n.pageId) {
            out.push({
              navHostId,
              navHostLabel,
              groupLabel,
              nodeId: n.id,
              nodeLabel: n.label,
            })
          }
          walk(n.children)
        }
      }

      walk(sec.children)
    }
  }

  if (cfg.sidebarTreesByNavId && Object.keys(cfg.sidebarTreesByNavId).length) {
    for (const [navHostId, tree] of Object.entries(cfg.sidebarTreesByNavId)) {
      addTree(navHostId, tree)
    }
  } else {
    addTree('', cfg.sidebar.tree)
  }

  return out
}

function buildUnboundItemsDialogContent(clickedLabel?: string): string {
  const nav = collectUnboundNavItems()
  const leaves = collectUnboundSidebarLeafItems()

  // 列表过长时做截断，避免弹窗挤爆屏幕
  const NAV_LIMIT = 25
  const LEAF_LIMIT = 25

  const navHead = `未绑定导航项：${nav.length}`
  const leavesHead = `未绑定侧栏叶子：${leaves.length}`

  const navSlice = nav.length ? nav.slice(0, NAV_LIMIT) : []
  const leavesSlice = leaves.length ? leaves.slice(0, LEAF_LIMIT) : []

  const navLines = navSlice.length ? navSlice.map((x) => `- ${x.label}`) : ['（无）']
  const leavesLines = leavesSlice.length
    ? leavesSlice.map((x) => `- ${x.navHostLabel} / ${x.groupLabel} / ${x.nodeLabel}`)
    : ['（无）']

  const moreNav = nav.length > NAV_LIMIT ? `（仅展示前 ${NAV_LIMIT} 项）` : ''
  const moreLeaves = leaves.length > LEAF_LIMIT ? `（仅展示前 ${LEAF_LIMIT} 项）` : ''

  const header = clickedLabel ? `你点击了「${clickedLabel}」：尚未绑定页面。` : '存在未绑定页面的节点，请先完成绑定。'

  return (
    `未绑定页面提示\n` +
    `${header}\n\n` +
    `${navHead}\n${navLines.join('\n')}${moreNav}\n\n` +
    `${leavesHead}\n${leavesLines.join('\n')}${moreLeaves}\n`
  )
}

function onSidebarUnboundClick(label: string) {
  // 预览内「未绑定页面」节点点击提示仅在预览端展示；构建器这里不再弹窗
  void label
}

const unboundNavItemsAll = computed(() => collectUnboundNavItems())
const unboundSidebarLeafItemsAll = computed(() => collectUnboundSidebarLeafItems())
const unboundNavItemsShown = computed(() => unboundNavItemsAll.value.slice(0, UNBOUND_NAV_LIMIT))
const unboundSidebarLeafItemsShown = computed(() => unboundSidebarLeafItemsAll.value.slice(0, UNBOUND_LEAF_LIMIT))
const unboundNavMore = computed(() => unboundNavItemsAll.value.length > UNBOUND_NAV_LIMIT)
const unboundSidebarLeafMore = computed(() => unboundSidebarLeafItemsAll.value.length > UNBOUND_LEAF_LIMIT)

const globalUnboundNavCount = computed(() => {
  let navCount = 0
  const emptyNavIds = new Set<string>()
  for (const l of cfg.navbar.links) {
    if (isEmptyNavSlot(l.id, l.pageId, l.type === 'dropdown' && !!l.children?.length)) {
      navCount += 1
      emptyNavIds.add(l.id)
    }
    if (l.type === 'dropdown' && l.children?.length) {
      for (const c of l.children) {
        if (isEmptyNavSlot(c.id, c.pageId)) {
          navCount += 1
          emptyNavIds.add(c.id)
        }
      }
    }
  }

  const countUnboundLeaves = (tree: SidebarTreeData | undefined): number => {
    if (!tree?.length) return 0
    let c = 0
    for (const sec of tree) {
      walkSidebarBuilderNodes(sec.children, (n) => {
        if (!(n.children?.length) && !n.pageId) c += 1
      })
    }
    return c
  }

  let sidebarCount = 0
  if (cfg.sidebarTreesByNavId && Object.keys(cfg.sidebarTreesByNavId).length) {
    for (const [navId, tree] of Object.entries(cfg.sidebarTreesByNavId)) {
      // 导航已记为“空导航项”时，不再重复累计其侧栏叶子未绑定，避免 +2 体感
      if (emptyNavIds.has(navId)) continue
      sidebarCount += countUnboundLeaves(tree)
    }
  } else {
    sidebarCount += countUnboundLeaves(cfg.sidebar.tree)
  }
  return navCount + sidebarCount
})

const sidebarNavTreeOptions = computed(() => {
  const out: { value: string; label: string }[] = []
  for (const l of cfg.navbar.links) {
    if (!l.pageId) {
      out.push({ value: l.id, label: `${l.icon ? l.icon + ' ' : ''}${l.label}（顶层）` })
    }
    if (l.type === 'dropdown' && l.children?.length) {
      for (const c of l.children) {
        if (!c.pageId) {
          out.push({
            value: c.id,
            label: `　└ ${c.icon ? c.icon + ' ' : ''}${c.label}（${l.label} 下）`,
          })
        }
      }
    }
  }
  return out
})

const sidebarCtxLabel = computed(() => findNavNodeLabel(sidebarEditNavId.value || activeNav.value))

const navEditorSidebarHostId = computed(() => {
  if (selNavItem.value === null) return null
  const top = cfg.navbar.links[selNavItem.value]
  if (!top) return null
  if (selNavSubIdx.value !== null && top.children?.[selNavSubIdx.value]) {
    const ch = top.children[selNavSubIdx.value]
    return ch.pageId ? null : ch.id
  }
  return top.pageId ? null : top.id
})

const navEditorSidebarSectionCount = computed(() => {
  const id = navEditorSidebarHostId.value
  if (!id || !cfg.sidebarTreesByNavId?.[id]) return 0
  return cfg.sidebarTreesByNavId[id].length
})

watch(
  () => cfg.navbar.links,
  () => {
    ensurePerNavSidebars()
    const opts = sidebarNavTreeOptions.value
    if (opts.length && !opts.some((o) => o.value === sidebarEditNavId.value)) {
      sidebarEditNavId.value = opts[0].value
    }
  },
  { deep: true }
)

function getEditingSidebarTreeArr(): SidebarTreeData {
  ensurePerNavSidebars()
  const id = sidebarEditNavId.value || ''
  if (!id) return cfg.sidebar.tree
  const t = cfg.sidebarTreesByNavId![id]
  return t || []
}

watch(activeNav, (navId) => {
  if (configDrawerOpen.value && configTab.value === 'sidebar') {
    const hosts = collectSidebarHostNavIds()
    sidebarEditNavId.value = hosts.includes(navId) ? navId : hosts[0] || sidebarEditNavId.value
    selTreeNode.value = null
  }
  void nextTick(() => {
    syncActivePageForNavContext(navId)
  })
})

watch(configTab, (t) => {
  if (t === 'sidebar' && configDrawerOpen.value) {
    ensurePerNavSidebars()
    const hosts = collectSidebarHostNavIds()
    sidebarEditNavId.value = hosts.includes(activeNav.value) ? activeNav.value : hosts[0] || sidebarEditNavId.value
    selTreeNode.value = null
  }
})

const kbCatalogFlat = computed(() => flattenKbTree(kbDocCatalogTree.value))

/** 知识库中有、但尚未加入站点 pages 的文档（用于关联到导航/侧栏） */
const kbDocsAvailableForLink = computed(() => {
  const linkedDocIds = new Set<number>()
  for (const p of pages) {
    const d = resolveKbDocId(p)
    if (d !== undefined) linkedDocIds.add(d)
  }
  return kbCatalogFlat.value.filter((c) => typeof c.docId === 'number' && !linkedDocIds.has(c.docId))
})

/** 已在站点 pages 中的 id 集合之外的知识库页（用于「关联页面」下拉展示 kbDocCatalogTree） */
const kbCatalogOnlyPages = computed(() => {
  const ids = new Set(pages.map((p) => p.id))
  return kbCatalogFlat.value.filter((c) => !ids.has(c.id))
})

/**
 * 配置里导航/侧栏已关联 doc-*，但 pages 中缺失时补全（先目录快照，否则 getDoc），
 * 否则预览 activePage 指向 doc-* 时 pageMap 无数据 → 正文「暂无内容」。
 */
function removePageAndUnbind(pageId: string) {
  // 1) 从 pages 中移除
  const idx = pages.findIndex((p) => p.id === pageId)
  if (idx > -1) pages.splice(idx, 1)
  // 2) 清理 navbar/sidebar 中对该 pageId 的引用
  cfg.navbar.links.forEach((l) => {
    if (l.pageId === pageId) l.pageId = null
    l.children?.forEach((c) => {
      if (c.pageId === pageId) c.pageId = null
    })
  })
  if (cfg.sidebar.tree?.length) {
    cfg.sidebar.tree.forEach((sec) =>
      walkSidebarBuilderNodes(sec.children, (n) => {
        if (n.pageId === pageId) n.pageId = null
      })
    )
  }
  if (cfg.sidebarTreesByNavId) {
    for (const t of Object.values(cfg.sidebarTreesByNavId)) {
      if (!t?.length) continue
      t.forEach((sec) =>
        walkSidebarBuilderNodes(sec.children, (n) => {
          if (n.pageId === pageId) n.pageId = null
        })
      )
    }
  }
}

async function reconcileKbDocPagesFromBindings() {
  // 先按目录快照裁剪：知识库已删除的文档不应继续出现在站点 pages / 下拉选择中
  // - doc-* 页面：按 pageId 判断
  // - 站点自建页面（如 draft-*）但带 docId：按 docId 判断
  const catDocPageIds = new Set(kbCatalogFlat.value.map((x) => x.id).filter((id) => /^doc-\d+$/.test(id)))
  const catDocIds = new Set(
    kbCatalogFlat.value
      .map((x) => resolveKbDocId(x))
      .filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
  )
  if (catDocPageIds.size || catDocIds.size) {
    const stale = pages.filter((p) => {
      const did = resolveKbDocId(p)
      if (did !== undefined) return !catDocIds.has(did)
      if (/^doc-\d+$/.test(p.id)) return !catDocPageIds.has(p.id)
      return false
    })
    for (const p of stale) removePageAndUnbind(p.id)
  }

  const refs = collectReferencedPageIds()
  for (const id of refs) {
    if (!/^doc-\d+$/.test(id)) continue
    if (getPage(id)) continue
    const fromCat = kbCatalogFlat.value.find((x) => x.id === id)
    const catDid = fromCat ? resolveKbDocId(fromCat) : undefined
    if (fromCat && catDid !== undefined) {
      const baseSlug = fromCat.slug || `/docs/${fromCat.id}`
      const used = new Set(pages.map((p) => p.slug).filter((s): s is string => !!s))
      let slug = baseSlug
      let idx = 2
      while (used.has(slug)) {
        slug = `${baseSlug}-${idx++}`
      }
      pages.push({
        id: fromCat.id,
        docId: catDid,
        source: 'kb-doc',
        status: fromCat.status,
        title: fromCat.title,
        slug,
        type: fromCat.type,
        parentId: '',
        order: pages.length,
        description: '',
      })
      continue
    }
    const m = /^doc-(\d+)$/.exec(id)
    if (!m) continue
    const docId = Number(m[1])
    try {
      const d = await kbApi.getDoc(docId, siteKey.value || undefined)
      const baseSlug = d.slug || `/docs/${d.id}`
      const used = new Set(pages.map((p) => p.slug).filter((s): s is string => !!s))
      let slug = baseSlug
      let idx = 2
      while (used.has(slug)) {
        slug = `${baseSlug}-${idx++}`
      }
      pages.push({
        id,
        docId: d.id,
        source: 'kb-doc',
        status: d.status,
        title: d.title || `文档 ${d.id}`,
        slug,
        type: mapKbType(d.slug || ''),
        parentId: '',
        order: pages.length,
        description: '',
      })
    } catch {
      // 文档不存在/无权：清理掉对该 doc-* 的引用，避免一直出现在下拉与提示报错
      removePageAndUnbind(id)
    }
  }
}

const devLabel = computed(() => ({ desktop: '桌面', tablet: '平板 768', mobile: '手机 390' }[device.value]))

const drawerBodyWidth = 480

const jsonSize = computed(() => JSON.stringify({ pages: toRaw(pages), cfg: toRaw(cfg) }).length)

/** 仅小号 ⚙ 可点，不遮挡预览内链接与菜单树（navbar 高度与渲染器一致） */
const RENDERER_NAV_H = 52

const navRegionFabStyle = computed(() => ({
  top: '10px',
  left: '10px',
}))

const sidebarRegionFabStyle = computed(() => ({
  top: `${RENDERER_NAV_H + 6}px`,
  left: `${Math.max(8, cfg.sidebar.width - 36)}px`,
}))

const contentRegionFabStyle = computed(() => ({
  top: `${RENDERER_NAV_H + 6}px`,
  right: '14px',
  left: 'auto',
}))

const footerRegionFabStyle = computed(() => ({
  bottom: '14px',
  right: '14px',
  top: 'auto',
  left: 'auto',
}))

const selectedPage = computed(() => getPage(activePage.value) || null)

const currentPagePreview = computed(() => getPage(activePage.value))
const currentPageSlug = computed(() => currentPagePreview.value?.slug || '')

const canvasStatusLabel = computed(() => {
  const p = getPage(activePage.value)
  if (!p?.status) return ''
  if (p.status === 'PUBLISHED') return '已发布'
  if (p.status === 'DRAFT') return '草稿'
  return String(p.status)
})

const canvasStatusTagType = computed(() => (getPage(activePage.value)?.status === 'PUBLISHED' ? 'success' : 'warning'))

const currentSlotKey = computed(() => (sel.value?.startsWith('slot:') ? sel.value.replace('slot:', '') : ''))

const colorPresets = [
  { n: '蓝', v: '#4d8ef5' },
  { n: '靛', v: '#4f46e5' },
  { n: '紫', v: '#7c3aed' },
  { n: '粉', v: '#db2777' },
  { n: '红', v: '#dc2626' },
  { n: '橙', v: '#ea580c' },
  { n: '绿', v: '#059669' },
  { n: '青', v: '#0891b2' },
]

const iconOpts = ['📄', '📁', '📚', '⚙️', '🔧', '🌟', '📊', '🔌', '☕', '🧩', '🎨', '🔒', '♻️', '🚀']

const SLOT_SCHEMAS: Record<string, Record<string, { type: 'string' | 'color' | 'boolean'; label: string; placeholder?: string; description?: string }>> = {
  AdBanner: {
    icon: { type: 'string', label: '图标', placeholder: '📢' },
    text: { type: 'string', label: '主文案' },
    subtext: { type: 'string', label: '副文案' },
    bg: { type: 'color', label: '背景色' },
    color: { type: 'color', label: '文字色' },
    closable: { type: 'boolean', label: '可关闭', description: '可关闭' },
  },
  Announcement: {
    badge: { type: 'string', label: '徽标', placeholder: 'NEW' },
    title: { type: 'string', label: '标题' },
    text: { type: 'string', label: '内容' },
    linkText: { type: 'string', label: '链接文字' },
    bg: { type: 'color', label: '背景色' },
    color: { type: 'color', label: '文字色' },
    closable: { type: 'boolean', label: '可关闭', description: '可关闭' },
  },
}

const slotSchemas = SLOT_SCHEMAS

const availableExtensions = computed(() => listExtensions())

function resolveExtensionPanel(ext: any): Component | null {
  const panel = ext?.configPanel
  if (!panel) return null
  const cat = String(panel.category || '').trim()
  const name = String(panel.name || '').trim()
  if (!cat || !name) return null
  const getter = sharedGetRegistry || fallbackGetRegistry
  return getter?.(cat)?.[name] || null
}

function findExtensionCfg(id: string): NonNullable<BuilderCfg['extensions']>[number] | null {
  const exts = cfg.extensions || []
  return exts.find((e) => e.id === id) || null
}

function ensureExtensionCfg(id: string) {
  if (!cfg.extensions) cfg.extensions = []
  let found = cfg.extensions.find((e) => e.id === id)
  if (found) return found
  const def = availableExtensions.value.find((x) => x.id === id)
  found = { id, enabled: true, order: 0, options: { ...(def?.defaultOptions || {}) } }
  cfg.extensions.push(found as any)
  return found
}

function isExtensionEnabled(id: string): boolean {
  const c = findExtensionCfg(id)
  if (!c) return false
  return c.enabled !== false
}

function toggleExtension(id: string) {
  const c = findExtensionCfg(id)
  if (!c) {
    ensureExtensionCfg(id)
    return
  }
  c.enabled = c.enabled === false ? true : false
}

function getExtensionOption(extId: string, key: string): any {
  const c = findExtensionCfg(extId)
  return c?.options?.[key]
}

function setExtensionOption(extId: string, key: string, value: any) {
  const c = ensureExtensionCfg(extId)
  if (!c.options) c.options = {}
  c.options[key] = value
}

function selectRegion(region: 'navbar' | 'sidebar' | 'content' | 'footer' | 'theme') {
  sel.value = region
  selNavItem.value = null
  selTreeNode.value = null
}

function openConfigDrawer() {
  ensureCfgSeo()
  if (sel.value?.startsWith('slot:')) {
    configTab.value = 'slots'
    modalSlotKey.value = sel.value.replace('slot:', '')
  } else if (sel.value === 'navbar') configTab.value = 'navbar'
  else if (sel.value === 'sidebar') configTab.value = 'sidebar'
  else if (sel.value === 'content') configTab.value = 'content'
  else if (sel.value === 'footer') configTab.value = 'footer'
  else if (sel.value === 'theme') configTab.value = 'theme'
  else configTab.value = 'content'
  if (configTab.value === 'sidebar') {
    ensurePerNavSidebars()
    sidebarEditNavId.value = activeNav.value
    selTreeNode.value = null
  }
  configDrawerOpen.value = true
}

function openRegionConfig(region: 'navbar' | 'sidebar' | 'content' | 'footer') {
  selectRegion(region)
  openConfigDrawer()
}

function openThemeConfig() {
  selectRegion('theme')
  openConfigDrawer()
}

function openSeoConfig() {
  ensureCfgSeo()
  configTab.value = 'seo'
  configDrawerOpen.value = true
}

function openSlotConfig(key: string) {
  sel.value = 'slot:' + key
  modalSlotKey.value = key
  configTab.value = 'slots'
  configDrawerOpen.value = true
}

function openCurrentPageConfig() {
  if (!selectedPage.value) return
  configTab.value = 'page'
  configDrawerOpen.value = true
}

function onCanvasDelete() {
  if (selectedPage.value) {
    const title = selectedPage.value.title
    dialog.warning({
      title: '删除页面',
      content: `确定删除「${title}」？将从导航与菜单引用中移除。`,
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: () => {
        deletePage(activePage.value)
        return true
      }
    })
    return
  }
  message.info('请先在预览中打开一篇文档，或点击「当前页」后再删除')
}

function saveVisualState() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getVisualStorageKey(), JSON.stringify({ pages: toRaw(pages), cfg: toRaw(cfg) }))
    if (!siteKey.value) {
      message.warning('未指定 siteKey：已保存到本地，但无法保存到数据库。请从「站点管理」进入构建器。')
      return
    }
    const json = JSON.stringify(siteRendererConfig.value)
    void kbApi
      .saveSiteRendererDraft(json, siteKey.value || undefined)
      .then(() => {
        message.success('草稿已保存到数据库')
        void refreshSiteCfgStatus()
      })
      .catch(() => message.error('保存到数据库失败'))
  } catch {
    message.error('保存失败')
  }
}

async function refreshSiteCfgStatus() {
  if (!siteKey.value) return
  try {
    const s = await kbApi.getSiteRendererConfigStatus(siteKey.value || undefined)
    siteCfgStatus.version = s?.version ?? 0
    siteCfgStatus.hasDraft = !!s?.hasDraft
    siteCfgStatus.hasPublished = !!s?.hasPublished
    siteCfgStatus.publishedAt = s?.publishedAt || ''
    siteCfgStatus.updatedAt = s?.updatedAt || ''
  } catch {
    // ignore
  }
}

async function openSiteCfgHistory() {
  if (!siteKey.value) {
    message.warning('缺少 siteKey，无法读取站点历史')
    return
  }
  try {
    siteCfgHistory.value = await kbApi.listSiteRendererConfigHistory(siteKey.value || undefined, 500)
    historyOnlyFailed.value = false
    historyOnlyPublishRelated.value = false
    historyPage.value = 1
    showSiteCfgHistory.value = true
  } catch {
    message.error('读取历史失败')
  }
}

function prettyHistoryAction(action?: string): string {
  const a = String(action || '').toUpperCase()
  if (a === 'SAVE_DRAFT') return '保存草稿'
  if (a === 'PUBLISH') return '发布'
  if (a === 'UNPUBLISH') return '取消发布'
  if (a === 'ROLLBACK') return '回滚'
  return action || '-'
}
function prettyHistoryStage(stage?: string): string {
  const s = String(stage || '').toLowerCase()
  if (s === 'draft') return '草稿'
  if (s === 'published') return '发布'
  return stage || '-'
}
function prettyHistoryTime(v?: string): string {
  if (!v) return '-'
  const s = String(v).replace('T', ' ').replace(/\.\d+$/, '')
  return s.length >= 19 ? s.slice(0, 19) : s
}

function canRollbackFromHistory(h: { action?: string; success?: number }): boolean {
  if (h.success !== 1) return false
  const a = String(h.action || '').toUpperCase()
  return a === 'SAVE_DRAFT' || a === 'PUBLISH' || a === 'ROLLBACK'
}

function fromRendererMenuNode(node: any): SidebarBuilderNode {
  const baseId = String(node?.id || `si${Date.now()}`)
  return {
    id: baseId,
    label: String(node?.label || '新页面'),
    icon: String(node?.icon || '📄'),
    badge: String(node?.badge || ''),
    pageId: node?.pageId ? String(node.pageId) : null,
    expanded: node?.expanded !== false,
    children: Array.isArray(node?.children) ? node.children.map((c: any) => fromRendererMenuNode(c)) : [],
  }
}

function applyRendererConfigToBuilder(parsed: SiteRendererConfig) {
  // pages: 完整恢复基础字段 + seo + kb-doc 元信息
  const restoredPages: BuilderPage[] = []
  for (const [pid, p] of Object.entries(parsed.pages || {})) {
    const page: BuilderPage = {
      id: String(p.id || pid),
      title: p.title || pid,
      slug: (p as any).slug || '',
      type: mapKbType(((p as any).slug || '') as string),
      parentId: '',
      order: restoredPages.length,
      description: p.description || '',
      seo: (p as any).seo ? { ...(p as any).seo } : undefined,
    }
    const kbDocMeta = (p as any).meta?.kbDoc
    if ((p as any).meta?.kbDocListSource || kbDocMeta?.id) {
      page.source = 'kb-doc'
      if (typeof kbDocMeta?.id === 'number') page.docId = kbDocMeta.id
      if (kbDocMeta?.status) page.status = kbDocMeta.status
      if (kbDocMeta?.title) page.title = kbDocMeta.title
      if (kbDocMeta?.slug) page.slug = kbDocMeta.slug
      if (!page.slug) page.slug = `/docs/${page.id}`
    }
    restoredPages.push(page)
  }
  pages.splice(0, pages.length, ...restoredPages)

  // cfg: 完整恢复主题/seo/navbar/sidebar/content/footer/landing/slots
  cfg.themeId = parsed.themeId || cfg.themeId
  cfg.theme.primary = parsed.theme?.primary || cfg.theme.primary
  cfg.theme.dark = !!parsed.theme?.darkMode
  cfg.theme.font = parsed.theme?.fontSans || cfg.theme.font
  cfg.seo = parsed.seo ? { ...(parsed.seo as any) } : { ...DEFAULT_SITE_SEO }
  cfg.navbar.brand = parsed.navbar?.brand || cfg.navbar.brand
  cfg.navbar.style = (parsed.navbar?.style as any) || cfg.navbar.style
  cfg.navbar.showSearch = parsed.navbar?.showSearch !== false
  cfg.navbar.links = (parsed.navbar?.links || []).map((l: any) => ({
    id: String(l.id || `n${Date.now()}`),
    label: String(l.label || '新链接'),
    icon: String(l.icon || ''),
    type: l.type === 'dropdown' ? 'dropdown' : l.type === 'external' ? 'external' : 'link',
    pageId: l.pageId || null,
    href: l.href || '/',
    externalOpen: l.externalOpen === 'same' ? 'same' : 'blank',
    children: (l.children || []).map((c: any) => ({
      id: String(c.id || `ns${Date.now()}`),
      label: String(c.label || '子链接'),
      icon: String(c.icon || ''),
      type: c.type === 'external' ? 'external' : 'link',
      pageId: c.pageId || null,
      href: c.href || '/',
      externalOpen: c.externalOpen === 'same' ? 'same' : 'blank',
    })),
  }))
  cfg.sidebar.width = Number(parsed.sidebar?.width || cfg.sidebar.width)
  cfg.sidebar.collapsible = parsed.sidebar?.collapsible !== false
  cfg.content.maxWidth = parsed.content?.maxWidth || cfg.content.maxWidth
  cfg.content.showToc = parsed.content?.showToc !== false
  cfg.footer = (parsed.footer as any) || cfg.footer
  cfg.landingExtras = (parsed.landingConfig as any) || cfg.landingExtras
  cfg.slots = (parsed.slots as any) || {}
  cfg.extensions = (parsed.extensions as any) || []

  // 侧栏树：优先恢复 treesByNavId；否则用单 tree
  const map: Record<string, SidebarTreeData> = {}
  const byNav = (parsed.sidebar as any)?.treesByNavId as Record<string, any[]> | undefined
  if (byNav && Object.keys(byNav).length) {
    for (const [navId, secs] of Object.entries(byNav)) {
      map[navId] = (secs || []).map((sec: any) => ({
        id: String(sec.id || `sg${Date.now()}`),
        groupLabel: sec.groupLabel,
        label: sec.groupLabel || sec.label || '菜单',
        icon: '📚',
        expanded: true,
        children: (sec.children || []).map((n: any) => fromRendererMenuNode(n)),
      }))
    }
  } else {
    const firstHost = collectSidebarHostNavIds()[0] || cfg.navbar.links[0]?.id || 'n1'
    map[firstHost] = ((parsed.sidebar?.tree as any[]) || []).map((sec: any) => ({
      id: String(sec.id || `sg${Date.now()}`),
      groupLabel: sec.groupLabel,
      label: sec.groupLabel || sec.label || '菜单',
      icon: '📚',
      expanded: true,
      children: (sec.children || []).map((n: any) => fromRendererMenuNode(n)),
    }))
  }
  cfg.sidebarTreesByNavId = map
  ensurePerNavSidebars()
  normalizeBindings()
  ensureCfgSeo()
  activePage.value = pages[0]?.id || 'home'
  activeNav.value = cfg.navbar.links[0]?.id || 'n1'
}

function unpublish() {
  if (!siteKey.value) {
    message.warning('缺少 siteKey，无法取消发布')
    return
  }
  void kbApi
    .unpublishSiteRendererConfig(siteKey.value || undefined)
    .then(() => {
      message.success('已取消发布')
      void refreshSiteCfgStatus()
      void openSiteCfgHistory()
    })
    .catch(() => message.error('取消发布失败'))
}

function rollbackToDraft(historyId: number) {
  if (!siteKey.value) {
    message.warning('缺少 siteKey，无法回滚')
    return
  }
  dialog.warning({
    title: '回滚确认',
    content: '将该历史快照恢复到草稿版本，是否继续？',
    positiveText: '回滚',
    negativeText: '取消',
    onPositiveClick: () => {
      void kbApi
        .rollbackSiteRendererConfigByHistory(historyId, 'draft', siteKey.value || undefined)
        .then(() => kbApi.getSiteRendererConfig(siteKey.value || undefined, 'draft'))
        .then((json: string) => {
          if (json && String(json).trim()) {
            const parsed = JSON.parse(String(json)) as SiteRendererConfig
            applyRendererConfigToBuilder(parsed)
          }
          message.success('回滚完成（已恢复到草稿）')
          void refreshSiteCfgStatus()
          void openSiteCfgHistory()
        })
        .catch(() => message.error('回滚失败'))
    },
  })
}

function hydrateVisualState() {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(getVisualStorageKey())
  if (!raw) {
    // 对带 siteKey 的新站点：第一次进入编辑器时不再套用 demo 模板，使用空白站点
    if (siteKey.value) {
      pages.splice(0, pages.length)
      cfg.navbar.links = []
      cfg.sidebar.tree = []
      if (cfg.sidebarTreesByNavId) {
        for (const k of Object.keys(cfg.sidebarTreesByNavId)) delete cfg.sidebarTreesByNavId[k]
      }
    }
    return
  }
  try {
    const o = JSON.parse(raw) as { pages: BuilderPage[]; cfg: BuilderCfg }
    if (o.pages?.length) pages.splice(0, pages.length, ...o.pages)
    for (const p of pages) normalizeBuilderPageDocId(p)
    if (o.cfg) Object.assign(cfg, o.cfg)
    ensureCfgSeo()
    /* normalizeBindings 在 reconcileKbDocPagesFromBindings 之后执行，避免先清空 doc-* 关联 */
  } catch {
    /* ignore */
  }
}

async function loadSiteConfigFromBackend(): Promise<boolean> {
  if (!siteKey.value) return false
  try {
    const draft = await kbApi.getSiteRendererConfig(siteKey.value || undefined, 'draft')
    if (draft && String(draft).trim()) {
      applyRendererConfigToBuilder(JSON.parse(String(draft)) as SiteRendererConfig)
      return true
    }
    const published = await kbApi.getSiteRendererConfig(siteKey.value || undefined, 'published')
    if (published && String(published).trim()) {
      applyRendererConfigToBuilder(JSON.parse(String(published)) as SiteRendererConfig)
      return true
    }
  } catch {
    // ignore and fallback to local state
  }
  return false
}

function removeSidebarSection(si: number) {
  const tree = getEditingSidebarTreeArr()
  if (si < 0 || si >= tree.length) return
  tree.splice(si, 1)
  selTreeNode.value = null
}

function toggleSecExpanded(si: number) {
  const tree = getEditingSidebarTreeArr()
  const sec = tree[si]
  if (!sec) return
  sec.expanded = sec.expanded === false ? true : false
}

/** 从知识库目录选中 doc-* 时，先写入 pages 再关联 nav/sidebar */
function ensurePageFromCatalogIfNeeded(pageId: string | null) {
  if (!pageId || getPage(pageId)) return
  const cat = kbCatalogFlat.value.find((x) => x.id === pageId)
  const did = cat ? resolveKbDocId(cat) : undefined
  if (!cat || did === undefined) return
  const baseSlug = cat.slug || `/docs/${cat.id}`
  const used = new Set(pages.map((p) => p.slug).filter((s): s is string => !!s))
  let slug = baseSlug
  let idx = 2
  while (used.has(slug)) {
    slug = `${baseSlug}-${idx++}`
  }
  pages.push({
    id: cat.id,
    docId: did,
    source: 'kb-doc',
    status: cat.status,
    title: cat.title,
    slug,
    type: cat.type,
    parentId: '',
    order: pages.length,
    description: '',
  })
  void hydrateKbDocsForCurrentPages()
}

function addNavItem() {
  const id = 'n' + Date.now()
  cfg.navbar.links.push({
    id,
    label: '新链接',
    icon: '',
    type: 'link',
    pageId: null,
    href: '/',
    children: [],
  })
  ensurePerNavSidebars()
  selNavItem.value = cfg.navbar.links.length - 1
}

function onNavPageChange(idx: number | null, raw: string) {
  if (idx === null || !cfg.navbar.links[idx]) return
  const l = cfg.navbar.links[idx]
  const pageId = raw || null
  ensurePageFromCatalogIfNeeded(pageId)
  l.pageId = pageId
  if (pageId) {
    const p = getPage(pageId)
    if (p) l.href = p.slug
  }
  ensurePerNavSidebars()
}

function onNavItemTypeChange(idx: number, raw: string) {
  const l = cfg.navbar.links[idx]
  if (!l) return
  const t = raw as 'link' | 'dropdown' | 'external'
  l.type = t
  if (t === 'dropdown') {
    l.pageId = null
    if (!l.children) l.children = []
  }
  if (t === 'external') {
    l.pageId = null
    if (l.externalOpen !== 'same') l.externalOpen = 'blank'
  }
  ensurePerNavSidebars()
}

function addNavChild(parentIdx: number) {
  const l = cfg.navbar.links[parentIdx]
  if (!l || l.type !== 'dropdown') return
  if (!l.children) l.children = []
  const id = 'ns' + Date.now()
  l.children.push({
    id,
    label: '子链接',
    icon: '',
    type: 'link',
    pageId: null,
    href: '/',
    externalOpen: 'blank',
  })
  ensurePerNavSidebars()
  selNavSubIdx.value = l.children.length - 1
}

function removeNavChild(parentIdx: number, ci: number) {
  const l = cfg.navbar.links[parentIdx]
  if (!l?.children?.[ci]) return
  const rid = l.children[ci].id
  if (cfg.sidebarTreesByNavId) delete cfg.sidebarTreesByNavId[rid]
  l.children.splice(ci, 1)
  ensurePerNavSidebars()
  const opts = sidebarNavTreeOptions.value
  if (opts.length && !opts.some((o) => o.value === sidebarEditNavId.value)) {
    sidebarEditNavId.value = opts[0].value
  }
  if (activeNav.value === rid) activeNav.value = cfg.navbar.links[0]?.id || ''
  if (selNavSubIdx.value === ci) selNavSubIdx.value = null
  else if (selNavSubIdx.value !== null && selNavSubIdx.value > ci) selNavSubIdx.value--
}

function onNavChildPageChange(parentIdx: number, ci: number, raw: string) {
  const l = cfg.navbar.links[parentIdx]
  if (!l?.children?.[ci]) return
  const c = l.children[ci]
  const pageId = raw || null
  ensurePageFromCatalogIfNeeded(pageId)
  c.pageId = pageId
  if (pageId) {
    const p = getPage(pageId)
    if (p) c.href = p.slug
  }
  ensurePerNavSidebars()
}

function openSidebarForNavHost(hostId: string) {
  sidebarEditNavId.value = hostId
  configTab.value = 'sidebar'
  configDrawerOpen.value = true
  selTreeNode.value = null
}

function allNavbarLinkIds(): Set<string> {
  const s = new Set<string>()
  cfg.navbar.links.forEach((l) => {
    s.add(l.id)
    l.children?.forEach((c) => s.add(c.id))
  })
  return s
}

function removeNavItemAt(idx: number) {
  if (idx < 0 || idx >= cfg.navbar.links.length) return
  const l = cfg.navbar.links[idx]
  const rid = l.id
  l.children?.forEach((c) => {
    if (cfg.sidebarTreesByNavId) delete cfg.sidebarTreesByNavId[c.id]
  })
  cfg.navbar.links.splice(idx, 1)
  if (cfg.sidebarTreesByNavId) delete cfg.sidebarTreesByNavId[rid]
  const hosts = collectSidebarHostNavIds()
  if (!hosts.includes(sidebarEditNavId.value)) {
    sidebarEditNavId.value = hosts[0] || ''
  }
  if (!allNavbarLinkIds().has(activeNav.value)) {
    activeNav.value = cfg.navbar.links[0]?.id || ''
  }
  if (selNavItem.value === idx) selNavItem.value = null
  else if (selNavItem.value !== null && selNavItem.value > idx) selNavItem.value--
}

function addSideSection() {
  const tree = getEditingSidebarTreeArr()
  const id = 'sg' + Date.now()
  const suf = '__' + (sidebarEditNavId.value || cfg.navbar.links[0]?.id || 'nav').replace(/[^a-zA-Z0-9]/g, '_')
  tree.push({
    id: id + suf,
    groupLabel: '新分组',
    label: '新分组',
    icon: '📁',
    expanded: true,
    children: [],
  })
  selTreeNode.value = tree.length - 1 + '.root'
}

function navSuffixForSidebar(): string {
  return '__' + (sidebarEditNavId.value || cfg.navbar.links[0]?.id || 'nav').replace(/[^a-zA-Z0-9]/g, '_')
}

/** parentPath 为空表示在该分组下追加顶级项；否则在对应父节点下追加子项（子分组 / 折叠父级） */
function addSideChildAt(si: number, parentPath: number[]) {
  const tree = getEditingSidebarTreeArr()
  const sec = tree[si]
  if (!sec) return
  const suf = navSuffixForSidebar()
  const newNode: SidebarBuilderNode = {
    id: 'si' + Date.now() + suf,
    label: '新页面',
    icon: '📄',
    pageId: null,
    badge: '',
  }

  if (parentPath.length === 0) {
    sec.children.push(newNode)
    selTreeNode.value = `${si}.${sec.children.length - 1}`
    return
  }

  let cur: SidebarBuilderNode | undefined = sec.children[parentPath[0]]
  for (let i = 1; i < parentPath.length; i++) {
    if (!cur) return
    if (!cur.children) cur.children = []
    cur = cur.children[parentPath[i]]
  }
  if (!cur) return
  if (!cur.children) cur.children = []
  cur.children.push(newNode)
  selTreeNode.value = [si, ...parentPath, cur.children.length - 1].join('.')
}

function removeSidebarNodeAt(si: number, nodePath: number[]) {
  const tree = getEditingSidebarTreeArr()
  const sec = tree[si]
  if (!sec || nodePath.length === 0) return
  const sel = selTreeNode.value
  if (sel && (sel === [si, ...nodePath].join('.') || sel.startsWith(`${[si, ...nodePath].join('.')}.`))) {
    selTreeNode.value = null
  }
  if (nodePath.length === 1) {
    sec.children.splice(nodePath[0], 1)
    return
  }
  const parentPath = nodePath.slice(0, -1)
  const last = nodePath[nodePath.length - 1]
  let cur: SidebarBuilderNode | undefined = sec.children[parentPath[0]]
  for (let i = 1; i < parentPath.length; i++) {
    if (!cur?.children) return
    cur = cur.children[parentPath[i]]
  }
  if (!cur?.children) return
  cur.children.splice(last, 1)
}

function onVsbSidebarSelect(key: string) {
  selTreeNode.value = selTreeNode.value === key ? null : key
}

function onVsbSidebarAddChild(p: { sectionIndex: number; parentPath: number[] }) {
  addSideChildAt(p.sectionIndex, p.parentPath)
}

function onVsbSidebarRemove(p: { sectionIndex: number; nodePath: number[] }) {
  removeSidebarNodeAt(p.sectionIndex, p.nodePath)
}

function sidebarPageSlug(pageId: string) {
  return getPage(pageId)?.slug || ''
}

function parseSidebarSel(
  sel: string | null
): { si: number; kind: 'root' } | { si: number; kind: 'node'; indices: number[] } | null {
  if (!sel) return null
  const parts = sel.split('.')
  const si = Number(parts[0])
  if (Number.isNaN(si)) return null
  if (parts[1] === 'root') return { si, kind: 'root' }
  const indices = parts.slice(1).map((x) => Number(x))
  if (indices.some((n) => Number.isNaN(n))) return null
  return { si, kind: 'node', indices }
}

function getTreeNode(): SidebarTreeData[number] | SidebarBuilderNode | null {
  const parsed = parseSidebarSel(selTreeNode.value)
  if (!parsed) return null
  const tree = getEditingSidebarTreeArr()
  const sec = tree[parsed.si]
  if (!sec) return null
  if (parsed.kind === 'root') return sec
  const { indices } = parsed
  if (!indices.length) return null
  let cur: SidebarBuilderNode | undefined = sec.children[indices[0]]
  if (!cur) return null
  for (let i = 1; i < indices.length; i++) {
    if (!cur.children) return null
    cur = cur.children[indices[i]]
    if (!cur) return null
  }
  return cur
}

function setTreeNodePageId(raw: string) {
  const parsed = parseSidebarSel(selTreeNode.value)
  if (!parsed || parsed.kind === 'root') return
  const n = getTreeNode() as { pageId?: string | null } | null
  if (!n) return
  const pageId = raw || null
  ensurePageFromCatalogIfNeeded(pageId)
  n.pageId = pageId
}

function onTreeLabelInput() {
  const n = getTreeNode() as { label?: string; groupLabel?: string; children?: unknown } | null
  if (n && 'groupLabel' in n && n.groupLabel !== undefined && n.label !== undefined) n.groupLabel = n.label
}

interface PageRef {
  id: string
  icon: string
  label: string
  loc: string
}

function getPageRefs(pageId: string): PageRef[] {
  const refs: PageRef[] = []
  cfg.navbar.links.forEach((l, i) => {
    if (l.pageId === pageId) refs.push({ id: 'nav:' + l.id, icon: '🔗', label: l.label, loc: '导航 #' + (i + 1) })
    l.children?.forEach((c) => {
      if (c.pageId === pageId) {
        refs.push({
          id: 'navc:' + c.id,
          icon: '🔗',
          label: c.label,
          loc: `导航 · ${l.label} / 子项`,
        })
      }
    })
  })
  ensurePerNavSidebars()
  const map = cfg.sidebarTreesByNavId!
  for (const [navId, tree] of Object.entries(map)) {
    const navLabel = cfg.navbar.links.find((l) => l.id === navId)?.label || navId
    tree.forEach((sec) => {
      walkSidebarBuilderNodes(sec.children, (it) => {
        if (it.pageId === pageId) {
          refs.push({
            id: 'side:' + it.id,
            icon: '📂',
            label: it.label,
            loc: `侧栏(${navLabel}) / ${sec.groupLabel} / ${it.label}`,
          })
        }
      })
    })
  }
  return refs
}

function removeRef(ref: PageRef) {
  if (ref.id.startsWith('nav:')) {
    const id = ref.id.slice(4)
    const i = cfg.navbar.links.findIndex((l) => l.id === id)
    if (i > -1) removeNavItemAt(i)
    return
  }
  if (ref.id.startsWith('navc:')) {
    const cid = ref.id.slice(5)
    for (let pi = 0; pi < cfg.navbar.links.length; pi++) {
      const l = cfg.navbar.links[pi]
      const j = l.children?.findIndex((c) => c.id === cid) ?? -1
      if (j >= 0 && l.children) {
        removeNavChild(pi, j)
        return
      }
    }
    return
  }
  if (ref.id.startsWith('side:')) {
    const id = ref.id.slice(5)
    ensurePerNavSidebars()
    for (const tree of Object.values(cfg.sidebarTreesByNavId!)) {
      for (const sec of tree) {
        if (removeSidebarBuilderNodeById(sec.children, id)) return
      }
    }
  }
}

function removeSidebarBuilderNodeById(list: SidebarBuilderNode[], targetId: string): boolean {
  const i = list.findIndex((c) => c.id === targetId)
  if (i > -1) {
    list.splice(i, 1)
    return true
  }
  for (const c of list) {
    if (c.children?.length && removeSidebarBuilderNodeById(c.children, targetId)) return true
  }
  return false
}

function quickAddToNav(pageId: string) {
  const p = getPage(pageId)
  if (!p) return
  cfg.navbar.links.push({
    id: 'n' + Date.now(),
    label: p.title,
    icon: '',
    type: 'link',
    pageId,
    href: p.slug,
    children: [],
  })
  toast('已添加到导航')
}

function ensureNavSidebarRoot(navId: string): SidebarTreeData[number] {
  ensurePerNavSidebars()
  const map = cfg.sidebarTreesByNavId!
  let tree = map[navId]
  if (!tree) {
    map[navId] = remapTreeIds(defaultSidebarTemplate(), navId)
    tree = map[navId]
  }
  if (!tree.length) {
    const suf = '__' + navId.replace(/[^a-zA-Z0-9]/g, '_')
    tree.push({
      id: 'sg-auto' + suf,
      groupLabel: '菜单',
      label: '菜单',
      icon: '📚',
      expanded: true,
      children: [],
    })
  }
  return tree[0]
}

function quickAddToSide(pageId: string) {
  const p = getPage(pageId)
  if (!p) return
  const hosts = collectSidebarHostNavIds()
  let navId = activeNav.value || ''
  if (!hosts.includes(navId)) navId = hosts[0] || ''
  if (!navId) {
    toast('没有可绑定的导航槽位（需存在未关联页面的导航项）')
    return
  }
  const sec = ensureNavSidebarRoot(navId)
  const suf = '__' + navId.replace(/[^a-zA-Z0-9]/g, '_')
  sec.children.push({
    id: 'si' + Date.now() + suf,
    label: p.title,
    icon: ptIcon(p.type),
    pageId,
    badge: '',
  })
  toast('已添加到当前导航的菜单树')
}

function toggleSlot(key: string) {
  if (!key) return
  if (cfg.slots[key]) {
    cfg.slots[key] = null
  } else {
    cfg.slots[key] = {
      instanceId: 's' + Date.now(),
      componentKey: 'Announcement',
      props: {
        badge: 'NEW',
        title: '',
        text: '',
        linkText: '',
        bg: '#eff6ff',
        color: '#1d4ed8',
        closable: true,
      },
    }
  }
}

function setSlotProp(slotKey: string, propKey: string, value: string) {
  const slot = cfg.slots[slotKey]
  if (!slot?.props) return
  ;(slot.props as Record<string, string | boolean>)[propKey] = value
}

function onPrimaryColorInput(e: Event) {
  const t = e.target as HTMLInputElement
  cfg.theme.primary = t.value
}

/** 与 KbDocList 同源页面（带 docId）：站点预览用 KbDocBody 渲染正文 */
const kbDocByPageId = reactive<Record<string, KbDoc | null>>({})
const kbDocLoadingByPageId = reactive<Record<string, boolean>>({})

async function hydrateKbDocsForCurrentPages() {
  const pageIds = new Set(pages.map((p) => p.id))
  for (const k of Object.keys(kbDocByPageId)) {
    if (!pageIds.has(k)) {
      delete kbDocByPageId[k]
      delete kbDocLoadingByPageId[k]
    }
  }
  const targets = pages.filter((p) => resolveKbDocId(p) !== undefined)
  if (!targets.length) return
  for (const p of targets) {
    kbDocLoadingByPageId[p.id] = true
  }
  const invalidPageIds: string[] = []
  await Promise.all(
    targets.map(async (p) => {
      const did = resolveKbDocId(p)!
      try {
        kbDocByPageId[p.id] = await kbApi.getDoc(did, siteKey.value || undefined)
      } catch {
        kbDocByPageId[p.id] = null
        invalidPageIds.push(p.id)
      } finally {
        kbDocLoadingByPageId[p.id] = false
      }
    })
  )
  // 文档不存在/无权：清理残留「带 docId 的页面」与导航/侧栏引用，避免反复请求导致错误提示刷屏
  if (invalidPageIds.length) {
    for (const pid of Array.from(new Set(invalidPageIds))) {
      removePageAndUnbind(pid)
    }
    normalizeBindings()
  }
}

let kbDocHydrateTimer: ReturnType<typeof setTimeout> | null = null
function scheduleKbDocHydrate() {
  if (kbDocHydrateTimer) clearTimeout(kbDocHydrateTimer)
  kbDocHydrateTimer = setTimeout(() => {
    kbDocHydrateTimer = null
    void hydrateKbDocsForCurrentPages()
  }, 280)
}

watch(
  () => pages.map((p) => `${p.id}:${resolveKbDocId(p) ?? ''}`).join('|'),
  () => scheduleKbDocHydrate()
)

function toRendererMenuNode(node: SidebarBuilderNode): SidebarMenuNode {
  return {
    id: node.pageId || node.id,
    label: node.label,
    icon: node.icon || undefined,
    badge: node.badge || undefined,
    pageId: node.pageId || undefined,
    expanded: node.children?.length ? node.expanded !== false : undefined,
    children: node.children?.length ? node.children.map(toRendererMenuNode) : undefined,
  }
}

function buildSiteRendererConfig(): SiteRendererConfig {
  const pageMap: SiteRendererConfig['pages'] = {}
  for (const p of pages) {
    const fallbackDesc = p.description || '页面内容将在此渲染'
    const placeholderHtml =
      p.type === 'home'
        ? undefined
        : `<p>${(p.description || '在列表中编辑页面，正文可在文档编辑器中完善。').replace(/</g, '&lt;')}</p>`

    const pickedSeo = pickPageSeoForExport(p)
    const kbDocId = resolveKbDocId(p)
    if (kbDocId !== undefined) {
      pageMap[p.id] = {
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: fallbackDesc,
        html: undefined,
        ...(pickedSeo ? { seo: pickedSeo } : {}),
        meta: {
          kbDocListSource: true,
          // 仅存引用（docId），正文/组件信息运行时按需 getDoc 拉取，避免站点配置 JSON 过大
          kbDocId,
        },
      }
    } else {
      pageMap[p.id] = {
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: fallbackDesc,
        html: placeholderHtml,
        ...(pickedSeo ? { seo: pickedSeo } : {}),
      }
    }
  }

  const slots: SiteRendererConfig['slots'] = {}
  for (const [k, v] of Object.entries(cfg.slots)) {
    if (v) slots[k] = v as SlotComponentInstance
  }

  return {
    themeId: cfg.themeId,
    theme: {
      primary: cfg.theme.primary,
      darkMode: cfg.theme.dark,
      fontSans: cfg.theme.font,
    },
    seo: cfg.seo ? { ...toRaw(cfg.seo) } : undefined,
    extensions: (cfg.extensions || []).map((e) => ({
      id: String((e as any).id || ''),
      enabled: (e as any).enabled !== false,
      order: typeof (e as any).order === 'number' ? (e as any).order : 0,
      options: (e as any).options || {},
    })).filter((e) => e.id),
    navbar: {
      brand: cfg.navbar.brand,
      style: cfg.navbar.style,
      showSearch: cfg.navbar.showSearch,
      links: cfg.navbar.links.map((l) => {
        const type: NavbarLinkItem['type'] =
          l.type === 'dropdown' ? 'dropdown' : l.type === 'external' ? 'external' : 'link'
        const row: NavbarLinkItem = {
          id: l.id,
          label: l.label,
          icon: l.icon,
          href: l.href,
          type,
          pageId: l.pageId || undefined,
        }
        if (type === 'external') row.externalOpen = l.externalOpen === 'same' ? 'same' : 'blank'
        if (type === 'dropdown' && l.children?.length) {
          row.children = l.children.map((ch) => ({
            id: ch.id,
            label: ch.label,
            icon: ch.icon,
            href: ch.href,
            pageId: ch.pageId || undefined,
            type: ch.type === 'external' ? 'external' : 'link',
            externalOpen:
              ch.type === 'external' ? (ch.externalOpen === 'same' ? 'same' : 'blank') : undefined,
          }))
        }
        return row
      }),
    },
    sidebar: (() => {
      ensurePerNavSidebars()
      const map = cfg.sidebarTreesByNavId!
      const treesByNavId: Record<string, SiteRendererConfig['sidebar']['tree']> = {}
      for (const navId of Object.keys(map)) {
        const src = map[navId]
        if (!src?.length) {
          treesByNavId[navId] = []
          continue
        }
        treesByNavId[navId] = src.map((sec) => ({
          id: sec.id,
          groupLabel: sec.groupLabel,
          children: sec.children.map((node) => toRendererMenuNode(node)),
        }))
      }
      const rawNavId = activeNav.value || cfg.navbar.links[0]?.id || ''
      let curSrc: SidebarTreeData = []
      for (const k of sidebarTreeMapKeysForLookup(cfg.navbar.links as NavbarLinkItem[], rawNavId)) {
        if (Object.prototype.hasOwnProperty.call(map, k) && map[k]?.length) {
          curSrc = map[k]!
          break
        }
      }
      const tree = curSrc.map((sec) => ({
        id: sec.id,
        groupLabel: sec.groupLabel,
        children: sec.children.map((node) => toRendererMenuNode(node)),
      }))
      return {
        width: cfg.sidebar.width,
        collapsible: cfg.sidebar.collapsible,
        tree,
        ...(Object.keys(treesByNavId).length ? { treesByNavId } : {}),
      }
    })(),
    content: { maxWidth: cfg.content.maxWidth, showToc: cfg.content.showToc },
    footer: cfg.footer,
    landingConfig: cfg.landingExtras,
    slots,
    pages: pageMap,
  }
}

const siteRendererConfig = computed(() => buildSiteRendererConfig())
const selectedPageKbDocId = computed(() => {
  if (!selectedPage.value) return null
  return resolveKbDocId(selectedPage.value) ?? null
})

function openSelectedPageDocEditor() {
  const did = selectedPageKbDocId.value
  if (!did) {
    message.info('当前页面不是知识库文档来源，无法打开正文编辑器')
    return
  }
  if (!siteKey.value) {
    message.warning('缺少 siteKey，请从站点管理页进入构建器后再编辑正文')
    return
  }
  const path = `/plugins/kb/docs/${encodeURIComponent(siteKey.value)}/edit/${did}`
  const isHashMode = typeof window !== 'undefined' && window.location.hash.includes('#/')
  const url = isHashMode
    ? `${window.location.origin}${window.location.pathname}#${path}`
    : `${window.location.origin}${path}`
  window.open(url, '_blank')
}

function toast(msg: string) {
  toastMsg.value = msg
  toastShow.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastShow.value = false
  }, 2200)
}

function getPage(id: string) {
  return pages.find((p) => p.id === id) || null
}

function ptIcon(type: BuilderPage['type']) {
  return { doc: '📄', home: '🏠', blog: '✍️', api: '🔌', custom: '⚙️' }[type] || '📄'
}

function ptLabel(type: BuilderPage['type']) {
  return { doc: '文档', home: '首页', blog: '博客', api: 'API参考', custom: '自定义' }[type] || type
}

function isInNav(pid: string) {
  return cfg.navbar.links.some((l) => l.pageId === pid || l.children?.some((c) => c.pageId === pid))
}

function isInSide(pid: string) {
  ensurePerNavSidebars()
  for (const tree of Object.values(cfg.sidebarTreesByNavId!)) {
    for (const s of tree) {
      let hit = false
      walkSidebarBuilderNodes(s.children, (it) => {
        if (it.pageId === pid) hit = true
      })
      if (hit) return true
    }
  }
  return false
}

function deletePage(id: string) {
  const i = pages.findIndex((p) => p.id === id)
  if (i > -1) pages.splice(i, 1)
  cfg.navbar.links.forEach((l) => {
    if (l.pageId === id) l.pageId = null
    l.children?.forEach((c) => {
      if (c.pageId === id) c.pageId = null
    })
  })
  ensurePerNavSidebars()
  for (const tree of Object.values(cfg.sidebarTreesByNavId!)) {
    tree.forEach((sec) =>
      walkSidebarBuilderNodes(sec.children, (it) => {
        if (it.pageId === id) it.pageId = null
      })
    )
  }
  if (activePage.value === id) activePage.value = pages[0]?.id || 'home'
  toast('页面已删除，关联自动清理')
}

function confirmNewPage() {
  if (!np.pageId) {
    toast('请先选择一个文档')
    return
  }
  let p = getPage(np.pageId)
  if (!p) {
    const cat = kbCatalogFlat.value.find((x) => x.id === np.pageId)
    const catDid = cat ? resolveKbDocId(cat) : undefined
    if (!cat || catDid === undefined) {
      toast('未找到该文档，请先同步知识库目录')
      return
    }
    pages.push({
      id: cat.id,
      docId: catDid,
      source: 'kb-doc',
      status: cat.status,
      title: cat.title,
      slug: cat.slug,
      type: cat.type,
      parentId: '',
      order: pages.length,
      description: '',
    })
    p = getPage(np.pageId) || null
    if (!p) return
    void hydrateKbDocsForCurrentPages()
  }
  if (np.addToNav) {
    const exists = cfg.navbar.links.some((n) => n.pageId === p.id)
    if (!exists)
      cfg.navbar.links.push({
        id: 'n' + Date.now(),
        label: p.title,
        icon: '',
        type: 'link',
        pageId: p.id,
        href: p.slug,
        children: [],
      })
  }
  if (np.addToSide) {
    const hosts = collectSidebarHostNavIds()
    let navId = activeNav.value || ''
    if (!hosts.includes(navId)) navId = hosts[0] || ''
    if (navId) {
      ensurePerNavSidebars()
      const treeArr = cfg.sidebarTreesByNavId![navId]
      const exists = treeArr.some((sec) => sec.children.some((n) => n.pageId === p.id))
      if (!exists) {
        const sec = ensureNavSidebarRoot(navId)
        const suf = '__' + navId.replace(/[^a-zA-Z0-9]/g, '_')
        sec.children.push({ id: 'si' + Date.now() + suf, label: p.title, icon: ptIcon(p.type), pageId: p.id, badge: '' })
      }
    }
  }
  activePage.value = p.id
  toast(`已添加「${p.title}」引用`)
  Object.assign(np, { pageId: '', addToNav: false, addToSide: false })
  showNewPage.value = false
}

/** 只拉取知识库目录供关联使用，不替换站点页面与侧栏结构 */
async function loadKbDocCatalog() {
  loadingKb.value = true
  try {
    kbDocCatalogTree.value = await kbApi.tree(siteKey.value || undefined)
    message.success('知识库目录已同步，可在「从文档库添加页面」中关联文档')
    await reconcileKbDocPagesFromBindings()
    await hydrateKbDocsForCurrentPages()
  } catch {
    message.warning('知识库目录同步失败')
    kbDocCatalogTree.value = []
    await reconcileKbDocPagesFromBindings()
    await hydrateKbDocsForCurrentPages()
  } finally {
    loadingKb.value = false
  }
}

function switchTheme(id: ThemeLayoutId) {
  cfg.themeId = id
  toast('已切换到「' + (THEME_MANIFESTS.find((m) => m.id === id)?.name || id) + '」')
}

function exportJson() {
  const full = buildSiteRendererConfig()
  const pagesExport: SiteRendererConfig['pages'] = {}
  for (const [pid, pg] of Object.entries(full.pages)) {
    const m = pg.meta
    if (m?.kbDocListSource) {
      pagesExport[pid] = {
        ...pg,
        meta: { ...m, kbDoc: undefined, kbDocLoading: false },
      }
    } else {
      pagesExport[pid] = pg
    }
  }
  const data = { pages: toRaw(pages), siteConfig: toRaw(cfg), renderer: { ...full, pages: pagesExport } }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'gress-config.json'
  a.click()
  toast('已导出 gress-config.json')
}

function publish() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getVisualStorageKey(), JSON.stringify({ pages: toRaw(pages), cfg: toRaw(cfg) }))
    if (!siteKey.value) {
      message.warning('未指定 siteKey：无法发布到数据库。请从「站点管理」进入构建器。')
      return
    }
    const json = JSON.stringify(siteRendererConfig.value)
    void kbApi
      .saveSiteRendererDraft(json, siteKey.value || undefined)
      .then(() => kbApi.publishSiteRendererConfig(siteKey.value || undefined))
      .then(() => {
        message.success('已发布：现在可通过 /sites/* 访问')
        void refreshSiteCfgStatus()
      })
      .catch(() => message.error('发布失败'))
  } catch {
    message.error('保存失败')
  }
}

function pushHistorySnap() {
  const snap = JSON.stringify({ pages: toRaw(pages), cfg: toRaw(cfg) })
  if (snap === hist.value[histIdx.value]) return
  hist.value = hist.value.slice(0, histIdx.value + 1)
  hist.value.push(snap)
  histIdx.value = hist.value.length - 1
}

watch(
  () => ({ pages: toRaw(pages), cfg: toRaw(cfg) }),
  () => {
    if (histLock) return
    if (histTimer != null) clearTimeout(histTimer)
    histTimer = setTimeout(() => pushHistorySnap(), 500)
  },
  { deep: true }
)

hist.value = [JSON.stringify({ pages: toRaw(pages), cfg: toRaw(cfg) })]
histIdx.value = 0
onMounted(() => {
  ensureCfgSeo()
  void refreshSiteCfgStatus()
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', scheduleKbDocHydrate)
  }
  void initializeBuilderBySiteKey()
})

async function initializeBuilderBySiteKey() {
  const loadedFromBackend = await loadSiteConfigFromBackend()
  if (!loadedFromBackend) hydrateVisualState()
  await reconcileKbDocPagesFromBindings()
  normalizeBindings()
  await hydrateKbDocsForCurrentPages()
  await loadKbDocCatalog()
  normalizeBindings()
  await refreshSiteCfgStatus()
  unboundDialogEnabled.value = true
}

// watch(
//   () => siteKey.value,
//   (_n, _o) => {
//     // keep-alive 场景下同一路由仅 query 变化不会重建组件，这里手动按 siteKey 重新初始化
//     void initializeBuilderBySiteKey()
//   }
// )

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('focus', scheduleKbDocHydrate)
  }
})

function undo() {
  if (histIdx.value <= 0) return
  histLock = true
  histIdx.value--
  applyHist(hist.value[histIdx.value])
  setTimeout(() => {
    histLock = false
  }, 60)
}

function redo() {
  if (histIdx.value >= hist.value.length - 1) return
  histLock = true
  histIdx.value++
  applyHist(hist.value[histIdx.value])
  setTimeout(() => {
    histLock = false
  }, 60)
}

function applyHist(snap: string) {
  const o = JSON.parse(snap) as { pages: BuilderPage[]; cfg: BuilderCfg }
  pages.splice(0, pages.length, ...o.pages)
  for (const p of pages) normalizeBuilderPageDocId(p)
  Object.assign(cfg, o.cfg)
  ensureCfgSeo()
  void (async () => {
    await reconcileKbDocPagesFromBindings()
    normalizeBindings()
    await hydrateKbDocsForCurrentPages()
  })()
}
</script>

<style src="./siteVisualBuilder.gsb.css"></style>
<style scoped>
.page-header-wrapper {
  flex-shrink: 0;
}
.kb-vb-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}
.kb-vb-toolbar__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 6px;
}
.kb-vb-toolbar__chip {
  font-size: 11px;
  line-height: 1.2;
  color: var(--text-tertiary, #94a3b8);
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  white-space: nowrap;
}
.kb-vb-toolbar__chip--muted {
  color: var(--text-secondary, #64748b);
}
.kb-vb-toolbar__group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.kb-vb-toolbar__group--soft {
  padding: 0 2px 0 10px;
  margin-left: 2px;
  border-left: 1px solid var(--border, #e2e8f0);
}
.gsb-canvas-stage {
  position: relative;
}
.gsb-canvas-floating-toolbar {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  pointer-events: auto;
}
.vb-modal-tabs-wrap :deep(.n-tabs-nav) {
  margin-bottom: 8px;
}
.vb-modal-scroll {
  max-height: min(64vh, 560px);
  overflow-y: auto;
  padding-right: 6px;
}
.kb-visual-builder--fullscreen.gsb-app {
  height: 100vh;
  max-height: 100vh;
}
.gsb-canvas-preview {
  min-height: 0;
  border-radius: 0;
  overflow: hidden;
}
@media (max-width: 1280px) {
  .kb-vb-toolbar {
    flex-wrap: wrap;
    justify-content: flex-end;
    max-width: min(84vw, 960px);
  }
  .kb-vb-toolbar__meta {
    width: 100%;
    justify-content: flex-end;
  }
}
.np-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--tx2);
  cursor: pointer;
}
.vb-sidebar-ctx-hint {
  margin: 0 0 12px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-tertiary, #94a3b8);
}
.vb-code {
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--bg2, #f1f5f9);
}
.fi-ta {
  width: 100%;
  min-height: 64px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--bd, #e2e8f0);
  font: inherit;
  resize: vertical;
  box-sizing: border-box;
  background: var(--surface, #fff);
}
.vb-pages-head,
.vb-pages-row {
  display: grid;
  grid-template-columns: 52px 1fr minmax(0, 120px) 72px;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}
.vb-pages-head {
  font-weight: 600;
  color: var(--tx2, #64748b);
  padding: 4px 0 8px;
  border-bottom: 1px solid var(--bd, #e2e8f0);
}
.vb-pages-row {
  padding: 8px 0;
  border-bottom: 1px solid var(--bd, #e2e8f0);
  cursor: pointer;
}
.vb-pages-row.on {
  background: var(--bg2, #f1f5f9);
  border-radius: 6px;
  padding-left: 6px;
  padding-right: 6px;
  margin-left: -6px;
  margin-right: -6px;
}
.vb-pi-order {
  width: 48px !important;
  min-width: 0;
  padding: 4px 6px !important;
}
.vb-pi-title {
  font-weight: 500;
}
.vb-pi-slug {
  font-size: 10px;
  color: var(--tx3, #94a3b8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vb-pi-act {
  display: flex;
  gap: 2px;
  justify-content: flex-end;
}
.vb-pi-act .ta {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: var(--tx2, #64748b);
}
.vb-pi-act .ta:hover:not(:disabled) {
  background: var(--bg, #fff);
}
.vb-pi-act .ta:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.vb-ext-card {
  border: 1px solid var(--bd, #e2e8f0);
  border-radius: 10px;
  background: var(--surface, #fff);
  padding: 12px 12px 10px;
  margin-bottom: 10px;
}
.vb-ext-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.vb-ext-name {
  font-weight: 600;
  color: var(--tx, #0f172a);
}
.vb-ext-desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--tx2, #64748b);
}
.vb-ext-body {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--bd, #e2e8f0);
}
</style>
