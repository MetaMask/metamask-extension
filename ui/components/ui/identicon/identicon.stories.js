import React from 'react';
import README from './README.mdx';
import Identicon from './identicon.component';

export default {
  title: 'Components/UI/Identicon',

  component: Identicon,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    addBorder: { control: 'boolean' },
    address: { control: 'text' },
    className: { control: 'text' },
    diameter: { control: 'number' },
    image: { control: 'text' },
    useBlockie: { control: 'boolean' },
    alt: { control: 'text' },
    imageBorder: { control: 'boolean' },
    useTokenDetection: { control: 'boolean' },
    tokenList: { control: 'object' },
    watchedNftContracts: { control: 'object' },
  },
};

export const DefaultStory = (args) => <Identicon {...args} />;

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  addBorder: false,
  address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
  diameter: 32,
  useBlockie: false,
};

export const WithImage = (args) => <Identicon {...args} />;
WithImage.args = {
  addBorder: false,
  diameter: 32,
  useBlockie: false,
  image: './images/eth_logo.svg',
  alt: 'Ethereum',
  imageBorder: true,
};

export const WithBlockie = (args) => <Identicon {...args} />;
WithBlockie.args = {
  addBorder: false,
  address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
  diameter: 32,
  useBlockie: true,
};

export const WithBorder = (args) => <Identicon {...args} />;
WithBorder.args = {
  addBorder: true,
  address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
  diameter: 32,
  useBlockie: false,
};
