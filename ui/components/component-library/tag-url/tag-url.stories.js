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
    showLockIcon: true,
  },
};

const Template = (args) => <TagUrl {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

DefaultStory.args = {
  actionButtonLabel: 'Permissions',
};

export const ActionButtonLabel = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={2}>
    <TagUrl {...args} />
    <TagUrl {...args} actionButtonLabel="Action" />
    <TagUrl {...args} actionButtonLabel="Click" />
  </Box>
);

ActionButtonLabel.args = {
  actionButtonLabel: 'Permissions',
};

export const ShowLockIcon = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={2}>
    <TagUrl
      {...args}
      label="app.uniswap.org"
      src="https://uniswap.org/favicon.ico"
      showLockIcon
    />
    <TagUrl
      {...args}
      label="http://notsecure.com"
      src=""
      showLockIcon={false}
    />
  </Box>
);

export const Src = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={2}>
    <TagUrl
      {...args}
      label="app.uniswap.org"
      src="https://uniswap.org/favicon.ico"
    />
    <TagUrl
      {...args}
      label="peepeth.com"
      src="https://peepeth.com/favicon-32x32.png"
    />
    <TagUrl
      {...args}
      label="1inch.exchange"
      src="https://1inch.exchange/assets/favicon/favicon-32x32.png"
    />
    <TagUrl label="fallback" src="" />
  </Box>
);

export const Label = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={2}>
    <TagUrl {...args} />
    <TagUrl
      {...args}
      src="https://metamask.io/icons/icon-48x48.png?v=48400a28770e10dd52a8c0e539aeb282"
      label="metamask.io"
    />
    <TagUrl {...args} src="" label="metamask.github.io" />
  </Box>
);
