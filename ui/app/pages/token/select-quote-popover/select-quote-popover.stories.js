import React from 'react'
import { action } from '@storybook/addon-actions'
import { object, boolean } from '@storybook/addon-knobs/react'
import mockQuoteData from './mock-quote-data'
import SelectQuotePopover from '.'

export default {
  title: 'SelectQuotePopover',
}

export const Default = () => {
  return (
    <div>
      {(boolean('shown select quote popover', false) && (
        <SelectQuotePopover
          quoteDataRows={object('quoteDataRows', mockQuoteData)}
          onClose={action('close SelectQuotePopover')}
          onSubmit={action('submit SelectQuotePopover')}
          convertToSymbol="DAI"
        />
      ))}
    </div>
  )
}
