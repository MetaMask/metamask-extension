import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ACTIVITY_ROUTE } from '../../../../helpers/constants/routes';
import { Header } from '../../components/header';
import { useRampsDetailsItem } from './hooks';
import { RampOrderDetails } from './ramp-order-details';

/**
 * Ramps-owned order details page. Resolves the order from the route
 * identifier and renders ramps header + template.
 *
 * @returns The ramps order details page, or a redirect to Activity.
 */
export default function RampOrderDetailsPage() {
  const navigate = useNavigate();
  const { caipChainId, txIdentifier } = useParams();
  const rampsItem = useRampsDetailsItem(txIdentifier);

  if (!caipChainId || !txIdentifier || !rampsItem) {
    return <Navigate to={ACTIVITY_ROUTE} replace />;
  }

  return (
    <div className="main-container">
      <div className="flex h-full flex-col bg-background-default [container-name:list-item] [container-type:inline-size]">
        <div className="shrink-0 px-4 py-4">
          <Header item={rampsItem} onBack={() => navigate(-1)} />
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto px-4 pb-4">
          <RampOrderDetails item={rampsItem} />
        </div>
      </div>
    </div>
  );
}
