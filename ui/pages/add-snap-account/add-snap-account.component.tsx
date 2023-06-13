import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { ADD_SNAP_ACCOUNT_ROUTE } from '../../helpers/constants/routes';
import {
  BackgroundColor,
  Display,
  JustifyContent,
} from '../../helpers/constants/design-system';
import { Box } from '../../components/component-library';
import NewSnapAccountPage from './snap-account';
import SnapAccountDetailPage from './snap-account-detail';

const AddSnapAccountPage = () => {
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
            path={`${ADD_SNAP_ACCOUNT_ROUTE}/:snapId`}
            component={SnapAccountDetailPage}
          />
          <Route
            exact
            path={ADD_SNAP_ACCOUNT_ROUTE}
            component={NewSnapAccountPage}
          />
        </>
      </Switch>
    </Box>
  );
};

export default AddSnapAccountPage;
