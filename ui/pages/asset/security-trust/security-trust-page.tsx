import React, { useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { ThemeType } from '../../../../shared/constants/preferences';
import { transitionBack } from '../../../components/ui/transition';
import { ScrollContainer } from '../../../contexts/scroll-container';
import { useTheme } from '../../../hooks/useTheme';
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
import { useSecurityTrustPageData } from './useSecurityTrustPageData';

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
      variant={TextVariant.HeadingMd}
      color={config.textColor}
      fontWeight={FontWeight.Medium}
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
          <Box
            className={`w-3 h-3 rounded-full ${otherHoldersBarClassName}`}
          />
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
}: {
  title: string;
  fees: TokenSecurityFees | null;
  buyTaxLabel: string;
  sellTaxLabel: string;
  transferLabel: string;
  noHiddenFeesLabel: string;
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
          {noHiddenFeesLabel}
        </Text>
      </Box>
    ) : null}
  </>
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
    <Box gap={3}>
      <Box flexDirection={BoxFlexDirection.Row} gap={3}>
        <Box style={{ flex: 1 }}>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            fontWeight={FontWeight.Medium}
          >
            {createdLabel}
          </Text>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
            {formattedCreatedDate}
          </Text>
        </Box>
        <Box style={{ flex: 1 }}>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            fontWeight={FontWeight.Medium}
          >
            {tokenAgeLabel}
          </Text>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
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
            {networkLabel}
          </Text>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
            {networkName ?? naLabel}
          </Text>
        </Box>
        <Box style={{ flex: 1 }}>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            fontWeight={FontWeight.Medium}
          >
            {typeLabel}
          </Text>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
            {tokenType}
          </Text>
        </Box>
      </Box>
    </Box>
  </>
);

const OfficialLinksSection = ({
  title,
  metadata,
  blockExplorerLink,
  websiteLabel,
  telegramLabel,
}: {
  title: string;
  metadata: TokenSecurityMetadata;
  blockExplorerLink: { url: string; name: string } | null;
  websiteLabel: string;
  telegramLabel: string;
}) => (
  <>
    <Box className="asset-page__divider" marginTop={6} marginBottom={6} />
    <SectionHeader title={title} />
    <Box flexDirection={BoxFlexDirection.Row} className="flex-wrap" gap={2}>
      {metadata.externalLinks.homepage ? (
        <OfficialLinkButton
          iconName={IconName.WebTraffic}
          label={websiteLabel}
          onClick={() => openLink(metadata.externalLinks.homepage ?? '')}
          testId="security-trust-link-website"
        />
      ) : null}
      {metadata.externalLinks.twitterPage ? (
        <OfficialLinkButton
          iconName={IconName.X}
          label={`@${metadata.externalLinks.twitterPage}`}
          onClick={() =>
            openLink(`https://x.com/${metadata.externalLinks.twitterPage}`)
          }
          testId="security-trust-link-twitter"
        />
      ) : null}
      {metadata.externalLinks.telegramChannelId ? (
        <OfficialLinkButton
          iconName={IconName.Telegram}
          label={telegramLabel}
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
);

const SectionDivider = () => (
  <Box className="asset-page__divider" marginTop={6} marginBottom={6} />
);

const SecurityTrustPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const otherHoldersBarClassName =
    theme === ThemeType.dark
      ? OTHER_HOLDERS_BAR_BG_DARK
      : OTHER_HOLDERS_BAR_BG_LIGHT;

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
    formattedCreatedDate,
    tokenAgeDisplay,
    tokenType,
    networkName,
    blockExplorerLink,
  } = useSecurityTrustPageData();

  useEffect(() => {
    document.querySelector('.app')?.scroll(0, 0);
  }, []);

  const handleBack = () => transitionBack(() => navigate(-1));

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
    <ScrollContainer className="main-container asset__container">
      {pageContent}
    </ScrollContainer>
  );
};

export default SecurityTrustPage;
