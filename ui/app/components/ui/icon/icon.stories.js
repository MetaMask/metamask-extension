import React from 'react'
import { storiesOf } from '@storybook/react'
import Icon from './icon.component'
import { color, number } from '@storybook/addon-knobs/react'

storiesOf('Icon', module)
  .add('Icon - Send', () => (
    <Icon
      type="send"
      width={number('width', 28,)}
      height={number('height', 28)}
      color={color('color', '#2F80ED')}
    />
  ))
  .add('Icon - Recieve', () => (
    <Icon
      type="recieve"
      width={number('width', 28)}
      height={number('height', 28)}
      color={color('color', '#2F80ED')}
    />
  ))
  .add('Icon - Site Interaction', () => (
    <Icon
      type="interaction"
      width={number('width', 28)}
      height={number('height', 28)}
      color={color('color', '#2F80ED')}
    />
  ))
  .add('Icon - Approve Send Limit', () => (
    <Icon
      type="approve"
      width={number('width', 28)}
      height={number('height', 28)}
      color={color('color', '#2F80ED')}
    />
  ))
