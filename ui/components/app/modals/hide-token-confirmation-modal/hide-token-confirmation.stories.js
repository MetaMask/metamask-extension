import React from 'react';
import ConnectedHideTokenConfirmationModal from './hide-token-confirmation-modal';

export default {
  title: 'Components/App/Modals/HideTokenConfirmationModal',
};

export const DefaultStory = () => (
  <ConnectedHideTokenConfirmationModal
    token={{
      address: '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4',
      chainId: '0x1',
      symbol: 'TST',
    }}
    isOpen
    onClose={() => undefined}
    navigate={() => undefined}
  />
);

DefaultStory.storyName = 'Default';
