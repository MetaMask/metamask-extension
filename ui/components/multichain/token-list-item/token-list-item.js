import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
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
  ButtonSecondary,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalOverlay,
  Text,
} from '../../component-library';
import { ModalContent } from '../../component-library/modal-content/deprecated';
import { ModalHeader } from '../../component-library/modal-header/deprecated';
import {
  getCurrentChainId,
  getCurrentNetwork,
  getMetaMetricsId,
  getNativeCurrencyImage,
  getTestNetworkBackgroundColor,
} from '../../../selectors';
import Tooltip from '../../ui/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { CURRENCY_SYMBOLS } from '../../../../shared/constants/network';

import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { setSelectedNetworkConfigurationId } from '../../../store/actions';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';

export const TokenListItem = ({
  className,
  onClick,
  tokenSymbol,
  tokenImage,
  primary,
  secondary,
  title,
  isOriginalTokenSymbol,
  isNativeCurrency = false,
  isStakeable = false,
}) => {
  const t = useI18nContext();
  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const trackEvent = useContext(MetaMetricsContext);
  const metaMetricsId = useSelector(getMetaMetricsId);
  const chainId = useSelector(getCurrentChainId);

  // Scam warning
  const showScamWarning = isNativeCurrency && !isOriginalTokenSymbol;
  const dispatch = useDispatch();
  const [showScamWarningModal, setShowScamWarningModal] = useState(false);
  const environmentType = getEnvironmentType();
  const providerConfig = useSelector(getProviderConfig);
  const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;
  const history = useHistory();

  const tokenTitle =
    title === CURRENCY_SYMBOLS.ETH && isOriginalTokenSymbol
      ? t('networkNameEthereum')
      : title;
  const stakeableTitle = (
    <Box
      as="button"
      backgroundColor={BackgroundColor.transparent}
      data-testid={`staking-entrypoint-${chainId}`}
      display={Display.InlineFlex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      gap={1}
      paddingInline={0}
      tabIndex="0"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = getPortfolioUrl('stake', 'ext_stake_button', metaMetricsId);
        global.platform.openTab({ url });
        trackEvent({
          event: MetaMetricsEventName.StakingEntryPointClicked,
          category: MetaMetricsEventCategory.Tokens,
          properties: {
            location: 'Token List Item',
            text: 'Stake',
            chain_id: chainId,
            token_symbol: tokenSymbol,
          },
        });
      }}
    >
      <Text as="span">•</Text>
      <Text as="span" color={TextColor.primaryDefault}>
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
  const currentNetwork = useSelector(getCurrentNetwork);
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);

  return (
    <Box
      className={classnames('multichain-token-list-item', className)}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={4}
      data-testid="multichain-token-list-item"
    >
      <Box
        className={classnames('multichain-token-list-item__container-cell', {
          'multichain-token-list-item__container-cell--clickable':
            onClick !== undefined,
        })}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        padding={4}
        data-testid="multichain-token-list-button"
        {...(onClick && {
          as: 'a',
          href: '#',
          onClick: (e) => {
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
              name={currentNetwork?.nickname}
              src={currentNetwork?.rpcPrefs?.imageUrl}
              backgroundColor={testNetworkBackgroundColor}
              borderColor={
                primaryTokenImage
                  ? BorderColor.borderMuted
                  : BorderColor.borderDefault
              }
            />
          }
          marginRight={3}
        >
          <AvatarToken
            name={tokenSymbol}
            src={tokenImage}
            showHalo
            borderColor={
              tokenImage ? BorderColor.transparent : BorderColor.borderDefault
            }
          />
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
                  interactive
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
                        {tokenSymbol} {stakeableTitle}
                      </>
                    ) : (
                      tokenSymbol
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
                      {tokenSymbol} {stakeableTitle}
                    </Box>
                  ) : (
                    tokenSymbol
                  )}
                </Text>
              )}
            </Box>

            {showScamWarning ? (
              <ButtonIcon
                iconName={IconName.Danger}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowScamWarningModal(true);
                }}
                color={IconColor.errorDefault}
                size={IconSize.Lg}
                backgroundColor={BackgroundColor.transparent}
              />
            ) : (
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
            )}
          </Box>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            gap={1}
          >
            <Box width={BlockSize.OneThird}>
              {/* bottom left */}
              <Text
                fontWeight={FontWeight.Medium}
                variant={TextVariant.bodyMd}
                color={TextColor.textAlternative}
                data-testid="multichain-token-list-item-token-name" //
                ellipsis
              >
                {tokenTitle}
              </Text>
            </Box>
            <Box style={{ overflow: 'hidden' }} width={BlockSize.TwoThirds}>
              {/* bottom right */}
              <Text
                data-testid="multichain-token-list-item-value"
                color={TextColor.textAlternative}
                fontWeight={FontWeight.Medium}
                variant={TextVariant.bodyMd}
                textAlign={TextAlign.End}
              >
                {primary} {isNativeCurrency ? '' : tokenSymbol}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
      {showScamWarningModal ? (
        <Modal isOpen>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader onClose={() => setShowScamWarningModal(false)}>
              {t('nativeTokenScamWarningTitle')}
            </ModalHeader>
            <Box marginTop={4} marginBottom={4}>
              {t('nativeTokenScamWarningDescription', [tokenSymbol])}
            </Box>
            <Box>
              <ButtonSecondary
                onClick={() => {
                  dispatch(
                    setSelectedNetworkConfigurationId(providerConfig.id),
                  );
                  if (isFullScreen) {
                    history.push(NETWORKS_ROUTE);
                  } else {
                    global.platform.openExtensionInBrowser(NETWORKS_ROUTE);
                  }
                }}
                block
              >
                {t('nativeTokenScamWarningConversion')}
              </ButtonSecondary>
            </Box>
          </ModalContent>
        </Modal>
      ) : null}
    </Box>
  );
};

TokenListItem.propTypes = {
  /**
   * An additional className to apply to the TokenList.
   */
  className: PropTypes.string,
  /**
   * The onClick handler to be passed to the TokenListItem component
   */
  onClick: PropTypes.func,
  /**
   * tokenSymbol represents the symbol of the Token
   */
  tokenSymbol: PropTypes.string,
  /**
   * title represents the name of the token and if name is not available then Symbol
   */
  title: PropTypes.string,
  /**
   * tokenImage represents the image of the token icon
   */
  tokenImage: PropTypes.string,
  /**
   * primary represents the balance
   */
  primary: PropTypes.string,
  /**
   * secondary represents the balance in dollars
   */
  secondary: PropTypes.string,
  /**
   * isOriginalTokenSymbol represents a boolean value to check if the token symbol is original or not
   */
  isOriginalTokenSymbol: PropTypes.bool,
  /**
   * isNativeCurrency represents if this item is the native currency
   */
  isNativeCurrency: PropTypes.bool,
  /**
   * isStakeable represents if this item is stakeable
   */
  isStakeable: PropTypes.bool,
};
