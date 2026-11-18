import React from 'react';
import { Navigate } from 'react-router-dom';
import { RAMPS_TOKEN_SELECTION_ROUTE } from '../../../helpers/constants/routes';
import LoadingScreen from '../../../components/ui/loading-screen';
import { useRampsScreenViewed } from '../../../hooks/ramps/useRampsScreenViewed';
import RampsBuildQuoteView from './components/ramps-build-quote-view';
import {
  type RampsBuildQuoteReadyViewModel,
  useRampsBuildQuote,
} from './hooks/useRampsBuildQuote';

const RampsBuildQuoteReadyScreen = ({
  view,
}: {
  view: RampsBuildQuoteReadyViewModel;
}) => {
  useRampsScreenViewed('Amount Input');
  return <RampsBuildQuoteView {...view} />;
};

export function RampsBuildQuoteScreen() {
  const view = useRampsBuildQuote();

  if (view.kind === 'loading') {
    return <LoadingScreen />;
  }

  if (view.kind === 'redirect') {
    return <Navigate to={RAMPS_TOKEN_SELECTION_ROUTE} replace />;
  }

  return <RampsBuildQuoteReadyScreen view={view} />;
}

export default RampsBuildQuoteScreen;
