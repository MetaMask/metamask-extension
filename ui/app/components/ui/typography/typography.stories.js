import React from 'react'
import { number, select, text } from '@storybook/addon-knobs'
import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system'
import Typography from '.'

export default {
  title: 'Typography',
}

const fontWeightOptions = {
  bold: 'bold',
  normal: 'normal',
}

const alignOptions = {
  left: undefined,
  center: 'center',
  right: 'right',
}

export const list = () => (
  <div style={{ width: '80%', flexDirection: 'column' }}>
    {Object.values(TYPOGRAPHY).map((variant) => (
      <div key={variant} style={{ width: '100%' }}>
        <Typography
          variant={variant}
          color={select('color', COLORS, COLORS.BLACK)}
          spacing={number('spacing', 1, { range: true, min: 1, max: 8 })}
          align={select('align', alignOptions, undefined)}
          fontWeight={select('font weight', fontWeightOptions, 'normal')}
        >
          {variant}
        </Typography>
      </div>
    ))}
  </div>
)

export const TheQuickOrangeFox = () => (
  <div style={{ width: '80%', flexDirection: 'column' }}>
    <div style={{ width: '100%' }}>
      <Typography
        color={select('color', COLORS, COLORS.BLACK)}
        variant={select('variant', TYPOGRAPHY, TYPOGRAPHY.Paragraph)}
        spacing={number('spacing', 1, { range: true, min: 1, max: 8 })}
        align={select('align', alignOptions, undefined)}
        fontWeight={select('font weight', fontWeightOptions, 'normal')}
      >
        {text('content', 'The quick orange fox jumped over the lazy dog.')}
      </Typography>
    </div>
  </div>
)
