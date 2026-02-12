/**
 * MUSD Conversion Page
 *
 * Main entry point for the mUSD stablecoin conversion feature.
 * Handles routing between education and prepare screens.
 */

///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsMusdConversionFlowEnabled } from '../../selectors/musd';
import { useMusdGeoBlocking } from '../../hooks/musd';
import {
  MUSD_CONVERSION_ROUTES,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import MusdEducationScreen from './screens/education';
import MusdPrepareScreen from './screens/prepare';
import MusdGeoBlockedScreen from './screens/geo-blocked';

/**
 * MUSD Conversion Page Component
 *
 * Routes:
 * - /musd-conversion/education - Education/onboarding screen
 * - /musd-conversion/prepare - Conversion input screen
 */
const MusdConversionPage: React.FC = () => {
  const isFeatureEnabled = useSelector(selectIsMusdConversionFlowEnabled);
  const { isBlocked, isLoading: isGeoLoading } = useMusdGeoBlocking();

  // Redirect if feature is disabled
  if (!isFeatureEnabled) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  // Show geo-blocked screen if user is in a blocked region
  if (isBlocked && !isGeoLoading) {
    return <MusdGeoBlockedScreen />;
  }

  return (
    <div className="musd-conversion-page">
      <Routes>
        {/* Education screen */}
        <Route
          path={MUSD_CONVERSION_ROUTES.EDUCATION.RELATIVE}
          element={<MusdEducationScreen />}
        />

        {/* Prepare/input screen */}
        <Route
          path={MUSD_CONVERSION_ROUTES.PREPARE.RELATIVE}
          element={<MusdPrepareScreen />}
        />

        {/* Default: redirect to prepare if education seen, else education */}
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
///: END:ONLY_INCLUDE_IF
