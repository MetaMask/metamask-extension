import React from 'react';
import { action } from '@storybook/addon-actions';
import { number, boolean } from '@storybook/addon-knobs';
import GasFeeDisplay from './gas-fee-display.component';

export default {
  title: 'Pages/Send/SendContent/SendGasRow/GasFeeDisplay',
  id: __filename,
};

export const DefaultStory = () => {
  const gasTotal = number('Gas Total', 10000000000);
  return (
    <GasFeeDisplay
      gasTotal={gasTotal}
      gasLoadingError={boolean('Gas Loading Error', false)}
      onReset={action('OnReset')}
    />
  );
};

DefaultStory.storyName = 'Default';
