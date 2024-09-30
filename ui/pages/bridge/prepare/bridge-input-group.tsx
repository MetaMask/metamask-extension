import React, { useEffect, useMemo } from 'react';
import { Hex } from '@metamask/utils';
import { useDispatch, useSelector } from 'react-redux';
import { SwapsTokenObject } from '../../../../shared/constants/swaps';
import {
  Box,
  Text,
  TextField,
  TextFieldType,
} from '../../../components/component-library';
import { AssetPicker } from '../../../components/multichain/asset-picker-amount/asset-picker';
import { TabName } from '../../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
import CurrencyDisplay from '../../../components/ui/currency-display';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { useEthFiatAmount } from '../../../hooks/useEthFiatAmount';
import { isSwapsDefaultTokenSymbol } from '../../../../shared/modules/swaps.utils';
import Tooltip from '../../../components/ui/tooltip';
import { getSelectedInternalAccount, SwapsEthToken } from '../../../selectors';
import {
  ERC20Asset,
  NativeAsset,
} from '../../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { zeroAddress } from '../../../__mocks__/ethereumjs-util';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
} from '../../../../shared/constants/network';
import { getNetworkClientRegistry } from '../../../ducks/bridge/actions';

const generateAssetFromToken = (
  chainId: Hex,
  tokenDetails: SwapsTokenObject | SwapsEthToken,
): ERC20Asset | NativeAsset => {
  if ('iconUrl' in tokenDetails && tokenDetails.address !== zeroAddress()) {
    return {
      type: AssetType.token,
      image: tokenDetails.iconUrl,
      symbol: tokenDetails.symbol,
      address: tokenDetails.address,
    };
  }

  return {
    type: AssetType.native,
    image:
      CHAIN_ID_TOKEN_IMAGE_MAP[
        chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
      ],
    symbol:
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ],
  };
};

export const BridgeInputGroup = ({
  className,
  header,
  token,
  onAssetChange,
  onAmountChange,
  networkProps,
  customTokenListGenerator,
  amountFieldProps = {},
}: {
  className: string;
  onAmountChange?: (value: string) => void;
  token: SwapsTokenObject | SwapsEthToken | null;
  amountFieldProps?: Pick<
    React.ComponentProps<typeof TextField>,
    'testId' | 'autoFocus' | 'value' | 'readOnly' | 'disabled'
  >;
} & Pick<
  React.ComponentProps<typeof AssetPicker>,
  'networkProps' | 'header' | 'customTokenListGenerator' | 'onAssetChange'
>) => {
  const t = useI18nContext();

  const selectedAccount = useSelector(getSelectedInternalAccount);

  const tokenFiatValue = useTokenFiatAmount(
    token?.address || undefined,
    amountFieldProps?.value?.toString() || '0x0',
    token?.symbol,
    {
      showFiat: true,
    },
    true,
  );
  const ethFiatValue = useEthFiatAmount(
    amountFieldProps?.value?.toString() || '0x0',
    { showFiat: true },
    true,
  );

  const dispatch = useDispatch();

  useEffect(() => {
    const provider = dispatch(getNetworkClientRegistry());
    (async () => console.log('====provider====', await provider))();
  }, []);

  const latestBalance = useMemo(async () => {
    if (
      token?.address &&
      networkProps?.network?.chainId &&
      selectedAccount?.address
    ) {
      // const provider = new Web3Provider(
      //   global.ethereumProvider,
      //   hexToNumber(networkProps.network.chainId),
      // );
      const { defaultRpcEndpointIndex, rpcEndpoints } = networkProps.network;
      // new controller method: refreshDestBalance that sets destERC20Balance or destNativeBalance
      //   destERC20Balance = AssetsContractController:getERC20BalanceOf(address, account, networkClientId)
      //   destNativeBalance = AccountTrackerController:refresh(networkClientId) // OR other method that just returns balance async
      // on dest token and chain change: refreshDestBalance(address, account, networkClientId)
      // selector getDestBalance = (toToken, destERC20Balance, destNativeBalance), ({address}, destERC20Balance, destNativeBalance) => address === zeroAddress() ? destNativeBalance : destERC20Balance
      // show dest balance in input field
      // TODO add abort controller to cancel background fetch as needed https://github.com/MetaMask/core/blob/main/packages/assets-controllers/src/TokensController.ts#L195
      // potential race condition if changes happen too quickly and response time inconsistent

      // to aviod race condition, fetch synchronously by
      // returning network client from background method and calculating things in the component
      // getNetworkClientRegistry method ?? autoManagedNetworkClientRegistry;

      // separate pr to check with brian
      // const provider = new JsonRpcProvider({
      //   url: rpcEndpoints[defaultRpcEndpointIndex].url,
      //   headers: {
      //     'Infura-Source': 'metamask/metamask',
      //   },
      // });
      const provider = await dispatch(getNetworkClientRegistry());
      console.log('====provider====', provider);
      return await '0';
      // if (token.address === zeroAddress()) {
      //   return await provider.getBalance(selectedAccount.address);
      // }
      // return await fetchTokenBalance(
      //   token.address,
      //   selectedAccount.address,
      //   provider,
      // );
    }
    return await '0';
  }, [networkProps?.network, token, selectedAccount]);

  // const marketData = useMemo(async () => {
  //   return token?.address && networkProps?.network?.chainId
  //     ? await fetchTokenPrice(
  //         token?.address,
  //         hexToNumber(networkProps.network.chainId),
  //       )
  //     : '0';
  // }, [networkProps?.network, token]);

  return (
    <Box className={className}>
      <Box className="prepare-bridge-page__input-row">
        <AssetPicker
          header={header}
          visibleTabs={[TabName.TOKENS]}
          asset={
            networkProps?.network?.chainId && token
              ? generateAssetFromToken(networkProps.network.chainId, token)
              : undefined
          }
          onAssetChange={onAssetChange}
          networkProps={networkProps}
          customTokenListGenerator={customTokenListGenerator}
        />
        <Tooltip
          containerClassName="amount-tooltip"
          position="top"
          title={amountFieldProps.value}
          disabled={(amountFieldProps.value?.toString()?.length ?? 0) < 12}
          arrow
          hideOnClick={false}
          // explicitly inherit display since Tooltip will default to block
          style={{ display: 'inherit' }}
        >
          <TextField
            type={TextFieldType.Number}
            className="amount-input"
            placeholder="0"
            onChange={(e) => {
              // TODO validate input

              onAmountChange?.(e.target.value);
            }}
            {...amountFieldProps}
          />
        </Tooltip>
      </Box>
      <Box className="prepare-bridge-page__amounts-row">
        <Text>
          {t('balance')}: {JSON.stringify(latestBalance)}
        </Text>
        <CurrencyDisplay
          currency="usd"
          displayValue={
            token?.symbol &&
            networkProps?.network?.chainId &&
            isSwapsDefaultTokenSymbol(
              token.symbol,
              networkProps.network.chainId,
            )
              ? ethFiatValue
              : tokenFiatValue
          }
          hideLabel
        />
      </Box>
    </Box>
  );
};
