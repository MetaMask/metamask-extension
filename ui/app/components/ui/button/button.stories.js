import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import Button from '.'
import { text, boolean, select } from '@storybook/addon-knobs/react'

storiesOf('Button', module)
  .add('button', () =>
    <Button
      onClick={action('clicked')}
      type={select('type', ['primary', 'secondary', 'default', 'warning', 'danger', 'danger-primary', 'link'], 'primary')}
      disabled={boolean('disabled', false)}
    >
      {text('text', 'Click me')}
    </Button>
  )
