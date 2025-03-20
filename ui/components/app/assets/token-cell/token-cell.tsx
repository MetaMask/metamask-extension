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


export const TokenCellLocation = {
  TokensTab: 'TokensTab',
  DefiTab: 'DefiTab',
  DefiDetailsTab: 'DefiDetailsTab',
} as const
export type TokenCellLocation = (typeof TokenCellLocation)[keyof typeof TokenCellLocation];

type TokenCellProps =
  | {
      location: typeof TokenCellLocation.TokensTab;
      token: TokenWithFiatAmount;
      onClick?: (chainId: string, address: string) => void;
      privacyMode: boolean;
    }
  | {
      location: typeof TokenCellLocation.DefiDetailsTab;
      token: TokenWithFiatAmount;
      privacyMode: boolean;
      onClick: undefined;
    }
  | {
      location: typeof TokenCellLocation.DefiTab;
      onClick?: (chainId: string, protocolId: string) => void;
      token: TokenWithFiatAmount & {
        iconGroup: { avatarValue: string; symbol: string }[];
        protocolId: string;
      };
      privacyMode: boolean;
    };




export default function TokenCell({
  token,
  privacyMode = false,
  onClick,
  location,
}: TokenCellProps) {
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useI18nContext();
  const isEvm = useSelector(getMultichainIsEvm);
  const trackEvent = useContext(MetaMetricsContext);
  const { safeChains } = useSafeChains();
  const [showScamWarningModal, setShowScamWarningModal] = useState(false);

  const decimalChainId = isEvm && parseInt(hexToDecimal(token.chainId), 10);

  const safeChainDetails: SafeChain | undefined = safeChains?.find((chain) => {
    if (typeof decimalChainId === 'number') {
      return chain.chainId === decimalChainId.toString();
    }
    return undefined;
  });

  const tokenDisplayInfo = useTokenDisplayInfo({
    token,
  });

  const handleClick = useCallback(
    (e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      e?.preventDefault();

      if (!onClick || !token.chainId || showScamWarningModal) {
        return;
      }

      if (location === TokenCellLocation.TokensTab) {
        onClick(token.chainId, token.address);
        trackEvent({
          category: MetaMetricsEventCategory.Tokens,
          event: MetaMetricsEventName.TokenDetailsOpened,
          properties: {
            location: 'Home',
            chain_id: token.chainId,
            token_symbol: token.symbol,
          },
        });
      } else if (location === TokenCellLocation.DefiTab) {
        onClick(token.chainId, token.protocolId);
      }
    },
    [onClick, token, location, showScamWarningModal, trackEvent],
  );

  const handleScamWarningModal = (arg: boolean) => {
    setShowScamWarningModal(arg);
  };

  if (!token.chainId) {
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
        <TokenCellBadge token={{ ...token, ...tokenDisplayInfo }} />
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
            <TokenCellTitle token={{ ...token, ...tokenDisplayInfo }} />
            <TokenCellSecondaryDisplay
              token={{ ...token, ...tokenDisplayInfo }}
              handleScamWarningModal={handleScamWarningModal}
              privacyMode={privacyMode}
            />
          </Box>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
          >
            <TokenCellPercentChange token={{ ...token, ...tokenDisplayInfo }} />
            {location === 'DefiTab' ? (
              <AvatarGroup
                avatarType={AvatarType.TOKEN}
                limit={4}
                members={token.iconGroup}
              />
            ) : (
              <TokenCellPrimaryDisplay
                token={{ ...token, ...tokenDisplayInfo }}
                privacyMode={privacyMode}
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
                token.symbol,
                safeChainDetails?.nativeCurrency?.symbol ||
                  t('nativeTokenScamWarningDescriptionExpectedTokenFallback'), // never render "undefined" string value
              ])}
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary
                onClick={() => {
                  dispatch(setEditedNetwork({ chainId: token.chainId }));
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
