import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { ONBOARDING_CREATE_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import {
  onboardingMetametricsAgree,
  onboardingMetametricsDisagree,
} from '../../../../app/_locales/en/messages.json';
import { setMetaMetricsParticipation } from '../../../store/actions';
import { MetaMetricsParticipation } from '../../../../shared/constants/metametrics';
import OnboardingMetametrics from './metametrics';

const mockPushHistory = jest.fn();

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useLocation: jest.fn(() => ({ search: '' })),
    useHistory: () => ({
      push: mockPushHistory,
    }),
  };
});

jest.mock('../../../store/actions.ts', () => ({
  setMetaMetricsParticipation: jest
    .fn()
    .mockReturnValue(jest.fn((val) => Promise.resolve([val]))),
}));

describe('Onboarding Metametrics Component', () => {
  let mockStore;

  const mockState = {
    metamask: {
      firstTimeFlowType: 'create',
      metaMetricsParticipationMode: '',
    },
  };

  beforeEach(() => {
    mockStore = configureMockStore([thunk])(mockState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <OnboardingMetametrics />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should set `setMetaMetricsParticipation` to `Participate` when clicking agree', async () => {
    const { queryByText } = renderWithProvider(
      <OnboardingMetametrics />,
      mockStore,
    );

    const confirmAgree = queryByText(onboardingMetametricsAgree.message);

    fireEvent.click(confirmAgree);

    await waitFor(() => {
      expect(setMetaMetricsParticipation).toHaveBeenCalledWith(
        MetaMetricsParticipation.Participate,
      );
      expect(mockPushHistory).toHaveBeenCalledWith(
        ONBOARDING_CREATE_PASSWORD_ROUTE,
      );
    });
  });

  it('should set `setMetaMetricsParticipation` to `DoNotParticipate` when clicking cancel', async () => {
    const { queryByText } = renderWithProvider(
      <OnboardingMetametrics />,
      mockStore,
    );

    const confirmCancel = queryByText(onboardingMetametricsDisagree.message);

    fireEvent.click(confirmCancel);

    await waitFor(() => {
      expect(setMetaMetricsParticipation).toHaveBeenCalledWith(
        MetaMetricsParticipation.DoNotParticipate,
      );
      expect(mockPushHistory).toHaveBeenCalledWith(
        ONBOARDING_CREATE_PASSWORD_ROUTE,
      );
    });
  });
});
