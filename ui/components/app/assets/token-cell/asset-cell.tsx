import React, { useCallback, useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useTokenDisplayInfo } from '../hooks';
import {
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  ButtonSecondary,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import { getMultichainIsEvm } from '../../../../selectors/multichain';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';
import { setEditedNetwork } from '../../../../store/actions';
import {
  SafeChain,
  useSafeChains,
} from '../../../../pages/settings/networks-tab/networks-form/use-safe-chains';
import { TokenWithFiatAmount } from '../types';
import {
  TokenCellBadge,
  TokenCellTitle,
  TokenCellPercentChange,
  TokenCellPrimaryDisplay,
  TokenCellSecondaryDisplay,
} from './cells';
import { AvatarGroup } from '../../../multichain';
import { AvatarType } from '../../../multichain/avatar-group/avatar-group.types';
import { DeFiProtocolCellPrimaryDisplay } from './cells/defi-protocol-cell-primary-display';

export const AssetCellLocation = {
  TokensTab: 'TokensTab',
  DefiTab: 'DefiTab',
  DefiDetailsTab: 'DefiDetailsTab',
} as const;
export type AssetCellLocation =
  (typeof AssetCellLocation)[keyof typeof AssetCellLocation];

export type AssetCellProps =
  | {
      location: typeof AssetCellLocation.TokensTab;
      asset: TokenWithFiatAmount;
      onClick: (chainId: string, address: string) => void;
      privacyMode: boolean;
    }
  | {
      location: typeof AssetCellLocation.DefiDetailsTab;
      asset: TokenWithFiatAmount;
      privacyMode: boolean;
      onClick: undefined;
    }
  | {
      location: typeof AssetCellLocation.DefiTab;
      onClick: (chainId: string, protocolId: string) => void;
      asset: TokenWithFiatAmount & {
        iconGroup: { avatarValue: string; symbol: string }[];
        protocolId: string;
      };
      privacyMode: boolean;
    };

export default function AssetCell({
  asset,
  privacyMode = false,
  onClick,
  location,
}: AssetCellProps) {
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useI18nContext();
  const isEvm = useSelector(getMultichainIsEvm);
  const trackEvent = useContext(MetaMetricsContext);
  const { safeChains } = useSafeChains();
  const [showScamWarningModal, setShowScamWarningModal] = useState(false);

  const decimalChainId = isEvm && parseInt(hexToDecimal(asset.chainId), 10);

  const safeChainDetails: SafeChain | undefined = safeChains?.find((chain) => {
    if (typeof decimalChainId === 'number') {
      return chain.chainId === decimalChainId.toString();
    }
    return undefined;
  });

  const tokenDisplayInfo = useTokenDisplayInfo({
    token: asset,
  });

  const handleClick = useCallback(
    (e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      e?.preventDefault();

      if (!onClick || !asset.chainId || showScamWarningModal) {
        return;
      }

      if (location === AssetCellLocation.TokensTab) {
        onClick(asset.chainId, asset.address);
        trackEvent({
          category: MetaMetricsEventCategory.Tokens,
          event: MetaMetricsEventName.TokenDetailsOpened,
          properties: {
            location: 'Home',
            chain_id: asset.chainId,
            token_symbol: asset.symbol,
          },
        });
      } else if (location === AssetCellLocation.DefiTab) {
        onClick(asset.chainId, asset.protocolId);
        trackEvent({
          category: MetaMetricsEventCategory.DeFi,
          event: MetaMetricsEventName.DefiDetailsOpened,
          properties: {
            location: 'Home',
            chain_id: asset.chainId,
            protocol_id: asset.protocolId,
          },
        });
      }
    },
    [onClick, asset, location, showScamWarningModal, trackEvent],
  );

  const handleScamWarningModal = (arg: boolean) => {
    setShowScamWarningModal(arg);
  };

  if (!asset.chainId) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      width={BlockSize.Full}
      height={BlockSize.Full}
      gap={4}
    >
      <Box
        as="a"
        onClick={handleClick}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        paddingTop={2}
        paddingBottom={2}
        paddingLeft={4}
        paddingRight={4}
        width={BlockSize.Full}
        style={{ height: 62, cursor: onClick ? 'pointer' : 'auto' }}
        data-testid="multichain-token-list-button"
      >
        <TokenCellBadge token={{ ...asset, ...tokenDisplayInfo }} />
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.Full}
          style={{ flexGrow: 1, overflow: 'hidden' }}
          justifyContent={JustifyContent.center}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
          >
            <TokenCellTitle token={{ ...asset, ...tokenDisplayInfo }} />
            <TokenCellSecondaryDisplay
              token={{ ...asset, ...tokenDisplayInfo }}
              handleScamWarningModal={handleScamWarningModal}
              privacyMode={privacyMode}
            />
          </Box>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
          >
            <TokenCellPercentChange
              token={{ ...asset, ...tokenDisplayInfo }}
              location={location}
            />
            {location === 'DefiTab' ? (
              <DeFiProtocolCellPrimaryDisplay iconGroup={asset.iconGroup} />
            ) : (
              <TokenCellPrimaryDisplay
                token={{ ...asset, ...tokenDisplayInfo }}
                privacyMode={privacyMode}
                location={location}
              />
            )}
          </Box>
        </Box>
      </Box>
      {/* scam warning modal, this should be higher up in the component tree */}
      {isEvm && showScamWarningModal ? (
        <Modal isOpen onClose={() => setShowScamWarningModal(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader onClose={() => setShowScamWarningModal(false)}>
              {t('nativeTokenScamWarningTitle')}
            </ModalHeader>
            <ModalBody marginTop={4} marginBottom={4}>
              {t('nativeTokenScamWarningDescription', [
                asset.symbol,
                safeChainDetails?.nativeCurrency?.symbol ||
                  t('nativeTokenScamWarningDescriptionExpectedTokenFallback'), // never render "undefined" string value
              ])}
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary
                onClick={() => {
                  dispatch(setEditedNetwork({ chainId: asset.chainId }));
                  history.push(NETWORKS_ROUTE);
                }}
                block
              >
                {t('nativeTokenScamWarningConversion')}
              </ButtonSecondary>
            </ModalFooter>
          </ModalContent>
        </Modal>
      ) : null}
    </Box>
  );
}
