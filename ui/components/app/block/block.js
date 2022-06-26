import React from 'react';
import PropTypes from 'prop-types';
import { conversionUtil } from '../../../../shared/modules/conversion.utils';
import Button from '../../ui/button';

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
      <span>{`Number: ${
        numericBase === 'hex'
          ? number
          : conversionUtil(number, {
              fromNumericBase: 'hex',
              toNumericBase: 'dec',
              numberOfDecimals: 2,
            })
      }`}</span>
      <span>{`Hash: ${hash}`}</span>
      <span>{`Nonce: ${
        numericBase === 'hex'
          ? nonce
          : conversionUtil(nonce, {
              fromNumericBase: 'hex',
              toNumericBase: 'dec',
              numberOfDecimals: 2,
            })
      }`}</span>
      <span>{`GasLimit: ${
        numericBase === 'hex'
          ? gasLimit
          : conversionUtil(gasLimit, {
              fromNumericBase: 'hex',
              toNumericBase: 'dec',
              numberOfDecimals: 2,
            })
      }`}</span>
      <span>{`GasUsed: ${
        numericBase === 'hex'
          ? gasUsed
          : conversionUtil(gasUsed, {
              fromNumericBase: 'hex',
              toNumericBase: 'dec',
              numberOfDecimals: 2,
            })
      }`}</span>
      <span>{`Transaction Count: ${transactions?.length}`}</span>
      <span>
        <Button type="danger" onClick={onDelete}>
          Delete
        </Button>
      </span>
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
