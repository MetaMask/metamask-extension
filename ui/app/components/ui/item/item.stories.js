import React from 'react'
import { storiesOf } from '@storybook/react'
import Item from './item.component'
import { text } from '@storybook/addon-knobs/react'

storiesOf('Item', module)
  .add('Item - Send', () => (
    <Item
      title={text('title', 'Send DAI')}
      className="Item__flex-grid"
      status="pending"
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
      // should create a constants and match it with what's in mm
      status="unapproved"
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
      subtitle={text('subtitle', 'Sept 20 · oxuniverse.com')}
      crypto={text('crypto', '0.00070 DAI')}
      cash={text('cash', '$0.02 USD')}
    />
  ))
  .add('Item - Failed', () => (
    <Item
      title={text('title', 'Hatch Turtles')}
      className="Item__flex-grid"
      status="failed"
      subtitle={text('subtitle', 'Turtlefarm.com')}
      crypto={text('crypto', '- 0.0732 ETH')}
      cash={text('cash', '- $6.00 USD')}
    />
  ))
