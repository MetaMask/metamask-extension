import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react';
import type { Dispatch, Store } from 'redux';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import {
  setParticipateInMetaMetrics,
  setDataCollectionForMarketing,
} from '../../../store/actions';
import configureStore from '../../../store/store';
import { submitRequestToBackground } from '../../../store/background-connection';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import OnboardingMetametrics from './metametrics';

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: jest.fn(),
      createEventBuilder,
    }),
  };
});

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: jest.fn(() => ({ search: '' })),
  };
});

jest.mock('../../../store/background-connection', () => ({
  ...jest.requireActual('../../../store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../../store/actions.ts', () => {
  const actionConstants = jest.requireActual('../../../store/actionConstants');
  return {
    setParticipateInMetaMetrics: jest.fn((value) => (dispatch: Dispatch) => {
      dispatch({ type: actionConstants.SET_PARTICIPATE_IN_METAMETRICS, value });
      return Promise.resolve([value]);
    }),
    setDataCollectionForMarketing: jest.fn((value) => (dispatch: Dispatch) => {
      dispatch({
        type: actionConstants.SET_DATA_COLLECTION_FOR_MARKETING,
        value,
      });
      return Promise.resolve([value]);
    }),
    setPna25Acknowledged: jest.fn(() => () => Promise.resolve()),
  };
});

describe('Onboarding Metametrics Component', () => {
  let store: Store;
  let resolveGeolocation: (location: string | undefined) => void = () =>
    undefined;
  let rejectGeolocation: (error: Error) => void = () => undefined;

  const mockState = {
    metamask: {
      firstTimeFlowType: FirstTimeFlowType.create,
      consentDecisionMade: false,
      optedIn: false,
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
    },
  };

  async function clickElement(element: HTMLElement) {
    await act(async () => {
      fireEvent.click(element);
    });
  }

  async function keyDownElement(element: HTMLElement, key: string) {
    await act(async () => {
      fireEvent.keyDown(element, { key });
    });
  }

  async function settleGeolocation(location?: string) {
    await act(async () => {
      resolveGeolocation(location);
    });
  }

  beforeEach(() => {
    jest.mocked(submitRequestToBackground).mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          resolveGeolocation = resolve;
          rejectGeolocation = reject;
        }),
    );
    store = configureStore(mockState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders match snapshot', () => {
    const { container } = renderWithProvider(<OnboardingMetametrics />, store);
    expect(container).toMatchSnapshot();
  });

  it('renders match snapshot after new policy date', () => {
    // TODO: merge this with the previous test once this date is reached
    jest.useFakeTimers().setSystemTime(new Date('2024-06-05'));
    const { container } = renderWithProvider(<OnboardingMetametrics />, store);
    expect(container).toMatchSnapshot();
    jest.useRealTimers();
  });

  it('default value is checked for ParticiapteMetatmric so on continue setParticipateInMetaMetrics should be called with true', async () => {
    const { queryByText, getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const title = queryByText(
      messages.onboardingMetametricCheckboxTitleOne.message,
    );
    const description = queryByText(
      messages.onboardingMetametricCheckboxDescriptionOneUpdated.message,
    );

    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();

    const checkbox = getAllByRole('checkbox')[0];

    await waitFor(() => {
      expect(checkbox).toBeChecked();
      expect(checkbox).toBeInTheDocument();
    });

    const continueButton = getByTestId('metametrics-i-agree');
    await settleGeolocation();

    await clickElement(continueButton);

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        { replace: true },
      );
    });
  });

  it('when the participate in MetaMetrics checkbox is unchecked, setParticipateInMetaMetrics should be called with false', async () => {
    const { queryByText, getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const title = queryByText(
      messages.onboardingMetametricCheckboxTitleOne.message,
    );
    const description = queryByText(
      messages.onboardingMetametricCheckboxDescriptionOneUpdated.message,
    );

    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();

    const checkboxLabel = queryByText(
      messages.onboardingMetametricCheckboxTitleOne.message,
    );
    expect(checkboxLabel).toBeInTheDocument();

    const checkbox = getAllByRole('checkbox')[0];
    const participateContainer = getByTestId(
      'metametrics-checkbox',
    ) as HTMLElement;

    expect(checkbox).toBeChecked();
    expect(checkbox).toBeInTheDocument();

    await clickElement(participateContainer);

    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });

    const continueButton = getByTestId('metametrics-i-agree');
    await settleGeolocation();

    await clickElement(continueButton);

    await waitFor(() => {
      expect(setParticipateInMetaMetrics).toHaveBeenCalledWith(false);
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        { replace: true },
      );
    });
  });

  it('when the participate in MetaMetrics checkbox is unchecked, setDataCollectionForMarketing should be called with false', async () => {
    const { queryByText, getByTestId } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const title = queryByText(
      messages.onboardingMetametricCheckboxTitleTwo.message,
    );
    const description = queryByText(
      messages.onboardingMetametricCheckboxDescriptionTwo.message,
    );

    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();

    const participateContainer = getByTestId(
      'metametrics-checkbox',
    ) as HTMLElement;

    // Opt out of MetaMetrics; this should clear marketing consent
    await clickElement(participateContainer);

    await settleGeolocation();
    const continueButton = getByTestId('metametrics-i-agree');
    await clickElement(continueButton);

    await waitFor(() => {
      expect(setDataCollectionForMarketing).toHaveBeenCalledWith(false);
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        { replace: true },
      );
    });
  });

  it('should render the Onboarding component when the current date is after the new privacy policy date', () => {
    jest.useFakeTimers().setSystemTime(new Date('2099-11-11'));
    const { queryByTestId } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );
    expect(
      queryByTestId('parent-selector-onboarding-metrics'),
    ).toBeInTheDocument();
  });

  it('on uncheking the participate meatametric, checked datacollection marketing checkbox should be unchecked', async () => {
    const { getAllByRole, getByTestId } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const marketingCheckbox = getAllByRole('checkbox')[1];

    const participateContainer = getByTestId(
      'metametrics-checkbox',
    ) as HTMLElement;
    const marketingContainer = getByTestId(
      'metametrics-data-collection-checkbox',
    ) as HTMLElement;

    expect(marketingCheckbox).not.toBeChecked();

    await settleGeolocation();
    await clickElement(marketingContainer);

    await waitFor(() => {
      expect(marketingCheckbox).toBeChecked();
    });

    await clickElement(participateContainer);

    await waitFor(() => {
      expect(marketingCheckbox).not.toBeChecked();
    });
  });

  it('clicking the participate checkbox container toggles the participate checkbox', async () => {
    const { getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const participateCheckboxContainer = getByTestId(
      'metametrics-checkbox',
    ) as HTMLElement;
    const checkbox = getAllByRole('checkbox')[0];

    expect(checkbox).toBeChecked();

    await clickElement(participateCheckboxContainer);
    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });

    await clickElement(participateCheckboxContainer);
    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
  });

  it('pressing Space on the participate checkbox container toggles the participate checkbox', async () => {
    const { getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const participateCheckboxContainer = getByTestId(
      'metametrics-checkbox',
    ) as HTMLElement;
    const checkbox = getAllByRole('checkbox')[0];

    expect(checkbox).toBeChecked();

    await keyDownElement(participateCheckboxContainer, ' ');
    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });

    await keyDownElement(participateCheckboxContainer, ' ');
    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
  });

  it('pressing Enter on the participate checkbox container toggles the participate checkbox', async () => {
    const { getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const participateCheckboxContainer = getByTestId(
      'metametrics-checkbox',
    ) as HTMLElement;
    const checkbox = getAllByRole('checkbox')[0];

    expect(checkbox).toBeChecked();

    await keyDownElement(participateCheckboxContainer, 'Enter');
    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('calls stopPropagation on the participate checkbox label click', () => {
    const { getByTestId } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const container = getByTestId('metametrics-checkbox');
    const label = container.querySelector('label') as HTMLElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    jest.spyOn(event, 'stopPropagation');

    label.dispatchEvent(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('calls stopPropagation on the participate checkbox input click', () => {
    const { getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const checkbox = getAllByRole('checkbox')[0];
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    jest.spyOn(event, 'stopPropagation');

    checkbox.dispatchEvent(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('calls stopPropagation on the marketing checkbox label click', () => {
    const { getByTestId } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const container = getByTestId('metametrics-data-collection-checkbox');
    const label = container.querySelector('label') as HTMLElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    jest.spyOn(event, 'stopPropagation');

    label.dispatchEvent(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('calls stopPropagation on the marketing checkbox input click', () => {
    const { getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const marketingCheckbox = getAllByRole('checkbox')[1];
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    jest.spyOn(event, 'stopPropagation');

    marketingCheckbox.dispatchEvent(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('clicking the marketing checkbox container toggles the marketing checkbox when participate is checked', async () => {
    const { getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const marketingCheckboxContainer = getByTestId(
      'metametrics-data-collection-checkbox',
    ) as HTMLElement;
    const marketingCheckbox = getAllByRole('checkbox')[1];

    expect(marketingCheckbox).not.toBeChecked();

    await settleGeolocation();
    await clickElement(marketingCheckboxContainer);
    await waitFor(() => {
      expect(marketingCheckbox).toBeChecked();
    });

    await clickElement(marketingCheckboxContainer);
    await waitFor(() => {
      expect(marketingCheckbox).not.toBeChecked();
    });
  });

  it('pressing Space on the marketing checkbox container toggles the marketing checkbox when participate is checked', async () => {
    const { getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const marketingCheckboxContainer = getByTestId(
      'metametrics-data-collection-checkbox',
    ) as HTMLElement;
    const marketingCheckbox = getAllByRole('checkbox')[1];

    expect(marketingCheckbox).not.toBeChecked();

    await settleGeolocation();
    await keyDownElement(marketingCheckboxContainer, ' ');
    await waitFor(() => {
      expect(marketingCheckbox).toBeChecked();
    });
  });

  it('pressing Enter on the marketing checkbox container toggles the marketing checkbox when participate is checked', async () => {
    const { getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const marketingCheckboxContainer = getByTestId(
      'metametrics-data-collection-checkbox',
    ) as HTMLElement;
    const marketingCheckbox = getAllByRole('checkbox')[1];

    expect(marketingCheckbox).not.toBeChecked();

    await settleGeolocation();
    await keyDownElement(marketingCheckboxContainer, 'Enter');
    await waitFor(() => {
      expect(marketingCheckbox).toBeChecked();
    });
  });

  describe('marketing toggle default by region', () => {
    it('disables marketing consent and continue while geolocation is pending', () => {
      const { getAllByRole, getByTestId } = renderWithProvider(
        <OnboardingMetametrics />,
        store,
      );

      expect(getAllByRole('checkbox')[1]).toBeDisabled();
      expect(getByTestId('metametrics-i-agree')).toBeDisabled();
    });

    it('uses a stored opted-in preference without requesting geolocation', () => {
      store = configureStore({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          marketingConsentDecisionMade: true,
          optedInToMarketing: true,
        },
      });

      const { getAllByRole, getByTestId } = renderWithProvider(
        <OnboardingMetametrics />,
        store,
      );

      expect(getAllByRole('checkbox')[1]).toBeChecked();
      expect(getByTestId('metametrics-i-agree')).toBeEnabled();
      expect(submitRequestToBackground).not.toHaveBeenCalled();
    });

    it('uses a stored opted-out preference without requesting geolocation', () => {
      store = configureStore({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          marketingConsentDecisionMade: true,
          optedInToMarketing: false,
        },
      });

      const { getAllByRole, getByTestId } = renderWithProvider(
        <OnboardingMetametrics />,
        store,
      );

      expect(getAllByRole('checkbox')[1]).not.toBeChecked();
      expect(getByTestId('metametrics-i-agree')).toBeEnabled();
      expect(submitRequestToBackground).not.toHaveBeenCalled();
    });

    it('defaults marketing checkbox to checked for a US region', async () => {
      const { getAllByRole } = renderWithProvider(
        <OnboardingMetametrics />,
        store,
      );

      await settleGeolocation('US-CA');
      expect(getAllByRole('checkbox')[1]).toBeChecked();
    });

    it('defaults marketing checkbox to unchecked outside the US', async () => {
      const { getAllByRole } = renderWithProvider(
        <OnboardingMetametrics />,
        store,
      );

      await settleGeolocation('GB');
      expect(getAllByRole('checkbox')[1]).not.toBeChecked();
    });

    it('defaults marketing checkbox to unchecked when geolocation is unknown', async () => {
      const { getAllByRole } = renderWithProvider(
        <OnboardingMetametrics />,
        store,
      );

      await settleGeolocation('UNKNOWN');
      expect(getAllByRole('checkbox')[1]).not.toBeChecked();
    });

    it('defaults marketing checkbox to unchecked when geolocation fails', async () => {
      const { getAllByRole, getByTestId } = renderWithProvider(
        <OnboardingMetametrics />,
        store,
      );

      await act(async () => {
        rejectGeolocation(new Error('geolocation failed'));
      });

      expect(getByTestId('metametrics-i-agree')).toBeEnabled();
      expect(getAllByRole('checkbox')[1]).not.toBeChecked();
    });

    it('dispatches setDataCollectionForMarketing with true on continue for a US region', async () => {
      const { getByTestId, getAllByRole } = renderWithProvider(
        <OnboardingMetametrics />,
        store,
      );

      await settleGeolocation('US');
      expect(getAllByRole('checkbox')[1]).toBeChecked();

      await clickElement(getByTestId('metametrics-i-agree'));

      await waitFor(() => {
        expect(setDataCollectionForMarketing).toHaveBeenCalledWith(true);
      });
    });
  });
});
