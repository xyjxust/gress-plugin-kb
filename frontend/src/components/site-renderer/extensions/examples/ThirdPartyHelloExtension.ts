import type { SiteExtensionDefinition } from '../extensionRegistry'
import { registerExtension } from '../extensionRegistry'

/**
 * Example: an extension provided by ANOTHER plugin.
 *
 * - Config UI is NOT implemented in KB builder
 * - Instead, builder discovers a config panel via host shared registry:
 *   category: 'site-renderer.extension-panel'
 *   name:     'HelloWorldThirdPartyPanel'
 *
 * The panel must implement:
 * - props: { options?: Record<string, any> }
 * - emits: { 'update:options': (opts) => void }
 */

export const EXT_THIRD_PARTY_HELLO_ID = 'third-party-hello'

const ThirdPartyHello: SiteExtensionDefinition = {
  id: EXT_THIRD_PARTY_HELLO_ID,
  name: '第三方示例：Hello 扩展',
  description: '示例：由其他插件提供，通过共享 registry 注入配置面板，并注入一个 slot 组件实例。',
  configPanel: {
    category: 'site-renderer.extension-panel',
    name: 'HelloWorldThirdPartyPanel',
  },
  defaultOptions: {
    slotKey: 'content-top',
    text: 'Hello from third-party plugin',
  },
  inject(_ctx, options) {
    const slotKey = String(options.slotKey || 'content-top')
    const text = String(options.text || 'Hello from third-party plugin')
    return [
      {
        slotKey,
        instances: [
          {
            instanceId: 'ext-third-party-hello',
            componentKey: 'Announcement',
            order: 60,
            props: {
              badge: 'EXT',
              title: 'Third-party extension',
              text,
              linkText: 'OK',
              bg: '#ecfeff',
              color: '#0e7490',
              closable: true,
            },
          },
        ],
      },
    ]
  },
}

export function registerHelloWorldThirdPartyExtension(): void {
  registerExtension(ThirdPartyHello)
}

