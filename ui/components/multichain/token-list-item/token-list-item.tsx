import React, { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import classnames from 'classnames';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { type Hex } from '@metamask/utils';
import { type KeyringAccountType } from '@metamask/keyring-api';
import {
  AlignItems,
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
} from '../../../helpers/constants/design-system';
import { TokenInsightsModal } from '../../../pages/bridge/token-insights-modal';
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
  Tag,
  Text,
} from '../../component-library';
import { getMarketData, getCurrencyRates } from '../../../selectors';
import { getMultichainIsEvm } from '../../../selectors/multichain';
import Tooltip from '../../ui/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  CURRENCY_SYMBOLS,
  NON_EVM_CURRENCY_SYMBOLS,
} from '../../../../shared/constants/network';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { setEditedNetwork } from '../../../store/actions';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../shared/constants/bridge';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { selectNoFeeAssets } from '../../../ducks/bridge/selectors';
import { ACCOUNT_TYPE_LABELS } from '../../app/assets/constants';
import { PercentageChange } from './price/percentage-change/percentage-change';
import { StakeableLink } from './stakeable-link';

type TokenListItemProps = {
  className?: string;
  onClick?: (arg?: string) => void;
  tokenSymbol?: string;
  tokenImage: string;
  primary?: string;
  secondary?: string | null;
  title: string;
  tooltipText?: string;
  isNativeCurrency?: boolean;
  isStakeable?: boolean;
  isTitleNetworkName?: boolean;
  isTitleHidden?: boolean;
  tokenChainImage?: string;
  chainId: string;
  address?: string | null;
  showPercentage?: boolean;
  privacyMode?: boolean;
  nativeCurrencySymbol?: string;
  isDestinationToken?: boolean;
  accountType?: KeyringAccountType;
};

