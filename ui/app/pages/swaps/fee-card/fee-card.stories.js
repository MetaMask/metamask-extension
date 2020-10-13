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

export const WithAllProps = () => {
  return (
    <div style={containerStyle}>
      <FeeCard
        feeRowText={text('feeRowText', 'Network fees')}
        primaryFee={({
          fee: text('primaryFee', '1 ETH'),
          maxFee: text('primaryMaxFee', '2 ETH'),
        })}
        secondaryFee={({
          fee: text('secondaryFee', '100 USD'),
          maxFee: text('secondaryMaxFee', '200 USD'),
        })}
        maxFeeRow={({
          text: text('maxFeeText', 'Max Fee'),
          linkText: text('maxFeeLinkText', 'Edit'),
          tooltipText: text('maxFeeTooltipText', 'Click here to edit.'),
          onClick: action('Clicked max fee row link'),
        })}
        thirdRow={({
          text: text('thirdRowText', 'Extra Option'),
          linkText: text('thirdRowLinkText', 'Click Me'),
          tooltipText: text('thirdRowTooltipText', 'Something happens if you click this'),
          onClick: action('Clicked third row link'),
          hide: false,
        })}
      />
    </div>
  )
}

export const WithoutThirdRow = () => {
  return (
    <div style={containerStyle}>
      <FeeCard
        feeRowText={text('feeRowText', 'Network fees')}
        primaryFee={({
          fee: text('primaryFee', '1 ETH'),
          maxFee: text('primaryMaxFee', '2 ETH'),
        })}
        secondaryFee={({
          fee: text('secondaryFee', '100 USD'),
          maxFee: text('secondaryMaxFee', '200 USD'),
        })}
        maxFeeRow={({
          text: text('maxFeeText', 'Max Fee'),
          linkText: text('maxFeeLinkText', 'Edit'),
          tooltipText: text('maxFeeTooltipText', 'Click here to edit.'),
          onClick: action('Clicked max fee row link'),
        })}
        thirdRow={({
          text: text('thirdRowText', 'Extra Option'),
          linkText: text('thirdRowLinkText', 'Click Me'),
          tooltipText: text('thirdRowTooltipText', 'Something happens if you click this'),
          onClick: action('Clicked third row link'),
          hide: true,
        })}
      />
    </div>
  )
}

export const WithOnlyRequiredProps = () => {
  return (
    <div style={containerStyle}>
      <FeeCard
        feeRowText={text('feeRowText', 'Network fees')}
        primaryFee={({
          fee: text('primaryFee', '1 ETH'),
          maxFee: text('primaryMaxFee', '2 ETH'),
        })}
        maxFeeRow={({
          text: text('maxFeeText', 'Max Fee'),
          linkText: text('maxFeeLinkText', 'Edit'),
          tooltipText: text('maxFeeTooltipText', 'Click here to edit.'),
          onClick: action('Clicked max fee row link'),
        })}
      />
    </div>
  )
}
