import React from 'react'
import { addDecorator } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs/react'

const styles = {
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

const CenterDecorator = story => (
  <div style={styles}>
    { story() }
  </div>
)

addDecorator(withKnobs)
addDecorator(CenterDecorator)
