// This is the initial setup for the Storybook story file for the nft-collection-image component.
import React from 'react';
import { Meta, Story } from '@storybook/react';
import NftCollectionImage from './nft-collection-image';

export default {
  title: 'Components/UI/NFTCollectionImage',
  component: NftCollectionImage,
  argTypes: {
    // Define argTypes here if necessary
  },
} as Meta;

const Template: Story = (args) => {
  // Ensure tokenAddress is a string before passing it to the component
  const tokenAddress = typeof args.tokenAddress === 'string' ? args.tokenAddress : '0x0000000000000000000000000000000000000000';
  return <NftCollectionImage {...args} tokenAddress={tokenAddress} />;
};

export const Default = Template.bind({});
Default.args = {
  assetName: 'Sample NFT Collection',
  tokenAddress: '0x0000000000000000000000000000000000000000',
};
