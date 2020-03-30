import React from 'react'
import ToastMessage from './toast-message.component'

export default {
  title: 'ToastMessage',
}

export const Success = () => (
  <ToastMessage
    type="success"
    style={{ width: '365px' }}
  >
    This is a test message.
  </ToastMessage>
)

export const Warning = () => (
  <ToastMessage
    type="warning"
    style={{ width: '365px' }}
  >
    This is a test message.
  </ToastMessage>
)

export const InfoWithoutWidth = () => (
  <ToastMessage
    type="info"
  >
    This is a test message.
  </ToastMessage>
)

export const DangerWithoutWidth = () => (
  <ToastMessage
    type="danger"
  >
    This is a test message.
  </ToastMessage>
)

