import React from 'react';
import { action } from '@storybook/addon-actions';
import ImportToken from './import-token';

export default {
  title: 'Import Token',
};

export const ImportTokenComponent = () => {
  const data = {
    iconUrl: './BAT_icon.svg',
    name: 'Basic Attention Token',
    symbol: 'BAT',
    address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
  };
  return (
    <ImportToken
      tokenForImport={data}
      onImportTokenClick={action('Token Imported')}
    />
  );
};
