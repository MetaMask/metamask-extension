import React from 'react';
import { useInsightSnap } from '../../../../hooks/useInsightSnap';

export const SnapInsight = ({ transaction }) => {
  const data = useInsightSnap(transaction);

  return <>{JSON.stringify(data)}</>;
};
