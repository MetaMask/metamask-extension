import React from 'react';
import UrlIcon from './url-icon';

export default {
  title: 'Components/UI/UrlIcon',

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

export const AST = () => {
  return <UrlIcon name="AST" url="AST.png" />;
};

export const BAT = () => {
  return <UrlIcon name="BAT" url="BAT_icon.svg" />;
};
