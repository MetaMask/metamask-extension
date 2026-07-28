import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { FormTextField } from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SettingsToggleItem } from '../shared/settings-toggle-item';
import {
  setIpfsGateway,
  setIsIpfsGatewayEnabled,
} from '../../../store/actions';
import type { MetaMaskReduxState } from '../../../store/store';
import {
  IPFS_DEFAULT_GATEWAY_URL,
  IPFS_FORBIDDEN_GATEWAY,
} from '../../../../shared/constants/network';
import { addUrlProtocolPrefix } from '../../../../shared/lib/url-utils';
import { PRIVACY_ITEMS } from '../search-config';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useDispatch } from '../../../store/hooks';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

export const IpfsGatewayItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();

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
    const newValue = !currentValue;

    trackEvent(
      createEventBuilder(MetaMetricsEventName.SettingsUpdated)
        .addCategory(MetaMetricsEventCategory.Settings)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          use_ipfs_gateway: newValue,
        })
        .build(),
    );

    if (currentValue) {
      dispatch(setIsIpfsGatewayEnabled(false));
      dispatch(setIpfsGateway(''));
    } else {
      dispatch(setIsIpfsGatewayEnabled(true));
      handleIpfsGatewayChange(ipfsGatewayValue);
    }

    setIpfsToggle(newValue);
  };

  return (
    <Box className={ipfsToggle ? 'mb-4' : undefined}>
      <SettingsToggleItem
        title={t(PRIVACY_ITEMS['ipfs-gateway'])}
        description={t('ipfsGatewayDescriptionV2')}
        value={ipfsToggle}
        onToggle={handleToggle}
        dataTestId="ipfs-gateway-toggle"
        containerDataTestId="ipfsToggle"
      />
      {ipfsToggle && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={1}
          marginHorizontal={4}
        >
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
