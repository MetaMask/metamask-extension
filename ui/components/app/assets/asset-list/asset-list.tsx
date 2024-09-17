import React, { useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import TokenList from '../token-list';
import { PRIMARY } from '../../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../../hooks/useUserPreferencedCurrency';
import {
  getDetectedTokensInCurrentNetwork,
  getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  getSelectedAccount,
} from '../../../../selectors';
import {
  getMultichainIsEvm,
  getMultichainCurrencyImage,
  getMultichainSelectedAccountCachedBalance,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getMultichainIsBitcoin,
  ///: END:ONLY_INCLUDE_IF
  getMultichainSelectedAccountCachedBalanceIsZero,
} from '../../../../selectors/multichain';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import DetectedToken from '../../detected-token/detected-token';
import {
  DetectedTokensBanner,
  ImportTokenLink,
  ReceiveModal,
} from '../../../multichain';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { FundingMethodModal } from '../../../multichain/funding-method-modal/funding-method-modal';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import {
  RAMPS_CARD_VARIANT_TYPES,
  RampsCard,
} from '../../../multichain/ramps-card/ramps-card';
import { getIsNativeTokenBuyable } from '../../../../ducks/ramps';
import AssetListControlBar from './asset-list-control-bar';
import { useNativeTokenBalance } from './native-token/use-native-token-balance';
import NativeToken from './native-token';
import { useTokenList } from '../token-list/use-token-list';
///: END:ONLY_INCLUDE_IF

export type TokenWithBalance = {
  address: string;
  symbol: string;
  string?: string;
  image: string;
  tokenFiatAmount?: string;
  isNative?: boolean;
};

export type AssetListProps = {
  onClickAsset: (arg: string) => void;
  showTokensLinks?: boolean;
};

const AssetList = ({ onClickAsset, showTokensLinks }: AssetListProps) => {
  const [tokenList, setTokenList] = useState<TokenWithBalance[]>([]);
  // const { tokenList } = useTokenList();
  const [loading, setLoading] = useState(false);
  const [sorted, setSorted] = useState(false); // TODO: Set to preferences
  const [showDetectedTokens, setShowDetectedTokens] = useState(false);
  const selectedAccount = useSelector(getSelectedAccount);
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);
  const { primaryBalance, secondaryBalance, tokenSymbol } =
    useNativeTokenBalance();

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, { ethNumberOfDecimals: 4 });

  const [, primaryCurrencyProperties] = useCurrencyDisplay(balance, {
    numberOfDecimals: primaryNumberOfDecimals,
    currency: primaryCurrency,
  });

  const primaryTokenImage = useSelector(getMultichainCurrencyImage);
  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork) || [];
  const isTokenDetectionInactiveOnNonMainnetSupportedNetwork = useSelector(
    getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  );

  const [showFundingMethodModal, setShowFundingMethodModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const onClickReceive = () => {
    setShowFundingMethodModal(false);
    setShowReceiveModal(true);
  };

  const balanceIsZero = useSelector(
    getMultichainSelectedAccountCachedBalanceIsZero,
  );

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const shouldShowBuy = isBuyableChain && balanceIsZero;
  ///: END:ONLY_INCLUDE_IF

  const isEvm = useSelector(getMultichainIsEvm);
  // NOTE: Since we can parametrize it now, we keep the original behavior
  // for EVM assets
  const shouldShowTokensLinks = showTokensLinks ?? isEvm;

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const isBtc = useSelector(getMultichainIsBitcoin);
  ///: END:ONLY_INCLUDE_IF

  // we need to calculate these values here in order to sort native token correctly
  // native token is computed differently than normal tokens, and is rendered as a ReactNode native-token.tsx
  // the data here is passed into sort control along with the other non-native tokens, in order to determine the order of the native token in the larger list list
  const nativeTokenWithBalance: TokenWithBalance = {
    address: '',
    symbol: tokenSymbol || '',
    string: primaryBalance,
    image: primaryTokenImage,
    tokenFiatAmount: secondaryBalance,
    isNative: true,
  };

  return (
    <>
      {detectedTokens.length > 0 &&
        !isTokenDetectionInactiveOnNonMainnetSupportedNetwork && (
          <DetectedTokensBanner
            className=""
            actionButtonOnClick={() => setShowDetectedTokens(true)}
            margin={4}
          />
        )}
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
      <AssetListControlBar
        tokenList={tokenList}
        setTokenList={setTokenList}
        setLoading={setLoading}
        sorted={sorted}
        setSorted={setSorted}
      />
      {/* {!sorted && <NativeToken onClickAsset={onClickAsset} />} */}
      <TokenList
        nativeToken={<NativeToken onClickAsset={onClickAsset} />}
        tokens={tokenList}
        loading={loading}
        onTokenClick={(tokenAddress: string) => {
          onClickAsset(tokenAddress);
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
      {shouldShowTokensLinks && (
        <ImportTokenLink
          margin={4}
          marginBottom={2}
          marginTop={detectedTokens.length > 0 && !balanceIsZero ? 0 : 2}
        />
      )}
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
          title={t('selectFundingMethod')}
          onClickReceive={onClickReceive}
        />
      )}
    </>
  );
};

export default AssetList;
