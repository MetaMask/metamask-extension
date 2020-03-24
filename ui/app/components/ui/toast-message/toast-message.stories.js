import React from 'react'
import ToastMessage from './toast-message.component'

export default {
  title: 'ToastMessage',
}

export const Success = () => (
  <ToastMessage
    type="success"
    width="365px"
  >
    This is a test message.
  </ToastMessage>
)

export const Warning = () => (
  <ToastMessage
    type="warning"
    width="365px"
  >
    This is a test message.
  </ToastMessage>
)

export const Info = () => (
  <ToastMessage
    type="info"
    width="365px"
  >
    This is a test message.
  </ToastMessage>
)

export const Danger = () => (
  <ToastMessage
    type="danger"
    width="365px"
  >
    This is a test message.
  </ToastMessage>
)

