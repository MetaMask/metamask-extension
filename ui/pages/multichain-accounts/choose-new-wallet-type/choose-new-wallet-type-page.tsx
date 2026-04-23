import React, { useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { TextVariant as LegacyTextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  CONNECT_HARDWARE_ROUTE,
  IMPORT_SRP_ROUTE,
  ADD_WALLET_PAGE_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../helpers/constants/routes';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import {
  getIsAddSnapAccountEnabled,
  getIsWatchEthereumAccountEnabled,
  getManageInstitutionalWallets,
} from '../../../selectors';
import { INSTITUTIONAL_WALLET_SNAP_ID } from '../../../../shared/lib/accounts';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  ACCOUNT_WATCHER_NAME,
  ACCOUNT_WATCHER_SNAP_ID,
  // eslint-disable-next-line import-x/no-restricted-paths
} from '../../../../app/scripts/lib/snap-keyring/account-watcher-snap';
import { getSnapRoute } from '../../../helpers/utils/util';
import type { WalletTypeOption } from './choose-new-wallet-type-page.types';

export const ChooseNewWalletTypePage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { trackEvent } = useContext(MetaMetricsContext);

  const institutionalWalletsEnabled = useSelector(
    getManageInstitutionalWallets,
  );
  const addSnapAccountEnabled = useSelector(getIsAddSnapAccountEnabled);
  const isAddWatchEthereumAccountEnabled = useSelector(
    getIsWatchEthereumAccountEnabled,
  );

  const walletOptions: WalletTypeOption[] = useMemo(
    () => [
      {
        id: 'import-wallet',
        titleKey: 'importAWallet',
        descriptionKey: 'importAWalletDescription',
        iconName: IconName.Wallet,
        route: IMPORT_SRP_ROUTE,
      },
      {
        id: 'import-account',
        titleKey: 'importAnAccount',
        descriptionKey: 'importAnAccountDescription',
        iconName: IconName.Download,
        route: ADD_WALLET_PAGE_ROUTE,
      },
      {
        id: 'hardware-wallet',
        titleKey: 'connectAHardwareWallet',
        descriptionKey: 'connectAHardwareWalletDescription',
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
              route: getSnapRoute(INSTITUTIONAL_WALLET_SNAP_ID),
            },
          ]
        : []),
    ],
    [institutionalWalletsEnabled],
  );

  const handleOptionClick = useCallback(
    (option: WalletTypeOption) => {
      if (option.metricsEvent) {
        trackEvent(option.metricsEvent);
      }

      if (option.id === 'import-wallet') {
        trackEvent({
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.ImportSecretRecoveryPhrase,
          properties: {
            status: 'started',
            location: 'Add Wallet Modal',
          },
        });
      }

      if (option.id === 'hardware-wallet') {
        if (
          getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ||
          getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL
        ) {
          const keepWindowOpen =
            getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;
          globalThis.platform.openExtensionInBrowser?.(
            option.route,
            null,
            keepWindowOpen,
          );
        } else {
          navigate(option.route);
        }
      } else {
        navigate(option.route);
      }
    },
    [trackEvent, navigate],
  );

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
    globalThis.platform.openTab({
      url: process.env.ACCOUNT_SNAPS_DIRECTORY_URL as string,
    });
  }, [trackEvent]);

  const handleAddWatchAccount = useCallback(() => {
    trackEvent({
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
    navigate(getSnapRoute(ACCOUNT_WATCHER_SNAP_ID));
  }, [trackEvent, navigate]);

  return (
    <Page className="choose-new-wallet-type-page">
      <Header
        textProps={{
          variant: LegacyTextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => navigate(PREVIOUS_ROUTE)}
            data-testid="back-button"
          />
        }
      >
        {t('addAWallet')}
      </Header>
      <Content paddingLeft={4} paddingRight={4}>
        <Box flexDirection={BoxFlexDirection.Column} gap={3}>
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
              paddingLeft={4}
              paddingRight={4}
              paddingTop={3}
              paddingBottom={3}
              gap={4}
              backgroundColor={BoxBackgroundColor.BackgroundMuted}
              flexDirection={BoxFlexDirection.Row}
              className="rounded-xl cursor-pointer"
              tabIndex={0}
              data-testid={`choose-wallet-type-${option.id}`}
            >
              <Box
                alignItems={BoxAlignItems.Center}
                backgroundColor={BoxBackgroundColor.BackgroundMuted}
                className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl"
              >
                <Icon
                  name={option.iconName}
                  size={IconSize.Md}
                  color={IconColor.IconAlternative}
                />
              </Box>
              <Box
                flexDirection={BoxFlexDirection.Column}
                className="flex-1 min-w-0"
              >
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.TextDefault}
                >
                  {t(option.titleKey)}
                </Text>
                {option.descriptionKey && (
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                    color={TextColor.TextAlternative}
                  >
                    {t(option.descriptionKey)}
                  </Text>
                )}
              </Box>
            </Box>
          ))}
          {addSnapAccountEnabled && (
            <Box
              onClick={handleSnapAccountLinkClick}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSnapAccountLinkClick();
                }
              }}
              alignItems={BoxAlignItems.Center}
              paddingLeft={4}
              paddingRight={4}
              paddingTop={3}
              paddingBottom={3}
              gap={4}
              backgroundColor={BoxBackgroundColor.BackgroundMuted}
              flexDirection={BoxFlexDirection.Row}
              className="rounded-xl cursor-pointer"
              tabIndex={0}
              data-testid="choose-wallet-type-snap-account"
            >
              <Box
                alignItems={BoxAlignItems.Center}
                backgroundColor={BoxBackgroundColor.BackgroundMuted}
                className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl"
              >
                <Icon
                  name={IconName.Snaps}
                  size={IconSize.Md}
                  color={IconColor.IconAlternative}
                />
              </Box>
              <Box
                flexDirection={BoxFlexDirection.Column}
                className="flex-1 min-w-0"
              >
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.TextDefault}
                >
                  {t('settingAddSnapAccount')}
                </Text>
              </Box>
            </Box>
          )}
          {isAddWatchEthereumAccountEnabled && (
            <Box
              onClick={handleAddWatchAccount}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleAddWatchAccount();
                }
              }}
              alignItems={BoxAlignItems.Center}
              paddingLeft={4}
              paddingRight={4}
              paddingTop={3}
              paddingBottom={3}
              gap={4}
              backgroundColor={BoxBackgroundColor.BackgroundMuted}
              flexDirection={BoxFlexDirection.Row}
              className="rounded-xl cursor-pointer"
              tabIndex={0}
              data-testid="choose-wallet-type-watch-ethereum-account"
            >
              <Box
                alignItems={BoxAlignItems.Center}
                backgroundColor={BoxBackgroundColor.BackgroundMuted}
                className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl"
              >
                <Icon
                  name={IconName.Eye}
                  size={IconSize.Md}
                  color={IconColor.IconAlternative}
                />
              </Box>
              <Box
                flexDirection={BoxFlexDirection.Column}
                className="flex-1 min-w-0"
              >
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.TextDefault}
                >
                  {t('addEthereumWatchOnlyAccount')}
                </Text>
              </Box>
            </Box>
          )}
        </Box>
      </Content>
    </Page>
  );
};
