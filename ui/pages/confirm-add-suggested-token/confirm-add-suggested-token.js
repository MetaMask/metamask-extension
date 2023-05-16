import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { ethErrors, serializeError } from 'eth-rpc-errors';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import ActionableMessage from '../../components/ui/actionable-message/actionable-message';
import Button from '../../components/ui/button';
import Identicon from '../../components/ui/identicon';
import TokenBalance from '../../components/ui/token-balance';
import { PageContainerFooter } from '../../components/ui/page-container';
import { I18nContext } from '../../contexts/i18n';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getTokens } from '../../ducks/metamask/metamask';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import {
  rejectPendingApproval,
  resolvePendingApproval,
} from '../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../shared/constants/metametrics';
import {
  AssetType,
  TokenStandard,
} from '../../../shared/constants/transaction';
import {
  BUTTON_PRIMARY_SIZES,
  ButtonLink,
  ButtonPrimary,
} from '../../components/component-library';
import {
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
  getSuggestedAssets,
  getSuggestedNfts,
} from '../../selectors';

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
  const suggestedNfts = useSelector(getSuggestedNfts);
  const tokens = useSelector(getTokens);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const chainId = useSelector(getCurrentChainId);
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
      [...suggestedAssets, ...suggestedNfts].map(
        async ({ requestData: { asset }, id }) => {
          await dispatch(resolvePendingApproval(id, null));

          trackEvent({
            event: MetaMetricsEventName.TokenAdded,
            category: MetaMetricsEventCategory.Wallet,
            sensitiveProperties: {
              token_symbol: asset.symbol,
              token_contract_address: asset.address,
              token_decimal_precision: asset.decimals,
              unlisted: asset.unlisted,
              source_connection_method: MetaMetricsTokenEventSource.Dapp,
              token_standard: TokenStandard.ERC20,
              asset_type: AssetType.token,
            },
          });
        },
      ),
    );

    history.push(mostRecentOverviewPage);
  }, [dispatch, history, trackEvent, mostRecentOverviewPage, suggestedAssets]);

  const handleCancelClick = useCallback(async () => {
    await Promise.all(
      [...suggestedAssets, ...suggestedNfts].map(({ id }) =>
        dispatch(
          rejectPendingApproval(
            id,
            serializeError(ethErrors.provider.userRejectedRequest()),
          ),
        ),
      ),
    );
    history.push(mostRecentOverviewPage);
  }, [dispatch, history, mostRecentOverviewPage, suggestedAssets]);

  const goBackIfNoSuggestedAssetsOnFirstRender = () => {
    if (!suggestedAssets.length && !suggestedNfts.length) {
      console.log('in here?');
      history.push(mostRecentOverviewPage);
    }
  };

  useEffect(() => {
    goBackIfNoSuggestedAssetsOnFirstRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNftConfirmation = suggestedNfts.length > 0;
  console.log('suggestedNfts', suggestedNfts);
  if (showNftConfirmation) {
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
              <div className="confirm-add-suggested-token__nft">{t('nft')}</div>
              <div className="confirm-add-suggested-token__details">
                {t('details')}
              </div>
            </div>
            <div className="confirm-add-suggested-token__nft-list">
              {suggestedNfts.map(
                ({
                  id,
                  requestData: {
                    asset: { address, tokenId, symbol, image, name },
                  },
                }) => {
                  const blockExplorerLink = getTokenTrackerLink(
                    address,
                    chainId,
                    null,
                    null,
                    {
                      blockExplorerUrl: rpcPrefs?.blockExplorerUrl ?? null,
                    },
                  );
                  return (
                    <div
                      className="confirm-add-suggested-token__nft-list-item"
                      key={`${address}-${tokenId}`}
                    >
                      {image && (
                        <img
                          className="confirm-add-suggested-token__nft-image"
                          src={image}
                          alt={name || tokenId}
                        />
                      )}
                      <div className="confirm-add-suggested-token__nft-details">
                        {rpcPrefs.blockExplorerUrl ? (
                          <ButtonLink
                            className="confirm-add-suggested-token__nft-address-tokenId"
                            // this will only work for etherscan
                            href={`${blockExplorerLink}?a=${tokenId}`}
                            target="_blank"
                          >
                            {name ?? symbol} - #{tokenId}
                          </ButtonLink>
                        ) : (
                          <div className="confirm-add-suggested-token__nft-address-tokenId">
                            {name ?? symbol} - #{tokenId}
                          </div>
                        )}
                        <ButtonPrimary
                          size={BUTTON_PRIMARY_SIZES.SMALL}
                          className="confirm-add-suggested-token__nft-add-button"
                          onClick={(e) => {
                            // const isLastSuggestedAsset =
                            //   suggestedNfts.length === 1;
                            e.preventDefault();
                            e.stopPropagation();
                            dispatch(resolvePendingApproval(id, null));
                          }}
                        >
                          {t('add')}
                        </ButtonPrimary>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
        <PageContainerFooter
          cancelText={t('cancel')}
          submitText={t('addAllNfts')}
          // onCancel={async () => {
          //   await Promise.all(
          //     suggestedNfts.map(({ id }) =>
          //       dispatch(
          //         rejectPendingApproval(
          //           id,
          //           serializeError(ethErrors.provider.userRejectedRequest()),
          //         ),
          //       ),
          //     ),
          //   );
          //   history.push(mostRecentOverviewPage);
          // }}
          onCancel={handleCancelClick}
          onSubmit={handleAddTokensClick}
          disabled={suggestedNfts.length === 0}
        />
      </div>
    );
  }

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
            {suggestedAssets.map(({ requestData: { asset } }) => {
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
      <PageContainerFooter
        cancelText={t('cancel')}
        submitText={t('addToken')}
        onCancel={handleCancelClick}
        onSubmit={handleAddTokensClick}
        disabled={suggestedAssets.length === 0}
      />
    </div>
  );
};

export default ConfirmAddSuggestedToken;
