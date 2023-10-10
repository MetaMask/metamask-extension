import React from 'react';
import { Connections } from './connections';

export default {
  title: 'Components/Multichain/Connections',
};
export const DefaultStory = () => (
  <div
    style={{
      width: '400px',
      height: '600px',
      border: '1px solid red',
    }}
  >
    <Connections />
  </div>
);

DefaultStory.storyName = 'Default';
