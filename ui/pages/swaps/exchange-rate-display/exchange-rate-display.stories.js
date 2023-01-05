import React from 'react';
import ExchangeRateDisplay from './exchange-rate-display';

export default {
  title: 'Pages/Swaps/ExchangeRateDisplay',

  argTypes: {
    primaryTokenValue: {
      control: {
        type: 'text',
      },
    },
    primaryTokenDecimals: {
      control: {
        type: 'number',
      },
    },
    primaryTokenSymbol: {
      control: {
        type: 'text',
      },
    },
    secondaryTokenValue: {
      control: {
        type: 'text',
      },
    },
    secondaryTokenDecimals: {
      control: 'number',
    },
    secondaryTokenSymbol: {
      control: {
        type: 'text',
      },
    },
  },
};

export const DefaultStory = (args) => {
  return <ExchangeRateDisplay {...args} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  primaryTokenValue: '2000000000000000000',
  primaryTokenDecimals: 18,
  primaryTokenSymbol: 'ETH',
  secondaryTokenValue: '200000000000000000',
  secondaryTokenDecimals: 18,
  secondaryTokenSymbol: 'ABC',
};

export const WhiteOnBlue = (args) => {
  return (
    <div
      style={{
        width: '150px',
        height: '30px',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background:
          'linear-gradient(90deg, var(--color-primary-default) 0%, var(--color-primary-muted) 101.32%)',
      }}
    >
      <ExchangeRateDisplay {...args} />
    </div>
  );
};

WhiteOnBlue.args = {
  primaryTokenValue: '2000000000000000000',
  primaryTokenDecimals: 18,
  primaryTokenSymbol: 'ETH',
  secondaryTokenValue: '200000000000000000',
  secondaryTokenDecimals: 18,
  secondaryTokenSymbol: 'ABC',
};
