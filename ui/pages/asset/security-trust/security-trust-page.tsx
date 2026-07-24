import React, { useEffect, useMemo } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  type CaipAssetType,
  isCaipChainId,
  parseCaipAssetType,
} from '@metamask/utils';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ThemeType } from '../../../../shared/constants/preferences';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { transitionBack } from '../../../components/ui/transition';
import { ScrollContainer } from '../../../contexts/scroll-container';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTheme } from '../../../hooks/useTheme';
import { useTokenSecurityData } from '../../../hooks/useTokenSecurityData';
import { getMultichainNetworkConfigurationsByChainId } from '../../../selectors/multichain';
import {
  formatCompactSupply,
  formatFeePercent,
  getFeatureTags,
  getResultTypeConfig,
  getSecurityAlertIconProps,
  getTop10HoldingPct,
  hasNoHiddenFees,
} from '../utils/security-utils';
import { processAssetParams, resolveAssetRouteLookup } from '../util';
import type { SecurityTrustLocationState } from '../types/security-trust';

const OTHER_HOLDERS_BAR_BG_LIGHT = 'bg-[rgba(133,139,154,0.77)]';
const OTHER_HOLDERS_BAR_BG_DARK = 'bg-[rgba(237,239,242,0.3)]';

const OfficialLinkButton = ({
  iconName,
  label,
  onClick,
  testId,
}: {
  iconName: IconName;
  label: string;
  onClick: () => void;
  testId?: string;
}) => (
  <button
    type="button"
    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-muted px-3 py-2"
    onClick={onClick}
    data-testid={testId}
  >
    <Icon name={iconName} size={IconSize.Sm} color={IconColor.IconDefault} />
    <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
      {label}
    </Text>
  </button>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text
    variant={TextVariant.HeadingSm}
    color={TextColor.TextDefault}
    className="pt-6 pb-3"
  >
    {title}
  </Text>
);

