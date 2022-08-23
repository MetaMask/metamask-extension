import configureMockStore from 'redux-mock-store';
import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import {
  DEFAULT_ROUTE,
  LOCK_ROUTE,
  INITIALIZE_WELCOME_ROUTE,
  INITIALIZE_UNLOCK_ROUTE,
  INITIALIZE_END_OF_FLOW_ROUTE,
} from '../../../helpers/constants/routes';
import FirstTimeFlowSwitch from './first-time-flow-switch.container';

describe('FirstTimeFlowSwitch', () => {
  it('redirects to /welcome route with null props', () => {
    const mockState = {
      metamask: {
        completedOnboarding: null,
        isInitialized: null,
        isUnlocked: null,
        seedPhraseBackedUp: null,
      },
    };
    const store = configureMockStore()(mockState);

    const { history } = renderWithProvider(<FirstTimeFlowSwitch />, store);

    expect(history.location.pathname).toStrictEqual(INITIALIZE_WELCOME_ROUTE);
  });

  it('redirects to / route when completedOnboarding is true', () => {
    const mockState = {
      metamask: {
        completedOnboarding: true,
        isInitialized: null,
        isUnlocked: null,
        seedPhraseBackedUp: null,
      },
    };
    const store = configureMockStore()(mockState);

    const { history } = renderWithProvider(<FirstTimeFlowSwitch />, store);
    expect(history.location.pathname).toStrictEqual(DEFAULT_ROUTE);
  });

  it('redirects to end of flow route when seedPhraseBackedUp is true', () => {
    const mockState = {
      metamask: {
        completedOnboarding: false,
        seedPhraseBackedUp: true,
        isInitialized: null,
        isUnlocked: null,
      },
    };
    const store = configureMockStore()(mockState);

    const { history } = renderWithProvider(<FirstTimeFlowSwitch />, store);
    expect(history.location.pathname).toStrictEqual(
      INITIALIZE_END_OF_FLOW_ROUTE,
    );
  });

  it('redirects to end of flow route when seedPhraseBackedUp is false', () => {
    const mockState = {
      metamask: {
        completedOnboarding: false,
        seedPhraseBackedUp: false,
        isInitialized: null,
        isUnlocked: null,
      },
    };
    const store = configureMockStore()(mockState);

    const { history } = renderWithProvider(<FirstTimeFlowSwitch />, store);
    expect(history.location.pathname).toStrictEqual(
      INITIALIZE_END_OF_FLOW_ROUTE,
    );
  });

  it('redirects to /lock route when isUnlocked is true', () => {
    const mockState = {
      metamask: {
        completedOnboarding: false,
        isUnlocked: true,
        seedPhraseBackedUp: null,
        isInitialized: null,
      },
    };
    const store = configureMockStore()(mockState);

    const { history } = renderWithProvider(<FirstTimeFlowSwitch />, store);
    expect(history.location.pathname).toStrictEqual(LOCK_ROUTE);
  });

  it('redirects to /welcome route when isInitialized is false', () => {
    const mockState = {
      metamask: {
        completedOnboarding: false,
        isUnlocked: false,
        isInitialized: false,
        seedPhraseBackedUp: null,
      },
    };
    const store = configureMockStore()(mockState);

    const { history } = renderWithProvider(<FirstTimeFlowSwitch />, store);
    expect(history.location.pathname).toStrictEqual(INITIALIZE_WELCOME_ROUTE);
  });

  it('redirects to /unlock route when isInitialized is true', () => {
    const mockState = {
      metamask: {
        completedOnboarding: false,
        isUnlocked: false,
        isInitialized: true,
        seedPhraseBackedUp: null,
      },
    };
    const store = configureMockStore()(mockState);

    const { history } = renderWithProvider(<FirstTimeFlowSwitch />, store);
    expect(history.location.pathname).toStrictEqual(INITIALIZE_UNLOCK_ROUTE);
  });
});
