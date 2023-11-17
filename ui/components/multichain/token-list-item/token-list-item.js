import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { useHistory } from 'react-router';
import {
  BlockSize,
  BorderColor,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
  TextAlign,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  Box,
  ButtonSecondary,
  Icon,
  IconName,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../component-library';
import {
  getCurrentChainId,
  getCurrentNetwork,
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
import {
  NETWORKS_FORM_ROUTE,
  NETWORKS_ROUTE,
} from '../../../helpers/constants/routes';
import { setSelectedNetworkConfigurationId } from '../../../store/actions';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { getProviderConfig } from '../../../ducks/metamask/metamask';

export const TokenListItem = ({
  className,
  onClick,
  tokenSymbol,
  tokenImage,
  primary,
  secondary,
  title,
  isNativeCurrency = false,
}) => {
  const t = useI18nContext();
  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const trackEvent = useContext(MetaMetricsContext);
  const chainId = useSelector(getCurrentChainId);
  const tokenTitle =
    title === CURRENCY_SYMBOLS.ETH ? t('networkNameEthereum') : title;

  // Used for badge icon
  const currentNetwork = useSelector(getCurrentNetwork);
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);

  // Scam warning
  const IS_PROBLEM = true; // TEMPORARY: REMOVE ME
  const dispatch = useDispatch();
  const [showScamWarningModal, setShowScamWarningModal] = useState(false);
  const environmentType = getEnvironmentType();
  const providerConfig = useSelector(getProviderConfig);
  const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;
  const history = useHistory();

  return (
    <Box
      className={classnames('multichain-token-list-item', className)}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={4}
      data-testid="multichain-token-list-item"
    >
      <Box
        className="multichain-token-list-item__container-cell"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        padding={4}
        as="a"
        data-testid="multichain-token-list-button"
        href="#"
        onClick={(e) => {
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
        }}
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
            justifyContent={JustifyContent.spaceBetween}
            gap={1}
          >
            <Box width={BlockSize.OneThird}>
              {title?.length > 12 ? (
                <Tooltip
                  position="bottom"
                  interactive
                  html={title}
                  tooltipInnerClassName="multichain-token-list-item__tooltip"
                >
                  <Text
                    fontWeight={FontWeight.Medium}
                    variant={TextVariant.bodyMd}
                    ellipsis
                  >
                    {tokenTitle}
                  </Text>
                </Tooltip>
              ) : (
                <Text
                  fontWeight={FontWeight.Medium}
                  variant={TextVariant.bodyMd}
                  ellipsis
                >
                  {tokenTitle}
                </Text>
              )}
            </Box>
            <Text
              fontWeight={FontWeight.Medium}
              variant={TextVariant.bodyMd}
              width={BlockSize.TwoThirds}
              textAlign={TextAlign.End}
              data-testid="multichain-token-list-item-secondary-value"
            >
              {isNativeCurrency && IS_PROBLEM ? (
                <>
                  {t('nativeTokenScamWarningLabel')}{' '}
                  <Icon
                    name={IconName.Info}
                    onMouseEnter={() => setShowScamWarningModal(true)}
                  />
                  {showScamWarningModal ? (
                    <Modal isOpen>
                      <ModalOverlay />
                      <ModalContent>
                        <ModalHeader
                          onClose={() => setShowScamWarningModal(false)}
                        >
                          {t('nativeTokenScamWarningTitle')}
                        </ModalHeader>
                        <Box marginTop={4} marginBottom={4}>
                          {t('nativeTokenScamWarningDescription', [
                            tokenSymbol,
                          ])}
                        </Box>
                        <Box>
                          <ButtonSecondary
                            onClick={() => {
                              dispatch(
                                setSelectedNetworkConfigurationId(
                                  providerConfig.id,
                                ),
                              );
                              if (isFullScreen) {
                                history.push(NETWORKS_ROUTE);
                              } else {
                                global.platform.openExtensionInBrowser(
                                  NETWORKS_ROUTE,
                                );
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
                </>
              ) : (
                secondary
              )}
            </Text>
          </Box>
          <Text
            color={TextColor.textAlternative}
            data-testid="multichain-token-list-item-value"
          >
            {primary} {tokenSymbol}{' '}
          </Text>
        </Box>
      </Box>
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
   * tokenImage represnts the image of the token icon
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
  isNativeCurrency: PropTypes.bool,
};
