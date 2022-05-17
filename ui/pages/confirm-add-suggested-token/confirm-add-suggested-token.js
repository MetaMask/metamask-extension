import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import ActionableMessage from '../../components/ui/actionable-message/actionable-message';
import Button from '../../components/ui/button';
import Identicon from '../../components/ui/identicon';
import TokenBalance from '../../components/ui/token-balance';
import { I18nContext } from '../../contexts/i18n';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getTokens } from '../../ducks/metamask/metamask';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import { getSuggestedAssets } from '../../selectors';
import { rejectWatchAsset, acceptWatchAsset } from '../../store/actions';
import { TOKEN_STANDARDS } from '../../helpers/constants/common';
import { EVENT, EVENT_NAMES } from '../../../shared/constants/metametrics';
import { ASSET_TYPES } from '../../../shared/constants/transaction';

function getTokenName(name, symbol) {
  return name === undefined ? symbol : `${name} (${symbol})`;
}

/**
 * @param {Array} suggestedAssets - an array of assets suggested to add to the user's wallet
 * via the RPC method `wallet_watchAsset`
 * @param {Array} tokens - the list of tokens currently tracked in state
 * @returns {boolean} Returns true when the list of suggestedAssets contains an entry with
 *          an address that matches an existing token.
 */
function hasDuplicateAddress(suggestedAssets, tokens) {
  const duplicate = suggestedAssets.find(({ asset }) => {
    const dupe = tokens.find(({ address }) => {
      return isEqualCaseInsensitive(address, asset.address);
    });
    return Boolean(dupe);
  });
  return Boolean(duplicate);
}

/**
 * @param {Array} suggestedAssets - a list of assets suggested to add to the user's wallet
 * via RPC method `wallet_watchAsset`
 * @param {Array} tokens - the list of tokens currently tracked in state
 * @returns {boolean} Returns true when the list of suggestedAssets contains an entry with both
 *          1. a symbol that matches an existing token
 *          2. an address that does not match an existing token
 */
function hasDuplicateSymbolAndDiffAddress(suggestedAssets, tokens) {
  const duplicate = suggestedAssets.find(({ asset }) => {
    const dupe = tokens.find((token) => {
      return (
        isEqualCaseInsensitive(token.symbol, asset.symbol) &&
        !isEqualCaseInsensitive(token.address, asset.address)
      );
    });
    return Boolean(dupe);
  });
  return Boolean(duplicate);
}

const ConfirmAddSuggestedToken = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const history = useHistory();

  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const suggestedAssets = useSelector(getSuggestedAssets);
  const tokens = useSelector(getTokens);

  const trackEvent = useContext(MetaMetricsContext);

  const knownTokenActionableMessage = useMemo(() => {
    return (
      hasDuplicateAddress(suggestedAssets, tokens) && (
        <ActionableMessage
          message={t('knownTokenWarning', [
            <Button
              type="link"
              key="confirm-add-suggested-token-duplicate-warning"
              className="confirm-add-suggested-token__link"
              rel="noopener noreferrer"
              target="_blank"
              href={ZENDESK_URLS.TOKEN_SAFETY_PRACTICES}
            >
              {t('learnScamRisk')}
            </Button>,
          ])}
          type="warning"
          withRightButton
          useIcon
          iconFillColor="#f8c000"
        />
      )
    );
  }, [suggestedAssets, tokens, t]);

  const reusedTokenNameActionableMessage = useMemo(() => {
    return (
      hasDuplicateSymbolAndDiffAddress(suggestedAssets, tokens) && (
        <ActionableMessage
          message={t('reusedTokenNameWarning')}
          type="warning"
          withRightButton
          useIcon
          iconFillColor="#f8c000"
        />
      )
    );
  }, [suggestedAssets, tokens, t]);

  const handleAddTokensClick = useCallback(async () => {
    await Promise.all(
      suggestedAssets.map(async ({ asset, id }) => {
        await dispatch(acceptWatchAsset(id));

        trackEvent({
          event: EVENT_NAMES.TOKEN_ADDED,
          category: EVENT.CATEGORIES.WALLET,
          sensitiveProperties: {
            token_symbol: asset.symbol,
            token_contract_address: asset.address,
            token_decimal_precision: asset.decimals,
            unlisted: asset.unlisted,
            source: EVENT.SOURCE.TOKEN.DAPP,
            token_standard: TOKEN_STANDARDS.ERC20,
            asset_type: ASSET_TYPES.TOKEN,
          },
        });
      }),
    );

    history.push(mostRecentOverviewPage);
  }, [dispatch, history, trackEvent, mostRecentOverviewPage, suggestedAssets]);

  const goBackIfNoSuggestedAssetsOnFirstRender = () => {
    if (!suggestedAssets.length) {
      history.push(mostRecentOverviewPage);
    }
  };

  useEffect(() => {
    goBackIfNoSuggestedAssetsOnFirstRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-container">
      <div className="page-container__header">
        <div className="page-container__title">{t('addSuggestedTokens')}</div>
        <div className="page-container__subtitle">
          {t('likeToImportTokens')}
        </div>
        {knownTokenActionableMessage}
        {reusedTokenNameActionableMessage}
      </div>
      <div className="page-container__content">
        <div className="confirm-add-suggested-token">
          <div className="confirm-add-suggested-token__header">
            <div className="confirm-add-suggested-token__token">
              {t('token')}
            </div>
            <div className="confirm-add-suggested-token__balance">
              {t('balance')}
            </div>
          </div>
          <div className="confirm-add-suggested-token__token-list">
            {suggestedAssets.map(({ asset }) => {
              return (
                <div
                  className="confirm-add-suggested-token__token-list-item"
                  key={asset.address}
                >
                  <div className="confirm-add-suggested-token__token confirm-add-suggested-token__data">
                    <Identicon
                      className="confirm-add-suggested-token__token-icon"
                      diameter={48}
                      address={asset.address}
                      image={asset.image}
                    />
                    <div className="confirm-add-suggested-token__name">
                      {getTokenName(asset.name, asset.symbol)}
                    </div>
                  </div>
                  <div className="confirm-add-suggested-token__balance">
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
                suggestedAssets.map(({ id }) => dispatch(rejectWatchAsset(id))),
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
            onClick={handleAddTokensClick}
          >
            {t('addToken')}
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmAddSuggestedToken;
