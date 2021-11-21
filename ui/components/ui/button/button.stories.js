import React from 'react';

import BuyIcon from '../icon/overview-buy-icon.component';

import README from './README.mdx';
import Button from '.';

export default {
  title: 'Button',
  id: __filename,
  component: Button,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    children: { control: 'text' },
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' },
    type: {
      control: {
        type: 'select',
      },
      options: [
        'default',
        'primary',
        'secondary',
        'warning',
        'danger',
        'danger-primary',
        'link',
      ],
    },
    submit: { control: 'boolean' },
    large: { control: 'boolean' },
    className: { control: 'text' },
    icon: {
      control: {
        type: 'select',
      },
      options: ['BuyIcon'],
      mapping: {
        BuyIcon: <BuyIcon />,
      },
    },
  },
};

export const DefaultStory = (args) => (
  <Button {...args}>{args.children}</Button>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  children: 'Default',
};

export const Types = (args) => (
  <>
    <Button {...args} type="default">
      {args.children || 'Default'}
    </Button>
    <Button {...args} type="primary">
      {args.children || 'Primary'}
    </Button>
    <Button {...args} type="secondary">
      {args.children || 'Secondary'}
    </Button>
    <Button {...args} type="warning">
      {args.children || 'Warning'}
    </Button>
    <Button {...args} type="danger">
      {args.children || 'Danger'}
    </Button>
    <Button {...args} type="danger-primary">
      {args.children || 'Danger primary'}
    </Button>
    <Button {...args} type="link">
      {args.children || 'Link'}
    </Button>
  </>
);

export const LinkType = (args) => <Button {...args} type="link" />;

LinkType.args = {
  children: 'Click me',
};

export const WithIcon = (args) => (
  <Button {...args} type="primary" icon={<BuyIcon />}>
    {args.children || 'Buy'}
  </Button>
);
