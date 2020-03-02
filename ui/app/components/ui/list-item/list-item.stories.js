import React from 'react'
import ListItem from './list-item.component'
import { text } from '@storybook/addon-knobs/react'

export default {
  title: 'ListItem',
}

const More = () => (
  <span>
    <button className="list-item__more--button">{text('Button1', 'Speed up')}</button>
    <button className="list-item__more--button">{text('Button2', 'Cancel')}</button>
  </span>
)

export const send = () => (
  <ListItem
    title={text('title', 'Send DAI')}
    className="list-item"
    status="pending"
    subtitle={text('subtitle', 'Sept 20 · To: 00X4...3058')}
    nativeCurrency={text('nativeCurrency', '- 0.0732 DAI')}
    currentCurrency={text('currentCurrency', '- $6.04 USD')}
  >
    <More />
  </ListItem>
)

export const hatchTurtles = () => (
  <ListItem
    title={text('title', 'Hatch Turtles')}
    className="list-item"
    status="unapproved"
    subtitle={text('subtitle', 'Turtlefarm.com')}
    nativeCurrency={text('nativeCurrency', '- 0.0732 ETH')}
    currentCurrency={text('currentCurrency', '- $6.00 USD')}
  />
)

export const approve = () => (
  <ListItem
    title={text('title', 'Approve spend limit')}
    className="list-item"
    status="approved"
    subtitle={text('subtitle', 'Sept 20 · oxuniverse.com')}
    nativeCurrency={text('nativeCurrency', '0.00070 DAI')}
    currentCurrency={text('currentCurrency', '$0.02 USD')}
  />
)

export const failed = () => (
  <ListItem
    title={text('title', 'Hatch Turtles')}
    className="list-item"
    status="failed"
    subtitle={text('subtitle', 'Turtlefarm.com')}
    nativeCurrency={text('nativeCurrency', '- 0.0732 ETH')}
    currentCurrency={text('currentCurrency', '- $6.00 USD')}
  />
)
