import React from 'react';
import ChangePassword from '../../../components/app/change-password/change-password';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';

const PasswordSubPage = () => {
  return <ChangePassword redirectRoute={SECURITY_AND_PASSWORD_ROUTE} />;
};

export default PasswordSubPage;
