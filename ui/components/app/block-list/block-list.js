import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  resetBlockList,
  deleteBlock,
  setNumericBase,
} from '../../../store/actions';
import Button from '../../ui/button';
import { Block } from '../block';
import Dropdown from '../../ui/dropdown';

const BlockList = () => {
  const dispatch = useDispatch();
  const blocks = useSelector((state) => state.metamask.blocks);
  const numericBase = useSelector((state) => state.metamask.numericBase);
  const [sort, setSort] = useState('block-number');

  const onClick = useCallback(() => {
    dispatch(setNumericBase(numericBase === 'hex' ? 'dec' : 'hex'));
  }, [dispatch, numericBase]);

  const blockSort = useCallback(
    (a, b) => {
      let aVal, bVal;
      if (sort === 'block-number') {
        aVal = a?.number;
        bVal = b?.number;
      } else if (sort === 'nonce') {
        aVal = a?.nonce;
        bVal = b?.nonce;
      } else if (sort === 'gas-limit') {
        aVal = a?.gasLimit;
        bVal = b?.gasLimit;
      } else if (sort === 'gas-used') {
        aVal = a?.gasUsed;
        bVal = b?.gasUsed;
      } else if (sort === 'tx-count') {
        aVal = a?.transactions.length;
        bVal = b?.transactions.length;
      }

      if (!aVal && !bVal) {
        return 0;
      } else if (!aVal) {
        return 1;
      } else if (!bVal) {
        return -1;
      } else if (aVal > bVal) {
        return -1;
      } else if (aVal < bVal) {
        return 1;
      }
      return 0;
    },
    [sort],
  );

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
        <Button type="secondary" rounded onClick={onClick}>
          {numericBase === 'hex'
            ? 'Display numbers in decimal'
            : 'Display numbers in hexidecimal'}
        </Button>
      </div>
      <div className="block-list__dropdown">
        <span className="block-list__dropdown_label">Sort by:</span>
        <Dropdown
          options={[
            { name: 'Block Number', value: 'block-number' },
            { name: 'Nonce', value: 'nonce' },
            { name: 'Gas Limit', value: 'gas-limit' },
            { name: 'Gas Used', value: 'gas-used' },
            { name: 'Transaction Count', value: 'tx-count' },
          ]}
          selectedOption={sort}
          onChange={(value) => {
            console.log('setting sort', { value });
            setSort(value);
          }}
        />
      </div>
      {blocks
        ? blocks.sort(blockSort).map((block, index) => {
            const onDelete = () => dispatch(deleteBlock(index));
            const props = {
              ...block,
              numericBase,
              onDelete,
            };
            return <Block key={block?.number} {...props} />;
          })
        : null}
    </div>
  );
};

export default BlockList;
