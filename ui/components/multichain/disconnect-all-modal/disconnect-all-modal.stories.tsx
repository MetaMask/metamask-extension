import React from 'react';
import { DisconnectAllModal } from '.';
import { DisconnectType } from './disconnect-all-modal';

export default {
  title: 'Components/Multichain/DisconnectAllModal',
  component: DisconnectAllModal,
  argTypes: {
    type: { control: 'string' },
    hostname: { control: 'string' },
    onClose: { action: 'onClose' },
    onClick: { action: 'onClose' }
  },
  args: {
    type: DisconnectType.Account,
    hostname: 'portfolio.metamask.io',
    onClick: () => undefined,
    onClose: () => undefined,
  }
};

export const DefaultStory = (args) => <DisconnectAllModal {...args} />;

DefaultStory.storyName = 'Default';
