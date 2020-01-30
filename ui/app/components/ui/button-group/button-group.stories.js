import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import ButtonGroup from '.'
import Button from '../button'
import { text, boolean } from '@storybook/addon-knobs/react'

storiesOf('ButtonGroup', module)
  .add('with Buttons', () =>
    <ButtonGroup
      style={{ width: '300px' }}
      disabled={boolean('Disabled', false)}
      defaultActiveButtonIndex={1}
    >
      <Button
        onClick={action('cheap')}
      >
        {text('Button1', 'Cheap')}
      </Button>
      <Button
        onClick={action('average')}
      >
        {text('Button2', 'Average')}
      </Button>
      <Button
        onClick={action('fast')}
      >
        {text('Button3', 'Fast')}
      </Button>
    </ButtonGroup>
  )
  .add('with a disabled Button', () =>
    <ButtonGroup
      style={{ width: '300px' }}
      disabled={boolean('Disabled', false)}
    >
      <Button
        onClick={action('enabled')}
      >
        {text('Button1', 'Enabled')}
      </Button>
      <Button
        onClick={action('disabled')}
        disabled
      >
        {text('Button2', 'Disabled')}
      </Button>
    </ButtonGroup>
  )
