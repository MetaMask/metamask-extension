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
  numericBase,
  onDelete,
}) => {
  return (
    <div className="block" key={number}>
      <span className="delete-block">
        <button onClick={onDelete}>Delete</button>
      </span>
      <span>{`Number: ${
        numericBase
          ? number
          : conversionUtil(number, {
              fromNumericBase: numericBase,
              toNumericBase: numericBase,
              numberOfDecimals: 2,
            })
      }`}</span>
      <span>{`Hash: ${hash}`}</span>
      <span>{`Nonce: ${
        numericBase
          ? nonce
          : conversionUtil(nonce, {
              fromNumericBase: numericBase,
              toNumericBase: numericBase,
              numberOfDecimals: 2,
            })
      }`}</span>
      <span>{`GasLimit: ${
        numericBase
          ? gasLimit
          : conversionUtil(gasLimit, {
              fromNumericBase: numericBase,
              toNumericBase: numericBase,
              numberOfDecimals: 2,
            })
      }`}</span>
      <span>{`GasUsed: ${
        numericBase
          ? gasUsed
          : conversionUtil(gasUsed, {
              fromNumericBase: numericBase,
              toNumericBase: numericBase,
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
  numericBase: PropTypes.string,
  onDelete: PropTypes.func,
};
