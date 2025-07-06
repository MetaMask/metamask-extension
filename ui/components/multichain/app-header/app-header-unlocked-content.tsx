import React, { useContext, useEffect, useMemo, useState } from 'react';
import browser from 'webextension-polyfill';
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
  Text,
} from '../../component-library';
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
  getOriginOfCurrentTab,
  getUseBlockie,
} from '../../../selectors';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { shortenAddress } from '../../../helpers/utils/util';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../shared/constants/app';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MINUTE } from '../../../../shared/constants/time';
import { REVIEW_PERMISSIONS } from '../../../helpers/constants/routes';
import { NotificationsButton } from './notifications-button';
import { ExpandViewButton } from './expand-view-button';

type AppHeaderUnlockedContentProps = {
  disableAccountPicker: boolean;
  menuRef: React.RefObject<HTMLButtonElement>;
};

export const AppHeaderUnlockedContent = ({
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
              process.env.REMOVE_GNS
                ? AlignItems.flexStart
                : AlignItems.flexStart
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
        <Box display={Display.Flex} gap={4} alignItems={AlignItems.center}>
          {showConnectedStatus && (
            <Box ref={menuRef}>
              <ConnectedStatusIndicator
                onClick={() => handleConnectionsRoute()}
              />
            </Box>
          )}
          {getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN && (
            <ButtonBase
              startIconName={IconName.Wise}
              onClick={() => {
                window.open('https://wise.com/', '_blank');
              }}
              size={ButtonBaseSize.Sm}
              backgroundColor={BackgroundColor.transparent}
              borderRadius={BorderRadius.LG}
              paddingLeft={2}
              paddingRight={2}
              data-testid="header-deposit-wise"
              style={{ border: '1px solid #E2E2E2', width: '180px' }}
            >
              {t('depositWise')}
            </ButtonBase>
          )}
          {getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN ? null : (
            <ExpandViewButton />
          )}

          <NotificationsButton />
          <Box
            ref={menuRef}
            display={Display.Flex}
            justifyContent={JustifyContent.flexEnd}
            width={getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN ? undefined : BlockSize.Full}
            style={getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN ? { width: 'auto' } : undefined}
          >
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
