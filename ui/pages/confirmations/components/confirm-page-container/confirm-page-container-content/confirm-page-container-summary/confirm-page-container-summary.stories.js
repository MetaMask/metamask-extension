import React from 'react';
import ConfirmPageContainerSummary from '.';

export default {
  title:
    'Confirmations/Components/ConfirmPageContainer/ConfirmPageContainerContent/ConfirmPageContainerSummary',
  argTypes: {
    action: {
      control: 'text',
    },
    title: {
      control: 'text',
    },
    image: {
      control: 'text',
    },
    titleComponent: {
      control: 'text',
    },
    subtitleComponent: {
      control: 'text',
    },
    hideSubtitle: {
      control: 'boolean',
    },
    className: {
      control: 'text',
    },
    tokenAddress: {
      control: 'text',
    },
    toAddress: {
      control: 'text',
    },
    nonce: {
      control: 'text',
    },
    origin: {
      control: 'text',
    },
    hideTitle: {
      control: 'boolean',
    },
    transactionType: {
      control: 'text',
    },
  },
  args: {
    action: 'action',
    title: 'title',
    titleComponent: 'titleComponent',
    subtitleComponent: 'subtitleComponent',
    className: 'className',
    tokenAddress: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
    toAddress: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
    nonce: 'nonce',
    origin: 'origin',
    hideTitle: 'hideTitle',
    transactionType: 'transactionType',
  },
};

export const DefaultStory = (args) => <ConfirmPageContainerSummary {...args} />;

DefaultStory.storyName = 'Default';
