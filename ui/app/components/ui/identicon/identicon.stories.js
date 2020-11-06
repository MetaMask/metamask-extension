import React from 'react'
import { text, boolean } from '@storybook/addon-knobs/react'
import { number } from '@storybook/addon-knobs'
import Identicon from './identicon.component'

export default { title: 'Identicon' }

const diameterOptions = {
  range: true,
  min: 10,
  max: 200,
  step: 1,
}
export const standard = () => (
  <Identicon
    addBorder={boolean('Add Border', Identicon.defaultProps.addBorder)}
    address={text('Address', '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1')}
    diameter={number(
      'Diameter',
      Identicon.defaultProps.diameter,
      diameterOptions,
    )}
    useBlockie={boolean('Use Blockie', Identicon.defaultProps.useBlockie)}
  />
)

export const image = () => <Identicon image="./images/eth_logo.svg" />

export const blockie = () => (
  <Identicon
    address={text('Address', '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1')}
    useBlockie={boolean('Use Blockie', true)}
  />
)

// The border size is hard-coded in CSS, and was designed with this size identicon in mind
const withBorderDiameter = 32

export const withBorder = () => (
  <Identicon
    addBorder={boolean('Add Border', true)}
    address={text('Address', '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1')}
    diameter={number('Diameter', withBorderDiameter, diameterOptions)}
  />
)
