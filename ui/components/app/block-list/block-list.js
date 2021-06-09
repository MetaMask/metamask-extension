import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetBlockList } from '../../../store/actions';

import Button from '../../ui/button';

const BlockList = () => {
  const dispatch = useDispatch();
  const blocks = useSelector((state) => state.metamask.blocks);

  return (
    <div className="block-list">
      <div className="block-list__buttons">
        <Button
          type="secondary"
          rounded
          disabled
          onClick={() => dispatch(resetBlockList())}
        >
          Reset Block List
        </Button>
        <Button type="secondary" rounded>
          Display numbers as decimals
        </Button>
      </div>
      {blocks.map((block, i) => {
        return (
          <div className="block-list__block" key={`block-${i}`}>
            <span>{`Number: ${block.number}`}</span>
            <span>{`Hash: ${block.hash}`}</span>
            <span>{`Nonce: ${block.nonce}`}</span>
            <span>{`GasLimit: ${block.gasLimit}`}</span>
            <span>{`GasUsed: ${block.gasUsed}`}</span>
            <span>{`Transaction Count: ${block.transactions.length}`}</span>
          </div>
        );
      })}
    </div>
  );
};

export default BlockList;
