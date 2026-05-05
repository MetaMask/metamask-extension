import React from 'react';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import ChangePassword from './change-password';

const PasswordSubPage = () => {
  return <ChangePassword redirectRoute={SECURITY_AND_PASSWORD_ROUTE} />;
};

export default PasswordSubPage;
