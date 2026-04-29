import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  isValidQuoteRequest,
  GenericQuoteRequest,
} from '@metamask/bridge-controller';

import {
  BannerAlert,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  getBridgeQuotes,
  getHardwareWalletName,
} from '../../../../ducks/bridge/selectors';
import { BackgroundColor } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Column } from '../../layout';
import { getCurrentKeyring } from '../../../../selectors';
import { isHardwareKeyring } from '../../../../helpers/utils/hardware';
import { useIsTxSubmittable } from '../../../../hooks/bridge/useIsTxSubmittable';
import { useDismissableAlerts } from '../../hooks/useDismissableBanners';
import { useBridgeAlerts } from '../../hooks/useBridgeAlerts';
import { type BridgeAlert } from '../types';
import { BridgeAlertModal } from './bridge-alert-modal';

const LocalBannerAlert = ({
  alert,
  onClose,
}: {
  alert: BridgeAlert;
  onClose?: () => void;
}) => {
  const bannerProps = alert.bannerAlertProps;
  const closeButtonProps = alert.openModalOnClick
    ? { iconProps: { name: IconName.ArrowRight } }
    : undefined;

  if (
    bannerProps &&
    'actionButtonLabel' in bannerProps &&
    'actionButtonOnClick' in bannerProps
  ) {
    return (
      <BannerAlert
        data-testid={`bridge-${alert.id}`}
        onClose={onClose}
        closeButtonProps={closeButtonProps}
        title={alert.title}
        description={alert.description}
        severity={bannerProps.severity}
        actionButtonLabel={bannerProps.actionButtonLabel}
        actionButtonOnClick={bannerProps.actionButtonOnClick}
      />
    );
  }

  return (
    <BannerAlert
      data-testid={`bridge-${alert.id}`}
      onClose={onClose}
      closeButtonProps={closeButtonProps}
      title={alert.title}
      description={alert.description}
      severity={bannerProps?.severity}
    />
  );
};

export const BridgeAlertBannerList = ({
  quoteParams,
}: {
  quoteParams: Partial<GenericQuoteRequest>;
}) => {
  const t = useI18nContext();

  const isTxSubmittable = useIsTxSubmittable();
  const { bannerAlerts } = useBridgeAlerts();
  const { alertVisibility, dismissAlert } = useDismissableAlerts(bannerAlerts);
  const [modalAlertId, setModalAlertId] = useState<
    BridgeAlert['id'] | undefined
  >();

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
    <>
      <Column
        paddingLeft={4}
        paddingRight={4}
        paddingBottom={4}
        gap={4}
        backgroundColor={BackgroundColor.backgroundDefault}
        data-testid="bridge-banner-alerts"
      >
        {isUsingHardwareWallet &&
          isTxSubmittable &&
          hardwareWalletName &&
          activeQuote && (
            <BannerAlert title={t('hardwareWalletSubmissionWarningTitle')}>
              <ul style={{ listStyle: 'disc' }}>
                <li>
                  <Text variant={TextVariant.BodyMd}>
                    {t('hardwareWalletSubmissionWarningStep1', [
                      hardwareWalletName,
                    ])}
                  </Text>
                </li>
                <li>
                  <Text variant={TextVariant.BodyMd}>
                    {t('hardwareWalletSubmissionWarningStep2', [
                      hardwareWalletName,
                    ])}
                  </Text>
                </li>
              </ul>
            </BannerAlert>
          )}

        {isValidQuoteRequest(quoteParams, false) &&
          bannerAlerts
            .filter((alert) => alert && alertVisibility[alert.id] !== false)
            .map((alert, index: number) => {
              let onClose: (() => void) | undefined;
              if (alert.openModalOnClick) {
                onClose = () => setModalAlertId(alert.id);
              } else if (alert.isDismissable) {
                onClose = () => dismissAlert(alert.id);
              }

              return (
                <LocalBannerAlert
                  key={`${alert.id}-${index}`}
                  alert={alert}
                  onClose={onClose}
                />
              );
            })}
      </Column>

      <BridgeAlertModal
        isOpen={Boolean(modalAlertId)}
        variant="alert-details"
        alertId={modalAlertId}
        onClose={() => setModalAlertId(undefined)}
      />
    </>
  );
};
