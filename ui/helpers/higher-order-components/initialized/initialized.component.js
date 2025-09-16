import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom-v5-compat';
import { ONBOARDING_ROUTE } from '../../constants/routes';

export default function Initialized(props) {
  const { completedOnboarding, children } = props;
  return completedOnboarding ? (
    children
  ) : (
    <Navigate to={ONBOARDING_ROUTE} replace />
  );
}

Initialized.propTypes = {
  completedOnboarding: PropTypes.bool,
  children: PropTypes.node.isRequired,
};
