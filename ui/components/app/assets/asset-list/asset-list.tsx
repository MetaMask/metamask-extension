import React, { useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import TokenList from '../token-list';
import { PRIMARY } from '../../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../../hooks/useUserPreferencedCurrency';
import {
  getAllDetectedTokensForSelectedAddress,
  getDetectedTokensInCurrentNetwork,
  getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getSelectedAccount,
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
} from '../../../../../shared/constants/metametrics';
import DetectedToken from '../../detected-token/detected-token';
import { DetectedTokensBanner, ReceiveModal } from '../../../multichain';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { FundingMethodModal } from '../../../multichain/funding-method-modal/funding-method-modal';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import {
  RAMPS_CARD_VARIANT_TYPES,
  RampsCard,
} from '../../../multichain/ramps-card/ramps-card';
import { getIsNativeTokenBuyable } from '../../../../ducks/ramps';
///: END:ONLY_INCLUDE_IF
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
  const isTokenDetectionInactiveOnNonMainnetSupportedNetwork = useSelector(
    getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  );

  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );

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

  const detectedTokensMultichain = useSelector(
    getAllDetectedTokensForSelectedAddress,
  );

  const totalTokens =
    process.env.PORTFOLIO_VIEW &&
    !isTokenNetworkFilterEqualCurrentNetwork &&
    detectedTokensMultichain
      ? (Object.values(detectedTokensMultichain).reduce(
          // @ts-expect-error TS18046: 'tokenArray' is of type 'unknown'
          (count, tokenArray) => count + tokenArray.length,
          0,
        ) as number)
      : detectedTokens.length;
  return (
    <>
      {totalTokens &&
      totalTokens > 0 &&
      !isTokenDetectionInactiveOnNonMainnetSupportedNetwork ? (
        <DetectedTokensBanner
          className=""
          actionButtonOnClick={() => setShowDetectedTokens(true)}
          margin={4}
        />
      ) : null}
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
