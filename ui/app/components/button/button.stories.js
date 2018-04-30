import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import Button from './'
import { text } from '@storybook/addon-knobs/react'

storiesOf('Button', module)
  .add('primary', () =>
    <Button
      onClick={action('clicked')}
      type="primary"
    >
      {text('text', 'Click me')}
    </Button>
  )
  .add('secondary', () => (
    <Button
      onClick={action('clicked')}
      type="secondary"
    >
      {text('text', 'Click me')}
    </Button>
  ))
  .add('large primary', () => (
    <Button
      onClick={action('clicked')}
      type="primary"
      large
    >
      {text('text', 'Click me')}
    </Button>
  ))
  .add('large secondary', () => (
    <Button
      onClick={action('clicked')}
      type="secondary"
      large
    >
      {text('text', 'Click me')}
    </Button>
  ))
