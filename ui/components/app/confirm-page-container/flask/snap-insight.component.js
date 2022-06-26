import React from 'react';
import { useInsightSnap } from '../../../../hooks/useInsightSnap';
import { Markdown } from './markdown.component';

export const SnapInsight = ({ transaction }) => {
  const data = useInsightSnap(transaction);
  console.log(data);

  return (
    <div className="confirm-page-container-content__data">
      {/* useful stuff goes here */}
      {!data && <>Loading...</>}
      {data && <Markdown source={data} />}
    </div>
  );
};
