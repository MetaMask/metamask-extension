import React from 'react'
import { addDecorator, addParameters } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs/react'
import '../ui/app/css/index.scss'

addParameters({
  backgrounds: [
    { name: 'light', value: '#FFFFFF'},
    { name: 'dark', value: '#333333' },
  ],
})

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
