# Third-party extension example (shared registry panel)

This folder demonstrates how **another plugin** can provide:

- A **site-renderer extension** (injects Slot instances into the renderer)
- A **config panel component** that is discovered via the host **shared component registry**

The goal is to make the KB visual builder automatically render the extension panel (no hard-coded UI in KB).

---

## 1) Register the extension (in your plugin)

In your plugin frontend entry (or an init file that runs once), call:

```ts
import { registerHelloWorldThirdPartyExtension } from './ThirdPartyHelloExtension'

registerHelloWorldThirdPartyExtension()
```

> In a real “other plugin” you’d import `registerExtension()` from the shared package/module
> (or expose a global bridge API) instead of importing from kb plugin source directly.

---

## 2) Provide the config panel via host shared registry

Your extension definition points to a config panel by `category + name`:

```ts
configPanel: {
  category: 'site-renderer.extension-panel',
  name: 'HelloWorldThirdPartyPanel',
}
```

So the **host** (or an appstore/registry plugin) must register the actual Vue component under that key.

Pseudo-code inside the host (the provider of `sharedComponentsGetRegistry`):

```ts
import HelloWorldThirdPartyPanel from 'your-plugin/HelloWorldThirdPartyPanel.vue'

registerSharedComponent('site-renderer.extension-panel', 'HelloWorldThirdPartyPanel', HelloWorldThirdPartyPanel)
```

And the host must expose `sharedComponentsGetRegistry` via Vue provide, same as the pattern in
`gress-plugin-codegen/frontend/src/views/SystemSettings.vue`.

---

## 3) Panel component contract

The panel component should implement:

- `props: { options?: Record<string, any> }`
- `emits: { 'update:options': (opts: Record<string, any>) => void }`

KB visual builder will render it as:

```vue
<component
  :is="Panel"
  :options="extCfg.options"
  @update:options="(v) => (extCfg.options = v)"
/>
```

