import React from 'react';
import { text } from '@storybook/addon-knobs';
import Tree from './tree.component';

export default {
  title: 'Tree',
  id: __filename,
};

export const flatTree = () => {
  return <Tree />;
};
