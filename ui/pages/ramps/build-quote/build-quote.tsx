import React from 'react';
import { Navigate } from 'react-router-dom';
import { RAMPS_TOKEN_SELECTION_ROUTE } from '../../../helpers/constants/routes';
import LoadingScreen from '../../../components/ui/loading-screen';
import RampsBuildQuoteView from './components/ramps-build-quote-view';
import { useRampsBuildQuote } from './hooks/useRampsBuildQuote';

export function RampsBuildQuoteScreen() {
  const view = useRampsBuildQuote();

  if (view.kind === 'loading') {
    return <LoadingScreen />;
  }

  if (view.kind === 'redirect') {
    return <Navigate to={RAMPS_TOKEN_SELECTION_ROUTE} replace />;
  }

  return <RampsBuildQuoteView {...view} />;
}

export default RampsBuildQuoteScreen;
