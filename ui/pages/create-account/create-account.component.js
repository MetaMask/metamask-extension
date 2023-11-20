import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Box } from '../../components/component-library';
import { CONNECT_HARDWARE_ROUTE } from '../../helpers/constants/routes';
import ConnectHardwareForm from './connect-hardware';

export default function CreateAccountPage() {
  return (
    <Box className="new-account-wrapper">
      <Switch>
        <Route
          exact
          path={CONNECT_HARDWARE_ROUTE}
          component={ConnectHardwareForm}
        />
      </Switch>
    </Box>
  );
}
