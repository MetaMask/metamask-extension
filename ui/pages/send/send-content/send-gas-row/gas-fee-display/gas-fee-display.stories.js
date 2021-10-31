import React from 'react';
import { action } from '@storybook/addon-actions';
import { number, boolean } from '@storybook/addon-knobs';
import GasFeeDisplay from './gas-fee-display.component';

export default {
  title: 'Pages/Send/Send Content/Send Gas Row/Gas Fee Display',
  id: __filename,
};

export const Base = () => {
  const gasTotal = number('Gas Total', 10000000000);
  return (
    <GasFeeDisplay
      gasTotal={gasTotal}
      gasLoadingError={boolean('Gas Loading Error', false)}
      onReset={action('OnReset')}
    />
  );
};
