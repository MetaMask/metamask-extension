import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { TOKEN_API_METASWAP_CODEFI_URL } from '../../../../shared/constants/tokens';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { I18nContext } from '../../../contexts/i18n';
import { getProviderConfig } from '../../../../shared/modules/selectors/networks';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  Color,
  Display,
  FlexDirection,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  getCurrentNetwork,
  getIsBridgeChain,
  getMetaMetricsId,
  getUseTokenDetection,
  getUseExternalServices,
  getParticipateInMetaMetrics,
  getDataCollectionForMarketing,
} from '../../../selectors';
import {
  PickerNetwork,
  Text,
  Box,
  Button,
  Icon,
  IconName,
  ButtonPrimarySize,
  IconSize,
  AvatarNetworkSize,
} from '../../component-library';
import Popover from '../popover';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';

export default function NewNetworkInfo() {
  const t = useContext(I18nContext);
  const [tokenDetectionSupported, setTokenDetectionSupported] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const autoDetectToken = useSelector(getUseTokenDetection);
  const areExternalServicesEnabled = useSelector(getUseExternalServices);
  const providerConfig = useSelector(getProviderConfig);
  const currentNetwork = useSelector(getCurrentNetwork);
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isBridgeChain = useSelector(getIsBridgeChain);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const onCloseClick = () => {
    setShowPopup(false);
  };

  const checkTokenDetection = useCallback(async () => {
    setIsLoading(true);
    const fetchedTokenData = await fetchWithCache({
      url: `${TOKEN_API_METASWAP_CODEFI_URL}${providerConfig.chainId}?occurrenceFloor=100&includeNativeAssets=false`,
      functionName: 'getIsTokenDetectionSupported',
    });
    const isTokenDetectionSupported = !fetchedTokenData?.error;
    setTokenDetectionSupported(isTokenDetectionSupported);
    setIsLoading(false);
  }, [providerConfig.chainId]);

  useEffect(() => {
    if (!areExternalServicesEnabled) {
      return;
    }
    checkTokenDetection();
    // we want to only fetch once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    !isLoading &&
    showPopup && (
      <Popover
        title={t('switchedTo')}
        centerTitle
        onClose={onCloseClick}
        className="new-network-info__wrapper"
        headerProps={{ marginLeft: 6 }}
        footer={
          <>
            <Button
              variant="secondary"
              href={ZENDESK_URLS.USER_GUIDE_CUSTOM_NETWORKS}
              externalLink
              rel="noreferrer"
              size={ButtonPrimarySize.Md}
              className="footer__button"
            >
              <Text variant={TextVariant.bodySm} as="h6" color={Color.inherit}>
                {t('learnToBridge')}
              </Text>
            </Button>
            <Button
              variant="primary"
              onClick={onCloseClick}
              size={ButtonPrimarySize.Md}
              className="footer__button"
            >
              <Text variant={TextVariant.bodySm} as="h6" color={Color.inherit}>
                {t('recoveryPhraseReminderConfirm')}
              </Text>
            </Button>
          </>
        }
      >
        <Box
          data-testid="new-network-info__wrapper"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
        >
          <PickerNetwork
            label={currentNetwork?.nickname}
            src={currentNetwork?.rpcPrefs?.imageUrl}
            marginLeft="auto"
            marginRight="auto"
            marginBottom={4}
            iconProps={{ display: 'none' }} // do not show the dropdown icon
            avatarNetworkProps={{ size: AvatarNetworkSize.Sm }}
            as="div" // do not render as a button
            backgroundColor={BackgroundColor.transparent}
            borderWidth={1}
            borderColor={BorderColor.borderMuted}
          />
          <Text
            variant={TextVariant.bodySm}
            as="h6"
            color={Color.textDefault}
            align={TextAlign.Start}
            marginLeft={4}
            marginTop={2}
          >
            {t('thingsToKeep')}
          </Text>
          <Box marginRight={4} marginLeft={4} marginTop={5}>
            {providerConfig.ticker && (
              <Box
                display={Display.Flex}
                alignItems={AlignItems.flexStart}
                marginBottom={2}
                paddingBottom={2}
                data-testid="new-network-info__bullet-paragraph"
                gap={3}
              >
                <Box className="new-network-info__bullet-icon-container">
                  <Icon name={IconName.Gas} size={IconSize.Sm} />
                </Box>
                <Box flexDirection={FlexDirection.Column}>
                  <Text
                    variant={TextVariant.bodySmBold}
                    as="h6"
                    color={TextColor.textDefault}
                  >
                    {t('gasIsETH', [providerConfig.ticker])}
                  </Text>
                  <Text
                    variant={TextVariant.bodySm}
                    as="h6"
                    color={TextColor.textDefault}
                    display={Display.InlineBlock}
                    key="nativeTokenInfo"
                  >
                    {t('nativeToken', [providerConfig.ticker])}
                  </Text>
                </Box>
              </Box>
            )}
            <Box
              display={Display.Flex}
              alignItems={AlignItems.flexStart}
              marginBottom={2}
              paddingBottom={2}
              gap={3}
            >
              <Box className="new-network-info__bullet-icon-container">
                <Icon name={IconName.Bridge} size={IconSize.Sm} />
              </Box>
              <Box flexDirection={FlexDirection.Column}>
                <Text
                  variant={TextVariant.bodySmBold}
                  as="h6"
                  color={TextColor.textDefault}
                >
                  {t('bridgeDontSend')}
                </Text>
                <Text
                  variant={TextVariant.bodySm}
                  as="h6"
                  color={TextColor.textDefault}
                  display={Display.InlineBlock}
                >
                  {isBridgeChain
                    ? t('attemptSendingAssetsWithPortfolio', [
                        <a
                          href={`${getPortfolioUrl(
                            'bridge',
                            'ext_bridge_new_network_info_link',
                            metaMetricsId,
                            isMetaMetricsEnabled,
                            isMarketingEnabled,
                          )}&destChain=${currentNetwork?.chainId}`}
                          target="_blank"
                          rel="noreferrer"
                          key="bridge-link"
                        >
                          <Text
                            variant={TextVariant.bodySm}
                            as="h6"
                            color={TextColor.infoDefault}
                            className="new-network-info__button"
                          >
                            {t('metamaskPortfolio')}
                          </Text>
                        </a>,
                      ])
                    : t('attemptSendingAssets')}
                </Text>
              </Box>
            </Box>

            {!autoDetectToken || !tokenDetectionSupported ? (
              <Box
                display={Display.Flex}
                alignItems={AlignItems.flexStart}
                marginBottom={2}
                paddingBottom={2}
                data-testid="new-network-info__add-token-manually"
                gap={3}
              >
                <Box className="new-network-info__bullet-icon-container">
                  <Icon name={IconName.Coin} size={IconSize.Sm} />
                </Box>
                <Box flexDirection={FlexDirection.Column}>
                  <Text
                    variant={TextVariant.bodySmBold}
                    as="h6"
                    color={TextColor.textDefault}
                  >
                    {t('addingTokens')}
                  </Text>
                  <Text
                    variant={TextVariant.bodySm}
                    as="h6"
                    color={Color.textDefault}
                    display={Display.InlineBlock}
                  >
                    {t('tokenShowUp')}
                    {t('clickToManuallyAdd')}
                  </Text>
                </Box>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Popover>
    )
  );
}
