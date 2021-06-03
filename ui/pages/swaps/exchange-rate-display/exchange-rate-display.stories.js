import React from 'react';
import { text, number } from '@storybook/addon-knobs';
import ExchangeRateDisplay from './exchange-rate-display';

export default {
  title: 'ExchangeRateDisplay',
};

export const Default = () => {
  return (
    <ExchangeRateDisplay
      primaryTokenValue={text('primaryTokenValue', '2000000000000000000')}
      primaryTokenDecimals={number('primaryTokenDecimals', 18)}
      primaryTokenSymbol={text('primaryTokenSymbol', 'ETH')}
      secondaryTokenValue={text('secondaryTokenValue', '200000000000000000')}
      secondaryTokenDecimals={number('secondaryTokenDecimals', 18)}
      secondaryTokenSymbol={text('secondaryTokenSymbol', 'ABC')}
    />
  );
};

export const WhiteOnBlue = () => {
  return (
    <div
      style={{
        width: '150px',
        height: '30px',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(90deg, #037DD6 0%, #1098FC 101.32%)',
      }}
    >
      <ExchangeRateDisplay
        primaryTokenValue={text('primaryTokenValue', '2000000000000000000')}
        primaryTokenDecimals={number('primaryTokenDecimals', 18)}
        primaryTokenSymbol={text('primaryTokenSymbol', 'ETH')}
        secondaryTokenValue={text('secondaryTokenValue', '200000000000000000')}
        secondaryTokenDecimals={number('secondaryTokenDecimals', 18)}
        secondaryTokenSymbol={text('secondaryTokenSymbol', 'ABC')}
        className="exchange-rate-display--white"
        arrowColor="white"
      />
    </div>
  );
};
