import React from 'react'
import { storiesOf } from '@storybook/react'
import Icon from './icon.component'
import { color } from '@storybook/addon-knobs/react'

storiesOf('Icon', module)
  .add('Icon - Send', () => (
    <Icon
      type="send"
      width={28}
      height={28}
      borderWidth={1}
      borderRadius={18}
      color={color('Blue', '#2F80ED')}
    />
  ))
  .add('Icon - Recieve', () => (
    <Icon
      type="recieve"
      width={28}
      height={28}
      borderWidth={1}
      borderRadius={18}
      color={color('Blue', '#2F80ED')}
    />
  ))
  .add('Icon - Site Interaction', () => (
    <Icon
      type="interaction"
      width={28}
      height={28}
      borderWidth={1}
      borderRadius={18}
      color={color('Blue', '#2F80ED')}
    />
  ))
  .add('Icon - Approve Send Limit', () => (
    <Icon
      type="approve"
      width={28}
      height={28}
      borderWidth={1}
      borderRadius={18}
      color={color('Blue', '#2F80ED')}
    />
  ))
