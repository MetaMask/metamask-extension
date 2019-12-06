import React from 'react'
import { storiesOf } from '@storybook/react'
import Icon from './icon.component'

storiesOf('Icon', module)
  .add('Icon - Send', () => (
    <Icon
      type="send"
      width="28"
      height="28"
      borderWidth={1}
      borderRadius={18}
      color="#2F80ED"
    />
  ))
  .add('Icon - Recieve', () => (
    <Icon
      type="recieve"
      width="28"
      height="28"
      borderWidth={1}
      borderRadius={18}
      color="#2F80ED"
    />
  ))
