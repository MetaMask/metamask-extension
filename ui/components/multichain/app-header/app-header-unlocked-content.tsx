import React, { useContext, useState } from 'react';
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
  Size,
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
  const [copied, handleCopy] = useCopyToClipboard(MINUTE) as [
    boolean,
    (text: string) => void,
  ];

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

  return (
    <>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={2}
      >
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
          <AvatarAccount
            variant={
              useBlockie
                ? AvatarAccountVariant.Blockies
                : AvatarAccountVariant.Jazzicon
            }
            address={internalAccount.address}
            size={AvatarAccountSize.Lg}
          />
          ///: END:ONLY_INCLUDE_IF
        }
        {internalAccount && (
          <Text
            as="div"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.flexStart}
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
                paddingLeft={0}
                paddingRight={0}
                ellipsis
                textProps={{
                  display: Display.Flex,
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
      </Box>
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
              iconName={IconName.MoreVertical}
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
