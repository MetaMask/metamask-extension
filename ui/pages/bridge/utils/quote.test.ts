import { BigNumber } from 'bignumber.js';
import { zeroAddress } from 'ethereumjs-util';

const ERC20_TOKEN = {
  decimals: 6,
  address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'.toLowerCase(),
};
const NATIVE_TOKEN = { decimals: 18, address: zeroAddress() };

describe('Bridge quote utils', () => {});
