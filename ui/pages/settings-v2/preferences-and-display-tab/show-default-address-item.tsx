import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import ToggleButton from '../../../components/ui/toggle-button';
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
    <Box flexDirection={BoxFlexDirection.Column} gap={1} paddingVertical={3}>
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {t('showDefaultAddress')}
        </Text>
        <ToggleButton
          value={showDefaultAddress}
          onToggle={handleToggle}
          dataTestId="show-default-address-toggle"
        />
      </Box>
      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.TextAlternative}
        className="mb-3"
      >
        {t('showDefaultAddressDescription')}
      </Text>
      <Dropdown
        options={defaultAddressDropdownOptions}
        selectedOption={defaultAddressScope}
        onChange={handleDropdownChange}
        data-testid="default-address-scope-dropdown"
      />
    </Box>
  );
};
