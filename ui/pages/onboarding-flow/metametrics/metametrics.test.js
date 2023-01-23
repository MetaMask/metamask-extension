import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import {
  onboardingMetametricsAgree,
  onboardingMetametricsDisagree,
} from '../../../../app/_locales/en/messages.json';
import { setParticipateInMetaMetrics } from '../../../store/actions';
import OnboardingMetametrics from './metametrics';

jest.mock('../../../store/actions.js', () => ({
  setParticipateInMetaMetrics: jest
    .fn()
    .mockReturnValue(jest.fn((val) => Promise.resolve([val]))),
}));

describe('Onboarding Metametrics Component', () => {
  let mockStore;

  const mockState = {
    metamask: {
      firstTimeFlowType: '',
      participateInMetaMetrics: '',
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

  it('should set setParticipateInMetaMetrics to true when clicking agree', () => {
    const { queryByText } = renderWithProvider(
      <OnboardingMetametrics />,
      mockStore,
    );

    const confirmAgree = queryByText(onboardingMetametricsAgree.message);

    fireEvent.click(confirmAgree);
    expect(setParticipateInMetaMetrics).toHaveBeenCalledWith(true);
  });

  it('should set setParticipateInMetaMetrics to false when clicking cancel', () => {
    const { queryByText } = renderWithProvider(
      <OnboardingMetametrics />,
      mockStore,
    );

    const confirmCancel = queryByText(onboardingMetametricsDisagree.message);

    fireEvent.click(confirmCancel);
    expect(setParticipateInMetaMetrics).toHaveBeenCalledWith(false);
  });
});
