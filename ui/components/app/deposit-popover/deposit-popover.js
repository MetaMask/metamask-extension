import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { I18nContext } from '../../../contexts/i18n';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  NETWORK_TO_NAME_MAP,
  BUYABLE_CHAINS_MAP,
} from '../../../../shared/constants/network';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';

import LogoMoonPay from '../../ui/logo/logo-moonpay';
import LogoWyre from '../../ui/logo/logo-wyre';
import LogoTransak from '../../ui/logo/logo-transak';
import LogoCoinbasePay from '../../ui/logo/logo-coinbasepay';
import LogoDepositEth from '../../ui/logo/logo-deposit-eth';
import Popover from '../../ui/popover';

import { buy, showModal, hideWarning } from '../../../store/actions';
import {
  getIsTestnet,
  getCurrentChainId,
  getSelectedAddress,
  getIsBuyableTransakChain,
  getIsBuyableMoonPayChain,
  getIsBuyableWyreChain,
  getIsBuyableCoinbasePayChain,
  getIsBuyableCoinbasePayToken,
  getIsBuyableTransakToken,
  getIsBuyableMoonpayToken,
  getIsBuyableWyreToken,
} from '../../../selectors/selectors';

import OnRampItem from './on-ramp-item';

const DepositPopover = ({ onClose, token }) => {
  const isTokenDeposit = Boolean(token);

  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();

  const chainId = useSelector(getCurrentChainId);
  const isTestnet = useSelector(getIsTestnet);
  const address = useSelector(getSelectedAddress);
  const isBuyableTransakChain = useSelector(getIsBuyableTransakChain);
  const isBuyableMoonPayChain = useSelector(getIsBuyableMoonPayChain);
  const isBuyableWyreChain = useSelector(getIsBuyableWyreChain);
  const isBuyableCoinbasePayChain = useSelector(getIsBuyableCoinbasePayChain);

  const isTokenBuyableCoinbasePay = useSelector((state) =>
    getIsBuyableCoinbasePayToken(state, token?.symbol),
  );
  const isTokenBuyableTransak = useSelector((state) =>
    getIsBuyableTransakToken(state, token?.symbol),
  );
  const isTokenBuyableMoonpay = useSelector((state) =>
    getIsBuyableMoonpayToken(state, token?.symbol),
  );
  const isTokenBuyableWyre = useSelector((state) =>
    getIsBuyableWyreToken(state, token?.symbol),
  );

  const networkName = NETWORK_TO_NAME_MAP[chainId];
  const symbol = token
    ? token.symbol
    : BUYABLE_CHAINS_MAP[chainId].nativeCurrency;

  const showAccountDetailModal = () => {
    dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
  };
  const hideWarningMessage = () => {
    dispatch(hideWarning());
  };

  const toCoinbasePay = () => {
    dispatch(
      buy({ service: 'coinbase', address, chainId, symbol: token?.symbol }),
    );
  };
  const toTransak = () => {
    dispatch(
      buy({ service: 'transak', address, chainId, symbol: token?.symbol }),
    );
  };
  const toMoonPay = () => {
    dispatch(
      buy({ service: 'moonpay', address, chainId, symbol: token?.symbol }),
    );
  };
  const toWyre = () => {
    dispatch(buy({ service: 'wyre', address, chainId, symbol: token?.symbol }));
  };
  const toFaucet = () => dispatch(buy({ chainId }));

  const goToAccountDetailsModal = () => {
    hideWarningMessage();
    showAccountDetailModal();
    onClose();
  };

  return (
    <Popover
      title={t('depositCrypto', [symbol])}
      subtitle={isTokenDeposit ? '' : t('needCryptoInWallet', [symbol])}
      onClose={onClose}
      className="deposit-popover"
    >
      <ul>
        <OnRampItem
          logo={<LogoCoinbasePay />}
          title={t('buyCryptoWithCoinbasePay', [symbol])}
          text={t('buyCryptoWithCoinbasePayDescription', [symbol])}
          buttonLabel={t('continueToCoinbasePay')}
          onButtonClick={() => {
            trackEvent({
              category: EVENT.CATEGORIES.ACCOUNTS,
              event: EVENT_NAMES.ONRAMP_PROVIDER_SELECTED,
              properties: {
                onramp_provider_type: EVENT.ONRAMP_PROVIDER_TYPES.COINBASE,
              },
            });
            toCoinbasePay();
          }}
          hide={
            isTokenDeposit
              ? !isBuyableCoinbasePayChain || !isTokenBuyableCoinbasePay
              : !isBuyableCoinbasePayChain
          }
        />
        <OnRampItem
          logo={<LogoTransak />}
          title={t('buyCryptoWithTransak', [symbol])}
          text={t('buyCryptoWithTransakDescription', [symbol])}
          buttonLabel={t('continueToTransak')}
          onButtonClick={() => {
            trackEvent({
              category: EVENT.CATEGORIES.ACCOUNTS,
              event: EVENT_NAMES.ONRAMP_PROVIDER_SELECTED,
              properties: {
                onramp_provider_type: EVENT.ONRAMP_PROVIDER_TYPES.TRANSAK,
              },
            });
            toTransak();
          }}
          hide={
            isTokenDeposit
              ? !isBuyableTransakChain || !isTokenBuyableTransak
              : !isBuyableTransakChain
          }
        />
        <OnRampItem
          logo={<LogoMoonPay />}
          title={t('buyCryptoWithMoonPay', [symbol])}
          text={t('buyCryptoWithMoonPayDescription', [symbol])}
          buttonLabel={t('continueToMoonPay')}
          onButtonClick={() => {
            trackEvent({
              category: EVENT.CATEGORIES.ACCOUNTS,
              event: EVENT_NAMES.ONRAMP_PROVIDER_SELECTED,
              properties: {
                onramp_provider_type: EVENT.ONRAMP_PROVIDER_TYPES.MOONPAY,
              },
            });
            toMoonPay();
          }}
          hide={
            isTokenDeposit
              ? !isBuyableMoonPayChain || !isTokenBuyableMoonpay
              : !isBuyableMoonPayChain
          }
        />
        <OnRampItem
          logo={<LogoWyre />}
          title={t('buyWithWyre', [symbol])}
          text={t('buyWithWyreDescription', [symbol])}
          buttonLabel={t('continueToWyre')}
          onButtonClick={() => {
            trackEvent({
              category: EVENT.CATEGORIES.ACCOUNTS,
              event: EVENT_NAMES.ONRAMP_PROVIDER_SELECTED,
              properties: {
                onramp_provider_type: EVENT.ONRAMP_PROVIDER_TYPES.WYRE,
              },
            });
            toWyre();
          }}
          hide={
            isTokenDeposit
              ? !isBuyableWyreChain || !isTokenBuyableWyre
              : !isBuyableWyreChain
          }
        />

        <OnRampItem
          logo={<LogoDepositEth width="50px" />}
          title={t('directDepositCrypto', [symbol])}
          text={t('directDepositCryptoExplainer', [symbol])}
          buttonLabel={t('viewAccount')}
          onButtonClick={() => {
            trackEvent({
              category: EVENT.CATEGORIES.ACCOUNTS,
              event: EVENT_NAMES.ONRAMP_PROVIDER_SELECTED,
              properties: {
                onramp_provider_type: EVENT.ONRAMP_PROVIDER_TYPES.SELF_DEPOSIT,
              },
            });
            goToAccountDetailsModal();
          }}
          hide={isTokenDeposit || !isBuyableWyreChain}
        />

        {networkName && (
          <OnRampItem
            logo={<i className="fa fa-tint fa-2x" />}
            title={t('testFaucet')}
            text={t('getEtherFromFaucet', [networkName])}
            buttonLabel={t('getEther')}
            onButtonClick={() => toFaucet()}
            hide={!isTestnet}
          />
        )}
      </ul>
    </Popover>
  );
};

DepositPopover.propTypes = {
  onClose: PropTypes.func.isRequired,
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
    image: PropTypes.string,
    aggregators: PropTypes.array,
    isERC721: PropTypes.bool,
  }),
};

export default DepositPopover;
