import React from 'react';
import { RAMPS_CARD_VARIANT_TYPES } from './ramps-card';
import { RampsCard } from '.';

export default {
  title: 'Components/Multichain/RampsCard',
  component: RampsCard,
  argTypes: {
    variant: {
      control: 'text',
    },
  },
  args: {
    variant: RAMPS_CARD_VARIANT_TYPES.TOKEN,
  },
};

export const DefaultStory = (args) => <RampsCard {...args} />;
DefaultStory.storyName = 'Default';

export const TokensStory = (args) => (
  <RampsCard {...args} variant={RAMPS_CARD_VARIANT_TYPES.TOKEN} />
);

TokensStory.storyName = 'Tokens';

export const NFTsStory = (args) => (
  <RampsCard {...args} variant={RAMPS_CARD_VARIANT_TYPES.NFT} />
);

NFTsStory.storyName = 'NFTs';

export const ActivityStory = (args) => (
  <RampsCard {...args} variant={RAMPS_CARD_VARIANT_TYPES.ACTIVITY} />
);

ActivityStory.storyName = 'Activity';

export const BTCStory = (args) => (
  <RampsCard {...args} variant={RAMPS_CARD_VARIANT_TYPES.BTC} />
);
BTCStory.storyName = 'BTC';
