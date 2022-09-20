import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { object } from '@storybook/addon-knobs';
import Button from '../../../components/ui/button';
import mockQuoteData from './mock-quote-data';
import README from './README.mdx';
import SelectQuotePopover from '.';

export default {
  title: 'Pages/Swaps/SelectQuotePopover',
  id: __filename,
  component: SelectQuotePopover,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    swapToSymbol: {
      control: {
        type: 'select',
      },
      options: ['ETH', 'DAI'],
    },
    initialAggId: {
      control: {
        type: 'select',
      },
      options: ['Agg1', 'Agg2', 'Agg3', 'Agg4', 'Agg5', 'Agg6'],
    },
    quoteDataRows: {
      control: 'object',
    },
    hideEstimatedGasFee: {
      control: 'boolean',
    },
  },
  args: {
    quoteDataRows: mockQuoteData,
  },
};

export const DefaultStory = (args) => {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div>
      <Button onClick={() => setShowPopover(true)}>Open Popover</Button>
      {showPopover && (
        <SelectQuotePopover
          quoteDataRows={object('quoteDataRows', mockQuoteData)}
          onClose={() => setShowPopover(false)}
          onSubmit={action('submit SelectQuotePopover')}
          swapToSymbol={args.swapToSymbol || 'DAI'}
          initialAggId={args.initialAggId || 'Agg4'}
          hideEstimatedGasFee={args.hideEstimatedGasFee || false}
        />
      )}
    </div>
  );
};

DefaultStory.storyName = 'Default';
