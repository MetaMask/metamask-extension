# Storybook Rules and Best Practices (targeting v9)

- **Prefer CSF 3**: Use exported `meta` and `StoryObj` with `render` instead of `Template.bind()`.
- **Colocate stories**: Keep `*.stories.(ts|tsx|js)` next to the component.
- **Type stories**: Use `Meta<typeof Component>` and `StoryObj<typeof meta>` to get type-safe args and controls.
- **Use `args` for variations**: Encode states via `args` and `argTypes`, avoid ad-hoc `useState` unless demonstrating controlled behavior.
- **Minimal decorators**: Prefer per-story `decorators` over global when possible. Keep global decorators stable and fast.
- **Controls-first**: Expose props via controls; avoid hard-coded values unless required for the scenario.
- **Accessibility**: Enable a11y addon; write stories that reflect accessible usage. Label interactive elements.
- **Performance**: Keep stories simple and deterministic. Avoid network calls; mock with fixtures.
- **MDX docs**: Use autodocs where possible. For custom docs, prefer MDX with `Meta`, `Story`, `ArgsTable`.
- **File naming**: Use kebab-case for filenames and PascalCase for components; suffix stories with `.stories.tsx`.
- **Play function (sparingly)**: Use `play` for basic interactions and assertions; keep fast and deterministic.
- **No snapshot-only stories**: Prefer interactive stories with controls over static snapshot stories.
- **Theming**: If theming is needed, add a story-level decorator that wraps the component in the theme provider.
- **CSF migration**: Replace `Template.bind({})` with `export const Name: Story = { args: {}, render: ... }`.

## Example (CSF 3)

```ts
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './my-component';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Click me' },
};

export const WithHandler: Story = {
  args: { label: 'Open' },
  render: (args) => <MyComponent {...args} onClick={() => console.log('clicked')} />,
};
```

## References
- CSF 3 documentation: `https://storybook.js.org/docs/writing-stories#stories-in-csf-3` 
- Rendering and args: `https://storybook.js.org/docs/writing-stories/args` 
- MDX docs: `https://storybook.js.org/docs/writing-docs/mdx` 
- Migrating from templates: `https://storybook.js.org/docs/writing-stories#using-render-to-replace-template-bind` 
- Storybook 9 migration guide: `https://storybook.js.org/docs/migrations/v9` 