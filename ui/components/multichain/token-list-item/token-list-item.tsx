import React, { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';
import { zeroAddress } from 'ethereumjs-util';
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
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonSecondary,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../component-library';
import {
  getMetaMetricsId,
  getTestNetworkBackgroundColor,
  getTokensMarketData,
  getParticipateInMetaMetrics,
  getDataCollectionForMarketing,
} from '../../../selectors';
import {
  getMultichainCurrentChainId,
  getMultichainCurrentNetwork,
  getMultichainIsEvm,
} from '../../../selectors/multichain';
import Tooltip from '../../ui/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { CURRENCY_SYMBOLS } from '../../../../shared/constants/network';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';

import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { setEditedNetwork } from '../../../store/actions';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import {
  SafeChain,
  useSafeChains,
} from '../../../pages/settings/networks-tab/networks-form/use-safe-chains';
import { PercentageChange } from './price/percentage-change/percentage-change';

type TokenListItemProps = {
  className?: string;
  onClick?: (arg?: string) => void;
  tokenSymbol?: string;
  tokenImage: string;
  primary?: string;
  secondary?: string | null;
  title: string;
  tooltipText?: string;
  isOriginalTokenSymbol?: boolean | null;
  isNativeCurrency?: boolean;
  isStakeable?: boolean;
  address?: string | null;
  showPercentage?: boolean;
};

export const TokenListItem = ({
  className,
  onClick,
  tokenSymbol,
  tokenImage,
  primary,
  secondary,
  title,
  tooltipText,
  isOriginalTokenSymbol,
  isNativeCurrency = false,
  isStakeable = false,
  address = null,
  showPercentage = false,
}: TokenListItemProps) => {
  const t = useI18nContext();
  const isEvm = useSelector(getMultichainIsEvm);
  const trackEvent = useContext(MetaMetricsContext);
  const chainId = useSelector(getMultichainCurrentChainId);
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  const { safeChains } = useSafeChains();

  const decimalChainId = isEvm && parseInt(hexToDecimal(chainId), 10);

  const safeChainDetails: SafeChain | undefined = safeChains?.find((chain) => {
    if (typeof decimalChainId === 'number') {
      return chain.chainId === decimalChainId.toString();
    }
    return undefined;
  });

  // Scam warning
  const showScamWarning =
    isNativeCurrency && !isOriginalTokenSymbol && showPercentage;

  const dispatch = useDispatch();
  const [showScamWarningModal, setShowScamWarningModal] = useState(false);
  const history = useHistory();

  const getTokenTitle = () => {
    if (!isOriginalTokenSymbol) {
      return title;
    }
    // We only consider native token symbols!
    switch (title) {
      case CURRENCY_SYMBOLS.ETH:
        return t('networkNameEthereum');
      case CURRENCY_SYMBOLS.BTC:
        return t('networkNameBitcoin');
      default:
        return title;
    }
  };

  const tokensMarketData = useSelector(getTokensMarketData);

  const tokenPercentageChange = address
    ? tokensMarketData?.[address]?.pricePercentChange1d
    : null;

  const tokenTitle = getTokenTitle();
  const tokenMainTitleToDisplay = showPercentage ? tokenTitle : tokenSymbol;

  const stakeableTitle = (
    <Box
      as="button"
      backgroundColor={BackgroundColor.transparent}
      data-testid={`staking-entrypoint-${chainId}`}
      gap={1}
      paddingInline={0}
      paddingInlineStart={1}
      paddingInlineEnd={1}
      tabIndex={0}
      onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        e.stopPropagation();
        const url = getPortfolioUrl(
          'stake',
          'ext_stake_button',
          metaMetricsId,
          isMetaMetricsEnabled,
          isMarketingEnabled,
        );
        global.platform.openTab({ url });
        trackEvent({
          event: MetaMetricsEventName.StakingEntryPointClicked,
          category: MetaMetricsEventCategory.Tokens,
          properties: {
            location: 'Token List Item',
            text: 'Stake',
            // FIXME: This might not be a number for non-EVM accounts
            chain_id: chainId,
            token_symbol: tokenSymbol,
          },
        });
      }}
    >
      <Text as="span">•</Text>
      <Text
        as="span"
        color={TextColor.primaryDefault}
        paddingInlineStart={1}
        paddingInlineEnd={1}
        fontWeight={FontWeight.Medium}
      >
        {t('stake')}
      </Text>
      <Icon
        name={IconName.Stake}
        size={IconSize.Sm}
        color={IconColor.primaryDefault}
      />
    </Box>
  );
  // Used for badge icon
  const currentNetwork = useSelector(getMultichainCurrentNetwork);
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);

  return (
    <Box
      className={classnames('multichain-token-list-item', className || {})}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
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
                chain_id: chainId,
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
              name={currentNetwork?.nickname || ''}
              src={currentNetwork?.rpcPrefs?.imageUrl}
              backgroundColor={testNetworkBackgroundColor}
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
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            gap={1}
          >
            <Box
              width={isStakeable ? BlockSize.Half : BlockSize.OneThird}
              display={Display.InlineBlock}
            >
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
                    ellipsis
                  >
                    {isStakeable ? (
                      <>
                        {tokenMainTitleToDisplay} {stakeableTitle}
                      </>
                    ) : (
                      tokenMainTitleToDisplay
                    )}
                  </Text>
                </Tooltip>
              ) : (
                <Text
                  as="span"
                  fontWeight={FontWeight.Medium}
                  variant={TextVariant.bodyMd}
                  ellipsis
                >
                  {isStakeable ? (
                    <Box display={Display.InlineBlock}>
                      {tokenMainTitleToDisplay}
                      {stakeableTitle}
                    </Box>
                  ) : (
                    tokenMainTitleToDisplay
                  )}
                </Text>
              )}

              {isEvm && !showPercentage ? (
                <Text
                  variant={TextVariant.bodyMd}
                  color={TextColor.textAlternative}
                  data-testid="multichain-token-list-item-token-name"
                  ellipsis
                >
                  {tokenTitle}
                </Text>
              ) : (
                <PercentageChange
                  value={
                    isNativeCurrency
                      ? tokensMarketData?.[zeroAddress()]?.pricePercentChange1d
                      : tokenPercentageChange
                  }
                  address={
                    isNativeCurrency
                      ? (zeroAddress() as `0x${string}`)
                      : (address as `0x${string}`)
                  }
                />
              )}
            </Box>

            {showScamWarning ? (
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                width={isStakeable ? BlockSize.Half : BlockSize.TwoThirds}
                alignItems={AlignItems.flexEnd}
              >
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

                <Text
                  data-testid="multichain-token-list-item-value"
                  color={TextColor.textAlternative}
                  variant={TextVariant.bodyMd}
                  textAlign={TextAlign.End}
                >
                  {primary} {isNativeCurrency ? '' : tokenSymbol}
                </Text>
              </Box>
            ) : (
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                width={isStakeable ? BlockSize.Half : BlockSize.TwoThirds}
                alignItems={AlignItems.flexEnd}
              >
                <Text
                  fontWeight={FontWeight.Medium}
                  variant={TextVariant.bodyMd}
                  width={isStakeable ? BlockSize.Half : BlockSize.TwoThirds}
                  textAlign={TextAlign.End}
                  data-testid="multichain-token-list-item-secondary-value"
                  ellipsis={isStakeable}
                >
                  {secondary}
                </Text>
                <Text
                  data-testid="multichain-token-list-item-value"
                  color={TextColor.textAlternative}
                  variant={TextVariant.bodyMd}
                  textAlign={TextAlign.End}
                >
                  {primary} {isNativeCurrency ? '' : tokenSymbol}
                </Text>
              </Box>
            )}
          </Box>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            gap={1}
          ></Box>
        </Box>
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
                safeChainDetails?.nativeCurrency?.symbol ||
                  t('nativeTokenScamWarningDescriptionExpectedTokenFallback'), // never render "undefined" string value
              ])}
            </ModalBody>
            <ModalFooter>
              <ButtonSecondary
                onClick={() => {
                  dispatch(setEditedNetwork({ chainId }));
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
