import React from 'react';
import { useInsightSnap } from '../../../../hooks/useInsightSnap';
import { Markdown } from './markdown.component';

export const SnapInsight = ({ transaction }) => {
  const data = useInsightSnap(transaction);

  return (
    <div className="confirm-page-container-content__data">
      {!data && <>Loading...</>}
      {data && <Markdown source={data} />}
    </div>
  );
};
