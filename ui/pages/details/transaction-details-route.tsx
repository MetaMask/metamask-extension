import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ACTIVITY_ROUTE, DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { useInAppBack } from '../../hooks/use-in-app-back';
import { TransactionDetails } from './transaction-details';

export default function TransactionDetailsRoute() {
  const { caipChainId, txIdentifier } = useParams();
  const handleBack = useInAppBack(ACTIVITY_ROUTE);

  if (!caipChainId || !txIdentifier) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <div className="main-container">
      <TransactionDetails
        chainId={caipChainId}
        txIdentifier={txIdentifier}
        onBack={handleBack}
      />
    </div>
  );
}
