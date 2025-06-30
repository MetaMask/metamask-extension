import crypto from 'crypto';
import { encode } from '@metamask/abi-utils';
import { parseUnits } from '@ethersproject/units';

import { Side } from '@polymarket/clob-client';

import {
  toFunctionSelector,
  toHex,
  concat,
  type Hex,
} from '../../../shared/lib/delegation/utils';
import { OrderData, RoundConfig, SignatureType, UserOrder } from './types';

export enum UtilsSide {
  BUY,

  SELL,
}

export const MSG_TO_SIGN =
  'This message attests that I control the given wallet';

export const GAMMA_API_ENDPOINT = 'https://gamma-api.polymarket.com';
export const CLOB_ENDPOINT = 'https://clob.polymarket.com';
export const DATA_API_ENDPOINT = 'https://data-api.polymarket.com';
export const STAGING_API_ENDPOINT = 'https://api-v1.staging.myriad.markets';

const COLLATERAL_TOKEN_DECIMALS = 6;

export const encodeApprove = ({
  spender,
  amount,
}: {
  spender: string;
  amount: bigint | string;
}): Hex => {
  const encodedSignature = toFunctionSelector('approve(address,uint256)');
  const encodedData = toHex(encode(['address', 'uint256'], [spender, amount]));
  return concat([encodedSignature, encodedData]);
};

export const encodeErc1155Approve = ({
  spender,
  approved,
}: {
  spender: string;
  approved: boolean;
}): Hex => {
  const encodedSignature = toFunctionSelector(
    'setApprovalForAll(address,bool)',
  );
  const encodedData = toHex(encode(['address', 'bool'], [spender, approved]));
  return concat([encodedSignature, encodedData]);
};

export const encodeRedeemPositions = ({
  collateralToken,
  parentCollectionId,
  conditionId,
  indexSets,
}: {
  collateralToken: string;
  parentCollectionId: string;
  conditionId: string;
  indexSets: (bigint | string | number)[];
}): Hex => {
  const encodedSignature = toFunctionSelector(
    'redeemPositions(address,bytes32,bytes32,uint256[])',
  );
  const encodedData = toHex(
    encode(
      ['address', 'bytes32', 'bytes32', 'uint256[]'],
      [collateralToken, parentCollectionId, conditionId, indexSets],
    ),
  );
  return concat([encodedSignature, encodedData]);
};

export const generateSalt = (): Hex => {
  return `0x${BigInt(Math.floor(Math.random() * 1000000)).toString(16)}`;
};

function replaceAll(s: string, search: string, replace: string) {
  return s.split(search).join(replace);
}

/**
 * Builds the canonical Polymarket CLOB HMAC signature
 *
 * @param secret
 * @param timestamp
 * @param method
 * @param requestPath
 * @param body
 * @returns string
 */
export const buildPolyHmacSignature = (
  secret: string,
  timestamp: number,
  method: string,
  requestPath: string,
  body?: string,
): string => {
  let message = timestamp + method + requestPath;
  if (body !== undefined) {
    message += body;
  }
  const base64Secret = Buffer.from(secret, 'base64');
  const hmac = crypto.createHmac('sha256', base64Secret);
  const sig = hmac.update(message).digest('base64');

  // NOTE: Must be url safe base64 encoding, but keep base64 "=" suffix
  // Convert '+' to '-'
  // Convert '/' to '_'
  const sigUrlSafe = replaceAll(replaceAll(sig, '+', '-'), '/', '_');
  return sigUrlSafe;
};

export const decimalPlaces = (num: number): number => {
  if (Number.isInteger(num)) {
    return 0;
  }

  const arr = num.toString().split('.');
  if (arr.length <= 1) {
    return 0;
  }

  return arr[1].length;
};

export const roundNormal = (num: number, decimals: number): number => {
  if (decimalPlaces(num) <= decimals) {
    return num;
  }
  return Math.round((num + Number.EPSILON) * 10 ** decimals) / 10 ** decimals;
};

