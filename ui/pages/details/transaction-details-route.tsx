import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { RampOrderDetailsRoute } from './templates/ramps/ramp-order-details-route';
import { TransactionDetails } from './transaction-details';

export default function TransactionDetailsRoute() {
  const navigate = useNavigate();
  const { caipChainId, txIdentifier } = useParams();

  if (!caipChainId || !txIdentifier) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  const onBack = () => navigate(-1);

  return (
    <div className="main-container">
      <RampOrderDetailsRoute
        chainId={caipChainId}
        txIdentifier={txIdentifier}
        onBack={onBack}
      >
        <TransactionDetails
          chainId={caipChainId}
          txIdentifier={txIdentifier}
          onBack={onBack}
        />
      </RampOrderDetailsRoute>
    </div>
  );
}
