import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Box from '../../components/ui/box';

import {
  CONNECT_HARDWARE_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  CUSTODY_ACCOUNT_ROUTE,
  ///: END:ONLY_INCLUDE_IN
} from '../../helpers/constants/routes';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import CustodyPage from '../institutional/custody';
///: END:ONLY_INCLUDE_IN
import ConnectHardwareForm from './connect-hardware';

export default function CreateAccountPage() {
  return (
    <Box className="new-account">
      <Switch>
        <Route
          exact
          path={CONNECT_HARDWARE_ROUTE}
          component={ConnectHardwareForm}
        />
        {
          ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
          <Route exact path={CUSTODY_ACCOUNT_ROUTE} component={CustodyPage} />
          ///: END:ONLY_INCLUDE_IN
        }
      </Switch>
    </Box>
  );
}
