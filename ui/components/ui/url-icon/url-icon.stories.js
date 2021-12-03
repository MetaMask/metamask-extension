import React from 'react';
import { text } from '@storybook/addon-knobs';
import UrlIcon from './url-icon';

export default {
  title: 'Components/UI/UrlIcon',
  id: __filename,
};

export const AST = () => {
  return <UrlIcon name="AST" url="AST.png" />;
};

export const BAT = () => {
  return <UrlIcon name="BAT" url="BAT_icon.svg" />;
};

export const CustomProps = () => {
  return (
    <UrlIcon
      name={text('Symbol', '')}
      url={text('Icon URL', '')}
      className={text('className', '')}
      fallbackClassName={text('fallbackClassName', '')}
    />
  );
};
