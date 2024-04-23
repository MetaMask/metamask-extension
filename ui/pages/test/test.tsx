import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Box, Button } from '../../components/component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../helpers/constants/design-system';
import { selectIsSignedIn } from '../../selectors/metamask-notifications/authentication';
import { performSignIn } from '../../store/actions';

import { Page } from '../../components/multichain/pages/page';

export type TestPageProps = {
  children: React.ReactNode;
};

export default function TestPage({ children }: TestPageProps) {
  const history = useHistory();
  const isSignedIn = useSelector(selectIsSignedIn);
  const dispatch = useDispatch();
  console.log('isSignedIn', isSignedIn);

  const handleSignIn = () => {
    console.log('handleSignIn');
    dispatch(performSignIn());
  };

  return (
    <div className="main-container" data-testid="notifications-page">
      <Box>
        <Button onClick={() => handleSignIn()}>SignIn</Button>
      </Box>
      <Page>{children}</Page>
    </div>
  );
}
