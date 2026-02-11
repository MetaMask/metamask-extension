/**
 * Detects and transforms Tempo 0x76 transactions sent via eth_sendTransaction:
 * - Removes `params[0].type` ('0x76') and sets the method to 'wallet_sendCalls'
 * - Converts `params[0].calls` to a EIP-5792 compatible `calls`
 * - Removes 'params[0]?.feeToken' to set `params[0].capabilities.feeToken.address`
 * See: https://eips.ethereum.org/EIPS/eip-5792
 */

import { JsonRpcEngineNextCallback } from '@metamask/json-rpc-engine';
import {
  Json,
  JsonRpcError,
  JsonRpcRequest,
  JsonRpcResponse,
} from '@metamask/utils';
import { cloneDeep } from 'lodash';

type Hex = `0x${string}`;

type TempoCall = {
  to: Hex;
  // In our tests we see '0x' (probably to signal no native token),
  // However '0x' is invalid as a value and we use '0x0' when transforming.
  value: Hex | '0x';
  data: Hex;
};

type TempoTransactionRequest = {
  from: Hex;
  chainId: Hex;
  type: '0x76';
  calls: TempoCall[];
  feeToken?: Hex;
};

type TempoSendTransactionRequest = {
  id: number;
  jsonrpc: '2.0';
  method: 'wallet_sendTransaction';
  params: [TempoTransactionRequest];
};

// TODO: Check for existing types instead of creating new ones
type WalletSendCallsRequest = {
  id: number | string;
  jsonrpc: '2.0';
  method: 'wallet_sendCalls';
  params: [
    {
      version: '2.0.0';
      from: Hex;
      chainId: Hex;
      atomicRequired?: boolean;
      calls: {
        to?: Hex;
        value?: Hex;
        data?: Hex;
      }[];
      capabilities?: {
        feeToken?: { address: Hex; optional: true };
      };
    },
  ];
};

const TEMPO_TRANSACTION_TYPE: Hex = '0x76';

// This could be in a flag/env var or other mechanism that allows per-chain enable/disable.
// Could also have one default fee token per chain. Keeping it simple for the PoC.
const ENABLED_TEMPO_CHAIN_IDS_HEX = [
  '0xa5bd', // Tempo older Testnet
  '0xa5bf', // Tempo Moderato Testnet
];
const DEFAULT_FEE_TOKEN_ADDRESS: Hex =
  '0x20c0000000000000000000000000000000000000';

function isTempoTransaction(
  req: JsonRpcRequest,
): req is TempoSendTransactionRequest {
  const firstParam = Array.isArray(req.params) ? req.params[0] : null;
  return (
    firstParam !== null &&
    typeof firstParam === 'object' &&
    !Array.isArray(firstParam) &&
    'type' in firstParam &&
    firstParam.type === TEMPO_TRANSACTION_TYPE
  );
}

function transformToEIP7702Transaction(
  req: TempoSendTransactionRequest | WalletSendCallsRequest,
): asserts req is WalletSendCallsRequest {
  const tempoRequest = req as TempoSendTransactionRequest;
  req.method = 'wallet_sendCalls';
  const { from, chainId, feeToken } = tempoRequest.params[0];
  req.params = [
    {
      version: '2.0.0',
      atomicRequired: false,
      from,
      chainId,
      calls: tempoRequest.params[0].calls.map(({ data, to }) => ({
        data,
        to,
        value: '0x0',
      })),
      capabilities: {
        // 'feeToken' is not part of any standard, but the "capabilities"
        // is part of EIP-5792. The idea is to carry this parameter down
        // until it reaches the part of the code where we turn it into "gasFeeToken".
        feeToken: {
          address: feeToken || DEFAULT_FEE_TOKEN_ADDRESS,
          optional: true,
        },
      },
    },
  ];
}

function isSupportEnabledForChainId(chainId: Hex): boolean {
  return chainId && ENABLED_TEMPO_CHAIN_IDS_HEX.includes(chainId);
}

export default function createTempoTransactionTransformMiddleware() {
  return function originThrottlingMiddleware(
    req: JsonRpcRequest,
    _res: JsonRpcResponse<Json | JsonRpcError>,
    next: JsonRpcEngineNextCallback,
  ) {
    const { method } = req;
    if (method === 'eth_sendTransaction' && isTempoTransaction(req)) {
      console.warn('TEMPO TRANSACTION DETECTED', cloneDeep(req));
      const { chainId } = req.params[0];
      if (!isSupportEnabledForChainId(chainId)) {
        next((callback: () => void) => {
          // TODO: Proper error propagation
          console.error(
            `Tempo Transactions are not supported for chain ${chainId}`,
          );
          callback();
        });
        return;
      }
      transformToEIP7702Transaction(req);
      console.warn('TRANSFORMED TEMPO REQUEST:', req);
    }
    next();
  };
}

// Tempo request example for reference (what dApps built on Viem will send to MetaMask)
// {
//    "enabled":true,
//    "req":{
//       "method":"wallet_sendTransaction",
//       "params":[
//          {
//             "from":"0x1e3abc74428056924cEeE2F45f060879c3F063ed",
//             "chainId":"0xa5bf",
//             "type":"0x76",
//             "calls":[
//                {
//                   "to":"0x20C0000000000000000000000008f1fB6c965249",
//                   "value":"0x",
//                   "data":"0x2f2ff15d114e74f6ea3bd819998f78687bfcb11b140da08e9b7d222fa9c1f1ba1f2aa1220000000000000000000000001e3abc74428056924ceee2f45f060879c3f063ed"
//                },
//                {
//                   "to":"0x20C0000000000000000000000008f1fB6c965249",
//                   "value":"0x",
//                   "data":"0x2f2ff15d139c2898040ef16910dc9f44dc697df79363da767d8bc92f2e310312b816e46d0000000000000000000000001e3abc74428056924ceee2f45f060879c3f063ed"
//                },
//                {
//                   "to":"0x20C0000000000000000000000008f1fB6c965249",
//                   "value":"0x",
//                   "data":"0x2f2ff15d265b220c5a8891efdd9e1b1b7fa72f257bd5169f8d87e319cf3dad6ff52b94ae0000000000000000000000001e3abc74428056924ceee2f45f060879c3f063ed"
//                },
//                {
//                   "to":"0x20C0000000000000000000000008f1fB6c965249",
//                   "value":"0x",
//                   "data":"0x2f2ff15d7408fdc0d31c7bcb349eab611f5d1168acd4303574993f8cdc98b1cd18c41cae0000000000000000000000001e3abc74428056924ceee2f45f060879c3f063ed"
//                }
//             ],
//             "feeToken":"0x20c0000000000000000000000000000000000001"
//          }
//       ]
//    }
// };
