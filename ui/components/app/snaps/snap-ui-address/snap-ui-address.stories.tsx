import React from 'react';
import { SnapUIAddress } from './snap-ui-address';

export default {
  title: 'Components/App/Snaps/SnapUiAddress',
  component: SnapUIAddress,
  argTypes: {},
};

export const EthereumStory = (args) => <SnapUIAddress {...args} />;

EthereumStory.storyName = 'Ethereum';

EthereumStory.args = {
  address: 'eip155:1:0xab16a96D359eC26a11e2C2b3d8f8B8942d5Bfcdb',
};

export const BitcoinStory = (args) => <SnapUIAddress {...args} />;

BitcoinStory.storyName = 'Bitcoin';

BitcoinStory.args = {
  address:
    'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
};

export const CosmosStory = (args) => <SnapUIAddress {...args} />;

CosmosStory.storyName = 'Cosmos';

CosmosStory.args = {
  address: 'cosmos:cosmoshub-3:cosmos1t2uflqwqe0fsj0shcfkrvpukewcw40yjj6hdc0',
};

export const PolkadotStory = (args) => <SnapUIAddress {...args} />;

PolkadotStory.storyName = 'Polkadot';

PolkadotStory.args = {
  address:
    'polkadot:b0a8d493285c2df73290dfb7e61f870f:5hmuyxw9xdgbpptgypokw4thfyoe3ryenebr381z9iaegmfy',
};

export const StarknetStory = (args) => <SnapUIAddress {...args} />;

StarknetStory.storyName = 'Starknet';

StarknetStory.args = {
  address:
    'starknet:SN_GOERLI:0x02dd1b492765c064eac4039e3841aa5f382773b598097a40073bd8b48170ab57',
};

export const HederaStory = (args) => <SnapUIAddress {...args} />;

HederaStory.storyName = 'Hedera';

HederaStory.args = {
  address: 'hedera:mainnet:0.0.1234567890-zbhlt',
};

export const All = () => (
  <>
    <SnapUIAddress address="eip155:1:0xab16a96D359eC26a11e2C2b3d8f8B8942d5Bfcdb" />
    <SnapUIAddress address="bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6" />
    <SnapUIAddress address="cosmos:cosmoshub-3:cosmos1t2uflqwqe0fsj0shcfkrvpukewcw40yjj6hdc0" />
    <SnapUIAddress address="polkadot:b0a8d493285c2df73290dfb7e61f870f:5hmuyxw9xdgbpptgypokw4thfyoe3ryenebr381z9iaegmfy" />
    <SnapUIAddress address="starknet:SN_GOERLI:0x02dd1b492765c064eac4039e3841aa5f382773b598097a40073bd8b48170ab57" />
    <SnapUIAddress address="hedera:mainnet:0.0.1234567890-zbhlt" />
  </>
);
