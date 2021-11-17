import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';

import Box from '../../components/ui/box';
import TextField from '../../components/ui/text-field';
import PageContainer from '../../components/ui/page-container';

export default function AddCollectible() {
  const t = useI18nContext();
  const history = useHistory();

  const [address, setAddress] = useState('');
  const [tokenId, setTokenId] = useState('');

  return (
    <PageContainer
      title={t('addNFT')}
      onSubmit={() => {
        console.log(
          `Adding collectible with ID: ${tokenId} and address ${address}`,
        );
        history.push(DEFAULT_ROUTE);
      }}
      submitText={t('add')}
      onCancel={() => {
        history.push(DEFAULT_ROUTE);
      }}
      onClose={() => {
        history.push(DEFAULT_ROUTE);
      }}
      disabled={false}
      contentComponent={
        <Box padding={4}>
          <Box>
            <TextField
              id="address"
              label={t('address')}
              placeholder="0x..."
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              fullWidth
              autoFocus
              margin="normal"
            />
          </Box>
          <Box>
            <TextField
              id="token-id"
              label={t('id')}
              placeholder={t('nftTokenIdPlaceholder')}
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              fullWidth
              margin="normal"
            />
          </Box>
        </Box>
      }
    />
  );
}
