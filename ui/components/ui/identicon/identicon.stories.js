import React from 'react';
import { text, boolean, number } from '@storybook/addon-knobs';
import Identicon from './identicon.component';

export default {
  title: 'Components/UI/Identicon',
  id: __filename,
};

const diameterOptions = {
  range: true,
  min: 10,
  max: 200,
  step: 1,
};
export const DefaultStory = () => (
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
);

DefaultStory.storyName = 'Default';

export const Image = () => <Identicon image="./images/eth_logo.svg" />;

export const Blockie = () => (
  <Identicon
    address={text('Address', '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1')}
    useBlockie={boolean('Use Blockie', true)}
  />
);

// The border size is hard-coded in CSS, and was designed with this size identicon in mind
const withBorderDiameter = 32;

export const WithBorder = () => (
  <Identicon
    addBorder={boolean('Add Border', true)}
    address={text('Address', '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1')}
    diameter={number('Diameter', withBorderDiameter, diameterOptions)}
  />
);
