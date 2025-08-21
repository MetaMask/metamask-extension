# Assistant Rules: Storybook (targeting v9)

These rules guide automated edits and reviews for Storybook stories in this repo.

- **Enforce CSF 3**: Prefer `Meta` + `StoryObj` exports and story objects. Do not use `Template.bind()`.
- **Typed stories**: Use `Meta<typeof Component>` and `StoryObj<typeof meta>` to ensure type safety.
- **Args over branching**: Encode variations via `args`; avoid conditional rendering in the story body.
- **Render function usage**: Use `render` when necessary to compose wrappers or handlers; keep it minimal.
- **No side effects**: Stories must be deterministic; mock timers, network, and randomness.
- **Docs**: Prefer autodocs; add MDX only when custom narrative is needed.
- **a11y**: Ensure components are accessible; include labels/roles in examples.
- **Play functions**: Keep `play` lightweight; avoid long waits; use testing-library idioms.
- **Performance**: Avoid heavy providers unless required; memoize fixtures when large.
- **Colocation**: Keep stories next to components with `.stories.tsx` suffix.
- **Naming**: Title segments mirror folder structure under `ui/` where feasible.

## Rewrite template to CSF 3

```diff
-import { StoryFn, Meta } from '@storybook/react';
-const Template: StoryFn<Props> = (args) => <Cmp {...args} />;
-export const Default = Template.bind({});
-Default.args = { ... };
+import type { Meta, StoryObj } from '@storybook/react';
+const meta: Meta<typeof Cmp> = { title: '...', component: Cmp };
+export default meta;
+type Story = StoryObj<typeof meta>;
+export const Default: Story = { args: { ... } };
```

## References
- CSF 3: `https://storybook.js.org/docs/writing-stories#stories-in-csf-3`
- Render function: `https://storybook.js.org/docs/writing-stories#using-render-to-replace-template-bind`
- Autodocs: `https://storybook.js.org/docs/writing-docs/autodocs`
- v9 migration: `https://storybook.js.org/docs/migrations/v9`