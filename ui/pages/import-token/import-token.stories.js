import React from 'react';
import { boolean } from '@storybook/addon-knobs';

import ImportToken from './import-token.component';

export default {
  title: 'Import Token',
  id: __filename,
};

export const ImportTokenComponent = () => {
  return <ImportToken showSearchTab={boolean('Show Search Tab', false)} />;
};
