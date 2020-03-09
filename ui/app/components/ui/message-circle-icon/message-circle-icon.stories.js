import React from 'react'
import MessageCircleIcon from './message-circle-icon.component'

export default {
  title: 'MessageCircleIcon',
}

export const successCircleIcon = () => (
  <MessageCircleIcon
    type="success"
  />
)

export const dangerCircleIcon = () => (
  <MessageCircleIcon
    type="danger"
  />
)

export const warningCircleIcon = () => (
  <MessageCircleIcon
    type="warning"
  />
)

export const infoCircleIcon = () => (
  <MessageCircleIcon
    type="info"
  />
)
