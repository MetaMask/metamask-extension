import React from 'react';
import { boolean } from '@storybook/addon-knobs';

import AddToken from './add-token.component';

export default {
  title: 'Add Token',
};

export const AddTokenComponent = () => {
  return <AddToken showSearchTab={boolean('Show Search Tab', false)} />;
};
