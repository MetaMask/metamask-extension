import React, { useContext, useEffect, useMemo, useState } from 'react';
import browser from 'webextension-polyfill';

import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  ButtonBase,
  ButtonBaseSize,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  IconSize,
  PickerNetwork,
  Text,
} from '../../component-library';
import Tooltip from '../../ui/tooltip';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { toggleAccountMenu } from '../../../store/actions';
import ConnectedStatusIndicator from '../../app/connected-status-indicator';
import { AccountPicker } from '../account-picker';
import { GlobalMenu } from '../global-menu';
import {
  getSelectedInternalAccount,
  getTestNetworkBackgroundColor,
  getOriginOfCurrentTab,
  getUseBlockie,
} from '../../../selectors';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { shortenAddress } from '../../../helpers/utils/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MINUTE } from '../../../../shared/constants/time';
import { NotificationsTagCounter } from '../notifications-tag-counter';
import { REVIEW_PERMISSIONS } from '../../../helpers/constants/routes';
import { getNetworkIcon } from '../../../../shared/modules/network.utils';
import { TraceName, trace } from '../../../../shared/lib/trace';

type AppHeaderUnlockedContentProps = {
  popupStatus: boolean;
  currentNetwork: MultichainNetworkConfiguration;
  networkOpenCallback: () => void;
  disableNetworkPicker: boolean;
  disableAccountPicker: boolean;
  menuRef: React.RefObject<HTMLButtonElement>;
};

