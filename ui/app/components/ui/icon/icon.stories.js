import React from 'react'
import Approve from './approve-icon.component'
import Copy from './copy-icon.component'
import Interaction from './interaction-icon.component'
import Preloader from './preloader-icon.component'
import Receive from './receive-icon.component'
import Send from './send-icon.component'
import { color, number } from '@storybook/addon-knobs/react'

export default {
  title: 'Icon',
}

export const copy = () => (
  <Copy
    width={number('width', 28,)}
    height={number('height', 28)}
    color={color('color', '#2F80ED')}
  />
)

export const send = () => (
  <Send
    width={number('width', 28,)}
    height={number('height', 28)}
    color={color('color', '#2F80ED')}
  />
)

export const receive = () => (
  <Receive
    width={number('width', 28)}
    height={number('height', 28)}
    color={color('color', '#2F80ED')}
  />
)

export const siteInteraction = () => (
  <Interaction
    width={number('width', 28)}
    height={number('height', 28)}
    color={color('color', '#2F80ED')}
  />
)

export const approveSpendLimit = () => (
  <Approve
    width={number('width', 28)}
    height={number('height', 28)}
    color={color('color', '#2F80ED')}
  />
)

export const preloader = () => (
  <Preloader
    width={number('width', 28)}
    height={number('height', 28)}
  />
)
