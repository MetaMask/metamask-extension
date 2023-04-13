import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { ethErrors, serializeError } from 'eth-rpc-errors';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import ActionableMessage from '../../components/ui/actionable-message/actionable-message';
import { PageContainerFooter } from '../../components/ui/page-container';
import { I18nContext } from '../../contexts/i18n';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import {
  resolvePendingApproval,
  rejectPendingApproval,
} from '../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../shared/constants/metametrics';
import {
  AssetType,
} from '../../../shared/constants/transaction';
import {
  ButtonLink,
  Icon,
  IconName,
} from '../../components/component-library';
import {
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
  getSuggestedNfts,
  getIpfsGateway,
} from '../../selectors';
import NftDefaultImage from '../../components/app/nft-default-image/nft-default-image';
import { getAssetImageURL } from '../../helpers/utils/util';
import IconButton from '../../components/ui/icon-button/icon-button';
import { IconColor } from '../../helpers/constants/design-system';

const ConfirmAddSuggestedNFT = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const history = useHistory();

  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const suggestedNfts = useSelector(getSuggestedNfts);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const chainId = useSelector(getCurrentChainId);
  const ipfsGateway = useSelector(getIpfsGateway);
  const trackEvent = useContext(MetaMetricsContext);

  const handleAddNftsClick = useCallback(async () => {
    await Promise.all(
      suggestedNfts.map(async ({ requestData: { asset, errors }, id }) => {
        if (Object.values(errors).some((val) => val)) {
          await dispatch(
            rejectPendingApproval(id, serializeError(new Error('test'))),
          );
          return;
        }
        await dispatch(resolvePendingApproval(id, null));

        trackEvent({
          event: MetaMetricsEventName.NftAdded,
          category: MetaMetricsEventCategory.Wallet,
          sensitiveProperties: {
            token_symbol: asset.symbol,
            token_contract_address: asset.address,
            source_connection_method: MetaMetricsTokenEventSource.Dapp,
            token_standard: asset.standard,
            asset_type: AssetType.NFT,
          },
        });
      }),
    );
    history.push(mostRecentOverviewPage);
  }, [dispatch, history, trackEvent, mostRecentOverviewPage, suggestedNfts]);

  const handleCancelNftClick = useCallback(async () => {
    await Promise.all(
      suggestedNfts.map(({ id }) =>
        dispatch(
          rejectPendingApproval(
            id,
            serializeError(ethErrors.provider.userRejectedRequest()),
          ),
        ),
      ),
    );
    history.push(mostRecentOverviewPage);
  }, [dispatch, history, mostRecentOverviewPage, suggestedNfts]);

  const goBackIfNoSuggestedNftsOnFirstRender = () => {
    if (!suggestedNfts.length) {
      console.log('in here suggestedNfts', suggestedNfts);
      history.push(mostRecentOverviewPage);
    }
  };

  useEffect(() => {
    goBackIfNoSuggestedNftsOnFirstRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-container">
      <div className="page-container__header">
        <div className="page-container__title">{t('addSuggestedTokens')}</div>
        <div className="page-container__subtitle">
          {t('likeToImportTokens')}
        </div>
        {/* {knownTokenActionableMessage} */}
        {/* {reusedTokenNameActionableMessage} */}
      </div>
      <div className="page-container__content">
        <div className="confirm-add-suggested-nft">
          <div className="confirm-add-suggested-nft__header">
            <div className="confirm-add-suggested-nft__nft">{t('nft')}</div>
            <div className="confirm-add-suggested-nft__details">
              {t('details')}
            </div>
          </div>
          <div className="confirm-add-suggested-nft__nft-list">
            {suggestedNfts.map(
              ({
                id,
                requestData: {
                  asset: { address, tokenId, symbol, image, name },
                  errors,
                },
              }) => {
                const nftImageURL = getAssetImageURL(image, ipfsGateway);
                const error = Object.values(errors).find((val) => !!val);
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
                    className="confirm-add-suggested-nft__nft-list-item"
                    key={`${address}-${tokenId}`}
                  >
                    {nftImageURL ? (
                      <img
                        className="confirm-add-suggested-nft__nft-image"
                        src={nftImageURL}
                        alt={name || tokenId}
                      />
                    ) : (
                      <NftDefaultImage
                        className="confirm-add-suggested-nft__nft-image-default"
                        name={name || address}
                        tokenId={tokenId}
                      />
                    )}
                    <div className="confirm-add-suggested-nft__nft-details">
                      <div className="confirm-add-suggested-nft__nft-sub-details">
                        {rpcPrefs.blockExplorerUrl ? (
                          <ButtonLink
                            className="confirm-add-suggested-nft__nft-name"
                            // this will only work for etherscan
                            href={`${blockExplorerLink}?a=${tokenId}`}
                            target="_blank"
                          >
                            {name || symbol || address}
                          </ButtonLink>
                        ) : (
                          <div className="confirm-add-suggested-nft__nft-name">
                            {name || symbol || address}
                          </div>
                        )}
                        <div className="confirm-add-suggested-nft__nft-tokenId">
                          #{tokenId}
                        </div>
                      </div>
                      <IconButton
                        className="confirm-add-suggested-nft__nft-remove"
                        Icon={
                          <Icon
                            name={IconName.Close}
                            color={IconColor.warningDefault}
                          />
                        }
                        disabled={error}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          dispatch(
                            rejectPendingApproval(
                              id,
                              serializeError(
                                ethErrors.provider.userRejectedRequest(),
                              ),
                            ),
                          );
                        }}
                      />
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
        onCancel={handleCancelNftClick}
        onSubmit={handleAddNftsClick}
        disabled={suggestedNfts.every(({ requestData: { errors } }) =>
          Object.values(errors).some((val) => val),
        )}
      />
    </div>
  );
};

export default ConfirmAddSuggestedNFT;
