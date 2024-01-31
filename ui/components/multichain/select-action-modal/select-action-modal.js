import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  useHistory,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  useLocation,
  ///: END:ONLY_INCLUDE_IF
} from 'react-router-dom';
import {
  Box,
  IconName,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';
import { SelectActionModalItem } from '../select-action-modal-item';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import useRamps from '../../../hooks/experiences/useRamps';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
///: END:ONLY_INCLUDE_IF
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  MetaMetricsSwapsEventSource,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../shared/constants/metametrics';
import {
  getCurrentChainId,
  getIsSwapsChain,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getSwapsDefaultToken,
  getCurrentKeyring,
  getIsBridgeChain,
  getIsBuyableChain,
  getMetaMetricsId,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  BUILD_QUOTE_ROUTE,
  ///: END:ONLY_INCLUDE_IF
  SEND_ROUTE,
} from '../../../helpers/constants/routes';
import { startNewDraftTransaction } from '../../../ducks/send';
import { I18nContext } from '../../../contexts/i18n';
import { AssetType } from '../../../../shared/constants/transaction';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { getMmiPortfolioUrl } from '../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IF

///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
///: END:ONLY_INCLUDE_IF
import { CURRENCY_SYMBOLS } from '../../../../shared/constants/network';

export const SelectActionModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const chainId = useSelector(getCurrentChainId);
  const isSwapsChain = useSelector(getIsSwapsChain);

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const location = useLocation();
  const { openBuyCryptoInPdapp } = useRamps();
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);
  const isBridgeChain = useSelector(getIsBridgeChain);
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isBuyableChain = useSelector(getIsBuyableChain);

  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const mmiPortfolioUrl = useSelector(getMmiPortfolioUrl);

  const stakingEvent = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.MMIPortfolioButtonClicked,
    });
  };
  ///: END:ONLY_INCLUDE_IF

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="select-action-modal"
      data-testid="select-action-modal"
    >
      <ModalOverlay />
      <ModalContent modalDialogProps={{ paddingLeft: 0, paddingRight: 0 }}>
        <ModalHeader onClose={onClose} paddingRight={4}>
          {t('selectAnAction')}
        </ModalHeader>
        <Box className="select-action-modal__container" marginTop={6}>
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <SelectActionModalItem
              actionIcon={IconName.PlusMinus}
              showIcon
              primaryText={t('buyAndSell')}
              secondaryText={t('buyAndSellDescription')}
              disabled={!isBuyableChain}
              tooltipTitle={t('buyAndSellDisabled')}
              onClick={() => {
                openBuyCryptoInPdapp();
                trackEvent({
                  event: MetaMetricsEventName.NavBuyButtonClicked,
                  category: MetaMetricsEventCategory.Navigation,
                  properties: {
                    location: 'Home',
                    text: 'Buy',
                    chain_id: chainId,
                    token_symbol: defaultSwapsToken,
                  },
                });
                onClose();
              }}
            />
            ///: END:ONLY_INCLUDE_IF
          }
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
            <SelectActionModalItem
              actionIcon={IconName.Stake}
              showIcon
              primaryText={t('stake')}
              secondaryText={t('stakeDescription')}
              onClick={() => {
                stakingEvent();
                global.platform.openTab({
                  url: `${mmiPortfolioUrl}/stake`,
                });
                onClose();
              }}
            />
            ///: END:ONLY_INCLUDE_IF
          }
          <SelectActionModalItem
            actionIcon={IconName.SwapHorizontal}
            primaryText={t('swap')}
            secondaryText={t('swapDescription')}
            disabled={!isSwapsChain}
            tooltipTitle={t('swapDisabled')}
            onClick={() => {
              ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
              global.platform.openTab({
                url: `${mmiPortfolioUrl}/swap`,
              });
              ///: END:ONLY_INCLUDE_IF

              ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
              if (isSwapsChain) {
                trackEvent({
                  event: MetaMetricsEventName.NavSwapButtonClicked,
                  category: MetaMetricsEventCategory.Swaps,
                  properties: {
                    token_symbol: CURRENCY_SYMBOLS.ETH,
                    location: MetaMetricsSwapsEventSource.MainView,
                    text: 'Swap',
                    chain_id: chainId,
                  },
                });
                dispatch(setSwapsFromToken(defaultSwapsToken));
                if (usingHardwareWallet) {
                  global.platform.openExtensionInBrowser(BUILD_QUOTE_ROUTE);
                } else {
                  history.push(BUILD_QUOTE_ROUTE);
                }
              }
              ///: END:ONLY_INCLUDE_IF
              onClose();
            }}
            data-testid="select-action-modal-item-swap"
          />
          <SelectActionModalItem
            actionIcon={IconName.Arrow2UpRight}
            primaryText={t('send')}
            secondaryText={t('sendDescription')}
            onClick={async () => {
              trackEvent({
                event: MetaMetricsEventName.NavSendButtonClicked,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  token_symbol: CURRENCY_SYMBOLS.ETH,
                  location: 'Home',
                  text: 'Send',
                  chain_id: chainId,
                },
              });
              await dispatch(
                startNewDraftTransaction({ type: AssetType.native }),
              );
              history.push(SEND_ROUTE);
              onClose();
            }}
            data-testid="select-action-modal-item-send"
          />
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <SelectActionModalItem
              actionIcon={IconName.Arrow2UpRight}
              showIcon
              primaryText={t('bridge')}
              secondaryText={t('bridgeDescription')}
              disabled={!isBridgeChain}
              tooltipTitle={t('bridgeDisabled')}
              onClick={() => {
                if (isBridgeChain) {
                  const portfolioUrl = getPortfolioUrl(
                    'bridge',
                    'ext_bridge_button',
                    metaMetricsId,
                  );
                  global.platform.openTab({
                    url: `${portfolioUrl}${
                      location.pathname.includes('asset') ? '&token=native' : ''
                    }`,
                  });
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.BridgeLinkClicked,
                    properties: {
                      location: 'Home',
                      text: 'Bridge',
                      chain_id: chainId,
                      token_symbol: CURRENCY_SYMBOLS.ETH,
                    },
                  });
                }
                onClose();
              }}
            />
            ///: END:ONLY_INCLUDE_IF
          }
        </Box>
      </ModalContent>
    </Modal>
  );
};

SelectActionModal.propTypes = {
  /**
   * onClose handler for Modal
   */
  onClose: PropTypes.func,
};
