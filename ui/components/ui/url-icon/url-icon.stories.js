import React from 'react';
import UrlIcon from './url-icon';

export default {
  title: 'Components/UI/UrlIcon (deprecated)',
  component: UrlIcon,
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release.',
      },
    },
  },
  argType: {
    name: { control: 'text' },
    url: { control: 'text' },
    className: { control: 'text' },
    fallbackClassName: { control: 'text' },
  },
  args: {
    name: 'AST',
    url: 'AST.png',
    className: '',
    fallbackClassName: '',
  },
};

export const DefaultStory = (args) => {
  return (
    <UrlIcon
      name={args.name}
      url={args.url}
      className={args.className}
      fallbackClassName={args.fallbackClassName}
    />
  );
};

DefaultStory.storyName = 'Default';
