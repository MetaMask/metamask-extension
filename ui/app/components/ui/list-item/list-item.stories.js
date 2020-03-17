import React from 'react'
import ListItem from './list-item.component'
import { text } from '@storybook/addon-knobs/react'

export default {
  title: 'ListItem',
}

export const send = () => (
  <ListItem
    title={text('title', 'Send DAI')}
    className="list-item"
    status="pending"
    subtitle={text('subtitle', 'Sept 20 · To: 00X4...3058')}
    primaryCurrency={text('primaryCurrency', '- 0.0732 DAI')}
    secondaryCurrency={text('secondaryCurrency', '- $6.04 USD')}
  />
)

export const pending = () => (
  <ListItem
    title={text('title', 'Hatch Turtles')}
    className="list-item"
    status="unapproved"
    subtitle={text('subtitle', 'Turtlefarm.com')}
    primaryCurrency={text('primaryCurrency', '- 0.0732 ETH')}
    secondaryCurrency={text('secondaryCurrency', '- $6.00 USD')}
  />
)

export const approve = () => (
  <ListItem
    title={text('title', 'Approve spend limit')}
    className="list-item"
    status="approved"
    subtitle={text('subtitle', 'Sept 20 · oxuniverse.com')}
    primaryCurrency={text('primaryCurrency', '0.00070 DAI')}
    secondaryCurrency={text('secondaryCurrency', '$0.02 USD')}
  />
)

export const failed = () => (
  <ListItem
    title={text('title', 'Hatch Turtles')}
    className="list-item"
    status="failed"
    subtitle={text('subtitle', 'Turtlefarm.com')}
    primaryCurrency={text('primaryCurrency', '- 0.0732 ETH')}
    secondaryCurrency={text('secondaryCurrency', '- $6.00 USD')}
  />
)
