import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { useUnreadNotificationsCounter, useReadNotificationsCounter, } from './useCounter';
const { TRIGGER_TYPES } = NotificationServicesController.Constants;
const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const mockState = {
    isMetamaskNotificationsEnabled: true,
    NotificationServicesController: {
        isFeatureAnnouncementsEnabled: true
    }
};
const wrapper = ({ children }: {
    children: ReactNode;
}) => (<Provider>store) = { mockStore(mockState); } > { children } < /Provider>;
;
describe('useUnreadNotificationsCounter', () => {
    it('should return the correct notifications count', () => {
        const { result } = renderHook(() => useUnreadNotificationsCounter(), {
            wrapper,
        });
        expect(result.current.notificationsUnreadCount).toBe(2);
    });
    it('should return zero when metamask notifications are disabled', () => {
        const disabledState = {
            isMetamaskNotificationsEnabled: false,
            NotificationServicesController: {
                isFeatureAnnouncementsEnabled: false
            }
        };
        const { result } = renderHook(() => useUnreadNotificationsCounter(), {
            wrapper: ({ children }) => (<Provider>store) = { mockStore(disabledState); } > { children } < /Provider>
        });
    });
    expect(result.current.notificationsUnreadCount).toBe(0);
});
;
describe('useReadNotificationsCounter', () => {
    it('should return the correct read notifications count', () => {
        const { result } = renderHook(() => useReadNotificationsCounter(), {
            wrapper,
        });
        expect(result.current.notificationsReadCount).toBe(0);
    });
    it('should return zero when metamask notifications are disabled', () => {
        const disabledState = {
            isMetamaskNotificationsEnabled: false,
            NotificationServicesController: {
                isFeatureAnnouncementsEnabled: false
            }
        };
        const { result } = renderHook(() => useReadNotificationsCounter(), {
            wrapper: ({ children }) => (<Provider>store) = { mockStore(disabledState); } > { children } < /Provider>
        });
    });
    expect(result.current.notificationsReadCount).toBe(0);
});
;
