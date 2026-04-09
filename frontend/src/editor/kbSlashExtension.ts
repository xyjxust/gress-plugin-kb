import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { VueRenderer } from '@tiptap/vue-3'
import KbSlashMenu from './KbSlashMenu.vue'
import { filterSlashItems, type KbSlashHandlers, type KbSlashItem } from './kbSlashItems'

export const kbSlashPluginKey = new PluginKey('kbSlashCommands')

export interface KbSlashCommandsOptions {
  slashHandlers: KbSlashHandlers
}

export const KbSlashCommands = Extension.create<KbSlashCommandsOptions>({
  name: 'kbSlashCommands',

  addOptions() {
    return {
      slashHandlers: {} as KbSlashHandlers
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    const { slashHandlers } = this.options

    return [
      Suggestion<KbSlashItem, KbSlashItem>({
        pluginKey: kbSlashPluginKey,
        editor,
        char: '/',
        allowedPrefixes: null,
        allowSpaces: true,
        allow: ({ editor: ed, state, range }) => {
          const $from = state.doc.resolve(range.from)
          for (let d = $from.depth; d > 0; d--) {
            const name = $from.node(d).type.name
            if (name === 'codeBlock') return false
          }
          return ed.isEditable
        },
        items: ({ query }) => filterSlashItems(query, slashHandlers),
        command: ({ editor: ed, range, props: item }) => {
          item.command({ editor: ed, range })
        },
        render: () => {
          let component: VueRenderer | null = null
          let mountedEl: Element | null = null

          const cleanup = () => {
            if (mountedEl?.parentNode) {
              mountedEl.parentNode.removeChild(mountedEl)
            }
            mountedEl = null
            component?.destroy()
            component = null
          }

          return {
            onStart: (props) => {
              cleanup()
              // 无候选项时不展示菜单，避免出现“无匹配命令”干扰
              if (!props.items?.length) return
              component = new VueRenderer(KbSlashMenu, {
                editor: props.editor,
                props
              })
              mountedEl = component.element
              if (mountedEl) {
                document.body.appendChild(mountedEl)
              }
            },
            onUpdate(props) {
              if (!props.items?.length) {
                cleanup()
                return
              }
              if (!component) {
                component = new VueRenderer(KbSlashMenu, {
                  editor: props.editor,
                  props
                })
                mountedEl = component.element
                if (mountedEl) {
                  document.body.appendChild(mountedEl)
                }
                return
              }
              component?.updateProps(props)
            },
            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                props.event.preventDefault()
                return true
              }
              const handled = component?.ref?.handleKeyDown?.(props.event)
              return !!handled
            },
            onExit() {
              cleanup()
            }
          }
        }
      })
    ]
  }
})
