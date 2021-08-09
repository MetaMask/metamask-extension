import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  ASSET_ROUTE,
  IMPORT_TOKEN_ROUTE,
} from '../../helpers/constants/routes';
import Button from '../../components/ui/button';
import Identicon from '../../components/ui/identicon';
import TokenBalance from '../../components/ui/token-balance';

export default class ConfirmImportToken extends Component {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    clearPendingTokens: PropTypes.func,
    addTokens: PropTypes.func,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    pendingTokens: PropTypes.object,
  };

  componentDidMount() {
    const { mostRecentOverviewPage, pendingTokens = {}, history } = this.props;

    if (Object.keys(pendingTokens).length === 0) {
      history.push(mostRecentOverviewPage);
    }
  }

  getTokenName(name, symbol) {
    return typeof name === 'undefined' ? symbol : `${name} (${symbol})`;
  }

  render() {
    const {
      history,
      addTokens,
      clearPendingTokens,
      mostRecentOverviewPage,
      pendingTokens,
    } = this.props;

    return (
      <div className="page-container">
        <div className="page-container__header">
          <div className="page-container__title">
            {this.context.t('importTokensCamelCase')}
          </div>
          <div className="page-container__subtitle">
            {this.context.t('likeToImportTokens')}
          </div>
        </div>
        <div className="page-container__content">
          <div className="confirm-import-token">
            <div className="confirm-import-token__header">
              <div className="confirm-import-token__token">
                {this.context.t('token')}
              </div>
              <div className="confirm-import-token__balance">
                {this.context.t('balance')}
              </div>
            </div>
            <div className="confirm-import-token__token-list">
              {Object.entries(pendingTokens).map(([address, token]) => {
                const { name, symbol } = token;

                return (
                  <div
                    className="confirm-import-token__token-list-item"
                    key={address}
                  >
                    <div className="confirm-import-token__token confirm-import-token__data">
                      <Identicon
                        className="confirm-import-token__token-icon"
                        diameter={48}
                        address={address}
                      />
                      <div className="confirm-import-token__name">
                        {this.getTokenName(name, symbol)}
                      </div>
                    </div>
                    <div className="confirm-import-token__balance">
                      <TokenBalance token={token} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="page-container__footer">
          <footer>
            <Button
              type="default"
              large
              className="page-container__footer-button"
              onClick={() => history.push(IMPORT_TOKEN_ROUTE)}
            >
              {this.context.t('back')}
            </Button>
            <Button
              type="secondary"
              large
              className="page-container__footer-button"
              onClick={() => {
                addTokens(pendingTokens).then(() => {
                  const pendingTokenValues = Object.values(pendingTokens);
                  pendingTokenValues.forEach((pendingToken) => {
                    this.context.trackEvent({
                      event: 'Token Added',
                      category: 'Wallet',
                      sensitiveProperties: {
                        token_symbol: pendingToken.symbol,
                        token_contract_address: pendingToken.address,
                        token_decimal_precision: pendingToken.decimals,
                        unlisted: pendingToken.unlisted,
                        source: pendingToken.isCustom ? 'custom' : 'list',
                      },
                    });
                  });
                  clearPendingTokens();
                  const firstTokenAddress = pendingTokenValues?.[0].address?.toLowerCase();
                  if (firstTokenAddress) {
                    history.push(`${ASSET_ROUTE}/${firstTokenAddress}`);
                  } else {
                    history.push(mostRecentOverviewPage);
                  }
                });
              }}
            >
              {this.context.t('importTokensCamelCase')}
            </Button>
          </footer>
        </div>
      </div>
    );
  }
}
