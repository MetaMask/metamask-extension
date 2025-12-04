import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom-v5-compat';
import { ClaimsProvider } from '../../../../contexts/claims/claims';
import ClaimsList from '../claims-list';
import ClaimsForm from '../claims-form';
import { TRANSACTION_SHIELD_CLAIM_ROUTES } from '../../../../helpers/constants/routes';

const ClaimsArea = () => {
  return (
    <ClaimsProvider>
      <RouterRoutes>
        <Route path="/" element={<ClaimsList />} />
        <Route
          path={TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.RELATIVE}
          element={<ClaimsForm />}
        />
        <Route
          path={`${TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW_PENDING.RELATIVE}/:claimId`}
          element={<ClaimsForm isView />}
        />
        <Route
          path={`${TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW_HISTORY.RELATIVE}/:claimId`}
          element={<ClaimsForm isView />}
        />
      </RouterRoutes>
    </ClaimsProvider>
  );
};

export default ClaimsArea;
