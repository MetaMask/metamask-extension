import React from 'react'
import AlertMessage from './alert-message.component'

export default {
  title: 'StyledMessage',
}

export const Success = () => (
  <AlertMessage
    type="success"
    width="365px"
  >
    This is a test message.
  </AlertMessage>
)

export const Warning = () => (
  <AlertMessage
    type="warning"
    width="365px"
  >
    This is a test message.
  </AlertMessage>
)

export const Info = () => (
  <AlertMessage
    type="info"
    width="365px"
  >
    This is a test message.
  </AlertMessage>
)

export const Danger = () => (
  <AlertMessage
    type="danger"
    width="365px"
  >
    This is a test message.
  </AlertMessage>
)

