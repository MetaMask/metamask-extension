import React from 'react'
import { storiesOf } from '@storybook/react'
import Item from './item.component'
import Icon from '../icon'
import { color, number } from '@storybook/addon-knobs/react'

const SendIcon = () => (
  <Icon
    type="send"
    width={number('width', 28,)}
    height={number('height', 28)}
    color={color('color', '#2F80ED')}
  />
)

storiesOf('Item', module)
  .add('Item - Send', () => (
    <Item
      className="Item__flex-grid"
      icon={SendIcon}
      title="Title"
      subtitle="Subtitle"
    />
  ))
