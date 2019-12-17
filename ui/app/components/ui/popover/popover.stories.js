import React from 'react'
import { storiesOf } from '@storybook/react'
import PopOver from './popover.component'
// import { text } from '@storybook/addon-knobs/react'

const containerStyle = {
  width: 800,
  height: 600,
  background: 'pink',
  position: 'relative'
}

storiesOf('PopOver', module)
  .add('PopOver - Approve', () => (
    <div style={containerStyle}>
        <PopOver />
    </div>
  ))