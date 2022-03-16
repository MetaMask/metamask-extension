import React from 'react';
import UrlIcon from './url-icon';

export default {
  title: 'Components/UI/UrlIcon',
  id: __filename,
  argType: {
    name: { description: 'Icon Name', control: 'text' },
    url: { description: 'Icon File URL', control: 'text' },
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
  return <UrlIcon name={args.name} url={args.url} />;
};

export const AST = () => {
  return <UrlIcon name="AST" url="AST.png" />;
};

export const BAT = () => {
  return <UrlIcon name="BAT" url="BAT_icon.svg" />;
};
