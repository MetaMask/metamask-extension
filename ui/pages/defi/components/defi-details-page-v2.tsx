import React, { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import type { CaipChainId } from '@metamask/utils';
import { decodeDefiRouteParam } from '../../../../shared/lib/defi-route';
import {
  IconColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  SensitiveText,
  SensitiveTextLength,
  Text,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { getSelectedCurrency } from '../../../selectors/assets';
import { useFormatters } from '../../../hooks/useFormatters';
import { AssetCellBadge } from '../../../components/app/assets/asset-list/cells/asset-cell-badge';
import PulseLoader from '../../../components/ui/pulse-loader';
import DefiDetailsListV2 from '../../../components/app/assets/defi-list/defi-details-list-v2';
import { useMultiAccountDefiBalances } from '../../../components/app/assets/defi-list/hooks/useMultiAccountDefiBalances';
import { isDefiBalancesProcessing } from '../../../components/app/assets/defi-list/utils/group-defi-protocol-positions';
import { groupDefiProtocolDetails } from '../../../components/app/assets/defi-list/utils/group-defi-protocol-details';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function DeFiDetailsPageV2() {
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const { chainId, protocolId } = useParams();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { privacyMode } = useSelector(getPreferences);
  const selectedCurrency = useSelector(getSelectedCurrency);
  const { data, isLoading, isError, isPending, isFetching } =
    useMultiAccountDefiBalances();

  const protocolDetails = useMemo(() => {
    if (!chainId || !protocolId) {
      return undefined;
    }

    return groupDefiProtocolDetails(
      data,
      decodeDefiRouteParam(chainId) as CaipChainId,
      decodeDefiRouteParam(protocolId),
    );
  }, [chainId, data, protocolId]);

  const isResolvingDetails =
    isLoading ||
    isPending ||
    isFetching ||
    isDefiBalancesProcessing(data) ||
    (!protocolDetails && !isError && data === undefined);

  if (isResolvingDetails) {
    return (
      <Box className="main-container asset__container flex justify-center pt-4">
        <PulseLoader />
      </Box>
    );
  }

  if (isError || !protocolDetails) {
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
          color={IconColor.iconDefault}
          marginRight={1}
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
          variant={TextVariant.headingLg}
          paddingLeft={4}
          paddingBottom={2}
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
          className="mm-box--color-text-alternative"
          ellipsis
          variant={TextVariant.inherit}
          isHidden={privacyMode}
          length={SensitiveTextLength.Medium}
        >
          {formatCurrencyWithMinThreshold(
            protocolDetails.aggregatedMarketValue,
            selectedCurrency,
          )}
        </SensitiveText>
      </Box>
      <Box paddingLeft={4} paddingBottom={4} paddingRight={4}>
        <hr style={{ border: '1px solid var(--border-muted, #858B9A33)' }} />
      </Box>
      <Box className="flex" flexDirection={BoxFlexDirection.Column}>
        <DefiDetailsListV2 sections={protocolDetails.sections} />
      </Box>
    </Box>
  );
}
