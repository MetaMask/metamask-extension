import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/ui/button';
import Identicon from '../../components/ui/identicon';
import TokenBalance from '../../components/ui/token-balance';
import { I18nContext } from '../../contexts/i18n';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { isEqualCaseInsensitive } from '../../helpers/utils/util';

function getTokenName(name, symbol) {
  return typeof name === 'undefined' ? symbol : `${name} (${symbol})`;
}
const ConfirmAddSuggestedToken = (props) => {
  const {
    acceptWatchAsset,
    history,
    mostRecentOverviewPage,
    rejectWatchAsset,
    suggestedAssets,
    tokens,
  } = props;

  const metricsEvent = useContext(MetaMetricsContext);
  const t = useContext(I18nContext);

  const tokenAddedEvent = (asset) => {
    metricsEvent({
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
  };

  /**
   * Returns true if any suggestedAssets both:
   * - Share a symbol with an existing `tokens` member.
   * - Does not share an address with that same `tokens` member.
   * This should be flagged as possibly deceptive or confusing.
   */
  const checkNameReuse = () => {
    const duplicates = suggestedAssets.filter(({ asset }) => {
      const dupes = tokens.filter(
        (old) =>
          old.symbol === asset.symbol &&
          !isEqualCaseInsensitive(old.address, asset.address),
      );
      return dupes.length > 0;
    });
    return duplicates.length > 0;
  };

  const checkTokenDuplicates = () => {
    const pending = suggestedAssets.map(({ asset }) =>
      asset.address.toUpperCase(),
    );
    const existing = tokens.map((token) => token.address.toUpperCase());
    const dupes = pending.filter((proposed) => {
      return existing.includes(proposed);
    });

    return dupes.length > 0;
  };

  const hasTokenDuplicates = checkTokenDuplicates();
  const reusesName = checkNameReuse();

  useEffect(() => {
    if (!suggestedAssets.length) {
      history.push(mostRecentOverviewPage);
    }
  }, [history, suggestedAssets, mostRecentOverviewPage]);

  return (
    <div className="page-container">
      <div className="page-container__header">
        <div className="page-container__title">{t('addSuggestedTokens')}</div>
        <div className="page-container__subtitle">
          {t('likeToImportTokens')}
        </div>
        {hasTokenDuplicates ? (
          <div className="warning">{t('knownTokenWarning')}</div>
        ) : null}
        {reusesName ? (
          <div className="warning">{t('reusedTokenNameWarning')}</div>
        ) : null}
      </div>
      <div className="page-container__content">
        <div className="confirm-import-token">
          <div className="confirm-import-token__header">
            <div className="confirm-import-token__token">{t('token')}</div>
            <div className="confirm-import-token__balance">{t('balance')}</div>
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
                      {getTokenName(asset.name, asset.symbol)}
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
            {t('cancel')}
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
                  tokenAddedEvent(asset);
                }),
              );
              history.push(mostRecentOverviewPage);
            }}
          >
            {t('addToken')}
          </Button>
        </footer>
      </div>
    </div>
  );
};

ConfirmAddSuggestedToken.propTypes = {
  acceptWatchAsset: PropTypes.func,
  history: PropTypes.object,
  mostRecentOverviewPage: PropTypes.string.isRequired,
  rejectWatchAsset: PropTypes.func,
  suggestedAssets: PropTypes.array,
  tokens: PropTypes.array,
};

export default ConfirmAddSuggestedToken;
