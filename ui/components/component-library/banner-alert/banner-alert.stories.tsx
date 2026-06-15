import React from 'react';
import { Meta, StoryFn } from '@storybook/react';

import { BannerAlert } from './banner-alert';
import { BannerAlertSeverity } from './banner-alert.types';

export default {
  title: 'Components/ComponentLibrary/BannerAlert (deprecated)',
  component: BannerAlert,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [`BannerAlert` from `@metamask/design-system-react`](https://metamask.github.io/metamask-design-system/?path=/docs/react-components-banneralert--docs) instead. See the [Migration Guide](https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#banneralert-component) for migration details.',
      },
    },
  },
  argTypes: {
    severity: {
      control: 'select',
      options: Object.values(BannerAlertSeverity),
    },
    className: {
      control: 'text',
    },
    title: {
      control: 'text',
    },
    description: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    actionButtonLabel: {
      control: 'text',
    },
    actionButtonOnClick: {
      action: 'actionButtonOnClick',
    },
    actionButtonProps: {
      control: 'object',
    },
    onClose: {
      action: 'onClose',
    },
  },
} as Meta<typeof BannerAlert>;

const Template: StoryFn<typeof BannerAlert> = (args) => (
  <BannerAlert {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
DefaultStory.args = {
  title: 'Title is sentence case no period',
  children: "Description shouldn't repeat title. 1-3 lines.",
  actionButtonLabel: 'Action',
};
