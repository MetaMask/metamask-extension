import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import configureStore from '../../../store/store';
import OnboardingReferral from './referral';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

describe('OnboardingReferral', () => {
  const store = configureStore({});

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows the invite copy and referral code', () => {
    const { getByText, getByDisplayValue } = renderWithProvider(
      <OnboardingReferral />,
      store,
    );

    expect(
      getByText(messages.referralRebateInviteTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.referralRebateInviteDescription.message),
    ).toBeInTheDocument();
    expect(getByDisplayValue('8F3A21')).toHaveAttribute('readonly');
  });

  it('returns to the metrics step from the back button', () => {
    const { getByTestId } = renderWithProvider(<OnboardingReferral />, store);

    fireEvent.click(getByTestId('onboarding-referral-back'));

    expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
      replace: true,
    });
  });

  it('finishes onboarding when the referral is accepted', () => {
    const { getByTestId } = renderWithProvider(<OnboardingReferral />, store);

    fireEvent.click(getByTestId('onboarding-referral-continue'));

    expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE, {
      replace: true,
    });
    expect(localStorage.getItem('referral-rebate-onboarding-accepted')).toBe(
      'true',
    );
  });

  it('finishes onboarding when the referral is skipped', () => {
    const { getByTestId } = renderWithProvider(<OnboardingReferral />, store);

    fireEvent.click(getByTestId('onboarding-referral-skip'));

    expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE, {
      replace: true,
    });
    expect(
      localStorage.getItem('referral-rebate-onboarding-accepted'),
    ).toBeNull();
  });
});
