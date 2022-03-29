import React from 'react';
import ExchangeRateDisplay from './exchange-rate-display';

export default {
  title: 'Pages/Swaps/ExchangeRateDisplay',
  id: __filename,
};

export const DefaultStory = (args) => {
  return <ExchangeRateDisplay {...args} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.argTypes = {
  primaryTokenValue: {
    control: {
      type: 'text',
    },
    defaultValue: '2000000000000000000',
  },
  primaryTokenDecimals: {
    control: {
      type: 'number',
    },
    defaultValue: 18,
  },
  primaryTokenSymbol: {
    control: {
      type: 'text',
    },
    defaultValue: 'ETH',
  },
  secondaryTokenValue: {
    control: {
      type: 'text',
    },
    defaultValue: '200000000000000000',
  },
  secondaryTokenDecimals: {
    control: 'number',
    defaultValue: 18,
  },
  secondaryTokenSymbol: {
    control: {
      type: 'text',
    },
    defaultValue: 'ABC',
  },
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

WhiteOnBlue.argTypes = {
  primaryTokenValue: {
    control: {
      type: 'text',
    },
    defaultValue: '2000000000000000000',
  },
  primaryTokenDecimals: {
    control: {
      type: 'number',
    },
    defaultValue: 18,
  },
  primaryTokenSymbol: {
    control: {
      type: 'text',
    },
    defaultValue: 'ETH',
  },
  secondaryTokenValue: {
    control: {
      type: 'text',
    },
    defaultValue: '200000000000000000',
  },
  secondaryTokenDecimals: {
    control: {
      type: 'number',
    },
    defaultValue: 18,
  },
  secondaryTokenSymbol: {
    control: {
      type: 'text',
    },
    defaultValue: 'ABC',
  },
};
