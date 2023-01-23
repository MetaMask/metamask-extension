import React from 'react';
import README from './README.mdx';
import MainQuoteSummary from './main-quote-summary';

export default {
  title: 'Pages/Swaps/MainQuoteSummary',

  component: MainQuoteSummary,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    sourceValue: {
      control: 'text',
    },
    sourceDecimals: {
      control: 'number',
    },
    sourceSymbol: {
      control: 'text',
    },
    destinationValue: {
      control: 'text',
    },
    destinationDecimals: {
      control: 'number',
    },
    destinationSymbol: {
      control: 'text',
    },
    sourceIconUrl: {
      control: 'text',
    },
    destinationIconUrl: {
      control: 'text',
    },
  },
  args: {
    sourceValue: '2000000000000000000',
    sourceDecimals: 18,
    sourceSymbol: 'ETH',
    destinationValue: '200000000000000000',
    destinationDecimals: 18,
    destinationSymbol: 'ABC',
    sourceIconUrl: '.storybook/images/metamark.svg',
    destinationIconUrl: '.storybook/images/sai.svg',
  },
};

export const DefaultStory = (args) => {
  return (
    <div
      style={{
        width: '360px',
        height: '224px',
        border: '1px solid black',
        padding: '24px',
      }}
    >
      <MainQuoteSummary {...args} />
    </div>
  );
};

DefaultStory.storyName = 'Default';
