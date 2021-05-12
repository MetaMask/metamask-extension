import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/ui/button';
import Identicon from '../../components/ui/identicon';
import TokenBalance from '../../components/ui/token-balance';
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../shared/constants/app';

export default class ConfirmAddSuggestedToken extends Component {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    addToken: PropTypes.func,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    pendingTokens: PropTypes.object,
    removeSuggestedTokens: PropTypes.func,
    tokens: PropTypes.array,
  };

  componentDidMount() {
    this._checkPendingTokens();
  }

  componentDidUpdate() {
    this._checkPendingTokens();
  }

  _checkPendingTokens() {
    const { mostRecentOverviewPage, pendingTokens = {}, history } = this.props;

    if (Object.keys(pendingTokens).length > 0) {
      return;
    }

    if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
      global.platform.closeCurrentWindow();
    } else {
      history.push(mostRecentOverviewPage);
    }
  }

  getTokenName(name, symbol) {
    return typeof name === 'undefined' ? symbol : `${name} (${symbol})`;
  }

  render() {
    const {
      addToken,
      pendingTokens,
      tokens,
      removeSuggestedTokens,
      history,
      mostRecentOverviewPage,
    } = this.props;
    const pendingTokenKey = Object.keys(pendingTokens)[0];
    const pendingToken = pendingTokens[pendingTokenKey];
    const hasTokenDuplicates = this.checkTokenDuplicates(pendingTokens, tokens);
    const reusesName = this.checkNameReuse(pendingTokens, tokens);

    return (
      <div className="page-container">
        <div className="page-container__header">
          <div className="page-container__title">
            {this.context.t('addSuggestedTokens')}
          </div>
          <div className="page-container__subtitle">
            {this.context.t('likeToAddTokens')}
          </div>
          {hasTokenDuplicates ? (
            <div className="warning">{this.context.t('knownTokenWarning')}</div>
          ) : null}
          {reusesName ? (
            <div className="warning">
              {this.context.t('reusedTokenNameWarning')}
            </div>
          ) : null}
        </div>
        <div className="page-container__content">
          <div className="confirm-add-token">
            <div className="confirm-add-token__header">
              <div className="confirm-add-token__token">
                {this.context.t('token')}
              </div>
              <div className="confirm-add-token__balance">
                {this.context.t('balance')}
              </div>
            </div>
            <div className="confirm-add-token__token-list">
              {Object.entries(pendingTokens).map(([address, token]) => {
                const { name, symbol, image } = token;

                return (
                  <div
                    className="confirm-add-token__token-list-item"
                    key={address}
                  >
                    <div className="confirm-add-token__token confirm-add-token__data">
                      <Identicon
                        className="confirm-add-token__token-icon"
                        diameter={48}
                        address={address}
                        image={image}
                      />
                      <div className="confirm-add-token__name">
                        {this.getTokenName(name, symbol)}
                      </div>
                    </div>
                    <div className="confirm-add-token__balance">
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
              onClick={() => {
                removeSuggestedTokens().then(() =>
                  history.push(mostRecentOverviewPage),
                );
              }}
            >
              {this.context.t('cancel')}
            </Button>
            <Button
              type="secondary"
              large
              className="page-container__footer-button"
              disabled={pendingTokens.length === 0}
              onClick={() => {
                addToken(pendingToken)
                  .then(() => removeSuggestedTokens())
                  .then(() => {
                    this.context.trackEvent({
                      event: 'Token Added',
                      category: 'Wallet',
                      sensitiveProperties: {
                        token_symbol: pendingToken.symbol,
                        token_contract_address: pendingToken.address,
                        token_decimal_precision: pendingToken.decimals,
                        unlisted: pendingToken.unlisted,
                        source: 'dapp',
                      },
                    });
                  })
                  .then(() => history.push(mostRecentOverviewPage));
              }}
            >
              {this.context.t('addToken')}
            </Button>
          </footer>
        </div>
      </div>
    );
  }

  checkTokenDuplicates(pendingTokens, tokens) {
    const pending = Object.keys(pendingTokens);
    const existing = tokens.map((token) => token.address);
    const dupes = pending.filter((proposed) => {
      return existing.includes(proposed);
    });

    return dupes.length > 0;
  }

  /**
   * Returns true if any pendingTokens both:
   * - Share a symbol with an existing `tokens` member.
   * - Does not share an address with that same `tokens` member.
   * This should be flagged as possibly deceptive or confusing.
   */
  checkNameReuse(pendingTokens, tokens) {
    const duplicates = Object.keys(pendingTokens)
      .map((addr) => pendingTokens[addr])
      .filter((token) => {
        const dupes = tokens
          .filter((old) => old.symbol === token.symbol)
          .filter((old) => old.address !== token.address);
        return dupes.length > 0;
      });
    return duplicates.length > 0;
  }
}
