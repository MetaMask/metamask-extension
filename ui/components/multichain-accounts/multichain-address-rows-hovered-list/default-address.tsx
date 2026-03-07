import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
  FontWeight,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import ToggleButton from '../../ui/toggle-button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { GENERAL_ROUTE } from '../../../helpers/constants/routes';
import {
  DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE,
  DefaultAddressScope,
} from '../../../../shared/constants/default-address';
import {
  getDefaultAddressScope,
  getShowDefaultAddress,
} from '../../../selectors';
import { setShowDefaultAddress } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

const METRICS_LOCATION = 'Account Hover Menu';

export const DefaultAddress = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const navigate = useNavigate();
  const showDefaultAddress = useSelector(getShowDefaultAddress);
  const defaultAddressScope = useSelector(
    getDefaultAddressScope,
  ) as DefaultAddressScope;
  const defaultScopeDisplayLabel = t(
    DEFAULT_ADDRESS_DISPLAY_KEY_BY_SCOPE[defaultAddressScope],
  );

  return (
    <Box paddingLeft={4} paddingBottom={2}>
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Box flexDirection={BoxFlexDirection.Column}>
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
          >
            {t('showDefaultAddress')}
          </Text>
          <Box flexDirection={BoxFlexDirection.Row} gap={2}>
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
            >
              {t('default')}: {defaultScopeDisplayLabel}
            </Text>
            <TextButton
              size={TextButtonSize.BodyXs}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                trackEvent({
                  category: MetaMetricsEventCategory.Navigation,
                  event: MetaMetricsEventName.NavSettingsOpened,
                  properties: {
                    location: METRICS_LOCATION,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    settings_type: 'show_default_address',
                  },
                });
                navigate(`${GENERAL_ROUTE}#show-default-address`);
              }}
              data-testid="change-in-settings-link"
            >
              {t('changeInSettings')}
            </TextButton>
          </Box>
        </Box>
        <ToggleButton
          value={showDefaultAddress}
          onToggle={(value: boolean) => {
            const newValue = !value;
            dispatch(setShowDefaultAddress(newValue));
            trackEvent({
              category: MetaMetricsEventCategory.Settings,
              event: MetaMetricsEventName.SettingsUpdated,
              properties: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                default_address_network: defaultAddressScope,
                location: METRICS_LOCATION,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                show_default_address: newValue,
              },
            });
          }}
          dataTestId="show-default-address-toggle"
        />
      </Box>
    </Box>
  );
};
