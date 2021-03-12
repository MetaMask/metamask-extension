import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { object } from '@storybook/addon-knobs';
import Button from '../../../components/ui/button';
import mockQuoteData from './mock-quote-data';
import SelectQuotePopover from '.';

export default {
  title: 'SelectQuotePopover',
};

export const Default = () => {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div>
      <Button onClick={() => setShowPopover(true)}>Open Popover</Button>
      {showPopover && (
        <SelectQuotePopover
          quoteDataRows={object('quoteDataRows', mockQuoteData)}
          onClose={() => setShowPopover(false)}
          onSubmit={action('submit SelectQuotePopover')}
          swapToSymbol="DAI"
          initialAggId="Agg4"
        />
      )}
    </div>
  );
};
