import React from 'react';

import README from './README.mdx';
import Link from '.';

export default {
  title: 'Components/UI/Link',

  component: Link,
  // parameters: {
  //   docs: {
  //     page: README,
  //   },
  // },
  argTypes: {
    children: { control: 'text' },
    referer: { control: 'boolean' },
    className: { control: 'text' },
    href: { control: 'text' },
    target: { control: 'text' },
    onClick: { action: 'clicked' },
  },
  args: {
    children: 'Link',

    className: '',
  },
};

export const DefaultStory = (args) => <Link {...args}>{args.children}</Link>;
