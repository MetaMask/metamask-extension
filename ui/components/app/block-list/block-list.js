import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  removeBlock,
  resetBlockList,
  sortBlockList,
  toggleBlockNumericInfoFormat,
} from '../../../store/actions';
import {
  getBlocks,
  getBlockListSortProperty,
  shouldFormatBlockNumericInfoAsHex,
} from '../../../selectors';

import Button from '../../ui/button';
import Dropdown from '../../ui/dropdown';

const sortOptions = [
  { name: 'Sort by: Block number', value: 'number' },
  { name: 'Sort by: Nonce', value: 'nonce' },
  { name: 'Sort by: Gas limit', value: 'gasLimit' },
  { name: 'Sort by: Gas used', value: 'gasUsed' },
  { name: 'Sort by: Transaction count', value: 'numTransactions' },
  { name: 'Sort by: Max transaction value', value: 'maxTransactionValue' },
];

function Block({ dispatch, block }) {
  return (
    <div className="block-list__block">
      <Button
        className="block-list__block-delete"
        type="danger"
        onClick={() => dispatch(removeBlock(block))}
      >
        X
      </Button>
      <span>
        Number: {block.number}
      </span>
      <span>Hash: {block.hash}</span>
      <span>
        Nonce: {block.nonce}
      </span>
      <span>
        GasLimit: {block.gasLimit}
      </span>
      <span>
        GasUsed: {block.gasUsed}
      </span>
      <span>
        Transaction Count: {block.transactions.length}
      </span>
    </div>
  );
}

const BlockList = () => {
  const dispatch = useDispatch();
  const { blocks, formatBlockNumericInfoAsHex, blockListSortProperty } = useSelector(state => state.metamask);

  return (
    <div className="block-list">
      <div className="block-list__buttons">
        <Button
          type="secondary"
          onClick={() => dispatch(resetBlockList())}
        >
          Reset Block List
        </Button>
        <Button
          type="secondary"
          onClick={() => dispatch(toggleBlockNumericInfoFormat())}
        >
          {formatBlockNumericInfoAsHex
            ? 'Display numbers as decimals'
            : 'Display numbers as hex'}
        </Button>
        <Dropdown
          options={sortOptions}
          selectedOption={blockListSortProperty}
          onChange={(value) => dispatch(sortBlockList(value))}
        />
      </div>
      {blocks.map((block, index) => {
        return (
          <Block key={`block-${index}`} dispatch={dispatch} block={block} />
        );
      })}
    </div>
  );
};

export default BlockList;
