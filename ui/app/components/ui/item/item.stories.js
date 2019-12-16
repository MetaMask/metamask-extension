import React from 'react'
import { storiesOf } from '@storybook/react'
import Item from './item.component'
import Preloader from '../preloader'
import { text } from '@storybook/addon-knobs/react'

storiesOf('Item', module)
  .add('Item - Send', () => (
    <Item
      title={
        // "status" should also determine if we need a Preloader
        <h2>Send DAI <span><Preloader className="preloader" /></span></h2>
      }
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
