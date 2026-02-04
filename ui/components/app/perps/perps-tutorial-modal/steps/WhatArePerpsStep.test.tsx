import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { PerpsTutorialStep } from '../../../../../ducks/perps';
import WhatArePerpsStep from './WhatArePerpsStep';

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

const mockStore = configureStore([]);

describe('WhatArePerpsStep', () => {
  const store = mockStore({});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the title text', () => {
      render(
        <Provider store={store}>
          <WhatArePerpsStep />
        </Provider>,
      );

      expect(
        screen.getByText('perpsTutorialWhatArePerpsTitle'),
      ).toBeInTheDocument();
    });

    it('renders the description text', () => {
      render(
        <Provider store={store}>
          <WhatArePerpsStep />
        </Provider>,
      );

      expect(
        screen.getByText('perpsTutorialWhatArePerpsDescription'),
      ).toBeInTheDocument();
    });

    it('renders the subtitle text', () => {
      render(
        <Provider store={store}>
          <WhatArePerpsStep />
        </Provider>,
      );

      expect(
        screen.getByText('perpsTutorialWhatArePerpsSubtitle'),
      ).toBeInTheDocument();
    });

    it('renders the character image', () => {
      render(
        <Provider store={store}>
          <WhatArePerpsStep />
        </Provider>,
      );

      const image = screen.getByTestId('perps-tutorial-step-image');
      expect(image).toBeInTheDocument();
      expect(image.querySelector('img')).toHaveAttribute(
        'src',
        './images/perps-character.png',
      );
    });

    it('renders the continue button', () => {
      render(
        <Provider store={store}>
          <WhatArePerpsStep />
        </Provider>,
      );

      expect(
        screen.getByTestId('perps-tutorial-continue-button'),
      ).toBeInTheDocument();
    });

    it('renders the skip button', () => {
      render(
        <Provider store={store}>
          <WhatArePerpsStep />
        </Provider>,
      );

      expect(
        screen.getByTestId('perps-tutorial-skip-button'),
      ).toBeInTheDocument();
    });

    it('renders the progress indicator', () => {
      render(
        <Provider store={store}>
          <WhatArePerpsStep />
        </Provider>,
      );

      // Progress indicator should be rendered
      expect(
        screen.getByTestId('perps-tutorial-progress-indicator'),
      ).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('dispatches setTutorialActiveStep when continue is clicked', () => {
      render(
        <Provider store={store}>
          <WhatArePerpsStep />
        </Provider>,
      );

      fireEvent.click(screen.getByTestId('perps-tutorial-continue-button'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'perpsTutorial/setTutorialActiveStep',
        payload: PerpsTutorialStep.GoLongOrShort,
      });
    });

    it('dispatches setTutorialModalOpen(false) when skip is clicked', () => {
      render(
        <Provider store={store}>
          <WhatArePerpsStep />
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
          <WhatArePerpsStep />
        </Provider>,
      );

      const title = screen.getByText('perpsTutorialWhatArePerpsTitle');
      expect(title).toHaveClass('text-left');
    });

    it('displays text above the image', () => {
      render(
        <Provider store={store}>
          <WhatArePerpsStep />
        </Provider>,
      );

      const container = screen.getByTestId('perps-tutorial-what-are-perps');
      const title = screen.getByText('perpsTutorialWhatArePerpsTitle');
      const image = screen.getByTestId('perps-tutorial-step-image');

      // Title should come before image in the DOM
      const titlePosition = Array.from(container.querySelectorAll('*')).indexOf(
        title,
      );
      const imagePosition = Array.from(container.querySelectorAll('*')).indexOf(
        image,
      );

      expect(titlePosition).toBeLessThan(imagePosition);
    });
  });
});
