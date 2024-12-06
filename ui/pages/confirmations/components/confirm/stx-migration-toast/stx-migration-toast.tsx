import React from 'react';
import useCurrentConfirmation from '../../../hooks/useCurrentConfirmation';
import STXMigrationToastLegacy from './stx-migration-toast-legacy';

const STXMigrationToast = () => {
  const { currentConfirmation } = useCurrentConfirmation();
  return <STXMigrationToastLegacy />;
};

export default STXMigrationToast;
