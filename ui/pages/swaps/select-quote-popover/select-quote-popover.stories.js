import React, { useState } from 'react';
import Button from '../../../components/ui/button';
import mockQuoteData from './mock-quote-data';
import README from './README.mdx';
import SelectQuotePopover from '.';

export default {
  title: 'Pages/Swaps/SelectQuotePopover',

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
      control: {
        type: 'object',
      },
    },
    hideEstimatedGasFee: {
      control: 'boolean',
    },
    onSubmit: {
      action: 'onSubmit',
    },
  },
  args: {
    quoteDataRows: mockQuoteData,
  },
};

export const DefaultStory = (args) => {
  const [showPopover, setShowPopover] = useState(false);

  const handleSubmit = () => {
    setShowPopover(false);
    args.onSubmit();
  };

  return (
    <div>
      <Button onClick={() => setShowPopover(true)}>Open Popover</Button>
      {showPopover && (
        <SelectQuotePopover
          quoteDataRows={args.quoteDataRows}
          onClose={() => setShowPopover(false)}
          onSubmit={handleSubmit}
          swapToSymbol={args.swapToSymbol || 'DAI'}
          initialAggId={args.initialAggId || 'Agg4'}
          hideEstimatedGasFee={args.hideEstimatedGasFee || false}
        />
      )}
    </div>
  );
};

DefaultStory.storyName = 'Default';
