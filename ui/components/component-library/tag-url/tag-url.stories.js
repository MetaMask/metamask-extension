import React from 'react';
import {
  DISPLAY,
  FLEX_DIRECTION,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';
import README from './README.mdx';
import { TagUrl } from './tag-url';

export default {
  title: 'Components/ComponentLibrary/TagUrl',
  id: __filename,
  component: TagUrl,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    label: {
      control: 'text',
    },
    src: {
      control: 'text',
    },
    actionButtonLabel: {
      control: 'text',
    },
    showLockIcon: {
      control: 'boolean',
    },
  },
  args: {
    label: 'app.uniswap.org',
    src: 'https://uniswap.org/favicon.ico',
    showLockIcon: false,
  },
};

const Template = (args) => <TagUrl {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const ActionButtonLabel = Template.bind({});
ActionButtonLabel.args = {
  actionButtonLabel: 'Permissions',
};

export const ShowLockIcon = Template.bind({});
ShowLockIcon.args = {
  showLockIcon: true,
};

export const Label = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={2}>
    <TagUrl {...args} label="https://widget.getacute.io" />
    <TagUrl {...args} label="app.uniswap.org" />
    <TagUrl {...args} label="https://metamask.github.io" />
  </Box>
);

export const Src = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={2}>
    <TagUrl
      {...args}
      label="peepeth.com"
      src="https://peepeth.com/favicon-32x32.png"
    />
    <TagUrl
      {...args}
      label="https://1inch.exchange"
      src="https://1inch.exchange/assets/favicon/favicon-32x32.png"
    />
    <TagUrl
      {...args}
      label="app.uniswap.org"
      src="https://uniswap.org/favicon.ico"
    />
  </Box>
);
