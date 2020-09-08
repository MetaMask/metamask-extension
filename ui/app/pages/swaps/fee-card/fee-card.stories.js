import React from 'react'
import { action } from '@storybook/addon-actions'
import { text } from '@storybook/addon-knobs/react'
import FeeCard from './fee-card'

const containerStyle = {
  width: '300px',
}

export default {
  title: 'FeeCard',
}

export const WithSecondRow = () => {
  return (
    <div style={containerStyle}>
      <FeeCard
        onFeeRowClick={action('Fee row link clicked')}
        feeRowText={text('feeRowText', 'Network fees')}
        feeRowLinkText={text('feeRowLinkText', 'Edit')}
        primaryFee={text('primaryFee', '1 ETH')}
        secondaryFee={text('secondaryFee', '$300.57')}
        onSecondRowClick={action('Second row link clicked')}
        secondRowText={text('secondRowText', 'This calls a contract')}
        secondRowLinkText={text('secondRowLinkText', 'Learn More')}
      />
    </div>
  )
}

export const WithoutSecondRow = () => {
  return (
    <div style={containerStyle}>
      <FeeCard
        onFeeRowClick={action('Fee row link clicked')}
        feeRowText={text('feeRowText', 'Network fees')}
        feeRowLinkText={text('feeRowLinkText', 'Edit')}
        primaryFee={text('primaryFee', '1 ETH')}
        secondaryFee={text('secondaryFee', '$300.57')}
        onSecondRowClick={action('Second row link clicked')}
        secondRowText={text('secondRowText', 'This calls a contract')}
        secondRowLinkText={text('secondRowLinkText', 'Learn More')}
        hideSecondRow
      />
    </div>
  )
}
