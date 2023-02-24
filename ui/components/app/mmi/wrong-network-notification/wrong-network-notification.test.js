import React from 'react';
import { mount } from 'enzyme';
import { shallowWithContext } from '../../../../test/lib/render-helpers';
import WrongNetworkNotification from './wrong-network-notification.component';

jest.mock('../../../../shared/modules/hash.utils', () => ({
  sha256: jest.fn().mockReturnValue(Promise.resolve('def')),
}));

describe('Wrong Network Notification', function () {
  let wrapper;

  const initialProps = {
    provider: { nickname: 'test' },
    balance: '',
    isCustodianSupportedChain: false,
  };

  beforeEach(() => {
    wrapper = mount(<WrongNetworkNotification {...initialProps} />, {
      context: { t: (str) => `${str}_t` },
    });
  });

  it('should not render if balance is empty', () => {
    expect(wrapper.isEmptyRender()).toBe(true);
  });

  it('should not render if balance is not empty and custodian is not in a wrong network', () => {
    const props = {
      balance: '0x00',
      isCustodianSupportedChain: true,
    };

    wrapper = shallowWithContext(
      <WrongNetworkNotification {...initialProps} {...props} />,
    );

    expect(wrapper.isEmptyRender()).toBe(true);
  });

  it('should render if balance is not empty and custodian is in wrong network', () => {
    const props = {
      balance: '0x00',
    };

    wrapper = shallowWithContext(
      <WrongNetworkNotification {...initialProps} {...props} />,
    );

    expect(wrapper.find('.wrong-network-notification')).toHaveLength(1);
  });
});
