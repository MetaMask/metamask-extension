import React from 'react';

import README from './README.mdx';
import ExternalLink from '.';

const METAMASK_URL = 'https://metamask.io/';
export default {
  title: 'Components/UI/ExternalLink',

  component: ExternalLink,
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
    children: 'ExternalLink with args',
    className: 'example classname',
  },
};

export const DefaultStory = (args) => (
  <ExternalLink {...args}>{args.children}</ExternalLink>
);
DefaultStory.args = {
  class: 'test-class',
  id: 'test-id',
  href: METAMASK_URL,
};

export const LinkWithReferer = (args) => (
  <ExternalLink {...args}>{args.children}</ExternalLink>
);
LinkWithReferer.args = {
  children: 'ExternalLink with referer',
  href: METAMASK_URL,
  referer: true,
};

export const LinkWithTarget = (args) => (
  <ExternalLink {...args} href={METAMASK_URL}>
    {args.children}
  </ExternalLink>
);
LinkWithTarget.args = {
  children: 'ExternalLink with target',
  target: '_self',
  href: METAMASK_URL,
};

export const LinkWithRel = (args) => (
  <ExternalLink {...args} href={METAMASK_URL}>
    {args.children}
  </ExternalLink>
);
LinkWithRel.args = {
  children: 'ExternalLink with target',
  href: METAMASK_URL,
  rel: 'author',
};

export const LinkWithOnClick = (args) => (
  // eslint-disable-next-line no-alert
  <ExternalLink {...args} onClick={() => window.open(METAMASK_URL)}>
    {args.children}
  </ExternalLink>
);
LinkWithOnClick.args = {
  children: 'ExternalLink with onClick',
  onClick: () => window.open(METAMASK_URL),
};
