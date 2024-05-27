import React from 'react';
import browser from 'webextension-polyfill';

import { CONNECTIONS } from '../../../helpers/constants/routes';

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
  Size,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
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
import { useHistory } from 'react-router-dom';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { toggleAccountMenu } from '../../../store/actions';
import ConnectedStatusIndicator from '../../app/connected-status-indicator';
import { AccountPicker } from '../account-picker';
import { GlobalMenu } from '../global-menu';
import { InternalAccount } from '@metamask/keyring-api';
import { useDispatch, useSelector } from 'react-redux';
import {
  getSelectedInternalAccount,
  getTestNetworkBackgroundColor,
} from '../../../selectors';
import {
  getEnvironmentType,
  normalizeSafeAddress,
} from '../../../../app/scripts/lib/util';
import { shortenAddress } from '../../../helpers/utils/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { useContext, useState } from 'react';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MINUTE } from '../../../../shared/constants/time';

type AppHeaderUnlockedContentProps = {
  popupStatus: boolean;
  isEvmNetwork: boolean;
  currentNetwork: any;
  networkOpenCallback: () => void;
  disableNetworkPicker: boolean;
  disableAccountPicker: boolean;
  menuRef: any;
  internalAccount: InternalAccount;
};

export const AppHeaderUnlockedContent = ({
  popupStatus,
  isEvmNetwork,
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
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);

  // Used for account picker
  const internalAccount = useSelector(getSelectedInternalAccount);
  const shortenedAddress =
    internalAccount &&
    shortenAddress(normalizeSafeAddress(internalAccount.address));

  // During onboarding there is no selected internal account
  const currentAddress = internalAccount?.address;

  // Passing non-evm address to checksum function will throw an error
  const normalizedCurrentAddress = normalizeSafeAddress(currentAddress);
  const [copied, handleCopy] = useCopyToClipboard(MINUTE) as [
    boolean,
    (text: string) => void,
  ];

  const showConnectedStatus =
    getEnvironmentType() === ENVIRONMENT_TYPE_POPUP &&
    origin &&
    origin !== browser.runtime.id;

  const handleConnectionsRoute = () => {
    history.push(`${CONNECTIONS}/${encodeURIComponent(origin)}`);
  };

  return (
    <>
      {popupStatus ? (
        <Box className="multichain-app-header__contents__container">
          <Tooltip title={currentNetwork?.nickname} position="right">
            <PickerNetwork
              avatarNetworkProps={{
                backgroundColor: testNetworkBackgroundColor,
                role: 'img',
                name: currentNetwork?.nickname ?? '',
              }}
              className="multichain-app-header__contents--avatar-network"
              ref={menuRef}
              as="button"
              src={currentNetwork?.rpcPrefs?.imageUrl}
              label={currentNetwork?.nickname}
              aria-label={`${t('networkMenu')} ${currentNetwork?.nickname}`}
              labelProps={{
                display: Display.None,
              }}
              onClick={(e: React.MouseEvent<HTMLElement>) => {
                e.stopPropagation();
                e.preventDefault();
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
              name: currentNetwork?.nickname ?? '',
            }}
            margin={2}
            aria-label={`${t('networkMenu')} ${currentNetwork?.nickname}`}
            label={currentNetwork?.nickname}
            src={currentNetwork?.rpcPrefs?.imageUrl}
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              e.preventDefault();
              networkOpenCallback();
            }}
            display={[Display.None, Display.Flex]} // show on desktop hide on popover
            className="multichain-app-header__contents__network-picker"
            disabled={disableNetworkPicker}
            data-testid="network-display"
          />
        </div>
      )}

      {internalAccount && (
        <Text
          as="div"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
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
            paddingLeft={2}
            paddingRight={2}
          />
          <Tooltip
            position="left"
            title={copied ? t('addressCopied') : t('copyToClipboard')}
          >
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
              ellipsis
              textProps={{
                display: Display.Flex,
                alignItems: AlignItems.center,
                gap: 2,
              }}
              style={{ height: 'auto' }} // ButtonBase doesn't have auto size
              data-testid="app-header-copy-button"
            >
              <Text
                color={TextColor.textAlternative}
                variant={TextVariant.bodySm}
                ellipsis
                as="span"
              >
                {shortenedAddress}
              </Text>
            </ButtonBase>
          </Tooltip>
        </Text>
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
                onClick={() => {
                  handleConnectionsRoute();
                }}
                disabled={!isEvmNetwork}
              />
            </Box>
          )}{' '}
          <Box
            ref={menuRef}
            display={Display.Flex}
            justifyContent={JustifyContent.flexEnd}
            width={BlockSize.Full}
          >
            <ButtonIcon
              iconName={IconName.MoreVertical}
              data-testid="account-options-menu-button"
              ariaLabel={t('accountOptions')}
              onClick={() => {
                trackEvent({
                  event: MetaMetricsEventName.NavMainMenuOpened,
                  category: MetaMetricsEventCategory.Navigation,
                  properties: {
                    location: 'Home',
                  },
                });
                setAccountOptionsMenuOpen(true);
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
