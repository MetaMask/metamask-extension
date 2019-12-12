import React from 'react'
import { storiesOf } from '@storybook/react'
import Item from './item.component'
import Icon from '../icon'
import Preloader from '../preloader'
import { text } from '@storybook/addon-knobs/react'

const SendIcon = () => (
  <Icon
    type="send"
    width={28}
    height={28}
    color="#2F80ED"
  />
)

storiesOf('Item', module)
  .add('Item - Send', () => (
    <Item
      title={
        <h2>Send DAI <span><Preloader className="preloader" /></span></h2>
      }
      className="Item__flex-grid"
      icon={<SendIcon />}
      subtitle={text('subtitle', 'Sept 20 · To: 00X4...3058')}
      more={
        (
          <span>
            <button>Speed up</button>
            <button>Cancel</button>
          </span>
        )
      }
      crypto={text('crypto', '- 0.0732 DAI')}
      cash={text('cash', '- $6.04 USD')}
    />
  ))
