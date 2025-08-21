import React from 'react';
import { DomainInputResolutionCell } from '.';
export default {
  title:
    'Components/Multichain/Pages/Send/Components/DomainInputResolutionCell',
  component: DomainInputResolutionCell,
  argTypes: {
    address: {
      control: 'text',
    },
    protocol: {
      control: 'text',
    },
    domainName: {
      control: 'text',
    },
    resolvingSnap: {
      control: 'text',
    },
    onClick: {
      action: 'onClick',
    },
  },
  args: {
    address: '0xc0ffee254729296a45a3885639AC7E10F9d54979',
    protocol: 'Ethereum Name Service',
    domainName: 'hamer.eth',
    resolvingSnap: '',
    onClick: () => undefined,
  },
};

export const DefaultStory = (args) => <DomainInputResolutionCell {...args} />;

DefaultStory.storyName = 'ENS Resolution';

export const LensStory = (args) => <DomainInputResolutionCell {...args} />;
LensStory.args = {
  address: '0xc0ffee254729296a45a3885639AC7E10F9d54979',
  protocol: 'Lens Protocol',
  domainName: 'm0nt0y4.lens',
  resolvingSnap: 'Lens Resolver Snap',
  onClick: () => undefined,
};

LensStory.storyName = 'Lens Resolution';

export const OverflowingTitleStory = (args) => (
  <div style={{ width: '308px', padding: '16px', border: '1px solid black' }}>
    <DomainInputResolutionCell {...args} />
  </div>
);

OverflowingTitleStory.args = {
  address: '0xc0ffee254729296a45a3885639AC7E10F9d54979',
  protocol: 'Test Protocol',
  domainName: 'superduperlongnamethatisoverflowingthiscontainer.testprotocol',
  resolvingSnap: 'Test Resolver Snap',
  onClick: () => undefined,
};

OverflowingTitleStory.storyName = 'Overflowing Domain Resolution';
