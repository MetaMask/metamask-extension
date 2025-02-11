import React, { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonSecondary,
  IconName,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SensitiveText,
  SensitiveTextLength,
  Text,
} from '../../../component-library';
import {
  getMarketData,
  getCurrencyRates,
  getNativeCurrencyForChain,
} from '../../../../selectors';
import {
  getImageForChainId,
  getMultichainIsEvm,
} from '../../../../selectors/multichain';
import Tooltip from '../../../ui/tooltip';
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
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { TokenFiatDisplayInfo } from '../types';
import { PercentageChange } from '../../../multichain/token-list-item/price/percentage-change';
import { StakeableLink } from '../../../multichain/token-list-item/stakeable-link';
import { networkTitleOverrides } from '../util/networkTitleOverrides';

type TokenCellListItemProps = {
  className?: string;
  token: TokenFiatDisplayInfo;
  onClick?: (arg?: string) => void;
  showPercentage?: boolean;
  privacyMode?: boolean;
};

export const TokenCellListItem = ({
  className,
  token,
  onClick,
  showPercentage = false,
  privacyMode = false,
}: TokenCellListItemProps) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useI18nContext();
  const isEvm = useSelector(getMultichainIsEvm);
  const trackEvent = useContext(MetaMetricsContext);
  const currencyRates = useSelector(getCurrencyRates);
  const multiChainMarketData = useSelector(getMarketData);
  const { safeChains } = useSafeChains();

  const decimalChainId = isEvm && parseInt(hexToDecimal(token.chainId), 10);

  const safeChainDetails: SafeChain | undefined = safeChains?.find((chain) => {
    if (typeof decimalChainId === 'number') {
      return chain.chainId === decimalChainId.toString();
    }
    return undefined;
  });

  // We do not want to display any percentage with non-EVM since we don't have the data for this yet. So
  // we only use this option for EVM here:
  const shouldShowPercentage = isEvm && showPercentage;

  const isOriginalTokenSymbol = token.symbol && currencyRates[token.symbol];

  // Scam warning
  const showScamWarning =
    token.isNative && !isOriginalTokenSymbol && shouldShowPercentage;

  const [showScamWarningModal, setShowScamWarningModal] = useState(false);

  const tokenPercentageChange = token.address
    ? multiChainMarketData?.[token.chainId]?.[token.address]
        ?.pricePercentChange1d
    : null;

  // Used for badge icon
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();

    // if scam modal is open don't track event
    if (showScamWarningModal) {
      return;
    }

    onClick?.();
    trackEvent({
      category: MetaMetricsEventCategory.Tokens,
      event: MetaMetricsEventName.TokenDetailsOpened,
      properties: {
        location: 'Home',
        chain_id: token.chainId, // FIXME: Ensure this is a number for EVM accounts
        token_symbol: token.symbol,
      },
    });
  };

  return (
    <Box
      className={classnames('multichain-token-list-item', className || {})}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      width={BlockSize.Full}
      height={BlockSize.Full}
      gap={4}
      data-testid="multichain-token-list-item"
    >
      <Box
        className={classnames('multichain-token-list-item__container-cell', {
          'multichain-token-list-item__container-cell--clickable':
            Boolean(onClick),
        })}
        as={onClick ? 'a' : 'div'}
        onClick={onClick ? handleClick : undefined}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        paddingTop={2}
        paddingBottom={2}
        paddingLeft={4}
        paddingRight={4}
        width={BlockSize.Full}
        style={{ height: 62 }}
        data-testid="multichain-token-list-button"
      >
        <BadgeWrapper
          badge={
            <AvatarNetwork
              size={AvatarNetworkSize.Xs}
              name={allNetworks?.[token.chainId as Hex]?.name}
              src={getImageForChainId(token.chainId) || undefined}
              backgroundColor={BackgroundColor.backgroundDefault}
              borderWidth={2}
              className="multichain-token-list-item__badge__avatar-network"
            />
          }
          marginRight={4}
          className="multichain-token-list-item__badge"
        >
          <AvatarToken
            name={token.symbol}
            src={
              token.isNative
                ? getNativeCurrencyForChain(token.chainId)
                : token.tokenImage
            }
          />
        </BadgeWrapper>
        <Box
          className="multichain-token-list-item__container-cell--text-container"
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
            {/* token cell title */}
            {token.title?.length && token.title?.length > 12 ? (
              <Tooltip
                position="bottom"
                html={token.title}
                tooltipInnerClassName="multichain-token-list-item__tooltip"
              >
                <Text
                  as="span"
                  fontWeight={FontWeight.Medium}
                  variant={TextVariant.bodyMd}
                  display={Display.Block}
                  ellipsis
                >
                  {networkTitleOverrides(t, token)}
                  {token.isStakeable && (
                    <StakeableLink
                      chainId={token.chainId}
                      symbol={token.symbol}
                    />
                  )}
                </Text>
              </Tooltip>
            ) : (
              <Text
                fontWeight={FontWeight.Medium}
                variant={TextVariant.bodyMd}
                ellipsis
              >
                {networkTitleOverrides(t, token)}
                {token.isStakeable && (
                  <StakeableLink
                    chainId={token.chainId}
                    symbol={token.symbol}
                  />
                )}
              </Text>
            )}

            {/* token cell secondary */}
            {showScamWarning ? (
              <ButtonIcon
                iconName={IconName.Danger}
                onClick={(
                  e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
                ) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowScamWarningModal(true);
                }}
                color={IconColor.errorDefault}
                size={ButtonIconSize.Md}
                backgroundColor={BackgroundColor.transparent}
                data-testid="scam-warning"
                ariaLabel={''}
              />
            ) : (
              <SensitiveText
                fontWeight={FontWeight.Medium}
                variant={TextVariant.bodyMd}
                textAlign={TextAlign.End}
                data-testid="multichain-token-list-item-secondary-value"
                ellipsis={token.isStakeable}
                isHidden={privacyMode}
                length={SensitiveTextLength.Medium}
              >
                {token.secondary}
              </SensitiveText>
            )}
          </Box>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
          >
            {/* token percent change */}
            {shouldShowPercentage ? (
              <PercentageChange
                value={
                  token.isNative
                    ? multiChainMarketData?.[token.chainId]?.[
                        getNativeTokenAddress(token.chainId as Hex)
                      ]?.pricePercentChange1d
                    : tokenPercentageChange
                }
                address={
                  token.isNative
                    ? getNativeTokenAddress(token.chainId as Hex)
                    : (token.address as `0x${string}`)
                }
              />
            ) : (
              <Text
                variant={TextVariant.bodySmMedium}
                color={TextColor.textAlternative}
                data-testid="multichain-token-list-item-token-name"
                ellipsis
              >
                {networkTitleOverrides(t, token)}
              </Text>
            )}

            {/* token primary display */}
            {showScamWarning ? (
              <SensitiveText
                data-testid="multichain-token-list-item-value"
                color={TextColor.textAlternative}
                variant={TextVariant.bodyMd}
                textAlign={TextAlign.End}
                isHidden={privacyMode}
                length={SensitiveTextLength.Short}
              >
                {token.primary} {token.symbol}
              </SensitiveText>
            ) : (
              <SensitiveText
                data-testid="multichain-token-list-item-value"
                color={TextColor.textAlternative}
                variant={TextVariant.bodySmMedium}
                textAlign={TextAlign.End}
                isHidden={privacyMode}
                length={SensitiveTextLength.Short}
              >
                {token.primary} {token.symbol}
              </SensitiveText>
            )}
          </Box>
        </Box>
      </Box>
      {/* scam warning modal */}
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
};
