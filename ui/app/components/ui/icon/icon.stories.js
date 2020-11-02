import React from 'react'
import { color, number } from '@storybook/addon-knobs/react'
import Approve from './approve-icon.component'
import Copy from './copy-icon.component'
import Interaction from './interaction-icon.component'
import Preloader from './preloader'
import Receive from './receive-icon.component'
import Send from './send-icon.component'

export default {
  title: 'Icon',
}

export const copy = () => (
  <Copy size={number('size', 40)} color={color('color', '#2F80ED')} />
)

export const send = () => (
  <Send size={number('size', 40)} color={color('color', '#2F80ED')} />
)

export const receive = () => (
  <Receive size={number('size', 40)} color={color('color', '#2F80ED')} />
)

export const siteInteraction = () => (
  <Interaction size={number('size', 40)} color={color('color', '#2F80ED')} />
)

export const approveSpendLimit = () => (
  <Approve size={number('size', 40)} color={color('color', '#2F80ED')} />
)

export const preloader = () => <Preloader size={number('size', 40)} />

export const PaperAirplane = () => (
  <PaperAirplane color={color('color', '#2F80ED')} size={number('size', 40)} />
)
