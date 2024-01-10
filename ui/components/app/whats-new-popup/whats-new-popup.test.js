import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { NOTIFICATION_BLOCKAID_DEFAULT } from '../../../../shared/notifications';
import WhatsNewPopup from './whats-new-popup';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      announcements: {
        1: {
          date: '2021-03-17',
          id: 1,
          image: {
            height: '230px',
            placeImageBelowDescription: true,
            src: 'images/mobile-link-qr.svg',
            width: '230px',
          },
          isShown: false,
        },
        3: {
          date: '2021-03-08',
          id: 3,
          isShown: false,
        },
        4: {
          date: '2021-05-11',
          id: 4,
          image: {
            src: 'images/source-logos-bsc.svg',
            width: '100%',
          },
          isShown: false,
        },
        5: {
          date: '2021-06-09',
          id: 5,
          isShown: false,
        },
        6: {
          date: '2021-05-26',
          id: 6,
          isShown: false,
        },
        7: {
          date: '2021-09-17',
          id: 7,
          isShown: false,
        },
        8: {
          date: '2021-11-01',
          id: 8,
          isShown: false,
        },
        9: {
          date: '2021-12-07',
          id: 9,
          image: {
            src: 'images/txinsights.png',
            width: '80%',
          },
          isShown: false,
        },
        10: {
          date: '2022-04-18',
          id: 10,
          image: {
            src: 'images/token-detection.svg',
            width: '100%',
          },
          isShown: true,
        },
        11: {
          date: '2022-04-18',
          id: 11,
          isShown: true,
        },
        12: {
          date: '2022-05-18',
          id: 12,
          image: {
            src: 'images/darkmode-banner.png',
            width: '100%',
          },
          isShown: false,
        },
        13: {
          date: '2022-07-12',
          id: 13,
          isShown: true,
        },
        23: {
          date: '2022-07-24',
          id: 23,
          isShown: false,
        },
        [NOTIFICATION_BLOCKAID_DEFAULT]: {
          date: '2022-07-24',
          id: Number(NOTIFICATION_BLOCKAID_DEFAULT),
          isShown: false,
        },
      },
    },
  });
  return renderWithProvider(<WhatsNewPopup />, store);
};

describe('WhatsNewPopup', () => {
  beforeEach(() => {
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    });
    window.IntersectionObserver = mockIntersectionObserver;
  });

  it("renders WhatsNewPopup component and shows What's new text", () => {
    render();
    expect(screen.getByText("What's new")).toBeInTheDocument();
  });

  it('renders WhatsNewPopup component and shows close button', () => {
    render();
    expect(screen.getByTestId('popover-close')).toBeInTheDocument();
  });
  it('renders WhatsNewPopup component and shows blockaid messages', () => {
    render();
    expect(
      screen.getByTestId('whats-new-description-item-0'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('whats-new-description-item-1'),
    ).toBeInTheDocument();
  });
});
