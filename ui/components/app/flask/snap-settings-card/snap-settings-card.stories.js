import React from 'react';
import { useArgs } from '@storybook/client-api';

// import README from './README.mdx';
import SnapSettingsCard from '.';

export default {
  title: 'App/Flask/SnapSettingsCard',
  id: __filename,
  component: SnapSettingsCard,
  parameters: {
    docs: {
      //   page: README,
    },
  },
  argTypes: {
    name: {
      control: 'text',
    },
    description: {
      control: 'text',
    },
    iconUrl: {
      control: 'text',
    },
    dateAdded: {
      control: 'text',
    },
    version: {
      control: 'text',
    },
    url: {
      control: 'text',
    },
    onToggle: {
      action: 'onToggle',
    },
    isEnabled: {
      control: 'boolean',
    },
    onClick: {
      action: 'onClick',
    },
    status: {
      control: {
        type: 'select',
      },
      options: ['installing', 'stopped', 'running', 'crashed'],
    },
    className: {
      control: 'string',
    },
    cardProps: {
      control: 'object',
    },
    toggleButtonProps: {
      control: 'object',
    },
    buttonProps: {
      control: 'object',
    },
    chipProps: {
      control: 'object',
    },
  },
};

export const DefaultStory = (args) => {
  const [{ isEnabled }, updateArgs] = useArgs();

  const handleOnToggle = () => {
    updateArgs({
      isEnabled: !isEnabled,
      status: isEnabled ? 'stopped' : 'running',
    });
  };
  return (
    <SnapSettingsCard
      {...args}
      isEnabled={isEnabled}
      onToggle={handleOnToggle}
    />
  );
};

DefaultStory.storyName = 'Default';

let d = new Date();
d = d.toDateString();

DefaultStory.args = {
  name: 'Snap name',
  description:
    'This snap provides developers everywhere access to an entirely new data storage paradigm, even letting your programs store data autonomously.',
  iconUrl: 'AST.png',
  dateAdded: d,
  version: '10.5.1234',
  url: 'https://metamask.io/',
  status: 'stopped',
};
