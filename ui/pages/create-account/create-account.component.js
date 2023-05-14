import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Box from '../../components/ui/box';

import {
  CONNECT_HARDWARE_ROUTE,
  IMPORT_ACCOUNT_ROUTE,
  NEW_AA_ACCOUNT_ROUTE,
  IMPORT_AA_ACCOUNT_ROUTE,
  NEW_ACCOUNT_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  CUSTODY_ACCOUNT_ROUTE,
  ///: END:ONLY_INCLUDE_IN
} from '../../helpers/constants/routes';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import CustodyPage from '../institutional/custody';
///: END:ONLY_INCLUDE_IN
import ConnectHardwareForm from './connect-hardware';
import NewAccountImportForm from './import-account';
import NewAAAccountImportForm from './import-account/import-aa-account';
import NewAAAccountForm from './import-account/create-aa-account';
import NewAccountCreateForm from './new-account.container';

export default function CreateAccountPage() {
  return (
    <Box className="new-account">
      <Switch>
        <Route
          exact
          path={NEW_ACCOUNT_ROUTE}
          component={NewAccountCreateForm}
        />
        <Route
          exact
          path={IMPORT_ACCOUNT_ROUTE}
          component={NewAccountImportForm}
        />
        <Route exact path={NEW_AA_ACCOUNT_ROUTE} component={NewAAAccountForm} />
        <Route
          exact
          path={IMPORT_AA_ACCOUNT_ROUTE}
          component={NewAAAccountImportForm}
        />
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
