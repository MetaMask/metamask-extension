import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Box, BoxBackgroundColor } from '@metamask/design-system-react';
import {
  CameraAccessErrorContent,
  CameraAccessErrorContentVariant,
} from './camera-access-error-content';
import type {
  CameraAccessErrorContentBlockedProps,
  CameraAccessErrorContentNeededProps,
} from './camera-access-error-content.types';

const MOZ_EXTENSION_DISPLAY_MOCK = 'moz-extension://ab5f75ae…d4aa03';

const meta = {
  title: 'Components/App/CameraAccessErrorContent',
  component: CameraAccessErrorContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Locale copy lives inside the component (\`useI18nContext\`).

**Variants**
- **needed** — User dismissed the permission prompt (Chromium-style flow); primary action retries the prompt.
- **blocked** — Camera denied / blocked. **Firefox**: numbered steps (step 2 uses \`mozExtensionDisplay\`). **Chromium**: Videocam hint callout, **Open settings**, and primary **Continue**.

**Blocked props (type-level)**
\`mozExtensionDisplay\` and \`onOpenSettings\` are required for \`blocked\` even though only one branch uses them at runtime (Firefox vs Chromium).

**Optional (both variants)**
\`continueLoading\` — primary button loading/disabled state.
\`rootPaddingHorizontal\` / \`rootPaddingBottom\` — outer wrapper padding on the design-system scale (default \`4\` each). Use \`0\` when embedded in a padded container (e.g. \`ModalBody\`).
`.trim(),
      },
    },
  },
  decorators: [
    (Story) => (
      <Box
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        padding={4}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <Story />
      </Box>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        CameraAccessErrorContentVariant.Needed,
        CameraAccessErrorContentVariant.Blocked,
      ],
      description:
        '`needed` — prompt dismissed. `blocked` — denied (UI branches on `isFirefox`).',
    },
    onContinue: {
      action: 'onContinue',
      description:
        'Primary button handler. Label is always the `continue` locale string.',
    },
    continueLoading: {
      control: 'boolean',
      description: 'Disables the primary button and shows a loading state.',
    },
    rootPaddingHorizontal: {
      control: { type: 'number', min: 0, max: 12, step: 1 },
      description:
        'Root horizontal padding (0–12). Default 4; use 0 inside padded parents.',
    },
    rootPaddingBottom: {
      control: { type: 'number', min: 0, max: 12, step: 1 },
      description:
        'Root bottom padding (0–12). Default 4; use 0 inside padded parents.',
    },
    isFirefox: {
      control: 'boolean',
      description:
        '`blocked` only: Firefox steps vs Chromium hint + Open settings.',
      if: { arg: 'variant', eq: CameraAccessErrorContentVariant.Blocked },
    },
    mozExtensionDisplay: {
      control: 'text',
      description:
        '`blocked` only: Firefox step 2; ignored when `isFirefox` is false.',
      if: { arg: 'variant', eq: CameraAccessErrorContentVariant.Blocked },
    },
    onOpenSettings: {
      action: 'onOpenSettings',
      description: '`blocked` only: Chromium secondary; not shown for Firefox.',
      if: { arg: 'variant', eq: CameraAccessErrorContentVariant.Blocked },
    },
  } as Meta<typeof CameraAccessErrorContent>['argTypes'],
} satisfies Meta<typeof CameraAccessErrorContent>;

export default meta;

type Story = StoryObj<typeof CameraAccessErrorContent>;

/** Default “needed” state; use Controls for `continueLoading` and root padding. */
export const Needed: Story = {
  args: {
    variant: CameraAccessErrorContentVariant.Needed,
    onContinue: () => undefined,
  } satisfies CameraAccessErrorContentNeededProps,
};

/** Primary button in a loading state. */
export const NeededContinueLoading: Story = {
  storyName: 'Needed (continue loading)',
  args: {
    variant: CameraAccessErrorContentVariant.Needed,
    continueLoading: true,
    onContinue: () => undefined,
  } satisfies CameraAccessErrorContentNeededProps,
};

export const BlockedChromium: Story = {
  storyName: 'Blocked (Chrome / Chromium)',
  args: {
    variant: CameraAccessErrorContentVariant.Blocked,
    isFirefox: false,
    mozExtensionDisplay: '',
    onContinue: () => undefined,
    onOpenSettings: () => undefined,
  } satisfies CameraAccessErrorContentBlockedProps,
};

export const BlockedFirefox: Story = {
  storyName: 'Blocked (Firefox)',
  args: {
    variant: CameraAccessErrorContentVariant.Blocked,
    isFirefox: true,
    mozExtensionDisplay: MOZ_EXTENSION_DISPLAY_MOCK,
    onContinue: () => undefined,
    onOpenSettings: () => undefined,
  } satisfies CameraAccessErrorContentBlockedProps,
};
