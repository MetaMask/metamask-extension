import React, { useCallback, useEffect, useRef } from 'react';
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
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { buildAssetRoutePath } from '../../../../shared/lib/asset-route';
import { ThemeType } from '../../../../shared/constants/preferences';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import { transitionBack } from '../../../components/ui/transition';
import { ScrollContainer } from '../../../contexts/scroll-container';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useTheme } from '../../../hooks/useTheme';
import { SecurityTrustAnalyticsProperty } from '../components/security-trust/security-trust-analytics-properties';
import { getUseExternalServices } from '../../../selectors';
import { getIsSecurityTrustTdpEnabled } from '../../../selectors/multichain/feature-flags';
import {
  formatCompactSupply,
  formatFeePercent,
  hasNoHiddenFees,
} from '../utils/security-utils';
import type {
  FeatureTag,
  TokenSecurityFees,
  TokenSecurityFinancialStats,
  TokenSecurityMetadata,
} from '../types/security-trust';
import type { ResultTypeConfig } from '../utils/security-utils';
import { processAssetParams, resolveAssetRouteLookup } from '../util';
import { useSecurityTrustPageData } from './useSecurityTrustPageData';

const OTHER_HOLDERS_BAR_BG_LIGHT = 'bg-[rgba(133,139,154,0.77)]';
const OTHER_HOLDERS_BAR_BG_DARK = 'bg-[rgba(237,239,242,0.3)]';

type SecurityTrustPageCtaType =
  | 'website'
  | 'twitter'
  | 'telegram'
  | 'block_explorer';

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

const openLink = (url: string) => {
  globalThis.open(url, '_blank', 'noopener,noreferrer');
};

const SecurityTrustPageHeader = ({
  onBack,
  title,
  backLabel,
}: {
  onBack: () => void;
  title: string;
  backLabel: string;
}) => (
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
      ariaLabel={backLabel}
      iconName={IconName.ArrowLeft}
      onClick={onBack}
      data-testid="security-trust-back-button"
    />
    <Text
      variant={TextVariant.HeadingSm}
      color={TextColor.TextDefault}
      className="flex-1 text-center"
    >
      {title}
    </Text>
    <Box style={{ width: 24 }} />
  </Box>
);

const SecurityTrustSummarySection = ({
  config,
  featureTags,
  alertIconProps,
}: {
  config: ResultTypeConfig;
  featureTags: FeatureTag[];
  alertIconProps: { name: IconName; color: IconColor } | null;
}) => (
  <Box flexDirection={BoxFlexDirection.Column} gap={3} paddingTop={3}>
    <Text
      variant={TextVariant.BodyLg}
      color={config.textColor}
      fontWeight={FontWeight.Medium}
      className="py-1"
    >
      {config.label}
    </Text>
    <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
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
            <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
              {tag.label}
            </Text>
          </Box>
        ))}
      </Box>
    ) : null}
  </Box>
);

const TokenDistributionSection = ({
  sectionTitle,
  totalSupplyLabel,
  top10HoldersLabel,
  otherLabel,
  naLabel,
  financialStats,
  decimals,
  symbol,
  top10Pct,
  otherPct,
  otherHoldersBarClassName,
}: {
  sectionTitle: string;
  totalSupplyLabel: string;
  top10HoldersLabel: string;
  otherLabel: string;
  naLabel: string;
  financialStats: TokenSecurityFinancialStats | null;
  decimals?: number;
  symbol: string;
  top10Pct: number | null;
  otherPct: number | null;
  otherHoldersBarClassName: string;
}) => (
  <>
    <SectionHeader title={sectionTitle} />
    <Box paddingBottom={3}>
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextAlternative}
        fontWeight={FontWeight.Medium}
      >
        {totalSupplyLabel}
      </Text>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
        {formatCompactSupply(financialStats?.supply, decimals, naLabel)}{' '}
        {symbol}
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
          <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
            {top10HoldersLabel}
          </Text>
        </Box>
        <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
          {top10Pct === null ? naLabel : `${top10Pct.toFixed(1)}%`}
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
          <Box className={`w-3 h-3 rounded-full ${otherHoldersBarClassName}`} />
          <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
            {otherLabel}
          </Text>
        </Box>
        <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
          {otherPct === null ? naLabel : `${otherPct.toFixed(1)}%`}
        </Text>
      </Box>
    </Box>
  </>
);

