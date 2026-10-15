import React, { type ComponentProps } from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import { PerpsMarketAbout } from './perps-market-about';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

function renderAbout(props: ComponentProps<typeof PerpsMarketAbout>) {
  return renderWithProvider(<PerpsMarketAbout {...props} />, mockStore);
}

function mockDescriptionDimensions({
  offsetHeight,
  scrollHeight,
}: {
  offsetHeight: number;
  scrollHeight: number;
}) {
  const offsetHeightSpy = jest
    .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
    .mockReturnValue(offsetHeight);
  const scrollHeightSpy = jest
    .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
    .mockReturnValue(scrollHeight);

  return {
    setDimensions({
      offsetHeight: nextOffsetHeight,
      scrollHeight: nextScrollHeight,
    }: {
      offsetHeight: number;
      scrollHeight: number;
    }) {
      offsetHeightSpy.mockReturnValue(nextOffsetHeight);
      scrollHeightSpy.mockReturnValue(nextScrollHeight);
    },
  };
}

function installResizeObserver() {
  const callbacks: ResizeObserverCallback[] = [];
  const originalResizeObserver = globalThis.ResizeObserver;

  globalThis.ResizeObserver = class {
    constructor(callback: ResizeObserverCallback) {
      callbacks.push(callback);
    }

    observe() {
      return undefined;
    }

    unobserve() {
      return undefined;
    }

    disconnect() {
      return undefined;
    }
  } as unknown as typeof ResizeObserver;

  return {
    async waitForInstall() {
      await waitFor(() => {
        expect(callbacks.length).toBeGreaterThan(0);
      });
    },
    notify() {
      const callback = callbacks.at(-1);

      if (!callback) {
        throw new Error('ResizeObserver was not installed');
      }

      act(() => {
        callback([], {} as ResizeObserver);
      });
    },
    restore() {
      globalThis.ResizeObserver = originalResizeObserver;
    },
  };
}

describe('PerpsMarketAbout', () => {
  const originalResizeObserver = globalThis.ResizeObserver;

  afterEach(() => {
    jest.restoreAllMocks();
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('renders the About title with the asset name and description', () => {
    renderAbout({
      assetName: 'Samsung',
      description: 'SAMSUNG tracks the value of one share.',
    });

    expect(
      screen.getByText(tEn('perpsAboutAsset', ['Samsung'])),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-market-about-description'),
    ).toHaveTextContent('SAMSUNG tracks the value of one share.');
  });

  it('falls back to a plain About title when the asset name is missing', () => {
    renderAbout({ description: 'A market description.' });

    expect(screen.getByText(tEn('perpsAbout'))).toBeInTheDocument();
  });

  it('trims surrounding whitespace from the description', () => {
    renderAbout({ description: '  A trimmed description.  ' });

    expect(
      screen.getByTestId('perps-market-about-description'),
    ).toHaveTextContent(/^A trimmed description\.$/u);
  });

  it('renders nothing when no description is provided', () => {
    renderAbout({ description: undefined });

    expect(
      screen.queryByTestId('perps-market-about-section'),
    ).not.toBeInTheDocument();
  });

  it('renders nothing when the description is empty', () => {
    renderAbout({ description: '' });

    expect(
      screen.queryByTestId('perps-market-about-section'),
    ).not.toBeInTheDocument();
  });

  it('renders nothing when the description is only whitespace', () => {
    renderAbout({ description: ' \n\t ' });

    expect(
      screen.queryByTestId('perps-market-about-section'),
    ).not.toBeInTheDocument();
  });

  it('applies the three-line clamp while collapsed', async () => {
    mockDescriptionDimensions({ offsetHeight: 60, scrollHeight: 120 });
    renderAbout({ description: 'A long market description.' });

    await waitFor(() => {
      const description = screen.getByTestId('perps-market-about-description');

      expect(description.style.display).toBe('-webkit-box');
      expect(Reflect.get(description.style, 'WebkitLineClamp')).toBe('3');
      expect(Reflect.get(description.style, 'WebkitBoxOrient')).toBe(
        'vertical',
      );
      expect(description.style.overflow).toBe('hidden');
    });
  });

  it('shows Read more for overflowing text, then expands and hides it', async () => {
    mockDescriptionDimensions({ offsetHeight: 60, scrollHeight: 120 });
    const user = userEvent.setup();
    renderAbout({
      assetName: 'Samsung',
      description: 'A long market description.',
    });

    const readMore = await screen.findByTestId('perps-market-about-read-more');
    expect(readMore).toHaveAccessibleName(
      tEn('perpsReadMoreAbout', ['Samsung']),
    );

    await act(async () => {
      await user.click(readMore);
    });

    expect(
      screen.queryByTestId('perps-market-about-read-more'),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      const { style } = screen.getByTestId('perps-market-about-description');

      expect(Reflect.get(style, 'WebkitLineClamp')).toBe('unset');
    });
  });

  it('does not show Read more when the description fits', async () => {
    mockDescriptionDimensions({ offsetHeight: 60, scrollHeight: 60 });
    renderAbout({ description: 'A short market description.' });

    await waitFor(() => {
      expect(
        screen.queryByTestId('perps-market-about-read-more'),
      ).not.toBeInTheDocument();
    });
  });

  it('shows Read more when fitting text starts overflowing after a resize', async () => {
    const resizeObserver = installResizeObserver();
    const dimensions = mockDescriptionDimensions({
      offsetHeight: 60,
      scrollHeight: 60,
    });

    try {
      renderAbout({ description: 'A market description.' });
      await resizeObserver.waitForInstall();

      expect(
        screen.queryByTestId('perps-market-about-read-more'),
      ).not.toBeInTheDocument();

      dimensions.setDimensions({ offsetHeight: 60, scrollHeight: 120 });
      resizeObserver.notify();

      expect(
        await screen.findByTestId('perps-market-about-read-more'),
      ).toBeInTheDocument();
    } finally {
      resizeObserver.restore();
    }
  });

  it('hides Read more when overflowing text starts fitting after a resize', async () => {
    const resizeObserver = installResizeObserver();
    const dimensions = mockDescriptionDimensions({
      offsetHeight: 60,
      scrollHeight: 120,
    });

    try {
      renderAbout({ description: 'A market description.' });

      expect(
        await screen.findByTestId('perps-market-about-read-more'),
      ).toBeInTheDocument();
      await resizeObserver.waitForInstall();

      dimensions.setDimensions({ offsetHeight: 60, scrollHeight: 60 });
      resizeObserver.notify();

      await waitFor(() => {
        expect(
          screen.queryByTestId('perps-market-about-read-more'),
        ).not.toBeInTheDocument();
      });
    } finally {
      resizeObserver.restore();
    }
  });
});
