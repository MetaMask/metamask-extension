import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import useCurrencyRatePolling from '../hooks/useCurrencyRatePolling';
import { getNativeCurrency } from '../ducks/metamask/metamask';
import useCurrencyRatePolling2 from '../hooks/useCurrencyRatePolling2';
import useTokenRatesPolling from '../hooks/useTokenRatesPolling';

export const CurrencyRateProvider = ({ children }) => {
  const sdf = useSelector(getNativeCurrency);
  // useCurrencyRatePolling();
  useCurrencyRatePolling2();


  // useTokenRatesPolling();

  return <>{children}</>;
};

CurrencyRateProvider.propTypes = {
  children: PropTypes.node,
};
