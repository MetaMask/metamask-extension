import React from 'react';
import { mountWithRouter } from '../../../../../test/lib/render-helpers';
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
    const props = {
      completedOnboarding: null,
      isInitialized: null,
      isUnlocked: null,
      seedPhraseBackedUp: null,
    };
    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />,
    );
    expect(
      wrapper
        .find('Lifecycle')
        .find({ to: { pathname: INITIALIZE_WELCOME_ROUTE } }),
    ).toHaveLength(1);
  });

  it('redirects to / route when completedOnboarding is true', () => {
    const props = {
      completedOnboarding: true,
    };
    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />,
    );

    expect(
      wrapper.find('Lifecycle').find({ to: { pathname: DEFAULT_ROUTE } }),
    ).toHaveLength(1);
  });

  it('redirects to end of flow route when seedPhraseBackedUp is true', () => {
    const props = {
      completedOnboarding: false,
      seedPhraseBackedUp: true,
    };
    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />,
    );

    expect(
      wrapper
        .find('Lifecycle')
        .find({ to: { pathname: INITIALIZE_END_OF_FLOW_ROUTE } }),
    ).toHaveLength(1);
  });

  it('redirects to end of flow route when seedPhraseBackedUp is false', () => {
    const props = {
      completedOnboarding: false,
      seedPhraseBackedUp: false,
    };
    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />,
    );

    expect(
      wrapper
        .find('Lifecycle')
        .find({ to: { pathname: INITIALIZE_END_OF_FLOW_ROUTE } }),
    ).toHaveLength(1);
  });

  it('redirects to /lock route when isUnlocked is true', () => {
    const props = {
      completedOnboarding: false,
      isUnlocked: true,
      seedPhraseBackedUp: null,
    };

    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />,
    );

    expect(
      wrapper.find('Lifecycle').find({ to: { pathname: LOCK_ROUTE } }),
    ).toHaveLength(1);
  });

  it('redirects to /welcome route when isInitialized is false', () => {
    const props = {
      completedOnboarding: false,
      isUnlocked: false,
      isInitialized: false,
      seedPhraseBackedUp: null,
    };

    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />,
    );

    expect(
      wrapper
        .find('Lifecycle')
        .find({ to: { pathname: INITIALIZE_WELCOME_ROUTE } }),
    ).toHaveLength(1);
  });

  it('redirects to /unlock route when isInitialized is true', () => {
    const props = {
      completedOnboarding: false,
      isUnlocked: false,
      isInitialized: true,
      seedPhraseBackedUp: null,
    };

    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />,
    );

    expect(
      wrapper
        .find('Lifecycle')
        .find({ to: { pathname: INITIALIZE_UNLOCK_ROUTE } }),
    ).toHaveLength(1);
  });
});
