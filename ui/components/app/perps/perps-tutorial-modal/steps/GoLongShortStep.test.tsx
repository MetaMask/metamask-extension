import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { PerpsTutorialStep } from '../../../../../ducks/perps';
import GoLongShortStep from './GoLongShortStep';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../../hooks/useTheme', () => ({
  useTheme: () => 'light',
}));

// Mock Rive animation component
jest.mock('../PerpsTutorialAnimation', () => {
  const mockComponent = ({ artboardName }: { artboardName: string }) => (
    <div data-testid="mock-rive-animation" data-artboard={artboardName}>
      Mock Rive Animation: {artboardName}
    </div>
  );
  return mockComponent;
});

const mockStore = configureStore([]);

describe('GoLongShortStep', () => {
  const store = mockStore({});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the title text', () => {
      render(
        <Provider store={store}>
          <GoLongShortStep />
        </Provider>,
      );

      expect(
        screen.getByText('perpsTutorialGoLongShortTitle'),
      ).toBeInTheDocument();
    });

    it('renders the description text', () => {
      render(
        <Provider store={store}>
          <GoLongShortStep />
        </Provider>,
      );

      expect(
        screen.getByText('perpsTutorialGoLongShortDescription'),
      ).toBeInTheDocument();
    });

    it('renders the subtitle text', () => {
      render(
        <Provider store={store}>
          <GoLongShortStep />
        </Provider>,
      );

      expect(
        screen.getByText('perpsTutorialGoLongShortSubtitle'),
      ).toBeInTheDocument();
    });

    it('renders the Rive animation with correct artboard', () => {
      render(
        <Provider store={store}>
          <GoLongShortStep />
        </Provider>,
      );

      const animation = screen.getByTestId('mock-rive-animation');
      expect(animation).toBeInTheDocument();
      expect(animation).toHaveAttribute('data-artboard', '01_Short_Long');
    });

    it('renders the continue button', () => {
      render(
        <Provider store={store}>
          <GoLongShortStep />
        </Provider>,
      );

      expect(
        screen.getByTestId('perps-tutorial-continue-button'),
      ).toBeInTheDocument();
    });

    it('renders the skip button', () => {
      render(
        <Provider store={store}>
          <GoLongShortStep />
        </Provider>,
      );

      expect(
        screen.getByTestId('perps-tutorial-skip-button'),
      ).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('dispatches setTutorialActiveStep to ChooseLeverage when continue is clicked', () => {
      render(
        <Provider store={store}>
          <GoLongShortStep />
        </Provider>,
      );

      fireEvent.click(screen.getByTestId('perps-tutorial-continue-button'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'perpsTutorial/setTutorialActiveStep',
        payload: PerpsTutorialStep.ChooseLeverage,
      });
    });

    it('dispatches setTutorialModalOpen(false) when skip is clicked', () => {
      render(
        <Provider store={store}>
          <GoLongShortStep />
        </Provider>,
      );

      fireEvent.click(screen.getByTestId('perps-tutorial-skip-button'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'perpsTutorial/setTutorialModalOpen',
        payload: false,
      });
    });
  });

  describe('layout', () => {
    it('has left-aligned text', () => {
      render(
        <Provider store={store}>
          <GoLongShortStep />
        </Provider>,
      );

      const title = screen.getByText('perpsTutorialGoLongShortTitle');
      expect(title).toHaveClass('text-left');
    });
  });
});
