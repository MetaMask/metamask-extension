import React from 'react'
import { storiesOf } from '@storybook/react'
import StyledMessage from './styled-message.component'

storiesOf('StyledMessage', module)
  .add('Success', () => (
    <StyledMessage
      type="success"
      width="365px"
    >
      This is a test message.
    </StyledMessage>
  ))
  .add('Danger', () => (
    <StyledMessage
      type="danger"
      width="365px"
    >
      This is a test message.
    </StyledMessage>
  ))
  .add('Warning', () => (
    <StyledMessage
      type="warning"
      width="365px"
    >
      This is a test message.
    </StyledMessage>
  ))
  .add('Info', () => (
    <StyledMessage
      type="info"
      width="365px"
    >
      This is a test message.
    </StyledMessage>
  ))
