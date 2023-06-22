import React from 'react';

import { SEVERITIES } from '../../../helpers/constants/design-system';
import { BannerAlert } from '../../component-library';

import IconTokenSearch from '../icon/icon-token-search';

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
      options: ['IconTokenSearch'],
      mapping: {
        IconTokenSearch: <IconTokenSearch />,
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
  <>
    <BannerAlert
      marginBottom={4}
      severity={SEVERITIES.WARNING}
      title="Deprecated"
      description="This version of Button has been deprecated in favor of the component-library version. Contribute to replacing old Button with new Button by submitting a PR to metamask-extension."
      actionButtonLabel="See details"
      actionButtonProps={{
        href: 'https://github.com/MetaMask/metamask-extension/issues/18896',
      }}
    />
    <Button {...args}>{args.children}</Button>
  </>
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
  icon: <IconTokenSearch />,
  children: 'Search',
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
