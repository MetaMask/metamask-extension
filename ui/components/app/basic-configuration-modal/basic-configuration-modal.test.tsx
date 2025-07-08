import * as React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import * as Actions from '../../../store/actions';
import {
  hideBasicFunctionalityModal,
  onboardingToggleBasicFunctionalityOff,
} from '../../../ducks/app/app';
import { ONBOARDING_PRIVACY_SETTINGS_ROUTE } from '../../../helpers/constants/routes';
import { BasicConfigurationModal } from './basic-configuration-modal';

jest.mock('../../../store/actions', () => ({
  setDataCollectionForMarketing: jest.fn(),
  setParticipateInMetaMetrics: jest.fn(),
  toggleExternalServices: jest.fn(),
}));

jest.mock('../../../ducks/app/app', () => ({
  hideBasicFunctionalityModal: jest.fn(),
  onboardingToggleBasicFunctionalityOff: jest.fn(),
}));

const mockDispatch = jest.fn();

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type StateOverrides<T extends boolean> = {
  metamask: {
    useExternalServices: T;
  };
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type ArrangeMocksParams<T extends boolean> = {
  isOnboarding?: boolean;
  stateOverrides?: StateOverrides<T>;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type ArrangeMocksReturn<T extends boolean> = {
  toggleBasicFunctionalityButton: HTMLElement;
  cancelButton: HTMLElement;
  agreementCheckbox: T extends true ? HTMLElement : null;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
const arrangeMocks = <T extends boolean>({
  isOnboarding = false,
  stateOverrides,
}: ArrangeMocksParams<T> = {}): ArrangeMocksReturn<T> => {
  jest.clearAllMocks();

  (useLocation as jest.Mock).mockReturnValue({
    pathname: isOnboarding
      ? ONBOARDING_PRIVACY_SETTINGS_ROUTE
      : '/any-other-path',
  });

  const store = configureStore({
    ...stateOverrides,
  });
  const { getByTestId, getByTitle } = renderWithProvider(
    <BasicConfigurationModal />,
    store,
  );

  const agreementCheckbox = stateOverrides?.metamask.useExternalServices
    ? getByTitle('basic-configuration-checkbox')
    : null;
  const toggleBasicFunctionalityButton = getByTestId(
    'basic-configuration-modal-toggle-button',
  );
  const cancelButton = getByTestId('basic-configuration-modal-cancel-button');

  return {
    toggleBasicFunctionalityButton,
    cancelButton,
    agreementCheckbox,
  } as ArrangeMocksReturn<T>;
};

describe('BasicConfigurationModal', () => {
  it('should call hideBasicFunctionalityModal when the cancel button is clicked', () => {
    const { cancelButton } = arrangeMocks();

    expect(cancelButton).toBeEnabled();

    fireEvent.click(cancelButton);

    expect(hideBasicFunctionalityModal).toHaveBeenCalledTimes(1);
  });

  describe('during onboarding', () => {
    it('should render the basic configuration modal', async () => {
      const {
        agreementCheckbox,
        cancelButton,
        toggleBasicFunctionalityButton,
      } = arrangeMocks({
        isOnboarding: true,
        stateOverrides: {
          metamask: {
            useExternalServices: true,
          },
        },
      });

      expect(agreementCheckbox).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      expect(toggleBasicFunctionalityButton).toBeInTheDocument();
    });

    it('should call appropriate actions when the turn off button is clicked', () => {
      const { agreementCheckbox, toggleBasicFunctionalityButton } =
        arrangeMocks({
          isOnboarding: true,
          stateOverrides: {
            metamask: {
              useExternalServices: true,
            },
          },
        });

      fireEvent.click(agreementCheckbox, {
        target: { checked: true },
      });

      expect(toggleBasicFunctionalityButton).toBeEnabled();

      fireEvent.click(toggleBasicFunctionalityButton);

      expect(hideBasicFunctionalityModal).toHaveBeenCalledTimes(1);
      expect(onboardingToggleBasicFunctionalityOff).toHaveBeenCalledTimes(1);
      expect(Actions.setParticipateInMetaMetrics).toHaveBeenCalledTimes(1);
      expect(Actions.setParticipateInMetaMetrics).toHaveBeenCalledWith(false);
      expect(Actions.setDataCollectionForMarketing).toHaveBeenCalledTimes(1);
      expect(Actions.setDataCollectionForMarketing).toHaveBeenCalledWith(false);
    });
  });

  describe('outside onboarding', () => {
    it('should render the basic configuration modal', async () => {
      const {
        agreementCheckbox,
        cancelButton,
        toggleBasicFunctionalityButton,
      } = arrangeMocks({
        isOnboarding: false,
        stateOverrides: {
          metamask: {
            useExternalServices: true,
          },
        },
      });

      expect(agreementCheckbox).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      expect(toggleBasicFunctionalityButton).toBeInTheDocument();
    });

    it('should call appropriate actions when the turn off button is clicked', () => {
      const { agreementCheckbox, toggleBasicFunctionalityButton } =
        arrangeMocks({
          stateOverrides: {
            metamask: {
              useExternalServices: true,
            },
          },
        });

      fireEvent.click(agreementCheckbox, {
        target: { checked: true },
      });

      waitFor(() => {
        expect(toggleBasicFunctionalityButton).toBeEnabled();
      });

      fireEvent.click(toggleBasicFunctionalityButton);

      expect(hideBasicFunctionalityModal).toHaveBeenCalledTimes(1);
      expect(Actions.setParticipateInMetaMetrics).toHaveBeenCalledTimes(1);
      expect(Actions.setParticipateInMetaMetrics).toHaveBeenCalledWith(false);
      expect(Actions.setDataCollectionForMarketing).toHaveBeenCalledTimes(1);
      expect(Actions.setDataCollectionForMarketing).toHaveBeenCalledWith(false);
      expect(Actions.toggleExternalServices).toHaveBeenCalledTimes(1);
      expect(Actions.toggleExternalServices).toHaveBeenCalledWith(false);
    });

    it('should call the appropriate actions when the turn on button is clicked', () => {
      const { toggleBasicFunctionalityButton } = arrangeMocks({
        stateOverrides: {
          metamask: {
            useExternalServices: false,
          },
        },
      });

      expect(toggleBasicFunctionalityButton).toBeEnabled();

      fireEvent.click(toggleBasicFunctionalityButton);

      expect(hideBasicFunctionalityModal).toHaveBeenCalledTimes(1);
      expect(Actions.setParticipateInMetaMetrics).toHaveBeenCalledTimes(0);
      expect(Actions.setDataCollectionForMarketing).toHaveBeenCalledTimes(0);
      expect(Actions.toggleExternalServices).toHaveBeenCalledTimes(1);
      expect(Actions.toggleExternalServices).toHaveBeenCalledWith(true);
    });
  });
});
