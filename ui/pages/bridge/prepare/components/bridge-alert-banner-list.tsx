import React from 'react';
import { useSelector } from 'react-redux';
import {
  isValidQuoteRequest,
  GenericQuoteRequest,
} from '@metamask/bridge-controller';

import {
  getBridgeQuotes,
  getHardwareWalletName,
} from '../../../../ducks/bridge/selectors';
import { BannerAlert, Text } from '../../../../components/component-library';
import {
  BackgroundColor,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Column } from '../../layout';
import { getCurrentKeyring } from '../../../../selectors';
import { isHardwareKeyring } from '../../../../helpers/utils/hardware';
import { useIsTxSubmittable } from '../../../../hooks/bridge/useIsTxSubmittable';
import { useDismissableAlerts } from '../../hooks/useDismissableBanners';
import { useBridgeAlerts } from '../../hooks/useBridgeAlerts';

export const BridgeAlertBannerList = ({
  quoteParams,
}: {
  quoteParams: Partial<GenericQuoteRequest>;
}) => {
  const t = useI18nContext();

  const isTxSubmittable = useIsTxSubmittable();
  const { bannerAlerts } = useBridgeAlerts();
  const { alertVisibility, dismissAlert } = useDismissableAlerts(bannerAlerts);

  const {
    /**
     * This quote may be older than the refresh rate, but we keep it for display purposes
     */
    activeQuote,
  } = useSelector(getBridgeQuotes);
  const keyring = useSelector(getCurrentKeyring);
  const hardwareWalletName = useSelector(getHardwareWalletName);
  const isUsingHardwareWallet = isHardwareKeyring(keyring?.type);

  // Alert banners
  return (
    <Column
      paddingInline={4}
      gap={4}
      backgroundColor={BackgroundColor.backgroundDefault}
      data-testid="bridge-banner-alerts"
    >
      {isUsingHardwareWallet &&
        isTxSubmittable &&
        hardwareWalletName &&
        activeQuote && (
          <BannerAlert
            title={t('hardwareWalletSubmissionWarningTitle')}
            textAlign={TextAlign.Left}
          >
            <ul style={{ listStyle: 'disc' }}>
              <li>
                <Text variant={TextVariant.bodyMd}>
                  {t('hardwareWalletSubmissionWarningStep1', [
                    hardwareWalletName,
                  ])}
                </Text>
              </li>
              <li>
                <Text variant={TextVariant.bodyMd}>
                  {t('hardwareWalletSubmissionWarningStep2', [
                    hardwareWalletName,
                  ])}
                </Text>
              </li>
            </ul>
          </BannerAlert>
        )}

      {isValidQuoteRequest(quoteParams, true) &&
        bannerAlerts.map((alert, index: number) =>
          alert && alertVisibility[alert.id] !== false ? (
            <BannerAlert
              key={`${alert.id}-${index}`}
              textAlign={TextAlign.Left}
              data-testid={`bridge-${alert.id}`}
              onClose={
                alertVisibility[alert.id]
                  ? () => dismissAlert(alert.id)
                  : undefined
              }
              title={alert.title}
              description={alert.description}
              {...alert.bannerAlertProps}
            />
          ) : null,
        )}
    </Column>
  );
};
