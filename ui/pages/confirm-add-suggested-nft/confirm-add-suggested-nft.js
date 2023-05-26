import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { ethErrors, serializeError } from 'eth-rpc-errors';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import { Severity } from '@sentry/types';
import classnames from 'classnames';
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
import { AssetType } from '../../../shared/constants/transaction';
import {
  BUTTON_SIZES,
  BannerAlert,
  ButtonIcon,
  ButtonLink,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../components/component-library';
import {
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
  getSuggestedNfts,
  getIpfsGateway,
} from '../../selectors';
import NftDefaultImage from '../../components/app/nft-default-image/nft-default-image';
import { getAssetImageURL, shortenAddress } from '../../helpers/utils/util';
import {
  BorderRadius,
  IconColor,
  TextAlign,
  TextVariant,
} from '../../helpers/constants/design-system';
import Box from '../../components/ui/box/box';
import Tooltip from '../../components/ui/tooltip';

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

  const errorMap = useMemo(
    () => ({
      nftAlreadyWatchedError:
        'The suggested NFT is already in the user’s wallet',
      ownerFetchError: 'An error occurred while fetching the owner of the NFT',
      wrongOwnerError: 'The user does not own the suggested NFT',
    }),
    [],
  );

  const disabled = suggestedNfts.every(({ requestData: { errors } }) =>
    Object.values(errors).some((val) => val),
  );

  const errorsPresent = suggestedNfts.some(({ requestData: { errors } }) =>
    Object.values(errors).some((val) => val),
  );

  const handleAddNftsClick = useCallback(async () => {
    await Promise.all(
      suggestedNfts.map(async ({ requestData: { asset, errors }, id }) => {
        const errorKey = Object.entries(errors).find(
          ([, v]) => v === true,
        )?.[0];
        if (errorKey) {
          await dispatch(
            rejectPendingApproval(
              id,
              serializeError(
                new Error(
                  `${errorMap[errorKey]}. Contract Address:${asset.address} TokenId:${asset.tokenId}`,
                ),
              ),
            ),
          );
          return;
        }
        await dispatch(resolvePendingApproval(id, null));

        trackEvent({
          event: MetaMetricsEventName.NftAdded,
          category: MetaMetricsEventCategory.Wallet,
          sensitiveProperties: {
            token_symbol: asset.symbol,
            token_id: asset.tokenId,
            token_contract_address: asset.address,
            source_connection_method: MetaMetricsTokenEventSource.Dapp,
            token_standard: asset.standard,
            asset_type: AssetType.NFT,
          },
        });
      }),
    );
    history.push(mostRecentOverviewPage);
  }, [
    dispatch,
    history,
    trackEvent,
    mostRecentOverviewPage,
    suggestedNfts,
    errorMap,
  ]);

  const handleCancelNftClick = useCallback(async () => {
    await Promise.all(
      suggestedNfts.map(async ({ id, requestData: { errors, asset } }) => {
        const errorKey = Object.entries(errors).find(
          ([, v]) => v === true,
        )?.[0];
        if (errorKey) {
          return await dispatch(
            rejectPendingApproval(
              id,
              serializeError(
                new Error(
                  `${errorMap[errorKey]}. ContractAddress:${asset.address}, TokenId:${asset.tokenId}`,
                ),
              ),
            ),
          );
        }

        return dispatch(
          rejectPendingApproval(
            id,
            serializeError(ethErrors.provider.userRejectedRequest()),
          ),
        );
      }),
    );
    history.push(mostRecentOverviewPage);
  }, [dispatch, history, mostRecentOverviewPage, suggestedNfts, errorMap]);

  const goBackIfNoSuggestedNftsOnFirstRender = () => {
    if (!suggestedNfts.length) {
      history.push(mostRecentOverviewPage);
    }
  };

  useEffect(() => {
    goBackIfNoSuggestedNftsOnFirstRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let origin;
  if (suggestedNfts.length) {
    origin = new URL(suggestedNfts[0].origin)?.host || 'dapp';
  }

  return (
    <div className="page-container">
      <div className="confirm-add-suggested-nft__header">
        {errorsPresent && (
          <BannerAlert
            severity={Severity.Warning}
            className="confirm-add-suggested-nft__banner-alert"
          >
            We are unable to add some or all of the suggested NFTs. Please check
            the error messages below for details.
          </BannerAlert>
        )}
        <Text
          variant={TextVariant.headingLg}
          textAlign={TextAlign.Center}
          margin={2}
        >
          {t('addSuggestedTokens')}
        </Text>
        <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
          {t('wantsToAddThisAsset', [
            <ButtonLink key={origin} size={BUTTON_SIZES.INHERIT}>
              {origin}
            </ButtonLink>,
          ])}
        </Text>
      </div>
      <div className="page-container__content">
        <Box
          className="confirm-add-suggested-nft"
          padding={2}
          borderRadius={BorderRadius.MD}
        >
          <div
            className={classnames({
              'confirm-add-suggested-nft__nft-list': suggestedNfts.length > 1,
            })}
          >
            {suggestedNfts.map(
              ({
                id,
                requestData: {
                  asset: { address, tokenId, symbol, image, name },
                  errors,
                },
              }) => {
                const nftImageURL = getAssetImageURL(image, ipfsGateway);
                const errorKey = Object.entries(errors).find(
                  ([, val]) => val === true,
                )?.[0];
                const blockExplorerLink = getTokenTrackerLink(
                  address,
                  chainId,
                  null,
                  null,
                  {
                    blockExplorerUrl: rpcPrefs?.blockExplorerUrl ?? null,
                  },
                );
                if (suggestedNfts.length === 1) {
                  return (
                    <Box
                      className="confirm-add-suggested-nft__nft-single"
                      borderRadius={BorderRadius.MD}
                      margin={0}
                      padding={0}
                    >
                      {nftImageURL ? (
                        <img
                          className="confirm-add-suggested-nft__nft-single-image"
                          src={nftImageURL}
                          alt={name || tokenId}
                        />
                      ) : (
                        <NftDefaultImage
                          className="confirm-add-suggested-nft__nft-single-image-default"
                          tokenId={tokenId}
                          name={name || symbol || shortenAddress(address)}
                        />
                      )}
                      <div className="confirm-add-suggested-nft__nft-single-details">
                        <div className="confirm-add-suggested-nft__nft-single-sub-details">
                          {rpcPrefs.blockExplorerUrl ? (
                            <ButtonLink
                              className="confirm-add-suggested-nft__nft-name"
                              // this will only work for etherscan
                              href={`${blockExplorerLink}?a=${tokenId}`}
                              title={address}
                              target="_blank"
                              size={BUTTON_SIZES.INHERIT}
                            >
                              {name || symbol || shortenAddress(address)}
                            </ButtonLink>
                          ) : (
                            <Text
                              variant={TextVariant.bodyMd}
                              className="confirm-add-suggested-nft__nft-name"
                              title={address}
                            >
                              {name || symbol || shortenAddress(address)}
                            </Text>
                          )}
                          <Text
                            variant={TextVariant.bodyMd}
                            className="confirm-add-suggested-nft__nft-tokenId"
                          >
                            #{tokenId}
                          </Text>
                        </div>
                        {errorKey && (
                          <Tooltip
                            interactive
                            position="right"
                            trigger="mouseenter"
                            title={errorMap[errorKey]}
                          >
                            <Icon
                              name={
                                errorKey === 'nftAlreadyWatchedError'
                                  ? IconName.Check
                                  : IconName.Danger
                              }
                              color={
                                errorKey === 'nftAlreadyWatchedError'
                                  ? IconColor.successDefault
                                  : IconColor.warningDefault
                              }
                              size={IconSize.Lg}
                              style={{ margin: '0, 12px, 0, 8px' }}
                            />
                          </Tooltip>
                        )}
                      </div>
                    </Box>
                  );
                }
                return (
                  <div
                    className="confirm-add-suggested-nft__nft-list-item"
                    key={`${address}-${tokenId}`}
                  >
                    <div
                      className={classnames(
                        'confirm-add-suggested-nft__nft-details',
                        {
                          'confirm-add-suggested-nft__nft-details--error':
                            errorKey,
                        },
                      )}
                    >
                      {nftImageURL ? (
                        <img
                          className="confirm-add-suggested-nft__nft-image"
                          src={nftImageURL}
                          alt={name || tokenId}
                        />
                      ) : (
                        <NftDefaultImage className="confirm-add-suggested-nft__nft-image-default" />
                      )}
                      <div className="confirm-add-suggested-nft__nft-sub-details">
                        {rpcPrefs.blockExplorerUrl ? (
                          <ButtonLink
                            className="confirm-add-suggested-nft__nft-name"
                            // this will only work for etherscan
                            href={`${blockExplorerLink}?a=${tokenId}`}
                            title={address}
                            target="_blank"
                            size={BUTTON_SIZES.INHERIT}
                          >
                            {name || symbol || shortenAddress(address)}
                          </ButtonLink>
                        ) : (
                          <Text
                            variant={TextVariant.bodySm}
                            className="confirm-add-suggested-nft__nft-name"
                            title={address}
                          >
                            {name || symbol || shortenAddress(address)}
                          </Text>
                        )}
                        <Text
                          variant={TextVariant.bodySm}
                          className="confirm-add-suggested-nft__nft-tokenId"
                        >
                          #{tokenId}
                        </Text>
                      </div>
                    </div>
                    {errorKey ? (
                      <Tooltip
                        interactive
                        position="right"
                        trigger="mouseenter"
                        title={errorMap[errorKey]}
                      >
                        <Icon
                          name={
                            errorKey === 'nftAlreadyWatchedError'
                              ? IconName.Check
                              : IconName.Danger
                          }
                          color={
                            errorKey === 'nftAlreadyWatchedError'
                              ? IconColor.successDefault
                              : IconColor.warningDefault
                          }
                          size={IconSize.Lg}
                          style={{ margin: '0, 12px, 0, 8px' }}
                        />
                      </Tooltip>
                    ) : (
                      <ButtonIcon
                        className="confirm-add-suggested-nft__nft-remove"
                        iconName={IconName.Close}
                        IconSize={IconSize.Xs}
                        color={IconColor.warningDefault}
                        disabled={errorKey}
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
                    )}
                  </div>
                );
              },
            )}
          </div>
        </Box>
      </div>
      <PageContainerFooter
        cancelText={t('cancel')}
        submitText={suggestedNfts.length === 1 ? t('addNft') : t('addNfts')}
        onCancel={handleCancelNftClick}
        onSubmit={handleAddNftsClick}
        disabled={disabled}
      />
    </div>
  );
};

export default ConfirmAddSuggestedNFT;
