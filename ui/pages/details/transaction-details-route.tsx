import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { TransactionDetails } from './transaction-details';

export default function TransactionDetailsRoute() {
  const navigate = useNavigate();
  const { caipChainId, txIdentifier } = useParams();

  if (!caipChainId || !txIdentifier) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <div className="main-container">
      <TransactionDetails
        chainId={caipChainId}
        txIdentifier={txIdentifier}
        onBack={() => navigate(-1)}
      />
    </div>
  );
}
