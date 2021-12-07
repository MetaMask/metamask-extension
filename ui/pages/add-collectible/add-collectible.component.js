import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';

import Box from '../../components/ui/box';
import TextField from '../../components/ui/text-field';
import PageContainer from '../../components/ui/page-container';
import {
  addCollectibleVerifyOwnership,
  setNewCollectibleAddedMessage,
} from '../../store/actions';

export default function AddCollectible() {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();

  const [address, setAddress] = useState('');
  const [tokenId, setTokenId] = useState('');

  const handleAddCollectible = async () => {
    try {
      await dispatch(addCollectibleVerifyOwnership(address, tokenId));
    } catch (error) {
      const { message } = error;
      dispatch(setNewCollectibleAddedMessage(message));
      history.push(DEFAULT_ROUTE);
      return;
    }
    dispatch(setNewCollectibleAddedMessage('success'));
    history.push(DEFAULT_ROUTE);
  };

  return (
    <PageContainer
      title={t('addNFT')}
      onSubmit={() => {
        handleAddCollectible();
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
