import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  useUnreadNotificationsCounter,
  useReadNotificationsCounter,
} from './useCounter';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const mockState = {
  metamask: {
    isMetamaskNotificationsEnabled: true,
    isFeatureAnnouncementsEnabled: true,
    notifications: {
      1: { id: 1, readDate: null },
      2: { id: 2, readDate: null },
      3: { id: 3, readDate: null },
    },
    metamaskNotificationsList: [
      {
        type: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
        createdAt: '2999-04-09T13:24:01.872Z',
        isRead: false,
        data: {
          id: 'dont-miss-out-on-airdrops-and-new-nft-mints',
          category: 'ANNOUNCEMENT',
          title: 'Don’t miss out on airdrops and new NFT mints!',
          longDescription: `<p>You can now verify if any of your connected addresses are eligible for airdrops and other ERC-20 claims in a secure and convenient way. We’ve also added trending NFT mints based on creators you’ve minted from before or other tokens you hold. Head over to the Explore tab to get started.</p>`,
          shortDescription:
            'Check your airdrop eligibility and see trending NFT drops. Head over to the Explore tab to get started.',
          image: {
            title: 'PDAPP notification image Airdrops & NFT mints',
            description: '',
            url: '//images.ctfassets.net/jdkgyfmyd9sw/5jqq8sFeLc6XEoeWlpI3aB/73ee0f1afa9916c3a7538b0bbee09c26/PDAPP_notification_image_Airdrops___NFT_mints.png',
          },
          link: {
            linkText: 'Try now',
            linkUrl: 'https://portfolio.metamask.io/explore',
            isExternal: false,
          },
        },
      },
      {
        type: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
        createdAt: '2999-04-09T13:24:01.872Z',
        isRead: false,
        data: {
          id: 'dont-miss-out-on-airdrops-and-new-nft-mints',
          category: 'ANNOUNCEMENT',
          title: 'Don’t miss out on airdrops and new NFT mints!',
          longDescription: `<p>You can now verify if any of your connected addresses are eligible for airdrops and other ERC-20 claims in a secure and convenient way. We’ve also added trending NFT mints based on creators you’ve minted from before or other tokens you hold. Head over to the Explore tab to get started.</p>`,
          shortDescription:
            'Check your airdrop eligibility and see trending NFT drops. Head over to the Explore tab to get started.',
          image: {
            title: 'PDAPP notification image Airdrops & NFT mints',
            description: '',
            url: '//images.ctfassets.net/jdkgyfmyd9sw/5jqq8sFeLc6XEoeWlpI3aB/73ee0f1afa9916c3a7538b0bbee09c26/PDAPP_notification_image_Airdrops___NFT_mints.png',
          },
          link: {
            linkText: 'Try now',
            linkUrl: 'https://portfolio.metamask.io/explore',
            isExternal: false,
          },
        },
      },
    ],
  },
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={mockStore(mockState)}>{children}</Provider>
);

describe('useUnreadNotificationsCounter', () => {
  it('should return the correct notifications count', () => {
    const { result } = renderHook(() => useUnreadNotificationsCounter(), {
      wrapper,
    });
    expect(result.current.notificationsUnreadCount).toBe(5);
  });

  it('should return three when metamask notifications are disabled', () => {
    const disabledState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        isMetamaskNotificationsEnabled: false,
        isFeatureAnnouncementsEnabled: false,
      },
    };
    const { result } = renderHook(() => useUnreadNotificationsCounter(), {
      wrapper: ({ children }) => (
        <Provider store={mockStore(disabledState)}>{children}</Provider>
      ),
    });
    expect(result.current.notificationsUnreadCount).toBe(3);
  });
});

describe('useReadNotificationsCounter', () => {
  it('should return the correct read notifications count', () => {
    const { result } = renderHook(() => useReadNotificationsCounter(), {
      wrapper,
    });
    expect(result.current.notificationsReadCount).toBe(0);
  });

  it('should return zero when metamask notifications are disabled', () => {
    const disabledState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        isMetamaskNotificationsEnabled: false,
        isFeatureAnnouncementsEnabled: false,
      },
    };
    const { result } = renderHook(() => useReadNotificationsCounter(), {
      wrapper: ({ children }) => (
        <Provider store={mockStore(disabledState)}>{children}</Provider>
      ),
    });
    expect(result.current.notificationsReadCount).toBe(0);
  });
});
