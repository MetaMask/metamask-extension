import React from 'react'
import { text, number, boolean } from '@storybook/addon-knobs/react'
import MainQuoteSummary from './main-quote-summary'

export default {
  title: 'MainQuoteSummary',
}

export const BestQuote = () => {
  return (
    <MainQuoteSummary
      sourceValue={text('sourceValue', '2000000000000000000')}
      sourceDecimals={number('sourceDecimals', 18)}
      sourceSymbol={text('sourceSymbol', 'ETH')}
      destinationValue={text('destinationValue', '200000000000000000')}
      destinationDecimals={number('destinationDecimals', 18)}
      destinationSymbol={text('destinationSymbol', 'ABC')}
      isBestQuote={boolean('isBestQuote', true)}
    />
  )
}

export const NotBestQuote = () => {
  return (
    <MainQuoteSummary
      sourceValue={text('sourceValue', '2000000000000000000')}
      sourceDecimals={number('sourceDecimals', 18)}
      sourceSymbol={text('sourceSymbol', 'ETH')}
      destinationValue={text('destinationValue', '200000000000000000')}
      destinationDecimals={number('destinationDecimals', 18)}
      destinationSymbol={text('destinationSymbol', 'ABC')}
      isBestQuote={boolean('isBestQuote', false)}
    />
  )
}