export const roundDown = (num: number, decimals: number): number => {
  if (decimalPlaces(num) <= decimals) {
    return num;
  }
  return Math.floor(num * 10 ** decimals) / 10 ** decimals;
};

export const roundUp = (num: number, decimals: number): number => {
  if (decimalPlaces(num) <= decimals) {
    return num;
  }
  return Math.ceil(num * 10 ** decimals) / 10 ** decimals;
};

export const getOrderRawAmounts = (
  side: Side,
  size: number,
  price: number,
  roundConfig: RoundConfig,
): { side: UtilsSide; rawMakerAmt: number; rawTakerAmt: number } => {
  const rawPrice = roundNormal(price, roundConfig.price);

  if (side === Side.BUY) {
    // force 2 decimals places
    const rawTakerAmt = roundDown(size, roundConfig.size);

    let rawMakerAmt = rawTakerAmt * rawPrice;
    if (decimalPlaces(rawMakerAmt) > roundConfig.amount) {
      rawMakerAmt = roundUp(rawMakerAmt, roundConfig.amount + 4);
      if (decimalPlaces(rawMakerAmt) > roundConfig.amount) {
        rawMakerAmt = roundDown(rawMakerAmt, roundConfig.amount);
      }
    }

    return {
      side: UtilsSide.BUY,
      rawMakerAmt,
      rawTakerAmt,
    };
  }
  const rawMakerAmt = roundDown(size, roundConfig.size);

  let rawTakerAmt = rawMakerAmt * rawPrice;
  if (decimalPlaces(rawTakerAmt) > roundConfig.amount) {
    rawTakerAmt = roundUp(rawTakerAmt, roundConfig.amount + 4);
    if (decimalPlaces(rawTakerAmt) > roundConfig.amount) {
      rawTakerAmt = roundDown(rawTakerAmt, roundConfig.amount);
    }
  }

  return {
    side: UtilsSide.SELL,
    rawMakerAmt,
    rawTakerAmt,
  };
};

/**
 * Translate simple user order to args used to generate Orders
 *
 * @param options
 * @param options.signer
 * @param options.maker
 * @param options.signatureType
 * @param options.userOrder
 * @param options.roundConfig
 */
export const buildOrderCreationArgs = ({
  signer,
  maker,
  signatureType,
  userOrder,
  roundConfig,
}: {
  signer: string;
  maker: string;
  signatureType: SignatureType;
  userOrder: UserOrder;
  roundConfig: RoundConfig;
}): OrderData => {
  const { side, rawMakerAmt, rawTakerAmt } = getOrderRawAmounts(
    userOrder.side,
    userOrder.size,
    userOrder.price,
    roundConfig,
  );

  const makerAmount = parseUnits(
    rawMakerAmt.toString(),
    COLLATERAL_TOKEN_DECIMALS,
  ).toString();
  const takerAmount = parseUnits(
    rawTakerAmt.toString(),
    COLLATERAL_TOKEN_DECIMALS,
  ).toString();

  let taker;
  if (typeof userOrder.taker !== 'undefined' && userOrder.taker) {
    taker = userOrder.taker;
  } else {
    taker = '0x0000000000000000000000000000000000000000';
  }

  let feeRateBps;
  if (typeof userOrder.feeRateBps !== 'undefined' && userOrder.feeRateBps) {
    feeRateBps = userOrder.feeRateBps.toString();
  } else {
    feeRateBps = '0';
  }

  let nonce;
  if (typeof userOrder.nonce !== 'undefined' && userOrder.nonce) {
    nonce = userOrder.nonce.toString();
  } else {
    nonce = '0';
  }

  return {
    maker,
    taker,
    tokenId: userOrder.tokenID,
    makerAmount,
    takerAmount,
    side,
    feeRateBps,
    nonce,
    signer,
    expiration: (userOrder.expiration || 0).toString(),
    signatureType,
  };
};
