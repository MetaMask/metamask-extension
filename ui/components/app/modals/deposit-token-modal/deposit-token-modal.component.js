import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { EVENT } from '../../../../../shared/constants/metametrics';
import { NETWORK_TO_NAME_MAP } from '../../../../../shared/constants/network';
import Button from '../../../ui/button';
import LogoCoinbasePay from '../../../ui/logo/logo-coinbasepay';
import LogoTransak from '../../../ui/logo/logo-transak';

export default class DepositEtherModal extends Component {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func.isRequired,
  };

  static propTypes = {
    token: PropTypes.shape({
      address: PropTypes.string.isRequired,
      decimals: PropTypes.number,
      symbol: PropTypes.string,
      image: PropTypes.string,
      aggregators: PropTypes.array,
      isERC721: PropTypes.bool,
    }),
    chainId: PropTypes.string.isRequired,
    isTestnet: PropTypes.bool.isRequired,
    isBuyableCoinbasePayChain: PropTypes.bool.isRequired,
    isBuyableTransakChain: PropTypes.bool.isRequired,
    isTokenBuyableCoinbasePay: PropTypes.bool.isRequired,
    isTokenBuyableTransak: PropTypes.bool.isRequired,
    toCoinbasePay: PropTypes.func.isRequired,
    toTransak: PropTypes.func.isRequired,
    address: PropTypes.string.isRequired,
    toFaucet: PropTypes.func.isRequired,
    hideWarning: PropTypes.func.isRequired,
    hideModal: PropTypes.func.isRequired,
    showAccountDetailModal: PropTypes.func.isRequired,
  };

  goToAccountDetailsModal = () => {
    this.props.hideWarning();
    this.props.hideModal();
    this.props.showAccountDetailModal();
  };

  renderRow({
    logo,
    title,
    text,
    buttonLabel,
    onButtonClick,
    hide,
    className,
    hideButton,
    hideTitle,
    onBackClick,
    showBackButton,
  }) {
    if (hide) {
      return null;
    }

    return (
      <div className={className || 'deposit-ether-modal__buy-row'}>
        {onBackClick && showBackButton && (
          <div
            className="deposit-ether-modal__buy-row__back"
            onClick={onBackClick}
          >
            <i className="fa fa-arrow-left cursor-pointer" />
          </div>
        )}
        <div className="deposit-ether-modal__buy-row__logo-container">
          {logo}
        </div>
        <div className="deposit-ether-modal__buy-row__description">
          {!hideTitle && (
            <div className="deposit-ether-modal__buy-row__description__title">
              {title}
            </div>
          )}
          <div className="deposit-ether-modal__buy-row__description__text">
            {text}
          </div>
        </div>
        {!hideButton && (
          <div className="deposit-ether-modal__buy-row__button">
            <Button
              type="secondary"
              className="deposit-ether-modal__deposit-button"
              large
              onClick={onButtonClick}
            >
              {buttonLabel}
            </Button>
          </div>
        )}
      </div>
    );
  }

  render() {
    const {
      chainId,
      toCoinbasePay,
      toTransak,
      address,
      toFaucet,
      isTestnet,
      isBuyableCoinbasePayChain,
      isBuyableTransakChain,
      isTokenBuyableCoinbasePay,
      isTokenBuyableTransak,
    } = this.props;
    const { t } = this.context;
    const networkName = NETWORK_TO_NAME_MAP[chainId];
    const { symbol } = this.props.token;

    return (
      <div className="page-container page-container--full-width page-container--full-height">
        <div className="page-container__header">
          <div className="page-container__title">
            {t('depositCrypto', [symbol])}
          </div>
          <div
            className="page-container__header-close"
            onClick={() => {
              this.props.hideWarning();
              this.props.hideModal();
            }}
          />
        </div>
        <div className="page-container__content">
          <div className="deposit-ether-modal__buy-rows">
            {this.renderRow({
              logo: <LogoCoinbasePay className="deposit-ether-modal__logo" />,
              title: t('buyCryptoWithCoinbasePay', [symbol]),
              text: t('buyCryptoWithCoinbasePayDescription', [symbol]),
              buttonLabel: t('continueToCoinbasePay'),
              onButtonClick: () => {
                this.context.trackEvent({
                  category: EVENT.CATEGORIES.ACCOUNTS,
                  event: `Click buy ${symbol} via Coinbase Pay`,
                  properties: {
                    action: `Deposit ${symbol}`,
                    legacy_event: true,
                  },
                });
                toCoinbasePay(address, chainId, symbol);
              },
              hide: !isBuyableCoinbasePayChain || !isTokenBuyableCoinbasePay,
            })}
            {this.renderRow({
              logo: <LogoTransak className="deposit-token-modal__logo" />,
              title: t('buyCryptoWithTransak', [symbol]),
              text: t('buyCryptoWithTransakDescription', [symbol]),
              buttonLabel: t('continueToTransak'),
              onButtonClick: () => {
                this.context.trackEvent({
                  category: EVENT.CATEGORIES.ACCOUNTS,
                  event: `Click buy ${symbol} via Transak`,
                  properties: {
                    action: `Deposit ${symbol}`,
                    legacy_event: true,
                  },
                });
                toTransak(address, chainId, symbol);
              },
              hide: !isBuyableTransakChain || !isTokenBuyableTransak,
            })}
            {networkName &&
              this.renderRow({
                logo: <i className="fa fa-tint fa-2x" />,
                title: t('testFaucet'),
                text: t('getEtherFromFaucet', [networkName]),
                buttonLabel: t('getEther'),
                onButtonClick: () => toFaucet(chainId),
                hide: !isTestnet,
              })}
          </div>
        </div>
      </div>
    );
  }
}
