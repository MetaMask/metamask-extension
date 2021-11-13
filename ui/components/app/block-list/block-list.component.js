import React from 'react';
import Button from '../../ui/button';
import { BigNumber } from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';
import Dropdown from '../../ui/dropdown';
import {
  convertNumbers,
  resetBlockList,
  removeBlockFromList,
  sortBlocks,
} from '../../../store/actions';

const BlockList = () => {
  const dispatch = useDispatch();

  const blocks = useSelector((state) => state.metamask.blocks);
  const currentChainId = useSelector((state) => state.metamask.currentChainId);
  const sortProperty = useSelector((state) => state.metamask.sortProperty);
  const displayNumbersAsHex = useSelector(
    (state) => state.metamask.displayNumbersAsHex,
  );

  const getDisplayNumber = (value) => {
    if (!value) {
      return value;
    }
    if (typeof value !== 'number') {
      return displayNumbersAsHex ? value : new BigNumber(value).toNumber();
    } else {
      return displayNumbersAsHex
        ? '0x' + new BigNumber(value).toString(16)
        : value;
    }
  };

  return (
    <div className="block-list">
      <div className="block-list__buttons">
        <Button
          type="secondary"
          rounded
          onClick={() => dispatch(resetBlockList())}
        >
          Reset Block List
        </Button>
        <Button
          type="secondary"
          rounded
          onClick={() => dispatch(convertNumbers())}
        >
          Display numbers as {displayNumbersAsHex ? 'decimals' : 'hex'}
        </Button>
      </div>

      <Dropdown
        className="block-list__dropdown"
        options={[
          { name: 'Sort By: Number', value: 'number' },
          { name: 'Sort By: Nonce', value: 'nonce' },
          { name: 'Sort By: GasLimit', value: 'gasLimit' },
          { name: 'Sort By: GasUsed', value: 'gasUsed' },
          { name: 'Sort By: Transaction Count', value: 'txCount' },
        ]}
        selectedOption={sortProperty}
        onChange={(value) => dispatch(sortBlocks(value))}
      />

      {blocks
        .filter((block) => block.chainId === currentChainId)
        .map((block) => {
          const { hash } = block;
          return (
            <div className="block-list__block" key={hash}>
              <span>{`Number: ${getDisplayNumber(block.number)}`}</span>
              <span>{`Hash: ${hash}`}</span>
              <span>{`Nonce: ${getDisplayNumber(block.nonce)}`}</span>
              <span>{`GasLimit: ${getDisplayNumber(block.gasLimit)}`}</span>
              <span>{`GasUsed: ${getDisplayNumber(block.gasUsed)}`}</span>
              <span>{`Transaction Count: ${block.txCount}`}</span>
              <span>{`Max Tx Value: ${block.maxTxValue} Ether`}</span>
              <span>{`ChainId: ${getDisplayNumber(block.chainId)}`}</span>
              <a href={block.etherscanLink} target="_blank">
                Etherscan Link
              </a>
              <Button
                className="block-list__remove-button"
                type="secondary"
                rounded
                onClick={() => dispatch(removeBlockFromList(hash))}
              >
                Remove Block
              </Button>
            </div>
          );
        })}
    </div>
  );
};

export default BlockList;
