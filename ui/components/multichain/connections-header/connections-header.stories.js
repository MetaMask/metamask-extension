import React from 'react';
import { ConnectionsHeader } from './connections-header';

export default {
  title: 'Components/Multichain/ConnectionsHeader',
};
export const DefaultStory = () => <ConnectionsHeader />;

DefaultStory.storyName = 'Default';

export const ChaosStory = () => (
  <div style={{ width: '400px', border: '1px solid red', background: 'pink' }}>
    <ConnectionsHeader hostName="some.weird.hostname.weve.never.heard.of.tld" />
  </div>
);

ChaosStory.storyName = 'Chaos';
