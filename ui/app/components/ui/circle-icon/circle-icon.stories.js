import React from 'react'
import { storiesOf } from '@storybook/react'
import CircleIcon from './circle-icon.component'
import img from '../../../../../images/eth_logo.svg'

storiesOf('CircleIcon', module)
  .add('Eth Logo example', () => (
    <CircleIcon
      border="1px solid"
      borderColor="black"
      background="white"
      iconSize="42px"
      iconSource={img}
    />
  ))
