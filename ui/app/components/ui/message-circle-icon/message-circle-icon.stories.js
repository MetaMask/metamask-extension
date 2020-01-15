import React from 'react'
import { storiesOf } from '@storybook/react'
import MessageCircleIcon from './message-circle-icon.component'

storiesOf('MessageCircleIcon', module)
  .add('Success', () => (
    <MessageCircleIcon
      type="success"
    />
  ))
  .add('Danger', () => (
    <MessageCircleIcon
      type="danger"
    />
  ))
  .add('Warning', () => (
    <MessageCircleIcon
      type="info"
    />
  ))
  .add('Info', () => (
    <MessageCircleIcon
      type="warning"
    />
  ))
