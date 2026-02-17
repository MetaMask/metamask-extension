import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { PerpsTutorialStep } from '../../../../ducks/perps';
import PerpsTutorialModal from './PerpsTutorialModal';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../hooks/useTheme', () => ({
  useTheme: () => 'light',
}));

// Mock environment type
jest.mock('../../../../../app/scripts/lib/util', () => ({
  getEnvironmentType: () => 'fullscreen',
}));

// Mock Rive animation component
jest.mock('./PerpsTutorialAnimation', () => {
  const mockComponent = ({ artboardName }: { artboardName: string }) => (
    <div data-testid="mock-rive-animation" data-artboard={artboardName}>
      Mock Rive Animation: {artboardName}
    </div>
  );
  return mockComponent;
});

const mockStore = configureStore([]);

describe('PerpsTutorialModal', () => {
  const createStore = (
    isOpen: boolean,
    activeStep: PerpsTutorialStep = PerpsTutorialStep.WhatArePerps,
  ) =>
    mockStore({
      perpsTutorial: {
        tutorialModalOpen: isOpen,
        activeStep,
        tutorialCompleted: false,
      },
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the modal when open', () => {
      const store = createStore(true);
      render(
        <Provider store={store}>
          <PerpsTutorialModal />
        </Provider>,
      );

      expect(screen.getByTestId('perps-tutorial-modal')).toBeInTheDocument();
    });

    it('renders progress indicator', () => {
      const store = createStore(true);
      render(
        <Provider store={store}>
          <PerpsTutorialModal />
        </Provider>,
      );

      expect(
        screen.getByTestId('perps-tutorial-progress-indicator'),
      ).toBeInTheDocument();
    });

    it('renders continue button', () => {
      const store = createStore(true);
      render(
        <Provider store={store}>
          <PerpsTutorialModal />
        </Provider>,
      );

      expect(
        screen.getByTestId('perps-tutorial-continue-button'),
      ).toBeInTheDocument();
    });

    it('renders skip button on non-last step', () => {
      const store = createStore(true, PerpsTutorialStep.WhatArePerps);
      render(
        <Provider store={store}>
          <PerpsTutorialModal />
        </Provider>,
      );

      expect(
        screen.getByTestId('perps-tutorial-skip-button'),
      ).toBeInTheDocument();
    });

    it('renders "Let\'s Go" button on last step', () => {
      const store = createStore(true, PerpsTutorialStep.ReadyToTrade);
      render(
        <Provider store={store}>
          <PerpsTutorialModal />
        </Provider>,
      );

      expect(
        screen.getByTestId('perps-tutorial-lets-go-button'),
      ).toBeInTheDocument();
    });

    it('does not render skip button on last step', () => {
      const store = createStore(true, PerpsTutorialStep.ReadyToTrade);
      render(
        <Provider store={store}>
          <PerpsTutorialModal />
        </Provider>,
      );

      expect(
        screen.queryByTestId('perps-tutorial-skip-button'),
      ).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('advances to next step when continue is clicked', () => {
      const store = createStore(true, PerpsTutorialStep.WhatArePerps);
      render(
        <Provider store={store}>
          <PerpsTutorialModal />
        </Provider>,
      );

      fireEvent.click(screen.getByTestId('perps-tutorial-continue-button'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'perpsTutorial/setTutorialActiveStep',
        payload: PerpsTutorialStep.GoLongOrShort,
      });
    });

    it('advances through all steps in correct order', () => {
      const steps = [
        {
          current: PerpsTutorialStep.WhatArePerps,
          next: PerpsTutorialStep.GoLongOrShort,
        },
        {
          current: PerpsTutorialStep.GoLongOrShort,
          next: PerpsTutorialStep.ChooseLeverage,
        },
        {
          current: PerpsTutorialStep.ChooseLeverage,
          next: PerpsTutorialStep.WatchLiquidation,
        },
        {
          current: PerpsTutorialStep.WatchLiquidation,
          next: PerpsTutorialStep.CloseAnytime,
        },
        {
          current: PerpsTutorialStep.CloseAnytime,
          next: PerpsTutorialStep.ReadyToTrade,
        },
      ];

      steps.forEach(({ current, next }) => {
        jest.clearAllMocks();
        const store = createStore(true, current);
        const { unmount } = render(
          <Provider store={store}>
            <PerpsTutorialModal />
          </Provider>,
        );

        fireEvent.click(screen.getByTestId('perps-tutorial-continue-button'));

        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'perpsTutorial/setTutorialActiveStep',
          payload: next,
        });

        unmount();
      });
    });

    it('marks tutorial completed when "Let\'s Go" is clicked on last step', () => {
      const store = createStore(true, PerpsTutorialStep.ReadyToTrade);
      render(
        <Provider store={store}>
          <PerpsTutorialModal />
        </Provider>,
      );

      fireEvent.click(screen.getByTestId('perps-tutorial-lets-go-button'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'perpsTutorial/markTutorialCompleted',
      });
    });

    it('closes modal when skip is clicked', () => {
      const store = createStore(true, PerpsTutorialStep.WhatArePerps);
      render(
        <Provider store={store}>
          <PerpsTutorialModal />
        </Provider>,
      );

      fireEvent.click(screen.getByTestId('perps-tutorial-skip-button'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'perpsTutorial/setTutorialModalOpen',
        payload: false,
      });
    });
  });

  describe('step content', () => {
    it('renders WhatArePerps step content', () => {
      const store = createStore(true, PerpsTutorialStep.WhatArePerps);
      render(
        <Provider store={store}>
          <PerpsTutorialModal />
        </Provider>,
      );

      expect(
        screen.getByTestId('perps-tutorial-what-are-perps'),
      ).toBeInTheDocument();
    });

    it('renders GoLongShort step content', () => {
      const store = createStore(true, PerpsTutorialStep.GoLongOrShort);
      render(
        <Provider store={store}>
          <PerpsTutorialModal />
        </Provider>,
      );

      expect(
        screen.getByTestId('perps-tutorial-go-long-short'),
      ).toBeInTheDocument();
    });

    it('renders ReadyToTrade step content', () => {
      const store = createStore(true, PerpsTutorialStep.ReadyToTrade);
      render(
        <Provider store={store}>
          <PerpsTutorialModal />
        </Provider>,
      );

      expect(
        screen.getByTestId('perps-tutorial-ready-to-trade'),
      ).toBeInTheDocument();
    });
  });

  describe('close behavior', () => {
    it('calls onClose callback when modal is closed', () => {
      const onClose = jest.fn();
      const store = createStore(true);
      render(
        <Provider store={store}>
          <PerpsTutorialModal onClose={onClose} />
        </Provider>,
      );

      // Find and click the close button in the modal header
      const closeButton = screen
        .getByTestId('perps-tutorial-modal-header')
        .querySelector('button');
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton as HTMLElement);
      expect(onClose).toHaveBeenCalled();
    });

    it('resets to first step when modal is closed', () => {
      const store = createStore(true, PerpsTutorialStep.ChooseLeverage);
      render(
        <Provider store={store}>
          <PerpsTutorialModal />
        </Provider>,
      );

      const closeButton = screen
        .getByTestId('perps-tutorial-modal-header')
        .querySelector('button');
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton as HTMLElement);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'perpsTutorial/setTutorialActiveStep',
        payload: PerpsTutorialStep.WhatArePerps,
      });
    });
  });
});
