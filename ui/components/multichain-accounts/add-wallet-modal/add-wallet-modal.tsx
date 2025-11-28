import React, { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  FontWeight,
  IconColor,
  Icon,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  BoxBorderColor,
} from '@metamask/design-system-react';

import { useSelector } from 'react-redux';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '../../component-library';
import type { ModalProps } from '../../component-library';
import { FlexDirection } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  CONNECT_HARDWARE_ROUTE,
  IMPORT_SRP_ROUTE,
  ADD_WALLET_PAGE_ROUTE,
} from '../../../helpers/constants/routes';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import {
  getIsAddSnapAccountEnabled,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask,build-experimental)
  getIsWatchEthereumAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  getManageInstitutionalWallets,
} from '../../../selectors';
import { INSTITUTIONAL_WALLET_SNAP_ID } from '../../../../shared/lib/accounts';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  type MetaMetricsEventPayload,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
///: BEGIN:ONLY_INCLUDE_IF(build-flask,build-experimental)
import {
  ACCOUNT_WATCHER_NAME,
  ACCOUNT_WATCHER_SNAP_ID,
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../app/scripts/lib/snap-keyring/account-watcher-snap';
///: END:ONLY_INCLUDE_IF

export type AddWalletModalProps = Omit<
  ModalProps,
  'isOpen' | 'onClose' | 'children'
> & {
  isOpen: boolean;
  onClose: () => void;
};

type WalletOption = {
  id: string;
  titleKey: string;
  iconName: IconName;
  route: string;
  metricsEvent?: MetaMetricsEventPayload;
};

export const AddWalletModal: React.FC<AddWalletModalProps> = ({
  onClose,
  isOpen,
  ...props
}) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const institutionalWalletsEnabled = useSelector(
    getManageInstitutionalWallets,
  );
  const trackEvent = useContext(MetaMetricsContext);
  const addSnapAccountEnabled = useSelector(getIsAddSnapAccountEnabled);
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask,build-experimental)
  const isAddWatchEthereumAccountEnabled = useSelector(
    getIsWatchEthereumAccountEnabled,
  );
  ///: END:ONLY_INCLUDE_IF

  const walletOptions: WalletOption[] = [
    {
      id: 'import-wallet',
      titleKey: 'importAWallet',
      iconName: IconName.Wallet,
      route: IMPORT_SRP_ROUTE,
    },
    {
      id: 'import-account',
      titleKey: 'importAnAccount',
      iconName: IconName.Download,
      route: ADD_WALLET_PAGE_ROUTE,
    },
    {
      id: 'hardware-wallet',
      titleKey: 'addAHardwareWallet',
      iconName: IconName.Hardware,
      route: CONNECT_HARDWARE_ROUTE,
      metricsEvent: {
        event: MetaMetricsEventName.AddHardwareWalletClicked,
        category: MetaMetricsEventCategory.Navigation,
      },
    },
    ...(institutionalWalletsEnabled
      ? [
          {
            id: 'institutional-wallet',
            titleKey: 'manageInstitutionalWallets',
            iconName: IconName.Add,
            route: `/snaps/view/${encodeURIComponent(
              INSTITUTIONAL_WALLET_SNAP_ID,
            )}`,
          },
        ]
      : []),
  ];

  const handleOptionClick = (option: WalletOption) => {
    onClose?.();

    if (option.metricsEvent) {
      trackEvent(option.metricsEvent);
    }

    if (option.id === 'import-wallet') {
      // Track the event for the selected option.
      trackEvent({
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.ImportSecretRecoveryPhrase,
        properties: {
          status: 'started',
          location: 'Add Wallet Modal',
        },
      });
    }

    // Hardware wallet connections require expanded view
    if (option.id === 'hardware-wallet') {
      if (
        getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ||
        getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL
      ) {
        global.platform.openExtensionInBrowser?.(option.route);
      } else {
        navigate(option.route);
      }
    } else {
      navigate(option.route);
    }
  };

  const handleSnapAccountLinkClick = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.AccountAddSelected,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: MetaMetricsEventAccountType.Snap,
        location: 'Main Menu',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: null,
      },
    });
    global.platform.openTab({
      url: process.env.ACCOUNT_SNAPS_DIRECTORY_URL as string,
    });
  }, [trackEvent]);

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask,build-experimental)
  const handleAddWatchAccount = useCallback(async () => {
    await trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.AccountAddSelected,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: MetaMetricsEventAccountType.Snap,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        snap_id: ACCOUNT_WATCHER_SNAP_ID,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        snap_name: ACCOUNT_WATCHER_NAME,
        location: 'Main Menu',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: null,
      },
    });
    onClose();
    navigate(`/snaps/view/${encodeURIComponent(ACCOUNT_WATCHER_SNAP_ID)}`);
  }, [trackEvent, onClose, navigate]);
  ///: END:ONLY_INCLUDE_IF

  return (
    <Modal isOpen={isOpen} onClose={onClose} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('addWallet')}</ModalHeader>
        <ModalBody
          paddingLeft={0}
          paddingRight={0}
          flexDirection={FlexDirection.Column}
          gap={2}
        >
          {walletOptions.map((option) => (
            <Box
              key={option.id}
              onClick={() => handleOptionClick(option)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOptionClick(option);
                }
              }}
              alignItems={BoxAlignItems.Center}
              padding={4}
              gap={3}
              backgroundColor={BoxBackgroundColor.BackgroundDefault}
              flexDirection={BoxFlexDirection.Row}
              borderColor={BoxBorderColor.BorderMuted}
              className="hover:bg-background-default-hover cursor-pointer transition-all duration-200 w-full text-left outline-none focus:outline-none focus:shadow-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-primary-default)]"
              tabIndex={0}
              data-testid={`add-wallet-modal-${option.id}`}
            >
              <Icon
                name={option.iconName}
                size={IconSize.Md}
                color={IconColor.IconAlternative}
              />
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextDefault}
                className="flex-1"
              >
                {t(option.titleKey)}
              </Text>
              <Icon name={IconName.ArrowRight} size={IconSize.Sm} />
            </Box>
          ))}
          {addSnapAccountEnabled && (
            <Box
              key="snap-account"
              onClick={() => handleSnapAccountLinkClick()}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSnapAccountLinkClick();
                }
              }}
              alignItems={BoxAlignItems.Center}
              padding={4}
              gap={3}
              backgroundColor={BoxBackgroundColor.BackgroundDefault}
              flexDirection={BoxFlexDirection.Row}
              borderColor={BoxBorderColor.BorderMuted}
              className="hover:bg-background-default-hover cursor-pointer transition-all duration-200 w-full text-left outline-none focus:outline-none focus:shadow-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-primary-default)]"
              tabIndex={0}
              data-testid={`add-wallet-modal-snap-account`}
            >
              <Icon
                name={IconName.Snaps}
                size={IconSize.Md}
                color={IconColor.IconAlternative}
              />
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextDefault}
                className="flex-1"
              >
                {t('settingAddSnapAccount')}
              </Text>
              <Icon name={IconName.ArrowRight} size={IconSize.Sm} />
            </Box>
          )}
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-flask,build-experimental)
            isAddWatchEthereumAccountEnabled && (
              <Box
                key="watch-ethereum-account"
                onClick={() => handleAddWatchAccount()}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleAddWatchAccount();
                  }
                }}
                alignItems={BoxAlignItems.Center}
                padding={4}
                gap={3}
                backgroundColor={BoxBackgroundColor.BackgroundDefault}
                flexDirection={BoxFlexDirection.Row}
                borderColor={BoxBorderColor.BorderMuted}
                className="hover:bg-background-default-hover cursor-pointer transition-all duration-200 w-full text-left outline-none focus:outline-none focus:shadow-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-primary-default)]"
                tabIndex={0}
                data-testid={`add-wallet-modal-watch-ethereum-account`}
              >
                <Icon
                  name={IconName.Eye}
                  size={IconSize.Md}
                  color={IconColor.IconAlternative}
                />
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.TextDefault}
                  className="flex-1"
                >
                  {t('addEthereumWatchOnlyAccount')}
                </Text>
                <Icon name={IconName.ArrowRight} size={IconSize.Sm} />
              </Box>
            )
            ///: END:ONLY_INCLUDE_IF
          }
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddWalletModal;
