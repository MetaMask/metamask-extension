import React, { useState } from 'react';
import Button from '../button';
import Box from '../box';
import NftsModal from './nfts-modal';

export default {
  title: 'Components/UI/NftsModal',
  id: __filename,
  argTypes: {
    senderAddress: { control: 'text' },
    accountName: { control: 'text' },
    assetName: { control: 'text' },
    total: { control: 'number' },
    tokenId: { control: 'text' },
    tokenImage: { control: 'text' },
    isSetApproveForAll: { control: 'boolean' },
    onClose: { action: 'onClose' },
  },
  args: {
    senderAddress: '0xcF2dBaB1176aF6F261d19092E1Ea7710868dC59E',
    accountName: 'Account 1',
    assetName: 'TestDappCollectibles',
    total: 6,
    tokenId: '1',
    tokenImage:
      'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjM1MCIgd2lkdGg9IjM1MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdGggaWQ9Ik15UGF0aCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZWQiIGQ9Ik0xMCw5MCBROTAsOTAgOTAsNDUgUTkwLDEwIDUwLDEwIFExMCwxMCAxMCw0MCBRMTAsNzAgNDUsNzAgUTcwLDcwIDc1LDUwIiAvPjwvZGVmcz48dGV4dD48dGV4dFBhdGggaHJlZj0iI015UGF0aCI+UXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nLjwvdGV4dFBhdGg+PC90ZXh0Pjwvc3ZnPg==',
    isSetApproveForAll: false,
  },
};

export const NftsModalWithoutImage = (args) => {
  const [isShowingNftsModal, setIsShowingNftsModal] = useState(false);
  return (
    <Box>
      <Button
        style={{ width: 'auto' }}
        onClick={() => setIsShowingNftsModal(true)}
      >
        Show modal
      </Button>
      {isShowingNftsModal && (
        <NftsModal
          {...args}
          tokenImage={undefined}
          onClose={() => setIsShowingNftsModal(false)}
        />
      )}
    </Box>
  );
};

export const NftsModalWithImage = (args) => {
  const [isShowingNftsModal, setIsShowingNftsModal] = useState(false);
  return (
    <Box>
      <Button
        style={{ width: 'auto' }}
        onClick={() => setIsShowingNftsModal(true)}
      >
        Show modal
      </Button>
      {isShowingNftsModal && (
        <NftsModal {...args} onClose={() => setIsShowingNftsModal(false)} />
      )}
    </Box>
  );
};
