import React from 'react';
import { boolean } from '@storybook/addon-knobs';

import ImportToken from './import-token.component';

export default {
  title: 'Pages/ImportToken',
  id: __filename,
};

export const Base = () => {
  return <ImportToken showSearchTab={boolean('Show Search Tab', false)} />;
};
