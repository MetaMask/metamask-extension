import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { CREATE_SNAP_ACCOUNT_ROUTE } from '../../../../helpers/constants/routes';
import {
  BackgroundColor,
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { Box } from '../../../../components/component-library';
import CreateSnapAccount from './create-snap-account';

export default function AddSnapAccountPage() {
  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      backgroundColor={BackgroundColor.backgroundDefault}
      marginLeft={10}
      marginRight={10}
    >
      <Switch>
        <>
          <Route
            exact
            path={CREATE_SNAP_ACCOUNT_ROUTE}
            component={CreateSnapAccount}
          />
        </>
      </Switch>
    </Box>
  );
}
