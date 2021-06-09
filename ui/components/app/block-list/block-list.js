import moment from 'moment';
import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { resetBlockList } from '../../../store/actions';
import Button from '../../ui/button';

const BlockList = () => {
  const dispatch = useDispatch();
  const blocks = useSelector((state) => state.metamask.blocks);

  const trackEvent = useContext(MetaMetricsContext);

  useEffect(() => {
    trackEvent({
      event: 'New block rendered to user',
      category: 'Home screen',
      properties: { blockNumber: blocks[blocks.length - 1].number },
    });
  }, [blocks]);

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
            <span>{`Block timestamp: ${moment
              .unix(parseInt(block.timestamp, 16))
              .format('hh:mm:ss')}`}</span>
          </div>
        );
      })}
    </div>
  );
};

export default BlockList;
