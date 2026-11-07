import type { CaipAssetType } from '@metamask/utils';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { IconName } from '@metamask/design-system-react';
import { OverflowMenu } from '#ui/components/ui/overflow-menu/overflow-menu';
import { getSelectedInternalAccount } from '#shared/lib/selectors/accounts';
import { TOKEN_MANAGEMENT_ROUTE } from '#ui/helpers/constants/routes';
import { selectEnabledNetworksAsCaipChainIds } from '#ui/selectors/multichain/networks';
import { refreshAssetsForSelectedAccount } from '#ui/store/actions';
import { useDispatch } from '#ui/store/hooks';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  ScreenViewedEntryPoint,
} from '../../../../../shared/constants/metametrics';
import { trace, TraceName } from '../../../../../shared/lib/trace';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { useScreenViewedEvent } from '../../../../hooks/useScreenViewedEvent';
import { getMultichainIsEvm } from '../../../../selectors/multichain';
import { type SafeChain } from '../../../multichain/networks-form/use-safe-chains';
import { usePrimaryCurrencyProperties } from '../hooks';
import TokenList from '../token-list';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import AssetListControlBar from './asset-list-control-bar';

export type AssetListProps = {
  onClickAsset: (
    chainId: string,
    address: string,
    assetId?: CaipAssetType,
  ) => void;
  showTokensLinks?: boolean;
  safeChains?: SafeChain[];
  entryPoint?: ScreenViewedEntryPoint;
};

const TokenListContainer = React.memo(
  ({
    onClickAsset,
    safeChains,
  }: Pick<AssetListProps, 'onClickAsset' | 'safeChains'>) => {
    const { trackEvent, createEventBuilder } = useAnalytics();
    const { primaryCurrencyProperties } = usePrimaryCurrencyProperties();

    const onTokenClick = useCallback(
      (chainId: string, tokenAddress: string, assetId?: CaipAssetType) => {
        trace({ name: TraceName.AssetDetails });
        onClickAsset(chainId, tokenAddress, assetId);
        trackEvent(
          createEventBuilder(MetaMetricsEventName.TokenScreenViewed)
            .addCategory(MetaMetricsEventCategory.Navigation)
            .addProperties({
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_symbol: primaryCurrencyProperties.suffix,
              location: 'Home',
            })
            .build(),
        );
      },
      [
        createEventBuilder,
        onClickAsset,
        primaryCurrencyProperties.suffix,
        trackEvent,
      ],
    );

    return <TokenList onTokenClick={onTokenClick} safeChains={safeChains} />;
  },
);

const AssetList = ({
  onClickAsset,
  showTokensLinks,
  safeChains,
  entryPoint,
}: AssetListProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const isEvm = useSelector(getMultichainIsEvm);
  const selectedInternalAccount = useSelector(getSelectedInternalAccount);
  const selectedCaipChainIds = useSelector(selectEnabledNetworksAsCaipChainIds);

  // NOTE: Since we can parametrize it now, we keep the original behavior
  // for EVM assets
  const shouldShowTokensLinks = showTokensLinks ?? isEvm;

  useScreenViewedEvent(MetaMetricsEventName.TokenScreenViewed, entryPoint);

  const handleOpenTokenManagement = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.TokenImportButtonClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location: 'HOME',
        })
        .build(),
    );
    navigate(TOKEN_MANAGEMENT_ROUTE, {
      state: {
        globalMenuTransition: 'forward',
      },
    });
  }, [createEventBuilder, navigate, trackEvent]);

  const handleRefresh = useCallback(() => {
    if (selectedInternalAccount) {
      dispatch(
        refreshAssetsForSelectedAccount([selectedInternalAccount], {
          chainIds: selectedCaipChainIds,
          assetTypes: ['token', 'price', 'metadata'],
        }),
      );
    }
  }, [dispatch, selectedInternalAccount, selectedCaipChainIds]);

  const menuItems = useMemo(
    () => [
      {
        key: 'manage-tokens',
        label: t('manageTokens'),
        iconName: IconName.Setting,
        'data-testid': 'manageTokens__button',
        onClick: handleOpenTokenManagement,
      },
      {
        key: 'refresh-list',
        label: t('refreshList'),
        iconName: IconName.Refresh,
        onClick: handleRefresh,
      },
    ],
    [t, handleOpenTokenManagement, handleRefresh],
  );

  return (
    <>
      <AssetListControlBar
        actionMenu={
          shouldShowTokensLinks ? (
            <OverflowMenu
              ariaLabel={t('assetOptions')}
              items={menuItems}
              testId="asset-list-control-bar-action-button"
            />
          ) : null
        }
        data-testid="parent-selector-tokens-tab"
      />
      <TokenListContainer onClickAsset={onClickAsset} safeChains={safeChains} />
    </>
  );
};

export default AssetList;
