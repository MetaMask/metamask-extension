import React, { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  IconColor,
  IconName,
  SensitiveText,
  SensitiveTextLength,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { getSelectedCurrency } from '../../../selectors/assets';
import { useFormatters } from '../../../hooks/useFormatters';
import { AssetCellBadge } from '../../../components/app/assets/asset-list/cells/asset-cell-badge';
import PulseLoader from '../../../components/ui/pulse-loader';
import { useDeFiPositionsV2 } from '../hooks/useDeFiPositionsV2';
import DefiDetailsListV2 from '../components/defi-details-list-v2';

export default function DeFiDetailsPageV2() {
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const { chainId, protocolId } = useParams();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { privacyMode } = useSelector(getPreferences);
  const selectedCurrency = useSelector(getSelectedCurrency);
  const { positions, isLoading } = useDeFiPositionsV2();

  const protocolDetails = useMemo(() => {
    if (!chainId || !protocolId) {
      return undefined;
    }

    return positions.find(
      (position) =>
        position.chainId === chainId && position.protocolId === protocolId,
    );
  }, [chainId, positions, protocolId]);

  if (isLoading) {
    return (
      <Box className="main-container asset__container flex justify-center pt-4">
        <PulseLoader />
      </Box>
    );
  }

  // Only redirect when there is genuinely nothing to render. A transient
  // background-refresh failure (`isError`) must not bounce the user home while
  // cached protocol data is still available.
  if (!protocolDetails) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <Box className="main-container asset__container">
      <Box
        className="flex pt-4 sticky top-0 z-10 bg-background-default"
        paddingLeft={2}
        paddingBottom={4}
      >
        <ButtonIcon
          data-testid="defi-details-page-back-button"
          iconProps={{ color: IconColor.IconDefault }}
          className="mr-1"
          size={ButtonIconSize.Md}
          ariaLabel={t('back')}
          iconName={IconName.ArrowLeft}
          onClick={() => navigate(DEFAULT_ROUTE)}
        />
      </Box>

      <Box
        className="flex"
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        paddingRight={4}
      >
        <Text
          variant={TextVariant.HeadingLg}
          className="pl-4 pb-2"
          data-testid="defi-details-page-title"
        >
          {protocolDetails.protocolId}
        </Text>
        <AssetCellBadge
          chainId={protocolDetails.chainId}
          tokenImage={protocolDetails.protocolIconUrl}
          symbol={protocolDetails.protocolId}
          data-testid="defi-details-page-protocol-badge"
        />
      </Box>
      <Box paddingLeft={4} paddingBottom={4}>
        <SensitiveText
          data-testid="defi-details-page-market-value"
          color={TextColor.TextAlternative}
          ellipsis
          isHidden={privacyMode}
          length={SensitiveTextLength.Medium}
        >
          {formatCurrencyWithMinThreshold(
            protocolDetails.marketValue,
            selectedCurrency,
          )}
        </SensitiveText>
      </Box>
      <Box paddingLeft={4} paddingBottom={4} paddingRight={4}>
        <Box
          borderColor={BoxBorderColor.BorderMuted}
          className="w-full h-px border border-b-0"
          data-testid="defi-details-page-v2-separator"
        />
      </Box>
      <Box className="flex" flexDirection={BoxFlexDirection.Column}>
        <DefiDetailsListV2 sections={protocolDetails.sections} />
      </Box>
    </Box>
  );
}
