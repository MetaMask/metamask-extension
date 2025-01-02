import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Token } from '@metamask/assets-controllers';
import { NetworkConfiguration } from '@metamask/network-controller';
import TokenList from '../token-list';
import { PRIMARY } from '../../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../../hooks/useUserPreferencedCurrency';
import {
  getAllDetectedTokensForSelectedAddress,
  getDetectedTokensInCurrentNetwork,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getSelectedAccount,
  getSelectedAddress,
  getUseTokenDetection,
} from '../../../../selectors';
import {
  getMultichainIsEvm,
  getMultichainSelectedAccountCachedBalance,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getMultichainIsBitcoin,
  getMultichainSelectedAccountCachedBalanceIsZero,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../selectors/multichain';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../../shared/constants/metametrics';
import DetectedToken from '../../detected-token/detected-token';
import { ReceiveModal } from '../../../multichain';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { FundingMethodModal } from '../../../multichain/funding-method-modal/funding-method-modal';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import {
  RAMPS_CARD_VARIANT_TYPES,
  RampsCard,
} from '../../../multichain/ramps-card/ramps-card';
import { getIsNativeTokenBuyable } from '../../../../ducks/ramps';
///: END:ONLY_INCLUDE_IF
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
  getSelectedNetworkClientId,
} from '../../../../../shared/modules/selectors/networks';
import { addImportedTokens } from '../../../../store/actions';
import {
  AssetType,
  TokenStandard,
} from '../../../../../shared/constants/transaction';
import AssetListControlBar from './asset-list-control-bar';
import NativeToken from './native-token';

export type TokenWithBalance = {
  address: string;
  symbol: string;
  string?: string;
  image: string;
  secondary?: string;
  tokenFiatAmount?: string;
  isNative?: boolean;
};

export type AssetListProps = {
  onClickAsset: (chainId: string, address: string) => void;
  showTokensLinks?: boolean;
};

