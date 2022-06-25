import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetBlockList } from '../../../store/actions';
import Button from '../../ui/button';
import { Block } from '../block';

const BlockList = () => {
  const dispatch = useDispatch();
  const blocks = useSelector((state) => state.metamask.blocks);
  const [isHex, setIsHex] = useState(true);

  console.log('block-list.js', { blocks });

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
        <Button type="secondary" rounded onClick={() => setIsHex(!isHex)}>
          {isHex
            ? 'Display numbers as decimals'
            : 'Display numbers as hexidecimals'}
        </Button>
      </div>
      {blocks
        ? blocks.map((block) => {
            const props = { ...block, isHex };
            return <Block key={block.number} {...props} />;
          })
        : null}
    </div>
  );
};

export default BlockList;
