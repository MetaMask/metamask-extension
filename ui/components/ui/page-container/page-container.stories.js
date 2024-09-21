import React from 'react';
import PageContainer from '.';

export default {
  title: 'Components/UI/PageContainer',

  argTypes: {
    backButtonString: {
      control: 'text',
    },
    backButtonStyles: {
      control: 'object',
    },
    headerCloseText: {
      control: 'text',
    },
    onBackButtonClick: {
      action: 'onBackButtonClick',
    },
    onClose: {
      action: 'onClose',
    },
    showBackButton: {
      control: 'boolean',
    },
    subtitle: {
      control: 'text',
    },
    title: {
      control: 'text',
    },
    defaultActiveTabIndex: {
      control: 'number',
    },
    tabsComponent: {
      control: 'node',
    },
    contentComponent: {
      control: 'node',
    },
    cancelText: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    hideCancel: {
      control: 'boolean',
    },
    onCancel: {
      action: 'onCancel',
    },
    onSubmit: {
      action: 'onSubmit',
    },
    submitText: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => (
  <PageContainer {...args}>Page container</PageContainer>
);

DefaultStory.storyName = 'Default';
