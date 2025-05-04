import React, { useState } from 'react';
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
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';
import { setEditedNetwork } from '../../../../store/actions';
import {
  type WellKnownChain,
  useWellKnownChains,
} from '../../../../pages/settings/networks-tab/networks-form/use-well-known-chains';
import { TokenWithFiatAmount } from '../types';
import {
  TokenCellBadge,
  TokenCellTitle,
  TokenCellPercentChange,
  TokenCellPrimaryDisplay,
  TokenCellSecondaryDisplay,
} from './cells';

export type TokenCellProps = {
  token: TokenWithFiatAmount;
  privacyMode?: boolean;
  disableHover?: boolean;
  onClick?: () => void;
  TokenCellPrimaryDisplayOverride?: React.ComponentType;
  fixCurrencyToUSD?: boolean;
};

export default function TokenCell({
  token,
  privacyMode = false,
  onClick,
  disableHover = false,
  TokenCellPrimaryDisplayOverride,
  fixCurrencyToUSD = false,
}: TokenCellProps) {
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useI18nContext();
  const isEvm = useSelector(getMultichainIsEvm);
  const { wellKnownChains } = useWellKnownChains();

  const [showScamWarningModal, setShowScamWarningModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const decimalChainId = isEvm && parseInt(token.chainId, 16);

  const wellKnownChainDetails: WellKnownChain | undefined =
    typeof decimalChainId === 'number'
      ? wellKnownChains?.find((chain) => chain.chainId === decimalChainId)
      : undefined;

  const tokenDisplayInfo = useTokenDisplayInfo({
    token,
    fixCurrencyToUSD,
  });

  const handleScamWarningModal = (arg: boolean) => {
    setShowScamWarningModal(arg);
  };

  if (!token.chainId) {
    return null;
  }

  const PrimaryDisplay = () =>
    TokenCellPrimaryDisplayOverride ? (
      <TokenCellPrimaryDisplayOverride />
    ) : (
      <TokenCellPrimaryDisplay
        token={{ ...token, ...tokenDisplayInfo }}
        privacyMode={privacyMode}
      />
    );

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
        onClick={(e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
          e?.preventDefault();

          if (!onClick || showScamWarningModal) {
            return;
          }

          onClick();
        }}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        paddingTop={2}
        paddingBottom={2}
        paddingLeft={4}
        paddingRight={4}
        width={BlockSize.Full}
        style={{
          height: 62,
          cursor: onClick ? 'pointer' : 'auto',
          backgroundColor:
            !disableHover && isHovered
              ? 'var(--color-background-default-hover)'
              : 'transparent',
          transition: 'background-color 0.2s ease-in-out',
        }}
        onMouseEnter={() => !disableHover && setIsHovered(true)}
        onMouseLeave={() => !disableHover && setIsHovered(false)}
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
            <PrimaryDisplay />
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
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                wellKnownChainDetails?.nativeCurrency?.symbol ||
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
