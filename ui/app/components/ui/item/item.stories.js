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

// "status" should likely determine these?
const InteractionIcon = () => (
  <Icon
    type="interaction"
    width={28}
    height={28}
    color="#2F80ED"
  />
)

const ApproveIcon = () => (
  <Icon
    type="approve"
    width={28}
    height={28}
    color="#2F80ED"
  />
)

storiesOf('Item', module)
  .add('Item - Send', () => (
    <Item
      title={
        // "status" should also determine if we need a Preloader
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
  .add('Item - Hatch Turtles', () => (
    <Item
      title={text('title', 'Hatch Turtles')}
      className="Item__flex-grid"
      // everything should just key off this
      // should honestly create a constants and match it with what's in mm
      status="unapproved"
      icon={<InteractionIcon />}
      subtitle={text('subtitle', 'Turtlefarm.com')}
      crypto={text('crypto', '- 0.0732 ETH')}
      cash={text('cash', '- $6.00 USD')}
    />
  ))
  .add('Item - Approve', () => (
    <Item
      title={text('title', 'Approve spend limit')}
      className="Item__flex-grid"
      status="approved"
      icon={<ApproveIcon />}
      subtitle={text('subtitle', 'Sept 20 · oxuniverse.com')}
      crypto={text('crypto', '0.00070 DAI')}
      cash={text('cash', '$0.02 USD')}
    />
  ))
