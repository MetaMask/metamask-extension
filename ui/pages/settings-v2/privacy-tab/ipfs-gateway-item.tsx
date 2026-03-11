import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';
import TextField from '../../../components/ui/text-field';
import {
  setIpfsGateway,
  setIsIpfsGatewayEnabled,
} from '../../../store/actions';
import type { MetaMaskReduxState } from '../../../store/store';
import { IPFS_DEFAULT_GATEWAY_URL } from '../../../../shared/constants/network';
import { addUrlProtocolPrefix } from '../../../../app/scripts/lib/util';

export const IpfsGatewayItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const ipfsGatewayFromState = useSelector(
    (state: MetaMaskReduxState) => state.metamask.ipfsGateway,
  );

  const [ipfsToggle, setIpfsToggle] = useState(ipfsGatewayFromState.length > 0);
  const [ipfsGatewayValue, setIpfsGatewayValue] = useState(
    ipfsGatewayFromState || IPFS_DEFAULT_GATEWAY_URL,
  );
  const [ipfsGatewayError, setIpfsGatewayError] = useState('');

  const handleIpfsGatewayChange = (url: string) => {
    let error = '';

    if (url.length > 0) {
      try {
        const validUrl = addUrlProtocolPrefix(url);

        if (validUrl) {
          const urlObj = new URL(validUrl);

          // don't allow the use of this gateway
          if (urlObj.host === 'gateway.ipfs.io') {
            error = t('forbiddenIpfsGateway');
          }

          if (error.length === 0) {
            dispatch(setIpfsGateway(urlObj.host));
          }
        } else {
          error = t('invalidIpfsGateway');
        }
      } catch {
        error = t('invalidIpfsGateway');
      }
    } else {
      error = t('invalidIpfsGateway');
    }

    setIpfsGatewayValue(url);
    setIpfsGatewayError(error);
  };

  const handleToggle = (currentValue: boolean) => {
    if (currentValue) {
      // turning from true to false
      dispatch(setIsIpfsGatewayEnabled(false));
      dispatch(setIpfsGateway(''));
    } else {
      // turning from false to true
      dispatch(setIsIpfsGatewayEnabled(true));
      handleIpfsGatewayChange(ipfsGatewayValue);
    }

    setIpfsToggle(!currentValue);
  };

  return (
    <Box className={ipfsToggle ? 'mb-4' : undefined}>
      <SettingsToggleItem
        title={t('ipfsGateway')}
        description={t('ipfsGatewayDescriptionV2')}
        value={ipfsToggle}
        onToggle={handleToggle}
        dataTestId="ipfs-gateway-toggle"
      />
      {ipfsToggle && (
        <Box flexDirection={BoxFlexDirection.Column} gap={1}>
          <TextField
            type="text"
            value={ipfsGatewayValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleIpfsGatewayChange(e.target.value)
            }
            error={ipfsGatewayError}
            fullWidth
            margin="dense"
          />
        </Box>
      )}
    </Box>
  );
};
