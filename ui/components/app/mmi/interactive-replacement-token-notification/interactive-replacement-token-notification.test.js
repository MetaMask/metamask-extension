import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import { shallowWithContext } from '../../../../../test/lib/render-helpers';
import InteractiveReplacementTokenNotification from './interactive-replacement-token-notification.component';

jest.mock('../../../../shared/modules/hash.utils', () => ({
  sha256: jest.fn().mockReturnValue(Promise.resolve('def')),
}));

describe('Interactive Replacement Token Notification', function () {
  let wrapper;
  const address = '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f';

  const initialProps = {
    keyring: {},
    address,
    isUnlocked: false,
    interactiveReplacementToken: { oldRefreshToken: 'abc' },
    showInteractiveReplacementTokenModal: sinon.spy(),
    getCustodianToken: sinon.spy(),
    getCustodyAccountDetails: sinon.spy(),
  };

  beforeEach(() => {
    wrapper = mount(
      <InteractiveReplacementTokenNotification {...initialProps} />,
      { context: { t: (str) => `${str}_t` } },
    );
  });

  it('should not render if show notification is false', () => {
    expect(wrapper.isEmptyRender()).toBe(true);
  });

  it('should render if show notification is true and click on lern more', () => {
    expect(wrapper.instance().state.showNotification).toBe(false);

    wrapper.setState({
      showNotification: true,
    });

    expect(wrapper.instance().state.showNotification).toBe(true);
    expect(
      wrapper.find('.interactive-replacement-token-notification'),
    ).toHaveLength(1);

    wrapper.find({ 'data-testid': 'show-modal' }).simulate('click');
    expect(initialProps.showInteractiveReplacementTokenModal.calledOnce).toBe(
      true,
    );
  });

  it('should render and call showNotification in componenDidMount', async () => {
    const props = {
      keyring: { type: 'Custody' },
      isUnlocked: true,
      interactiveReplacementToken: { oldRefreshToken: 'def', url: 'url' },
      showInteractiveReplacementTokenModal: sinon.spy(),
      getCustodianToken: sinon.stub().resolves('token'),
      getCustodyAccountDetails: sinon.stub().resolves([
        {
          address,
          authDetails: { refreshToken: 'def' },
        },
      ]),
    };

    wrapper = shallowWithContext(
      <InteractiveReplacementTokenNotification {...initialProps} {...props} />,
    );

    expect(await props.getCustodianToken.calledOnce).toBe(true);
    expect(
      await props.getCustodyAccountDetails.calledWith(props.keyring, 'token'),
    ).toBe(true);

    await wrapper.update();
    expect(wrapper.state('showNotification')).toBe(true);
  });
});
