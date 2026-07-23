import React, { useEffect, useRef } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import type { TokenSecurityData } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import { buildAssetSecurityTrustRoutePath } from '../../../../../shared/lib/asset-route';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getFeatureTags,
  getResultTypeConfig,
  getSecurityAlertIconProps,
} from '../../utils/security-utils';
import type { SecurityTrustLocationState } from '../../types/security-trust';

export type SecurityTrustEntryCardToken = {
  symbol: string;
  name?: string;
  chainId: string;
  address?: string;
  decimals?: number;
  isNative?: boolean;
  image?: string;
  assetId: CaipAssetType;
};

type SecurityTrustEntryCardProps = {
  securityData: TokenSecurityData | null;
  isLoading: boolean;
  token: SecurityTrustEntryCardToken;
};

export const SecurityTrustEntryCard = ({
  securityData,
  isLoading,
  token,
}: SecurityTrustEntryCardProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const hasTrackedView = useRef(false);

  const config = getResultTypeConfig(
    securityData?.resultType,
    t as (key: string, substitutions?: string[]) => string,
  );
  const { tags: featureTags, remainingCount } = securityData
    ? getFeatureTags(
        securityData.features ?? [],
        securityData.resultType,
        t as (key: string, substitutions?: string[]) => string,
      )
    : { tags: [], remainingCount: 0 };

  const hasDetails = (securityData?.features?.length ?? 0) > 0;
  const alertIconProps = getSecurityAlertIconProps(config.alertSeverity);

  useEffect(() => {
    if (!isLoading && securityData && !hasTrackedView.current) {
      hasTrackedView.current = true;
    }
  }, [isLoading, securityData]);

  const handlePress = () => {
    if (!hasDetails) {
      return;
    }

    const state: SecurityTrustLocationState = {
      securityData,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      isNative: token.isNative,
      image: token.image,
      chainId: token.chainId,
      address: token.address,
    };

    navigate(buildAssetSecurityTrustRoutePath(token.assetId), { state });
  };

  if (isLoading) {
    return (
      <Box gap={3} data-testid="security-trust-entry-card">
        <Skeleton height={22} width="100%" />
        <Skeleton height={24} width="50%" />
        <Box flexDirection={BoxFlexDirection.Row} gap={2}>
          <Skeleton height={20} width="30%" />
          <Skeleton height={20} width="35%" />
        </Box>
      </Box>
    );
  }

  const content = (
    <Box gap={3}>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={1}
      >
        <Text variant={TextVariant.HeadingMd} color={TextColor.TextDefault}>
          {t('securityTrustTitle')}
        </Text>
        {hasDetails ? (
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Md}
            color={IconColor.IconAlternative}
          />
        ) : null}
      </Box>
      <Text
        variant={TextVariant.BodyMd}
        color={config.textColor}
        fontWeight={FontWeight.Medium}
      >
        {config.label}
      </Text>
      {hasDetails ? (
        featureTags.length > 0 && (
          <Box flexDirection={BoxFlexDirection.Row} className="flex-wrap" gap={2}>
            {featureTags.map((tag) => (
              <Box
                key={tag.label}
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                className="rounded bg-muted self-start min-w-[22px] px-1.5 py-0.5"
                gap={1}
              >
                {alertIconProps ? (
                  <Icon
                    name={alertIconProps.name}
                    size={IconSize.Sm}
                    color={alertIconProps.color}
                  />
                ) : null}
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                  fontWeight={FontWeight.Medium}
                >
                  {tag.label}
                </Text>
              </Box>
            ))}
            {remainingCount > 0 ? (
              <Box
                alignItems={BoxAlignItems.Center}
                className="rounded self-start px-1.5 py-0.5"
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                  fontWeight={FontWeight.Medium}
                >
                  +{remainingCount} {t('securityTrustMore')}
                </Text>
              </Box>
            ) : null}
          </Box>
        )
      ) : config.subtitle ? (
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {config.subtitle}
        </Text>
      ) : null}
    </Box>
  );

  if (!hasDetails) {
    return (
      <Box data-testid="security-trust-entry-card">{content}</Box>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePress}
      className="w-full text-left bg-transparent border-0 p-0 cursor-pointer"
      data-testid="security-trust-entry-card"
    >
      {content}
    </button>
  );
};