const AssetList = ({ onClickAsset, showTokensLinks }: AssetListProps) => {
  const dispatch = useDispatch();
  const [showDetectedTokens, setShowDetectedTokens] = useState(false);
  const selectedAccount = useSelector(getSelectedAccount);
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, {
    ethNumberOfDecimals: 4,
    shouldCheckShowNativeToken: true,
  });

  const [, primaryCurrencyProperties] = useCurrencyDisplay(balance, {
    numberOfDecimals: primaryNumberOfDecimals,
    currency: primaryCurrency,
  });

  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork) || [];

  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );

  const allNetworks: Record<`0x${string}`, NetworkConfiguration> = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const networkClientId = useSelector(getSelectedNetworkClientId);
  const selectedAddress = useSelector(getSelectedAddress);
  const useTokenDetection = useSelector(getUseTokenDetection);
  const currentChainId = useSelector(getCurrentChainId);

  const [showFundingMethodModal, setShowFundingMethodModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const onClickReceive = () => {
    setShowFundingMethodModal(false);
    setShowReceiveModal(true);
  };

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const balanceIsZero = useSelector(
    getMultichainSelectedAccountCachedBalanceIsZero,
  );
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const shouldShowBuy = isBuyableChain && balanceIsZero;
  const isBtc = useSelector(getMultichainIsBitcoin);
  ///: END:ONLY_INCLUDE_IF

  const isEvm = useSelector(getMultichainIsEvm);
  // NOTE: Since we can parametrize it now, we keep the original behavior
  // for EVM assets
  const shouldShowTokensLinks = showTokensLinks ?? isEvm;

  const detectedTokensMultichain: {
    [key: `0x${string}`]: Token[];
  } = useSelector(getAllDetectedTokensForSelectedAddress);

  const multichainDetectedTokensLength = Object.keys(
    detectedTokensMultichain || {},
  ).reduce(
    (sum, key) => sum + detectedTokensMultichain[key as `0x${string}`].length,
    0,
  );

  // Add detected tokens to sate
  useEffect(() => {
    const importAllDetectedTokens = async () => {
      // If autodetect tokens toggle is OFF, return
      if (!useTokenDetection) {
        return;
      }
      // TODO add event for MetaMetricsEventName.TokenAdded

      if (
        process.env.PORTFOLIO_VIEW &&
        !isTokenNetworkFilterEqualCurrentNetwork
      ) {
        const importPromises = Object.entries(detectedTokensMultichain).map(
          async ([networkId, tokens]) => {
            const chainConfig = allNetworks[networkId as `0x${string}`];
            const { defaultRpcEndpointIndex } = chainConfig;
            const { networkClientId: networkInstanceId } =
              chainConfig.rpcEndpoints[defaultRpcEndpointIndex];

            await dispatch(
              addImportedTokens(tokens as Token[], networkInstanceId),
            );
            tokens.forEach((importedToken) => {
              trackEvent({
                event: MetaMetricsEventName.TokenAdded,
                category: MetaMetricsEventCategory.Wallet,
                sensitiveProperties: {
                  token_symbol: importedToken.symbol,
                  token_contract_address: importedToken.address,
                  token_decimal_precision: importedToken.decimals,
                  source: MetaMetricsTokenEventSource.Detected,
                  token_standard: TokenStandard.ERC20,
                  asset_type: AssetType.token,
                  token_added_type: 'detected',
                  chain_id: chainConfig.chainId,
                },
              });
            });
          },
        );

        await Promise.all(importPromises);
      } else if (detectedTokens.length > 0) {
        await dispatch(addImportedTokens(detectedTokens, networkClientId));
        detectedTokens.forEach((importedToken: Token) => {
          trackEvent({
            event: MetaMetricsEventName.TokenAdded,
            category: MetaMetricsEventCategory.Wallet,
            sensitiveProperties: {
              token_symbol: importedToken.symbol,
              token_contract_address: importedToken.address,
              token_decimal_precision: importedToken.decimals,
              source: MetaMetricsTokenEventSource.Detected,
              token_standard: TokenStandard.ERC20,
              asset_type: AssetType.token,
              token_added_type: 'detected',
              chain_id: currentChainId,
            },
          });
        });
      }
    };
    importAllDetectedTokens();
  }, [
    isTokenNetworkFilterEqualCurrentNetwork,
    selectedAddress,
    networkClientId,
    detectedTokens.length,
    multichainDetectedTokensLength,
  ]);

  return (
    <>
      <AssetListControlBar showTokensLinks={shouldShowTokensLinks} />
      <TokenList
        // nativeToken is still needed to avoid breaking flask build's support for bitcoin
        // TODO: refactor this to no longer be needed for non-evm chains
        nativeToken={!isEvm && <NativeToken onClickAsset={onClickAsset} />}
        onTokenClick={(chainId: string, tokenAddress: string) => {
          onClickAsset(chainId, tokenAddress);
          trackEvent({
            event: MetaMetricsEventName.TokenScreenOpened,
            category: MetaMetricsEventCategory.Navigation,
            properties: {
              token_symbol: primaryCurrencyProperties.suffix,
              location: 'Home',
            },
          });
        }}
      />
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        shouldShowBuy ? (
          <RampsCard
            variant={
              isBtc
                ? RAMPS_CARD_VARIANT_TYPES.BTC
                : RAMPS_CARD_VARIANT_TYPES.TOKEN
            }
            handleOnClick={
              isBtc ? undefined : () => setShowFundingMethodModal(true)
            }
          />
        ) : null
        ///: END:ONLY_INCLUDE_IF
      }
      {showDetectedTokens && (
        <DetectedToken setShowDetectedTokens={setShowDetectedTokens} />
      )}
      {showReceiveModal && selectedAccount?.address && (
        <ReceiveModal
          address={selectedAccount.address}
          onClose={() => setShowReceiveModal(false)}
        />
      )}
      {showFundingMethodModal && (
        <FundingMethodModal
          isOpen={showFundingMethodModal}
          onClose={() => setShowFundingMethodModal(false)}
          title={t('fundingMethod')}
          onClickReceive={onClickReceive}
        />
      )}
    </>
  );
};

export default AssetList;
