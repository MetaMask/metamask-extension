import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { ethErrors, serializeError } from 'eth-rpc-errors';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
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
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  IconName,
  Text,
  Box,
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
  AlignItems,
  BorderRadius,
  Display,
  FlexDirection,
  FlexWrap,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
  BlockSize,
} from '../../helpers/constants/design-system';

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
      suggestedNfts.map(async ({ requestData: { asset }, id }) => {
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
  }, [dispatch, history, trackEvent, mostRecentOverviewPage, suggestedNfts]);

  const handleCancelNftClick = useCallback(async () => {
    await Promise.all(
      suggestedNfts.map(async ({ id }) => {
        return dispatch(
          rejectPendingApproval(
            id,
            serializeError(ethErrors.provider.userRejectedRequest()),
          ),
        );
      }),
    );
    history.push(mostRecentOverviewPage);
  }, [dispatch, history, mostRecentOverviewPage, suggestedNfts]);

  useEffect(() => {
    const goBackIfNoSuggestedNftsOnFirstRender = () => {
      if (!suggestedNfts.length) {
        history.push(mostRecentOverviewPage);
      }
    };
    goBackIfNoSuggestedNftsOnFirstRender();
  }, [history, mostRecentOverviewPage, suggestedNfts]);

  let origin;
  if (suggestedNfts.length) {
    try {
      origin = new URL(suggestedNfts[0].origin)?.host;
    } catch {
      origin = 'dapp';
    }
  }
  return (
    <Box
      height={BlockSize.Full}
      width={BlockSize.Full}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
    >
      <Box paddingBottom={2} className="confirm-add-suggested-nft__header">
        <Text
          variant={TextVariant.headingLg}
          textAlign={TextAlign.Center}
          margin={2}
        >
          {t('addSuggestedNFTs')}
        </Text>
        <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
          {t('wantsToAddThisAsset', [
            origin === 'dapp' ? (
              <Text key={origin} variant={TextVariant.bodyMd} fontWeight="bold">
                {origin}
              </Text>
            ) : (
              <ButtonLink
                key={origin}
                size={BUTTON_SIZES.INHERIT}
                href={origin}
                target="_blank"
              >
                {origin}
              </ButtonLink>
            ),
          ])}
        </Text>
      </Box>
      <Box className="confirm-add-suggested-nft__content">
        <Box
          className="confirm-add-suggested-nft__card"
          padding={2}
          borderRadius={BorderRadius.MD}
        >
          <Box
            className={classnames({
              'confirm-add-suggested-nft__nft-list': suggestedNfts.length > 1,
            })}
          >
            {suggestedNfts.map(
              ({
                id,
                requestData: {
                  asset: { address, tokenId, symbol, image, name },
                },
              }) => {
                const nftImageURL = getAssetImageURL(image, ipfsGateway);
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
                      <Box
                        padding={1}
                        display={Display.Flex}
                        flexDirection={FlexDirection.Row}
                        justifyContent={JustifyContent.spaceBetween}
                        alignItems={AlignItems.Center}
                      >
                        <Box
                          display={Display.Flex}
                          flexDirection={FlexDirection.Column}
                          justifyContent={JustifyContent.spaceEvenly}
                          flexWrap={FlexWrap.NoWrap}
                          width={BlockSize.Full}
                          className="confirm-add-suggested-nft__nft-single-sub-details"
                        >
                          {rpcPrefs.blockExplorerUrl ? (
                            <ButtonLink
                              className="confirm-add-suggested-nft__nft-name"
                              href={blockExplorerLink}
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
                        </Box>
                      </Box>
                    </Box>
                  );
                }
                return (
                  <Box
                    display={Display.Flex}
                    flexDirection={FlexDirection.Row}
                    flexWrap={FlexWrap.NoWrap}
                    alignItems={AlignItems.Center}
                    justifyContent={JustifyContent.spaceBetween}
                    marginBottom={4}
                    className="confirm-add-suggested-nft__nft-list-item"
                    key={`${address}-${tokenId}`}
                  >
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Row}
                      flexWrap={FlexWrap.NoWrap}
                      alignItems={AlignItems.Center}
                      justifyContent={JustifyContent.spaceBetween}
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
                      <Box
                        display={Display.Flex}
                        flexDirection={FlexDirection.Column}
                        justifyContent={JustifyContent.spaceEvenly}
                        flexWrap={FlexWrap.NoWrap}
                        width={BlockSize.Full}
                        className="confirm-add-suggested-nft__nft-sub-details"
                      >
                        {rpcPrefs.blockExplorerUrl ? (
                          <ButtonLink
                            className="confirm-add-suggested-nft__nft-name"
                            href={blockExplorerLink}
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
                      </Box>
                    </Box>
                    <ButtonIcon
                      className="confirm-add-suggested-nft__nft-remove"
                      data-testid={`confirm-add-suggested-nft__nft-remove-${id}`}
                      iconName={IconName.Close}
                      size={ButtonIconSize.Sm}
                      color={IconColor.iconMuted}
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
                  </Box>
                );
              },
            )}
          </Box>
        </Box>
      </Box>
      <PageContainerFooter
        cancelText={t('cancel')}
        submitText={suggestedNfts.length === 1 ? t('addNft') : t('addNfts')}
        onCancel={handleCancelNftClick}
        onSubmit={handleAddNftsClick}
      />
    </Box>
  );
};

export default ConfirmAddSuggestedNFT;
