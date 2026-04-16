import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import WhatArePerpsStep from './WhatArePerpsStep';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
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

    it('renders decorative image with empty alt text for accessibility', () => {
      render(
        <Provider store={store}>
          <WhatArePerpsStep />
        </Provider>,
      );

      const image = screen
        .getByTestId('perps-tutorial-step-image')
        .querySelector('img');
      expect(image).toHaveAttribute('alt', '');
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
