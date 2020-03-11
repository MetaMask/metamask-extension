import React from 'react'
import { storiesOf } from '@storybook/react'
import AlertMessage from './alert-message.component'

storiesOf('StyledMessage', module)
  .add('Success', () => (
    <AlertMessage
      type="success"
      width="365px"
    >
      This is a test message.
    </AlertMessage>
  ))
  .add('Danger', () => (
    <AlertMessage
      type="danger"
      width="365px"
    >
      This is a test message.
    </AlertMessage>
  ))
  .add('Warning', () => (
    <AlertMessage
      type="warning"
      width="365px"
    >
      This is a test message.
    </AlertMessage>
  ))
  .add('Info', () => (
    <AlertMessage
      type="info"
      width="365px"
    >
      This is a test message.
    </AlertMessage>
  ))
