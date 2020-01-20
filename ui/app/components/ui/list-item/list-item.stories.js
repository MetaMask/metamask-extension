import React from 'react'
import { storiesOf } from '@storybook/react'
import ListItem from './list-item.component'
import { text } from '@storybook/addon-knobs/react'

storiesOf('ListItem', module)
  .add('ListItem - Send', () => (
    <ListItem
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
      nativeCurrency={text('nativeCurrency', '- 0.0732 DAI')}
      currentCurrency={text('currentCurrency', '- $6.04 USD')}
    />
  ))
  .add('ListItem - Hatch Turtles', () => (
    <ListItem
      title={text('title', 'Hatch Turtles')}
      className="Item__flex-grid"
      // should create a constants and match it with what's in mm
      status="unapproved"
      subtitle={text('subtitle', 'Turtlefarm.com')}
      nativeCurrency={text('nativeCurrency', '- 0.0732 ETH')}
      currentCurrency={text('currentCurrency', '- $6.00 USD')}
    />
  ))
  .add('ListItem - Approve', () => (
    <ListItem
      title={text('title', 'Approve spend limit')}
      className="Item__flex-grid"
      status="approved"
      subtitle={text('subtitle', 'Sept 20 · oxuniverse.com')}
      nativeCurrency={text('nativeCurrency', '0.00070 DAI')}
      currentCurrency={text('currentCurrency', '$0.02 USD')}
    />
  ))
  .add('ListItem - Failed', () => (
    <ListItem
      title={text('title', 'Hatch Turtles')}
      className="Item__flex-grid"
      status="failed"
      subtitle={text('subtitle', 'Turtlefarm.com')}
      nativeCurrency={text('nativeCurrency', '- 0.0732 ETH')}
      currentCurrency={text('currentCurrency', '- $6.00 USD')}
    />
  ))
