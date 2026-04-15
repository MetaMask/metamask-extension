import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import GoLongShortStep from './GoLongShortStep';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
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
