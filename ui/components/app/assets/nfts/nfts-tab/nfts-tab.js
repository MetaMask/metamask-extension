import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  Size,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { SECURITY_ROUTE } from '../../../../../helpers/constants/routes';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useNftsCollections } from '../../../../../hooks/useNftsCollections';
import {
  getCurrentNetwork,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getShouldHideZeroBalanceTokens,
  getSelectedAccount,
  ///: END:ONLY_INCLUDE_IF
  getIsMainnet,
  getUseNftDetection,
  getNftIsStillFetchingIndication,
} from '../../../../../selectors';
import {
  checkAndUpdateAllNftsOwnershipStatus,
  detectNfts,
  showImportNftsModal,
} from '../../../../../store/actions';
import { Box, ButtonLink, IconName, Text } from '../../../../component-library';
import NFTsDetectionNoticeNFTsTab from '../nfts-detection-notice-nfts-tab/nfts-detection-notice-nfts-tab';
import NftsItems from '../nfts-items';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
///: END:ONLY_INCLUDE_IF
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { getCurrentLocale } from '../../../../../ducks/locale/locale';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import {
  RAMPS_CARD_VARIANT_TYPES,
  RampsCard,
} from '../../../../multichain/ramps-card/ramps-card';
import { useAccountTotalFiatBalance } from '../../../../../hooks/useAccountTotalFiatBalance';
import { getIsNativeTokenBuyable } from '../../../../../ducks/ramps';
///: END:ONLY_INCLUDE_IF
import Spinner from '../../../../ui/spinner';

export default function NftsTab() {
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const history = useHistory();
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const selectedAccount = useSelector(getSelectedAccount);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const { totalFiatBalance } = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  );
  const balanceIsZero = Number(totalFiatBalance) === 0;
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const showRampsCard = isBuyableChain && balanceIsZero;
  ///: END:ONLY_INCLUDE_IF

  const { nftsLoading, collections, previouslyOwnedCollection } =
    useNftsCollections();

  const onEnableAutoDetect = () => {
    history.push(SECURITY_ROUTE);
  };

  const onRefresh = () => {
    if (isMainnet) {
      dispatch(detectNfts());
    }
    checkAndUpdateAllNftsOwnershipStatus();
  };

  const hasAnyNfts = Object.keys(collections).length > 0;
  const showNftBanner = hasAnyNfts === false;
  const { chainId, nickname } = useSelector(getCurrentNetwork);
  const currentLocale = useSelector(getCurrentLocale);

  useEffect(() => {
    if (nftsLoading || !showNftBanner) {
      return;
    }
    trackEvent({
      event: MetaMetricsEventName.EmptyNftsBannerDisplayed,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        chain_id: chainId,
        locale: currentLocale,
        network: nickname,
        referrer: ORIGIN_METAMASK,
      },
    });
  }, [
    nftsLoading,
    showNftBanner,
    trackEvent,
    chainId,
    nickname,
    currentLocale,
  ]);

  if (!hasAnyNfts && nftsStillFetchingIndication) {
    return (
      <Box className="nfts-tab__loading">
        <Spinner
          color="var(--color-warning-default)"
          className="loading-overlay__spinner"
        />
      </Box>
    );
  }

  return (
    <>
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        showRampsCard ? (
          <RampsCard variant={RAMPS_CARD_VARIANT_TYPES.NFT} />
        ) : null
        ///: END:ONLY_INCLUDE_IF
      }
      <Box className="nfts-tab">
        {isMainnet && !useNftDetection ? (
          <Box paddingTop={4} paddingInlineStart={4} paddingInlineEnd={4}>
            <NFTsDetectionNoticeNFTsTab />
          </Box>
        ) : null}
        {hasAnyNfts > 0 || previouslyOwnedCollection.nfts.length > 0 ? (
          <Box>
            <NftsItems
              collections={collections}
              previouslyOwnedCollection={previouslyOwnedCollection}
            />

            {nftsStillFetchingIndication ? (
              <Box className="nfts-tab__fetching">
                <Spinner
                  color="var(--color-warning-default)"
                  className="loading-overlay__spinner"
                />
              </Box>
            ) : null}
          </Box>
        ) : (
          <>
            <Box
              padding={12}
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}
            >
              <Box justifyContent={JustifyContent.center}>
                <img src="./images/no-nfts.svg" />
              </Box>
              <Box
                marginTop={4}
                marginBottom={12}
                display={Display.Flex}
                justifyContent={JustifyContent.center}
                alignItems={AlignItems.center}
                flexDirection={FlexDirection.Column}
                className="nfts-tab__link"
              >
                <Text
                  color={TextColor.textMuted}
                  variant={TextVariant.headingSm}
                  align={TextAlign.Center}
                  as="h4"
                >
                  {t('noNFTs')}
                </Text>
                {
                  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
                  <ButtonLink
                    size={Size.MD}
                    href={ZENDESK_URLS.NFT_TOKENS}
                    externalLink
                  >
                    {t('learnMoreUpperCase')}
                  </ButtonLink>
                  ///: END:ONLY_INCLUDE_IF
                }
              </Box>
            </Box>
          </>
        )}
        <Box
          className="nfts-tab__buttons"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.flexStart}
          margin={4}
          gap={2}
          marginBottom={2}
        >
          <ButtonLink
            size={Size.MD}
            data-testid="import-nft-button"
            startIconName={IconName.Add}
            onClick={() => {
              dispatch(showImportNftsModal());
            }}
          >
            {t('importNFT')}
          </ButtonLink>
          {!isMainnet && Object.keys(collections).length < 1 ? null : (
            <>
              <Box
                className="nfts-tab__link"
                justifyContent={JustifyContent.flexEnd}
              >
                {isMainnet && !useNftDetection ? (
                  <ButtonLink
                    size={Size.MD}
                    startIconName={IconName.Setting}
                    data-testid="refresh-list-button"
                    onClick={onEnableAutoDetect}
                  >
                    {t('enableAutoDetect')}
                  </ButtonLink>
                ) : (
                  <ButtonLink
                    size={Size.MD}
                    startIconName={IconName.Refresh}
                    data-testid="refresh-list-button"
                    onClick={onRefresh}
                  >
                    {t('refreshList')}
                  </ButtonLink>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </>
  );
}