export const TokenListItemComponent = ({
  className,
  onClick,
  tokenSymbol,
  tokenImage,
  primary,
  secondary,
  title,
  tooltipText,
  tokenChainImage,
  chainId,
  isNativeCurrency = false,
  isStakeable = false,
  isTitleNetworkName = false,
  isTitleHidden = false,
  address = null,
  showPercentage = false,
  accountType,
  privacyMode = false,
  nativeCurrencySymbol,
  isDestinationToken = false,
}: TokenListItemProps) => {
  const t = useI18nContext();
  const isEvm = useSelector(getMultichainIsEvm);
  const trackEvent = useContext(MetaMetricsContext);
  const currencyRates = useSelector(getCurrencyRates);
  const noFeeAssets = useSelector((state) => selectNoFeeAssets(state, chainId));

  // We do not want to display any percentage with non-EVM since we don't have the data for this yet. So
  // we only use this option for EVM here:
  const shouldShowPercentage = isEvm && showPercentage;

  const isOriginalTokenSymbol = tokenSymbol && currencyRates[tokenSymbol];

  // Scam warning
  const showScamWarning =
    isNativeCurrency && !isOriginalTokenSymbol && shouldShowPercentage;

  const dispatch = useDispatch();
  const [showScamWarningModal, setShowScamWarningModal] = useState(false);
  const navigate = useNavigate();
  const [showTokenInsights, setShowTokenInsights] = useState(false);

  const getTokenTitle = () => {
    if (isTitleNetworkName) {
      return NETWORK_TO_SHORT_NETWORK_NAME_MAP[
        chainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
      ];
    }
    if (isTitleHidden) {
      return undefined;
    }
    switch (title) {
      case CURRENCY_SYMBOLS.ETH:
        return t('networkNameEthereum');
      case NON_EVM_CURRENCY_SYMBOLS.BTC:
        return t('networkNameBitcoin');
      case NON_EVM_CURRENCY_SYMBOLS.SOL:
        return t('networkNameSolana');
      default:
        return title;
    }
  };

  const multiChainMarketData = useSelector(getMarketData);

  const tokenPercentageChange = address
    ? multiChainMarketData?.[chainId]?.[address]?.pricePercentChange1d
    : null;

  const tokenTitle = getTokenTitle();
  const tokenMainTitleToDisplay =
    shouldShowPercentage && !isTitleNetworkName ? tokenTitle : tokenSymbol;

  const isNoFeeAsset =
    isDestinationToken &&
    address &&
    noFeeAssets?.includes(address.toLowerCase());

  // Used for badge icon
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  return (
    <Box
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      className={classnames('multichain-token-list-item', className || {})}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      width={BlockSize.Full}
      height={BlockSize.Full}
      gap={4}
      data-testid="multichain-token-list-item"
      title={tooltipText ? t(tooltipText) : undefined}
    >
      <Box
        className={classnames('multichain-token-list-item__container-cell', {
          'multichain-token-list-item__container-cell--clickable':
            onClick !== undefined,
        })}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        paddingTop={2}
        paddingBottom={2}
        paddingLeft={4}
        paddingRight={4}
        width={BlockSize.Full}
        style={{ height: 62 }}
        data-testid="multichain-token-list-button"
        {...(onClick && {
          as: 'a',
          href: '#',
          onClick: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
            e.preventDefault();

            if (showScamWarningModal) {
              return;
            }

            onClick();
            trackEvent({
              category: MetaMetricsEventCategory.Tokens,
              event: MetaMetricsEventName.TokenDetailsOpened,
              properties: {
                location: 'Home',
                // FIXME: This might not be a number for non-EVM accounts
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                chain_id: chainId,
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                token_symbol: tokenSymbol,
              },
            });
          },
        })}
      >
        <BadgeWrapper
          badge={
            <AvatarNetwork
              size={AvatarNetworkSize.Xs}
              name={allNetworks?.[chainId as Hex]?.name}
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              src={tokenChainImage || undefined}
              backgroundColor={BackgroundColor.backgroundDefault}
              borderWidth={2}
              className="multichain-token-list-item__badge__avatar-network"
            />
          }
          marginRight={4}
          className="multichain-token-list-item__badge"
        >
          <AvatarToken name={tokenSymbol} src={tokenImage} />
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
            <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
              {title?.length > 12 ? (
                <Tooltip
                  position="bottom"
                  html={title}
                  tooltipInnerClassName="multichain-token-list-item__tooltip"
                >
                  <Text
                    as="span"
                    fontWeight={FontWeight.Medium}
                    variant={TextVariant.bodyMd}
                    display={Display.Block}
                    ellipsis
                  >
                    {tokenMainTitleToDisplay}
                    {isStakeable && (
                      <StakeableLink chainId={chainId} symbol={tokenSymbol} />
                    )}
                  </Text>
                </Tooltip>
              ) : (
                <Text
                  fontWeight={FontWeight.Medium}
                  variant={TextVariant.bodyMd}
                  ellipsis
                >
                  {tokenMainTitleToDisplay}
                  {isStakeable && (
                    <StakeableLink chainId={chainId} symbol={tokenSymbol} />
                  )}
                </Text>
              )}
              {accountType && ACCOUNT_TYPE_LABELS[accountType] && (
                <Tag label={ACCOUNT_TYPE_LABELS[accountType]} />
              )}
              {isNoFeeAsset && <Tag label={t('bridgeNoMMFee')} />}
            </Box>

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
                ariaLabel=""
              />
            ) : (
              <SensitiveText
                fontWeight={FontWeight.Medium}
                variant={TextVariant.bodyMd}
                textAlign={TextAlign.End}
                data-testid="multichain-token-list-item-secondary-value"
                ellipsis={isStakeable}
                isHidden={privacyMode}
                length={SensitiveTextLength.Medium}
              >
                {secondary}
              </SensitiveText>
            )}
          </Box>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
          >
            {shouldShowPercentage ? (
              <PercentageChange
                value={
                  isNativeCurrency
                    ? multiChainMarketData?.[chainId]?.[
                        getNativeTokenAddress(chainId as Hex)
                      ]?.pricePercentChange1d
                    : tokenPercentageChange
                }
                address={
                  isNativeCurrency
                    ? getNativeTokenAddress(chainId as Hex)
                    : (address as `0x${string}`)
                }
              />
            ) : (
              <Text
                variant={TextVariant.bodySmMedium}
                color={TextColor.textAlternative}
                data-testid="multichain-token-list-item-token-name"
                ellipsis
              >
                {tokenTitle}
              </Text>
            )}

            {showScamWarning ? (
              <SensitiveText
                data-testid="multichain-token-list-item-value"
                color={TextColor.textAlternative}
                variant={TextVariant.bodyMd}
                textAlign={TextAlign.End}
                isHidden={privacyMode}
                length={SensitiveTextLength.Short}
              >
                {primary}
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
                {primary}
              </SensitiveText>
            )}
          </Box>
        </Box>

        {isDestinationToken && (
          <ButtonIcon
            iconName={IconName.Info}
            size={ButtonIconSize.Sm}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              e.preventDefault();
              setShowTokenInsights(true);
            }}
            className="multichain-token-list-item__info-icon"
            color={IconColor.iconAlternative}
            ariaLabel={t('viewTokenDetails')}
          />
        )}
      </Box>
      {isEvm && showScamWarningModal ? (
        <Modal isOpen onClose={() => setShowScamWarningModal(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader onClose={() => setShowScamWarningModal(false)}>
              {t('nativeTokenScamWarningTitle')}
            </ModalHeader>
            <ModalBody marginTop={4} marginBottom={4}>
              {t('nativeTokenScamWarningDescription', [
                tokenSymbol,
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                nativeCurrencySymbol ||
                  t('nativeTokenScamWarningDescriptionExpectedTokenFallback'), // never render "undefined" string value
              ])}
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary
                onClick={() => {
                  dispatch(setEditedNetwork({ chainId }));
                  navigate(NETWORKS_ROUTE);
                }}
                block
              >
                {t('nativeTokenScamWarningConversion')}
              </ButtonSecondary>
            </ModalFooter>
          </ModalContent>
        </Modal>
      ) : null}

      {showTokenInsights && (
        <TokenInsightsModal
          isOpen={showTokenInsights}
          onClose={() => setShowTokenInsights(false)}
          token={{
            address,
            symbol: tokenSymbol || title,
            name: title,
            chainId,
            iconUrl: tokenImage,
          }}
        />
      )}
    </Box>
  );
};

export const TokenListItem = React.memo(TokenListItemComponent);
