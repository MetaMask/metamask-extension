import React from 'react'
import Icon from './icon.component'
import { color, number } from '@storybook/addon-knobs/react'

export default {
  title: 'Icon',
}

export const copy = () => (
  <Icon
    type="copy"
    width={number('width', 28,)}
    height={number('height', 28)}
    color={color('color', '#2F80ED')}
  />
)

export const send = () => (
  <Icon
    type="send"
    width={number('width', 28,)}
    height={number('height', 28)}
    color={color('color', '#2F80ED')}
  />
)

export const receive = () => (
  <Icon
    type="receive"
    width={number('width', 28)}
    height={number('height', 28)}
    color={color('color', '#2F80ED')}
  />
)

export const siteInteraction = () => (
  <Icon
    type="interaction"
    width={number('width', 28)}
    height={number('height', 28)}
    color={color('color', '#2F80ED')}
  />
)

export const approveSpendLimit = () => (
  <Icon
    type="approve"
    width={number('width', 28)}
    height={number('height', 28)}
    color={color('color', '#2F80ED')}
  />
)