const SecurityTrustPage = () => {
  const t = useI18nContext();
  const theme = useTheme();
  const otherHoldersBarClassName =
    theme === ThemeType.dark
      ? OTHER_HOLDERS_BAR_BG_DARK
      : OTHER_HOLDERS_BAR_BG_LIGHT;
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const locationState = location.state as
    | SecurityTrustLocationState
    | undefined;

  const { chainId, decodedAsset, assetId } = resolveAssetRouteLookup(
    processAssetParams(params),
  );

  const { securityData: fetchedSecurityData, isLoading } = useTokenSecurityData(
    {
      assetId: (assetId ?? null) as CaipAssetType | null,
      prefetchedData: locationState?.securityData ?? undefined,
    },
  );

  const securityData =
    fetchedSecurityData ?? locationState?.securityData ?? null;
  const symbol = locationState?.symbol ?? '';
  const decimals = locationState?.decimals;
  const isNative = locationState?.isNative ?? false;
  const tokenAddress = locationState?.address;

  const evmNetworkConfigurations = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const multichainNetworkConfigurations = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );

  const networkName = useMemo(() => {
    if (!chainId) {
      return undefined;
    }
    if (isCaipChainId(chainId)) {
      return multichainNetworkConfigurations[chainId]?.name;
    }
    return evmNetworkConfigurations[chainId]?.name;
  }, [chainId, evmNetworkConfigurations, multichainNetworkConfigurations]);

  const config = getResultTypeConfig(
    securityData?.resultType,
    t as (key: string, substitutions?: string[]) => string,
  );
  const { tags: featureTags } = getFeatureTags(
    securityData?.features ?? [],
    securityData?.resultType,
    t as (key: string, substitutions?: string[]) => string,
    true,
  );
  const alertIconProps = getSecurityAlertIconProps(config.alertSeverity);

  const fees = securityData?.fees ?? null;
  const financialStats = securityData?.financialStats ?? null;
  const metadata = securityData?.metadata ?? null;
  const top10Pct = getTop10HoldingPct(financialStats);
  const otherPct = top10Pct === null ? null : Math.max(0, 100 - top10Pct);

  const formattedCreatedDate = useMemo(() => {
    const raw = securityData?.created;
    if (!raw) {
      return t('securityTrustNa');
    }
    try {
      return new Date(raw).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return raw;
    }
  }, [securityData?.created, t]);

  const tokenAgeDisplay = useMemo(() => {
    const raw = securityData?.created;
    if (!raw) {
      return t('securityTrustNa');
    }
    try {
      const diffMs = Date.now() - new Date(raw).getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (days < 30) {
        return `${days}d`;
      }
      if (days < 365) {
        return `${Math.floor(days / 30)}mo`;
      }
      return `${Math.floor(days / 365)}yr`;
    } catch {
      return t('securityTrustNa');
    }
  }, [securityData?.created, t]);

  const tokenType = isNative ? 'Native' : 'ERC-20';

  const blockExplorerLink = useMemo(() => {
    if (!tokenAddress || isNative || !chainId || !isEvmChainId(chainId)) {
      return null;
    }
    const caipChainId = isCaipChainId(chainId)
      ? chainId
      : formatChainIdToCaip(chainId);
    const networkConfig = isCaipChainId(chainId)
      ? multichainNetworkConfigurations[chainId]
      : evmNetworkConfigurations[chainId];
    const defaultIdx = networkConfig?.defaultBlockExplorerUrlIndex;
    const blockExplorerUrl =
      defaultIdx === undefined
        ? ''
        : (networkConfig?.blockExplorerUrls?.[defaultIdx] ?? '');

    const contractAddress = isCaipChainId(tokenAddress)
      ? parseCaipAssetType(tokenAddress as CaipAssetType).assetReference
      : tokenAddress;

    return {
      url: getTokenTrackerLink(contractAddress, chainId, '', '', {
        blockExplorerUrl,
      }),
      name: networkConfig?.name ?? t('securityTrustEtherscan'),
    };
  }, [
    tokenAddress,
    isNative,
    chainId,
    evmNetworkConfigurations,
    multichainNetworkConfigurations,
    t,
  ]);

  const openLink = (url: string) => {
    globalThis.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    document.querySelector('.app')?.scroll(0, 0);
  }, []);

  const pageContent =
    isLoading && !securityData ? (
      <Box className="asset__content" data-testid="security-trust-screen">
        <Text variant={TextVariant.BodyMd}>{t('loading')}</Text>
      </Box>
    ) : (
      <Box className="asset__content" data-testid="security-trust-screen">
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          paddingBottom={3}
          paddingLeft={2}
          paddingRight={4}
          className="pt-4 sticky top-0 z-10 bg-background-default"
        >
          <ButtonIcon
            color={IconColor.IconDefault}
            size={ButtonIconSize.Md}
            ariaLabel={t('back') as string}
            iconName={IconName.ArrowLeft}
            onClick={() => transitionBack(() => navigate(-1))}
            data-testid="security-trust-back-button"
          />
          <Text
            variant={TextVariant.HeadingSm}
            color={TextColor.TextDefault}
            className="flex-1 text-center"
          >
            {t('securityTrustTitle')}
          </Text>
          <Box style={{ width: 24 }} />
        </Box>

        <Box paddingLeft={4} paddingRight={4} paddingBottom={6} gap={0}>
          <Box flexDirection={BoxFlexDirection.Column} gap={3} paddingTop={3}>
            <Text
              variant={TextVariant.HeadingMd}
              color={config.textColor}
              fontWeight={FontWeight.Medium}
            >
              {config.label}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {config.subtitle}
            </Text>
            {featureTags.length > 0 ? (
              <Box flexDirection={BoxFlexDirection.Column} gap={2}>
                {featureTags.map((tag) => (
                  <Box
                    key={tag.label}
                    flexDirection={BoxFlexDirection.Row}
                    alignItems={BoxAlignItems.Center}
                    gap={2}
                  >
                    {alertIconProps ? (
                      <Icon
                        name={alertIconProps.name}
                        size={IconSize.Md}
                        color={alertIconProps.color}
                      />
                    ) : null}
                    <Text
                      variant={TextVariant.BodyMd}
                      color={TextColor.TextDefault}
                    >
                      {tag.label}
                    </Text>
                  </Box>
                ))}
              </Box>
            ) : null}
          </Box>

          <Box className="asset-page__divider" marginTop={6} marginBottom={6} />

          <SectionHeader title={t('securityTrustTokenDistribution')} />
          <Box paddingBottom={3}>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              fontWeight={FontWeight.Medium}
            >
              {t('securityTrustTotalSupply')}
            </Text>
            <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
              {formatCompactSupply(financialStats?.supply, decimals)} {symbol}
            </Text>
          </Box>

          {top10Pct === null ? null : (
            <Box paddingBottom={3}>
              <Box
                className={`h-2 rounded-full overflow-hidden flex flex-row ${otherHoldersBarClassName}`}
                style={{ width: '100%' }}
              >
                <Box
                  className="h-full bg-primary-default"
                  style={{ width: `${top10Pct}%` }}
                />
              </Box>
            </Box>
          )}

          <Box gap={2}>
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Between}
            >
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={2}
              >
                <Box className="w-3 h-3 rounded-full bg-primary-default" />
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextDefault}
                >
                  {t('securityTrustTop10Holders')}
                </Text>
              </Box>
              <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
                {top10Pct === null
                  ? t('securityTrustNa')
                  : `${top10Pct.toFixed(1)}%`}
              </Text>
            </Box>
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Between}
            >
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={2}
              >
                <Box
                  className={`w-3 h-3 rounded-full ${otherHoldersBarClassName}`}
                />
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextDefault}
                >
                  {t('securityTrustOther')}
                </Text>
              </Box>
              <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
                {otherPct === null
                  ? t('securityTrustNa')
                  : `${otherPct.toFixed(1)}%`}
              </Text>
            </Box>
          </Box>

          <Box className="asset-page__divider" marginTop={6} marginBottom={6} />

          <SectionHeader title={t('securityTrustBuySellTax')} />
          <Box flexDirection={BoxFlexDirection.Row} gap={3}>
            {[
              { label: t('securityTrustBuyTax'), value: fees?.buy },
              { label: t('securityTrustSellTax'), value: fees?.sell },
              { label: t('securityTrustTransfer'), value: fees?.transfer },
            ].map(({ label, value }) => (
              <Box key={label} style={{ flex: 1 }}>
                <Text
                  variant={TextVariant.HeadingLg}
                  color={TextColor.TextDefault}
                  fontWeight={FontWeight.Bold}
                >
                  {formatFeePercent(value)}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                  fontWeight={FontWeight.Medium}
                >
                  {label}
                </Text>
              </Box>
            ))}
          </Box>
          {hasNoHiddenFees(fees) ? (
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={1}
              className="mt-3 inline-flex self-start rounded-sm bg-success-muted px-1.5 py-0.5"
            >
              <Icon
                name={IconName.SecurityTick}
                size={IconSize.Xs}
                color={IconColor.SuccessDefault}
              />
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.SuccessDefault}
                fontWeight={FontWeight.Medium}
              >
                {t('securityTrustNoHiddenFeesDetected')}
              </Text>
            </Box>
          ) : null}

          <Box className="asset-page__divider" marginTop={6} marginBottom={6} />

          <SectionHeader title={t('securityTrustTokenInfo')} />
          <Box gap={3}>
            <Box flexDirection={BoxFlexDirection.Row} gap={3}>
              <Box style={{ flex: 1 }}>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                  fontWeight={FontWeight.Medium}
                >
                  {t('securityTrustCreated')}
                </Text>
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextDefault}
                >
                  {formattedCreatedDate}
                </Text>
              </Box>
              <Box style={{ flex: 1 }}>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                  fontWeight={FontWeight.Medium}
                >
                  {t('securityTrustTokenAge')}
                </Text>
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextDefault}
                >
                  {tokenAgeDisplay}
                </Text>
              </Box>
            </Box>
            <Box flexDirection={BoxFlexDirection.Row} gap={3}>
              <Box style={{ flex: 1 }}>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                  fontWeight={FontWeight.Medium}
                >
                  {t('securityTrustNetwork')}
                </Text>
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextDefault}
                >
                  {networkName ?? t('securityTrustNa')}
                </Text>
              </Box>
              <Box style={{ flex: 1 }}>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                  fontWeight={FontWeight.Medium}
                >
                  {t('securityTrustType')}
                </Text>
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextDefault}
                >
                  {tokenType}
                </Text>
              </Box>
            </Box>
          </Box>

          {metadata?.externalLinks ? (
            <>
              <Box
                className="asset-page__divider"
                marginTop={6}
                marginBottom={6}
              />
              <SectionHeader title={t('securityTrustOfficialLinks')} />
              <Box
                flexDirection={BoxFlexDirection.Row}
                className="flex-wrap"
                gap={2}
              >
                {metadata.externalLinks.homepage ? (
                  <OfficialLinkButton
                    iconName={IconName.WebTraffic}
                    label={t('securityTrustWebsite')}
                    onClick={() =>
                      openLink(metadata.externalLinks.homepage ?? '')
                    }
                    testId="security-trust-link-website"
                  />
                ) : null}
                {metadata.externalLinks.twitterPage ? (
                  <OfficialLinkButton
                    iconName={IconName.X}
                    label={`@${metadata.externalLinks.twitterPage}`}
                    onClick={() =>
                      openLink(
                        `https://x.com/${metadata.externalLinks.twitterPage}`,
                      )
                    }
                    testId="security-trust-link-twitter"
                  />
                ) : null}
                {metadata.externalLinks.telegramChannelId ? (
                  <OfficialLinkButton
                    iconName={IconName.Telegram}
                    label={t('securityTrustTelegram')}
                    onClick={() =>
                      openLink(
                        `https://t.me/${metadata.externalLinks.telegramChannelId}`,
                      )
                    }
                    testId="security-trust-link-telegram"
                  />
                ) : null}
                {blockExplorerLink ? (
                  <OfficialLinkButton
                    iconName={IconName.Explore}
                    label={blockExplorerLink.name}
                    onClick={() => openLink(blockExplorerLink.url)}
                    testId="security-trust-link-explorer"
                  />
                ) : null}
              </Box>
            </>
          ) : null}

          <Box className="asset-page__divider" marginTop={6} marginBottom={6} />
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('securityTrustEvaluationDisclaimer')}
          </Text>
        </Box>
      </Box>
    );

  return (
    <ScrollContainer className="main-container asset__container">
      {pageContent}
    </ScrollContainer>
  );
};

export default SecurityTrustPage;