export const AppHeaderUnlockedContent = ({
  popupStatus,
  currentNetwork,
  networkOpenCallback,
  disableNetworkPicker,
  disableAccountPicker,
  menuRef,
}: AppHeaderUnlockedContentProps) => {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const origin = useSelector(getOriginOfCurrentTab);
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const useBlockie = useSelector(getUseBlockie);
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);
  const networkIconSrc = getNetworkIcon(currentNetwork);

  // Used for account picker
  const internalAccount = useSelector(getSelectedInternalAccount);
  const shortenedAddress =
    internalAccount &&
    shortenAddress(normalizeSafeAddress(internalAccount.address));

  // During onboarding there is no selected internal account
  const currentAddress = internalAccount?.address;

  // Passing non-evm address to checksum function will throw an error
  const normalizedCurrentAddress = normalizeSafeAddress(currentAddress);
  const [copied, handleCopy, resetCopyState] = useCopyToClipboard(MINUTE, {
    expireClipboard: false,
  });

  // Reset copy state when a switching accounts
  useEffect(() => {
    if (normalizedCurrentAddress) {
      resetCopyState();
    }
  }, [normalizedCurrentAddress, resetCopyState]);

  const showConnectedStatus =
    getEnvironmentType() === ENVIRONMENT_TYPE_POPUP &&
    origin &&
    origin !== browser.runtime.id;

  const handleMainMenuOpened = () => {
    trackEvent({
      event: MetaMetricsEventName.NavMainMenuOpened,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        location: 'Home',
      },
    });
    setAccountOptionsMenuOpen(true);
  };

  const handleConnectionsRoute = () => {
    history.push(`${REVIEW_PERMISSIONS}/${encodeURIComponent(origin)}`);
  };

  const CopyButton = useMemo(
    () => (
      <ButtonBase
        className="multichain-app-header__address-copy-button"
        onClick={() => handleCopy(normalizedCurrentAddress)}
        size={ButtonBaseSize.Sm}
        backgroundColor={BackgroundColor.transparent}
        borderRadius={BorderRadius.LG}
        endIconName={copied ? IconName.CopySuccess : IconName.Copy}
        endIconProps={{
          color: IconColor.iconAlternative,
          size: IconSize.Sm,
        }}
        paddingLeft={0}
        paddingRight={0}
        ellipsis
        textProps={{
          display: Display.Flex,
          gap: 2,
          variant: TextVariant.bodyMdMedium,
        }}
        style={{ height: 'auto' }} // ButtonBase doesn't have auto size
        data-testid="app-header-copy-button"
      >
        <Text
          color={TextColor.textAlternative}
          variant={TextVariant.bodySmMedium}
          ellipsis
          as="span"
        >
          {shortenedAddress}
        </Text>
      </ButtonBase>
    ),
    [copied, handleCopy, normalizedCurrentAddress, shortenedAddress],
  );

  const AppContent = useMemo(
    () => (
      <>
        {process.env.REMOVE_GNS ? (
          <AvatarAccount
            variant={
              useBlockie
                ? AvatarAccountVariant.Blockies
                : AvatarAccountVariant.Jazzicon
            }
            address={internalAccount.address}
            size={AvatarAccountSize.Md}
          />
        ) : null}
        {internalAccount && (
          <Text
            as="div"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={
              process.env.REMOVE_GNS ? AlignItems.flexStart : AlignItems.center
            }
            ellipsis
          >
            <AccountPicker
              address={internalAccount.address}
              name={internalAccount.metadata.name}
              onClick={() => {
                dispatch(toggleAccountMenu());

                trackEvent({
                  event: MetaMetricsEventName.NavAccountMenuOpened,
                  category: MetaMetricsEventCategory.Navigation,
                  properties: {
                    location: 'Home',
                  },
                });
              }}
              disabled={disableAccountPicker}
              labelProps={{ fontWeight: FontWeight.Bold }}
              paddingLeft={0}
              paddingRight={0}
            />
            {process.env.REMOVE_GNS ? (
              <>{CopyButton}</>
            ) : (
              <Tooltip
                position="left"
                title={copied ? t('addressCopied') : t('copyToClipboard')}
              >
                {CopyButton}
              </Tooltip>
            )}
          </Text>
        )}
      </>
    ),
    [
      disableAccountPicker,
      dispatch,
      internalAccount,
      t,
      trackEvent,
      useBlockie,
      CopyButton,
      copied,
    ],
  );

  return (
    <>
      {process.env.REMOVE_GNS ? null : (
        <>
          {popupStatus ? (
            <Box className="multichain-app-header__contents__container">
              <Tooltip title={currentNetwork.name} position="right">
                <PickerNetwork
                  avatarNetworkProps={{
                    backgroundColor: testNetworkBackgroundColor,
                    role: 'img',
                    name: currentNetwork.name,
                  }}
                  className="multichain-app-header__contents--avatar-network"
                  ref={menuRef}
                  as="button"
                  src={networkIconSrc}
                  label={currentNetwork.name}
                  aria-label={`${t('networkMenu')} ${currentNetwork.name}`}
                  labelProps={{
                    display: Display.None,
                  }}
                  onClick={(e: React.MouseEvent<HTMLElement>) => {
                    e.stopPropagation();
                    e.preventDefault();
                    trace({ name: TraceName.NetworkList });
                    networkOpenCallback();
                  }}
                  display={[Display.Flex, Display.None]} // show on popover hide on desktop
                  disabled={disableNetworkPicker}
                />
              </Tooltip>
            </Box>
          ) : (
            <div>
              <PickerNetwork
                avatarNetworkProps={{
                  backgroundColor: testNetworkBackgroundColor,
                  role: 'img',
                  name: currentNetwork.name,
                }}
                margin={2}
                aria-label={`${t('networkMenu')} ${currentNetwork.name}`}
                label={currentNetwork.name}
                src={networkIconSrc}
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  e.stopPropagation();
                  e.preventDefault();
                  trace({ name: TraceName.NetworkList });
                  networkOpenCallback();
                }}
                display={[Display.None, Display.Flex]} // show on desktop hide on popover
                className="multichain-app-header__contents__network-picker"
                disabled={disableNetworkPicker}
                data-testid="network-display"
              />
            </div>
          )}
        </>
      )}
      {process.env.REMOVE_GNS ? (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          gap={2}
        >
          {AppContent}
        </Box>
      ) : (
        <>{AppContent}</>
      )}
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.flexEnd}
        style={{ marginLeft: 'auto' }}
      >
        <Box display={Display.Flex} gap={4}>
          {showConnectedStatus && (
            <Box ref={menuRef}>
              <ConnectedStatusIndicator
                onClick={() => handleConnectionsRoute()}
              />
            </Box>
          )}{' '}
          <Box
            ref={menuRef}
            display={Display.Flex}
            justifyContent={JustifyContent.flexEnd}
            width={BlockSize.Full}
          >
            {!accountOptionsMenuOpen && (
              <Box
                style={{ position: 'relative' }}
                onClick={() => handleMainMenuOpened()}
              >
                <NotificationsTagCounter noLabel />
              </Box>
            )}
            <ButtonIcon
              iconName={IconName.Menu}
              data-testid="account-options-menu-button"
              ariaLabel={t('accountOptions')}
              onClick={() => {
                handleMainMenuOpened();
              }}
              size={ButtonIconSize.Sm}
            />
          </Box>
        </Box>
        <GlobalMenu
          anchorElement={menuRef.current}
          isOpen={accountOptionsMenuOpen}
          closeMenu={() => setAccountOptionsMenuOpen(false)}
        />
      </Box>
    </>
  );
};
