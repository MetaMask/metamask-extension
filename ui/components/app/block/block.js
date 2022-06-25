import React from 'react';
import PropTypes from 'prop-types';
import { conversionUtil } from '../../../../shared/modules/conversion.utils';

export const Block = ({
  number,
  hash,
  nonce,
  gasLimit,
  gasUsed,
  transactions,
  isHex,
}) => {
  return (
    <div className="block" key={number}>
      <span>{`Number: ${
        isHex
          ? number
          : conversionUtil(number, {
              fromNumericBase: isHex ? 'hex' : 'dec',
              toNumericBase: isHex ? 'hex' : 'dec',
              numberOfDecimals: 2,
            })
      }`}</span>
      <span>{`Hash: ${hash}`}</span>
      <span>{`Nonce: ${
        isHex
          ? nonce
          : conversionUtil(nonce, {
              fromNumericBase: isHex ? 'hex' : 'dec',
              toNumericBase: isHex ? 'hex' : 'dec',
              numberOfDecimals: 2,
            })
      }`}</span>
      <span>{`GasLimit: ${
        isHex
          ? gasLimit
          : conversionUtil(gasLimit, {
              fromNumericBase: isHex ? 'hex' : 'dec',
              toNumericBase: isHex ? 'hex' : 'dec',
              numberOfDecimals: 2,
            })
      }`}</span>
      <span>{`GasUsed: ${
        isHex
          ? gasUsed
          : conversionUtil(gasUsed, {
              fromNumericBase: isHex ? 'hex' : 'dec',
              toNumericBase: isHex ? 'hex' : 'dec',
              numberOfDecimals: 2,
            })
      }`}</span>
      <span>{`Transaction Count: ${transactions.length}`}</span>
    </div>
  );
};

Block.propTypes = {
  number: PropTypes.string,
  hash: PropTypes.string,
  nonce: PropTypes.string,
  gasLimit: PropTypes.string,
  gasUsed: PropTypes.string,
  transactions: PropTypes.arrayOf(PropTypes.string),
  isHex: PropTypes.bool,
};
