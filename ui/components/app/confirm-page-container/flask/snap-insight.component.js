import React from 'react';
import { useInsightSnap } from '../../../../hooks/useInsightSnap';
import { useSimulation } from '../../../../hooks/useSimulation';
import { Markdown } from './markdown.component';

export const SnapInsight = ({ transaction }) => {
  console.log('transaction', { transaction });
  // const data = useInsightSnap(transaction);
  const data = useSimulation(transaction);
  console.log(data);

  return (
    <div className="confirm-page-container-content__data">
      {/* useful stuff goes here */}
      {!data && <>Loading...</>}
      {data && <Markdown source={data} />}
    </div>
  );
};