const BuySellTaxSection = ({
  title,
  fees,
  buyTaxLabel,
  sellTaxLabel,
  transferLabel,
  noHiddenFeesLabel,
  naLabel,
}: {
  title: string;
  fees: TokenSecurityFees | null;
  buyTaxLabel: string;
  sellTaxLabel: string;
  transferLabel: string;
  noHiddenFeesLabel: string;
  naLabel: string;
}) => (
  <>
    <SectionHeader title={title} />
    <Box flexDirection={BoxFlexDirection.Row} gap={3}>
      {[
        { label: buyTaxLabel, value: fees?.buy },
        { label: sellTaxLabel, value: fees?.sell },
        { label: transferLabel, value: fees?.transfer },
      ].map(({ label, value }) => (
        <Box key={label} style={{ flex: 1 }}>
          <Text
            variant={TextVariant.HeadingLg}
            color={TextColor.TextDefault}
            fontWeight={FontWeight.Bold}
          >
            {formatFeePercent(value, naLabel)}
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
          {noHiddenFeesLabel}
        </Text>
      </Box>
    ) : null}
  </>
);

const TokenInfoField = ({ label, value }: { label: string; value: string }) => (
  <Box flexDirection={BoxFlexDirection.Column} gap={1} style={{ flex: 1 }}>
    <Text
      variant={TextVariant.BodySm}
      color={TextColor.TextAlternative}
      fontWeight={FontWeight.Medium}
    >
      {label}
    </Text>
    <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
      {value}
    </Text>
  </Box>
);

const TokenInfoSection = ({
  title,
  createdLabel,
  tokenAgeLabel,
  networkLabel,
  typeLabel,
  formattedCreatedDate,
  tokenAgeDisplay,
  networkName,
  tokenType,
  naLabel,
}: {
  title: string;
  createdLabel: string;
  tokenAgeLabel: string;
  networkLabel: string;
  typeLabel: string;
  formattedCreatedDate: string;
  tokenAgeDisplay: string;
  networkName: string | undefined;
  tokenType: string;
  naLabel: string;
}) => (
  <>
    <SectionHeader title={title} />
    <Box flexDirection={BoxFlexDirection.Column} gap={4}>
      <Box flexDirection={BoxFlexDirection.Row} gap={3}>
        <TokenInfoField label={createdLabel} value={formattedCreatedDate} />
        <TokenInfoField label={tokenAgeLabel} value={tokenAgeDisplay} />
      </Box>
      <Box flexDirection={BoxFlexDirection.Row} gap={3}>
        <TokenInfoField label={networkLabel} value={networkName ?? naLabel} />
        <TokenInfoField label={typeLabel} value={tokenType} />
      </Box>
    </Box>
  </>
);

const SectionDivider = () => (
  <Box
    className="security-trust__section-divider"
    marginTop={8}
    marginBottom={2}
  />
);

const OfficialLinksSection = ({
  title,
  metadata,
  blockExplorerLink,
  websiteLabel,
  telegramLabel,
  onLinkClick,
}: {
  title: string;
  metadata: TokenSecurityMetadata;
  blockExplorerLink: { url: string; name: string } | null;
  websiteLabel: string;
  telegramLabel: string;
  onLinkClick: (url: string, ctaType: SecurityTrustPageCtaType) => void;
}) => (
  <>
    <SectionDivider />
    <SectionHeader title={title} />
    <Box flexDirection={BoxFlexDirection.Row} className="flex-wrap" gap={2}>
      {metadata.externalLinks.homepage ? (
        <OfficialLinkButton
          iconName={IconName.WebTraffic}
          label={websiteLabel}
          onClick={() =>
            onLinkClick(metadata.externalLinks.homepage ?? '', 'website')
          }
          testId="security-trust-link-website"
        />
      ) : null}
      {metadata.externalLinks.twitterPage ? (
        <OfficialLinkButton
          iconName={IconName.X}
          label={`@${metadata.externalLinks.twitterPage}`}
          onClick={() =>
            onLinkClick(
              `https://x.com/${metadata.externalLinks.twitterPage}`,
              'twitter',
            )
          }
          testId="security-trust-link-twitter"
        />
      ) : null}
      {metadata.externalLinks.telegramChannelId ? (
        <OfficialLinkButton
          iconName={IconName.Telegram}
          label={telegramLabel}
          onClick={() =>
            onLinkClick(
              `https://t.me/${metadata.externalLinks.telegramChannelId}`,
              'telegram',
            )
          }
          testId="security-trust-link-telegram"
        />
      ) : null}
      {blockExplorerLink ? (
        <OfficialLinkButton
          iconName={IconName.Explore}
          label={blockExplorerLink.name}
          onClick={() => onLinkClick(blockExplorerLink.url, 'block_explorer')}
          testId="security-trust-link-explorer"
        />
      ) : null}
    </Box>
  </>
);

const SecurityTrustPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const hasTrackedView = useRef(false);
  const timeSpentStart = useRef(0);

  useEffect(() => {
    timeSpentStart.current = Date.now();
  }, []);
  const params = useParams();
  const { assetId } = resolveAssetRouteLookup(processAssetParams(params));
  const useExternalServices = useSelector(getUseExternalServices);
  const isSecurityTrustTdpEnabled = useSelector(getIsSecurityTrustTdpEnabled);
  const isFeatureEnabled = useExternalServices && isSecurityTrustTdpEnabled;
  const otherHoldersBarClassName =
    theme === ThemeType.dark
      ? OTHER_HOLDERS_BAR_BG_DARK
      : OTHER_HOLDERS_BAR_BG_LIGHT;

  useEffect(() => {
    if (isFeatureEnabled) {
      return;
    }

    if (assetId) {
      navigate(buildAssetRoutePath(assetId), { replace: true });
      return;
    }

    navigate(PREVIOUS_ROUTE);
  }, [assetId, isFeatureEnabled, navigate]);

  const {
    t,
    isLoading,
    securityData,
    config,
    featureTags,
    alertIconProps,
    fees,
    financialStats,
    metadata,
    top10Pct,
    otherPct,
    symbol,
    decimals,
    chainId,
    formattedCreatedDate,
    tokenAgeDisplay,
    tokenType,
    networkName,
    blockExplorerLink,
  } = useSecurityTrustPageData();

  useEffect(() => {
    document.querySelector('.app')?.scroll(0, 0);
  }, []);

  useEffect(() => {
    if (hasTrackedView.current || !securityData) {
      return;
    }

    hasTrackedView.current = true;
    trackEvent(
      createEventBuilder(MetaMetricsEventName.SecurityPageViewed)
        .addProperties({
          [SecurityTrustAnalyticsProperty.TokenSymbol]: symbol,
          [SecurityTrustAnalyticsProperty.ChainId]: chainId,
          severity: securityData.resultType ?? 'unknown',
        })
        .build(),
    );
  }, [chainId, createEventBuilder, securityData, symbol, trackEvent]);

  const handleLinkClick = useCallback(
    (url: string, ctaType: SecurityTrustPageCtaType) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.SecurityPageCtaClicked)
          .addProperties({
            [SecurityTrustAnalyticsProperty.TokenSymbol]: symbol,
            [SecurityTrustAnalyticsProperty.ChainId]: chainId,
            [SecurityTrustAnalyticsProperty.CtaType]: ctaType,
            severity: securityData?.resultType ?? 'unknown',
          })
          .build(),
      );

      if (ctaType === 'block_explorer') {
        trackEvent(
          createEventBuilder(MetaMetricsEventName.BlockExplorerLinkClicked)
            .addCategory(MetaMetricsEventCategory.Navigation)
            .addProperties({
              location: 'security_trust_page',
              [SecurityTrustAnalyticsProperty.ChainId]: chainId,
            })
            .build(),
        );
      }

      openLink(url);
    },
    [chainId, createEventBuilder, securityData?.resultType, symbol, trackEvent],
  );

  const handleBack = () => {
    const timeSpentMs = Date.now() - timeSpentStart.current;
    trackEvent(
      createEventBuilder(MetaMetricsEventName.SecurityPageDismissed)
        .addProperties({
          [SecurityTrustAnalyticsProperty.TokenSymbol]: symbol,
          [SecurityTrustAnalyticsProperty.ChainId]: chainId,
          severity: securityData?.resultType ?? 'unknown',
          [SecurityTrustAnalyticsProperty.TimeSpentMs]: timeSpentMs,
        })
        .build(),
    );
    transitionBack(() => navigate(PREVIOUS_ROUTE));
  };

  if (!isFeatureEnabled) {
    return null;
  }

  const pageContent =
    isLoading && !securityData ? (
      <Box className="asset__content" data-testid="security-trust-screen">
        <Text variant={TextVariant.BodyMd}>{t('loading')}</Text>
      </Box>
    ) : (
      <Box className="asset__content" data-testid="security-trust-screen">
        <SecurityTrustPageHeader
          onBack={handleBack}
          title={t('securityTrustTitle') as string}
          backLabel={t('back') as string}
        />

        <Box paddingLeft={4} paddingRight={4} paddingBottom={6} gap={0}>
          <SecurityTrustSummarySection
            config={config}
            featureTags={featureTags}
            alertIconProps={alertIconProps}
          />

          <SectionDivider />

          <TokenDistributionSection
            sectionTitle={t('securityTrustTokenDistribution')}
            totalSupplyLabel={t('securityTrustTotalSupply')}
            top10HoldersLabel={t('securityTrustTop10Holders')}
            otherLabel={t('securityTrustOther')}
            naLabel={t('securityTrustNa')}
            financialStats={financialStats}
            decimals={decimals}
            symbol={symbol}
            top10Pct={top10Pct}
            otherPct={otherPct}
            otherHoldersBarClassName={otherHoldersBarClassName}
          />

          <SectionDivider />

          <BuySellTaxSection
            title={t('securityTrustBuySellTax')}
            fees={fees}
            buyTaxLabel={t('securityTrustBuyTax')}
            sellTaxLabel={t('securityTrustSellTax')}
            transferLabel={t('securityTrustTransfer')}
            noHiddenFeesLabel={t('securityTrustNoHiddenFeesDetected')}
            naLabel={t('securityTrustNa')}
          />

          <SectionDivider />

          <TokenInfoSection
            title={t('securityTrustTokenInfo')}
            createdLabel={t('securityTrustCreated')}
            tokenAgeLabel={t('securityTrustTokenAge')}
            networkLabel={t('securityTrustNetwork')}
            typeLabel={t('securityTrustType')}
            formattedCreatedDate={formattedCreatedDate}
            tokenAgeDisplay={tokenAgeDisplay}
            networkName={networkName}
            tokenType={tokenType}
            naLabel={t('securityTrustNa')}
          />

          {metadata?.externalLinks ? (
            <OfficialLinksSection
              title={t('securityTrustOfficialLinks')}
              metadata={metadata}
              blockExplorerLink={blockExplorerLink}
              websiteLabel={t('securityTrustWebsite')}
              telegramLabel={t('securityTrustTelegram')}
              onLinkClick={handleLinkClick}
            />
          ) : null}

          <SectionDivider />
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('securityTrustEvaluationDisclaimer')}
          </Text>
        </Box>
      </Box>
    );

  return (
    <ScrollContainer
      className="main-container asset__container"
      data-testid="asset-page-scroll-container"
    >
      {pageContent}
    </ScrollContainer>
  );
};

export default SecurityTrustPage;
