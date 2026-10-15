import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { useActivityHomeRoute } from '../../hooks/useActivityHomeRoute';
import { useInAppBack } from '../../hooks/useInAppBack';
import { TransactionDetails } from './transaction-details';

export default function TransactionDetailsRoute() {
  const { caipChainId, txIdentifier } = useParams();
  const activityHomeRoute = useActivityHomeRoute();
  const handleBack = useInAppBack(activityHomeRoute);

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
