import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { tEn } from '../../../../../../test/lib/i18n-helpers';
import NftDetailDescription from './nft-detail-description';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

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

describe('NftDetailDescription', () => {
  const originalResizeObserver = globalThis.ResizeObserver;
  const resizeCallbacks: ResizeObserverCallback[] = [];

  beforeEach(() => {
    resizeCallbacks.length = 0;
    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback);
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
  });

  afterEach(() => {
    jest.restoreAllMocks();
    globalThis.ResizeObserver = originalResizeObserver;
  });

  function notifyResize() {
    const callback = resizeCallbacks.at(-1);

    if (!callback) {
      throw new Error('ResizeObserver was not installed');
    }

    act(() => {
      callback([], {} as ResizeObserver);
    });
  }

  it('keeps Show less after expanding clears the overflow measurement', async () => {
    const dimensions = mockDescriptionDimensions({
      offsetHeight: 40,
      scrollHeight: 80,
    });
    const user = userEvent.setup();

    await act(async () => {
      renderWithProvider(
        <NftDetailDescription value="A long NFT description." />,
        mockStore,
      );
    });

    await user.click(
      await screen.findByRole('button', { name: tEn('showMore') }),
    );

    dimensions.setDimensions({ offsetHeight: 80, scrollHeight: 80 });
    notifyResize();

    const showLess = screen.getByRole('button', { name: tEn('showLess') });
    expect(showLess).toBeInTheDocument();

    await user.click(showLess);

    expect(
      Reflect.get(
        screen.getByTestId('nft-details__description').style,
        'WebkitLineClamp',
      ),
    ).toBe('2');
  });

  it('hides the toggle when collapsed text fits', async () => {
    mockDescriptionDimensions({ offsetHeight: 40, scrollHeight: 40 });

    await act(async () => {
      renderWithProvider(
        <NftDetailDescription value="A short NFT description." />,
        mockStore,
      );
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: tEn('showMore') }),
      ).not.toBeInTheDocument();
    });
  });
});
