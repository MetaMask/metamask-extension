import React from 'react'
import { text } from '@storybook/addon-knobs/react'
import CaretToggle from '.'

export default {
  title: 'CaretToggleDropdown',
}

export const basic = () => (
  <div style={{ height: '200px' }}>
    <CaretToggle text="Example">
      {text('text', 'Example Content')}
    </CaretToggle>
  </div>
)
