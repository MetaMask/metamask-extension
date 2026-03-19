import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { FormTextField } from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';
import {
  setIpfsGateway,
  setIsIpfsGatewayEnabled,
} from '../../../store/actions';
import type { MetaMaskReduxState } from '../../../store/store';
import {
  IPFS_DEFAULT_GATEWAY_URL,
  IPFS_FORBIDDEN_GATEWAY,
} from '../../../../shared/constants/network';
// eslint-disable-next-line import-x/no-restricted-paths
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
    setIpfsGatewayValue(url);

    if (!url.length) {
      setIpfsGatewayError(t('invalidIpfsGateway'));
      return;
    }

    const validUrl = addUrlProtocolPrefix(url);
    if (!validUrl) {
      setIpfsGatewayError(t('invalidIpfsGateway'));
      return;
    }

    const urlObj = new URL(validUrl);
    if (urlObj.host === IPFS_FORBIDDEN_GATEWAY) {
      setIpfsGatewayError(t('forbiddenIpfsGateway'));
      return;
    }

    dispatch(setIpfsGateway(urlObj.host));
    setIpfsGatewayError('');
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
          <FormTextField
            value={ipfsGatewayValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleIpfsGatewayChange(e.target.value)
            }
            error={Boolean(ipfsGatewayError)}
            helpText={ipfsGatewayError}
          />
        </Box>
      )}
    </Box>
  );
};
