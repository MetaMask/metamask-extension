import React from 'react';

import README from './README.mdx';
import Link from '.';

const METAMASK_URL = 'https://metamask.io/';
export default {
  title: 'Components/UI/Link',

  component: Link,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    children: { control: 'text' },
    referer: { control: 'boolean' },
    className: { control: 'text' },
    href: { control: 'text' },
    target: { control: 'text' },
    rel: { control: 'text' },
    onClick: { action: 'clicked' },
  },
  args: {
    children: 'Link with args',
    className: 'example classname',
  },
};

export const DefaultStory = (args) => <Link {...args}>{args.children}</Link>;
DefaultStory.args = {
  class: 'test-class',
  id: 'test-id',
  href: METAMASK_URL,
};

export const LinkWithReferer = (args) => <Link {...args}>{args.children}</Link>;
LinkWithReferer.args = {
  children: 'Link with referer',
  href: METAMASK_URL,
  referer: true,
};

export const LinkWithTarget = (args) => (
  <Link {...args} href={METAMASK_URL}>
    {args.children}
  </Link>
);
LinkWithTarget.args = {
  children: 'Link with target',
  target: '_self',
  href: METAMASK_URL,
};

export const LinkWithRel = (args) => (
  <Link {...args} href={METAMASK_URL}>
    {args.children}
  </Link>
);
LinkWithRel.args = {
  children: 'Link with target',
  href: METAMASK_URL,
  rel: 'author',
};

export const LinkWithOnClick = (args) => (
  // eslint-disable-next-line no-alert
  <Link {...args} onClick={() => window.open(METAMASK_URL)}>
    {args.children}
  </Link>
);
LinkWithOnClick.args = {
  children: 'Link with onClick',
  onClick: () => window.open(METAMASK_URL),
};
