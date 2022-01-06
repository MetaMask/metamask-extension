import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/ui/button';
import Identicon from '../../components/ui/identicon';
import TokenBalance from '../../components/ui/token-balance';
import { isEqualCaseInsensitive } from '../../helpers/utils/util';

export default class ConfirmAddSuggestedToken extends Component {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    acceptWatchAsset: PropTypes.func,
    rejectWatchAsset: PropTypes.func,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    suggestedAssets: PropTypes.array,
    tokens: PropTypes.array,
  };

  componentDidMount() {
    this._checksuggestedAssets();
  }

  componentDidUpdate() {
    this._checksuggestedAssets();
  }

  _checksuggestedAssets() {
    const {
      mostRecentOverviewPage,
      suggestedAssets = [],
      history,
    } = this.props;

    if (suggestedAssets.length > 0) {
      return;
    }

    history.push(mostRecentOverviewPage);
  }

  getTokenName(name, symbol) {
    return typeof name === 'undefined' ? symbol : `${name} (${symbol})`;
  }

  render() {
    const {
      suggestedAssets,
      tokens,
      rejectWatchAsset,
      history,
      mostRecentOverviewPage,
      acceptWatchAsset,
    } = this.props;

    const hasTokenDuplicates = this.checkTokenDuplicates(
      suggestedAssets,
      tokens,
    );
    const reusesName = this.checkNameReuse(suggestedAssets, tokens);

    return (
      <div className="page-container">
        <div className="page-container__header">
          <div className="page-container__title">
            {this.context.t('addSuggestedTokens')}
          </div>
          <div className="page-container__subtitle">
            {this.context.t('likeToImportTokens')}
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
              {suggestedAssets.map(({ asset }) => {
                return (
                  <div
                    className="confirm-import-token__token-list-item"
                    key={asset.address}
                  >
                    <div className="confirm-import-token__token confirm-import-token__data">
                      <Identicon
                        className="confirm-import-token__token-icon"
                        diameter={48}
                        address={asset.address}
                        image={asset.image}
                      />
                      <div className="confirm-import-token__name">
                        {this.getTokenName(asset.name, asset.symbol)}
                      </div>
                    </div>
                    <div className="confirm-import-token__balance">
                      <TokenBalance token={asset} />
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
              type="secondary"
              large
              className="page-container__footer-button"
              onClick={async () => {
                await Promise.all(
                  suggestedAssets.map(async ({ id }) => rejectWatchAsset(id)),
                );
                history.push(mostRecentOverviewPage);
              }}
            >
              {this.context.t('cancel')}
            </Button>
            <Button
              type="primary"
              large
              className="page-container__footer-button"
              disabled={suggestedAssets.length === 0}
              onClick={async () => {
                await Promise.all(
                  suggestedAssets.map(async ({ asset, id }) => {
                    await acceptWatchAsset(id);
                    this.context.trackEvent({
                      event: 'Token Added',
                      category: 'Wallet',
                      sensitiveProperties: {
                        token_symbol: asset.symbol,
                        token_contract_address: asset.address,
                        token_decimal_precision: asset.decimals,
                        unlisted: asset.unlisted,
                        source: 'dapp',
                      },
                    });
                  }),
                );
                history.push(mostRecentOverviewPage);
              }}
            >
              {this.context.t('addToken')}
            </Button>
          </footer>
        </div>
      </div>
    );
  }

  checkTokenDuplicates(suggestedAssets, tokens) {
    const pending = suggestedAssets.map(({ asset }) =>
      asset.address.toUpperCase(),
    );
    const existing = tokens.map((token) => token.address.toUpperCase());
    const dupes = pending.filter((proposed) => {
      return existing.includes(proposed);
    });

    return dupes.length > 0;
  }

  /**
   * Returns true if any suggestedAssets both:
   * - Share a symbol with an existing `tokens` member.
   * - Does not share an address with that same `tokens` member.
   * This should be flagged as possibly deceptive or confusing.
   */
  checkNameReuse(suggestedAssets, tokens) {
    const duplicates = suggestedAssets.filter(({ asset }) => {
      const dupes = tokens.filter(
        (old) =>
          old.symbol === asset.symbol &&
          !isEqualCaseInsensitive(old.address, asset.address),
      );
      return dupes.length > 0;
    });
    return duplicates.length > 0;
  }
}
