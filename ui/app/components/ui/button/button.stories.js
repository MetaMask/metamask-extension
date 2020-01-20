import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import Button from '.'
import { text, boolean } from '@storybook/addon-knobs/react'

// ', 'secondary', 'default', 'warning', 'danger', 'danger-primary', 'link'], 'primary')}
storiesOf('Button', module)
  .add('Button - Primary', () => (
    <Button
      onClick={action('clicked')}
      type="primary"
      disabled={boolean('disabled', false)}
    >
      {text('text', 'Click me')}
    </Button>
  ))
  .add('Button - Secondary', () => (
    <Button
      onClick={action('clicked')}
      type="secondary"
      disabled={boolean('disabled', false)}
    >
      {text('text', 'Click me')}
    </Button>
  ))
  .add('Button - Default', () => (
    <Button
      onClick={action('clicked')}
      type="default"
      disabled={boolean('disabled', false)}
    >
      {text('text', 'Click me')}
    </Button>
  ))
  .add('Button - Warning', () => (
    <Button
      onClick={action('clicked')}
      type="warning"
      disabled={boolean('disabled', false)}
    >
      {text('text', 'Click me')}
    </Button>
  ))
  .add('Button - Danger', () => (
    <Button
      onClick={action('clicked')}
      type="danger"
      disabled={boolean('disabled', false)}
    >
      {text('text', 'Click me')}
    </Button>
  ))
  .add('Button - Danger Primary', () => (
    <Button
      onClick={action('clicked')}
      type="danger-primary"
      disabled={boolean('disabled', false)}
    >
      {text('text', 'Click me')}
    </Button>
  ))
  .add('Button - Link', () => (
    <Button
      onClick={action('clicked')}
      type="link"
      disabled={boolean('disabled', false)}
    >
      {text('text', 'Click me')}
    </Button>
  ))
