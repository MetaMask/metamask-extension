import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import Dropdown from '../../../components/ui/dropdown';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getShowDefaultAddress,
  getDefaultAddressScope,
  getIsDefaultAddressEnabled,
} from '../../../selectors';
import {
  setShowDefaultAddress,
  setDefaultAddressScope,
} from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  DEFAULT_ADDRESS_OPTIONS,
  type DefaultAddressScope,
} from '../../../../shared/constants/default-address';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';

export const ShowDefaultAddressItem = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);

  const isDefaultAddressEnabled = useSelector(getIsDefaultAddressEnabled);
  const showDefaultAddress = useSelector(getShowDefaultAddress);
  const defaultAddressScope = useSelector(
    getDefaultAddressScope,
  ) as DefaultAddressScope;

  const defaultAddressDropdownOptions = DEFAULT_ADDRESS_OPTIONS.map((opt) => ({
    name: t(opt.messageKey),
    value: opt.value,
  }));

  const trackShowDefaultAddress = (
    enabled: boolean,
    scope: DefaultAddressScope,
  ) => {
    trackEvent({
      event: MetaMetricsEventName.SettingsUpdated,
      category: MetaMetricsEventCategory.Settings,
      properties: {
        /* eslint-disable @typescript-eslint/naming-convention */
        show_default_address: enabled,
        default_address_network: scope,
        /* eslint-enable @typescript-eslint/naming-convention */
        location: 'Settings Page',
      },
    });
  };

  const handleToggle = (value: boolean) => {
    const newValue = !value;
    dispatch(setShowDefaultAddress(newValue));
    trackShowDefaultAddress(newValue, defaultAddressScope);
  };

  const handleDropdownChange = (value: string) => {
    dispatch(setDefaultAddressScope(value as DefaultAddressScope));
    trackShowDefaultAddress(true, value as DefaultAddressScope);
    if (!showDefaultAddress) {
      dispatch(setShowDefaultAddress(true));
    }
  };

  if (!isDefaultAddressEnabled) {
    return null;
  }

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={1} marginBottom={3}>
      <SettingsToggleItem
        title={t('showDefaultAddress')}
        description={t('showDefaultAddressDescription')}
        value={showDefaultAddress}
        onToggle={handleToggle}
        dataTestId="show-default-address-toggle"
      />
      <Dropdown
        options={defaultAddressDropdownOptions}
        selectedOption={defaultAddressScope}
        onChange={handleDropdownChange}
        data-testid="default-address-scope-dropdown"
      />
    </Box>
  );
};
