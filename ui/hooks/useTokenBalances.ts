import { useSelector } from 'react-redux';
import {
  getAllTokens,
  getCurrentChainId,
  getInternalAccounts,
  getSelectedAddress,
  getSelectedNetworkClientId,
} from '../selectors';
import {
  tokenBalancesStartPollingByNetworkClientId,
  tokenBalancesStopPollingByPollingToken,
} from '../store/actions';
import { getTokenBalances, getTokens } from '../ducks/metamask/metamask';
import usePolling from './usePolling';
import { hexToDecimal } from '../../shared/modules/conversion.utils';

import util from '@metamask/eth-token-tracker';



const useAllTokenBalances = () => {

  const chainId = useSelector(getCurrentChainId);
  const accounts = useSelector(getInternalAccounts);
  const allTokens = useSelector(getAllTokens);

  // const options = accounts.reduce((acc, account) => {
  //   acc[account.address] = allTokens[chainId]?.[account.address];
  //   return acc;
  // }, {} as Record<string, {address:string}[]>);

  const options = allTokens[chainId] ?? {};

  return useTokenBalances(chainId, options);
}


const useTokenBalances = (chainId: string, options: Record<string, {address:string, decimals:number}[]>) => {
  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);
  const tokenBalances = useSelector(getTokenBalances);

  const z = Object.entries(options).reduce((acc, [accountAddress, tokens]) => {
    acc[accountAddress] = tokens.map((token) => token.address);
    return acc;
  }, {} as Record<string, string[]> );


  usePolling({
    startPollingByNetworkClientId: tokenBalancesStartPollingByNetworkClientId,
    stopPollingByPollingToken: tokenBalancesStopPollingByPollingToken,
    networkClientId: selectedNetworkClientId,
    enabled: true,
    options: z,
  });

  const tokensWithBalances = Object.entries(options).reduce((acc, [accountAddress, tokens]) => {

    acc[accountAddress] = tokens.map((token) => {
      const balance = hexToDecimal(tokenBalances?.[accountAddress]?.[chainId]?.[token.address]);
      return {
        ...token,
        balance,
        string: stringifyBalance(new BN(balance), token.decimals)
      }
    })
    return acc;
  }, {} as Record<string, {}[]> );

  return { tokensWithBalances };
}



// const useTokenBalances = () => {
//   const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);

//   const chainId = useSelector(getCurrentChainId);
//   const tokenBalances = useSelector(getTokenBalances);
//   const accounts = useSelector(getInternalAccounts);
//   const allTokens = useSelector(getAllTokens);

//   const options = accounts.reduce((acc, account) => {
//     const tokens = allTokens[chainId]?.[account.address]?.map(
//       (token: { address: string }) => token.address,
//     );
//     if (tokens) {
//       acc[account.address] = tokens;
//     }
//     return acc;
//   }, {});

//   // console.log('options', options);

//   usePolling({
//     startPollingByNetworkClientId: tokenBalancesStartPollingByNetworkClientId,
//     stopPollingByPollingToken: tokenBalancesStopPollingByPollingToken,
//     networkClientId: selectedNetworkClientId,
//     enabled: true,
//     options,
//   });



//   // join data from all tokens?

//   return { tokenBalances };
// };


import BN from 'bn.js';
const zero = new BN(0)


  function stringifyBalance (balance, bnDecimals, balanceDecimals = 3) {
    if (balance.eq(zero)) {
      return '0'
    }

    const decimals = parseInt(bnDecimals.toString())
    if (decimals === 0) {
      return balance.toString()
    }

    let bal = balance.toString()
    let len = bal.length
    let decimalIndex = len - decimals
    let prefix = ''

    if (decimalIndex <= 0) {
      while (prefix.length <= decimalIndex * -1) {
        prefix += '0'
        len++
      }
      bal = prefix + bal
      decimalIndex = 1
    }

    const whole = bal.substr(0, len - decimals)

    if (balanceDecimals === 0) {
      return whole;
    }

    const fractional = bal.substr(decimalIndex, balanceDecimals)
    if (/0+$/.test(fractional)) {
      let withOnlySigZeroes = bal.substr(decimalIndex).replace(/0+$/, '')
      if (withOnlySigZeroes.length > 0) withOnlySigZeroes = `.${withOnlySigZeroes}`
      return `${whole}${withOnlySigZeroes}`
    }
    return `${whole}.${fractional}`
  }
export default useAllTokenBalances;
