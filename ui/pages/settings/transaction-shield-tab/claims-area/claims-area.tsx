import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';
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
          path={`${TRANSACTION_SHIELD_CLAIM_ROUTES.EDIT_DRAFT.RELATIVE}/:draftId`}
          element={<ClaimsForm mode="edit-draft" />}
        />
        <Route
          path={`${TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW_PENDING.RELATIVE}/:claimId`}
          element={<ClaimsForm mode="view" />}
        />
        <Route
          path={`${TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW_HISTORY.RELATIVE}/:claimId`}
          element={<ClaimsForm mode="view" />}
        />
      </RouterRoutes>
    </ClaimsProvider>
  );
};

export default ClaimsArea;
