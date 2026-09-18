import React from 'react';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import ManageShieldPlan from '../../shield/transaction-shield/manage-shield-plan/manage-shield-plan';

const ManagePastPlanSubPage = () => {
  return <ManageShieldPlan isPastPlan />;
};

export default ManagePastPlanSubPage;
