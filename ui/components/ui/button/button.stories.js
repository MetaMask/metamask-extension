import React from 'react';

import BuyIcon from '../icon/overview-buy-icon.component';

import README from './README.mdx';
import Button from '.';

export default {
  title: 'Components/UI/Button',

  component: Button,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    children: { control: 'text' },
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
        'inline',
      ],
    },
    large: { control: 'boolean' },
    icon: {
      control: {
        type: 'select',
      },
      options: ['BuyIcon'],
      mapping: {
        BuyIcon: <BuyIcon />,
      },
    },
    submit: { control: 'boolean' },
    disabled: { control: 'boolean' },
    className: { control: 'text' },
    onClick: { action: 'clicked' },
  },
  args: {
    disabled: false,
    large: false,
    submit: false,
    className: '',
    rounded: true,
  },
};

export const DefaultStory = (args) => (
  <Button {...args}>{args.children}</Button>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  children: 'Default',
};

export const Type = (args) => (
  <>
    <Button {...args} type="default">
      {args.children || 'Default'}
    </Button>
    <br />
    <Button {...args} type="primary">
      {args.children || 'Primary'}
    </Button>
    <br />
    <Button {...args} type="secondary">
      {args.children || 'Secondary'}
    </Button>
    <br />
    <Button {...args} type="warning">
      {args.children || 'Warning'}
    </Button>
    <br />
    <Button {...args} type="danger">
      {args.children || 'Danger'}
    </Button>
    <br />
    <Button {...args} type="danger-primary">
      {args.children || 'Danger primary'}
    </Button>
    <br />
    <Button {...args} type="raised">
      {args.children || 'Raised'}
    </Button>
    <br />
    <Button {...args} type="link">
      {args.children || 'Link'}
    </Button>
    <br />
    <Button {...args} type="inline">
      {args.children || 'Inline'}
    </Button>
  </>
);

Type.args = {
  children: '',
};

export const TypeLink = (args) => (
  <Button type={args.type}>{args.children}</Button>
);

TypeLink.args = {
  href: 'https://metamask.io/',
  type: 'link',
  children: 'Click me',
};

export const TypeInline = (args) => (
  <div>
    this is a inline button
    <Button type={args.type}>{args.children}</Button>
  </div>
);

TypeInline.args = {
  type: 'inline',
  children: 'Click me',
};

export const Icon = (args) => <Button {...args}>{args.children}</Button>;

Icon.args = {
  type: 'primary',
  icon: <BuyIcon />,
  children: 'Buy',
};

export const Submit = (args) => (
  <Button type={args.type} submit={args.submit}>
    {args.children}
  </Button>
);

Submit.args = {
  type: 'primary',
  submit: true,
  children: 'Submit',
};
