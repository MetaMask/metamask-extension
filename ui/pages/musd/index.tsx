/**
 * MUSD Conversion Page
 *
 * Main entry point for the mUSD stablecoin conversion feature.
 * Handles routing to the education screen.
 */

import React from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsMusdConversionFlowEnabled } from '../../selectors/musd';
import { useMusdGeoBlocking } from '../../hooks/musd';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { MUSD_DEEPLINK_PARAM } from '../../../shared/lib/deep-links/routes/musd';
import { MUSD_CONVERSION_ROUTES } from './constants/routes';
import MusdEducationScreen from './screens/education';

/**
 * MUSD Conversion Page Component
 *
 * Routes:
 * - /musd/education - Education/onboarding screen
 */
const MusdConversionPage: React.FC = () => {
  const isFeatureEnabled = useSelector(selectIsMusdConversionFlowEnabled);
  const [searchParams] = useSearchParams();
  const isDeeplink = searchParams.get(MUSD_DEEPLINK_PARAM) === 'true';
  const { isBlocked, isLoading: isGeoLoading } = useMusdGeoBlocking();

  // Redirect if feature is disabled
  if (!isFeatureEnabled) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  // Redirect geo-blocked users to home (deeplink users see education with a home CTA instead)
  if (isBlocked && !isGeoLoading && !isDeeplink) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <div className="musd-conversion-page" style={{ height: '100%', flex: 1 }}>
      <Routes>
        {/* Education screen */}
        <Route
          path={MUSD_CONVERSION_ROUTES.EDUCATION.RELATIVE}
          element={<MusdEducationScreen />}
        />

        {/* Default: redirect to education */}
        <Route
          path="/"
          element={
            <Navigate to={MUSD_CONVERSION_ROUTES.EDUCATION.RELATIVE} replace />
          }
        />
      </Routes>
    </div>
  );
};

export default MusdConversionPage;
