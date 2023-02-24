import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import { MAINNET_DEFAULT_BLOCK_EXPLORER_URL } from '../../../shared/constants/swaps';
import { shortenAddress } from '../../helpers/utils/util';
import InteractiveReplacementTokenPage from './interactive-replacement-token-page.component';

describe('Interactive Replacement Token Page', function () {
  const address = '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f';
  const accountName = 'Jupiter';
  const labels = [
    {
      key: 'service',
      value: 'label test',
    },
  ];
  let wrapper;

  const props = {
    history: {
      push: sinon.spy(),
    },
    keyring: { type: 'Custody' },
    mostRecentOverviewPage: 'home',
    connectRequests: [
      {
        labels: [
          {
            key: 'service',
            value: 'test',
          },
        ],
        origin: 'origin',
        token: 'testToken',
        feature: 'custodian',
        service: 'Jupiter',
        apiUrl: 'https://',
        environment: 'Jupiter',
      },
    ],
    custodian: {
      production: true,
      name: 'Jupiter',
      type: 'Jupiter',
      iconUrl: 'iconUrl',
      displayName: 'displayName',
    },

    metaMaskAccounts: { [address]: { balance: '0x' } },
    removeAddTokenConnectRequest: sinon.spy(),
    setCustodianNewRefreshToken: sinon.spy(),
    showInteractiveReplacementTokenBanner: sinon.spy(),
    getCustodianAccounts: sinon.stub().resolves([
      {
        address,
        name: accountName,
        labels,
      },
    ]),
    url: 'https://saturn-custody-ui.codefi.network/',
  };

  beforeEach(() => {
    wrapper = mount(<InteractiveReplacementTokenPage {...props} />, {
      context: { t: (str) => `${str}_t` },
    });
  });

  afterEach(() => {
    props.history.push.resetHistory();
  });

  it('should render all the accounts correctly', () => {
    expect(wrapper.html()).toContain(accountName);
    expect(wrapper.html()).toContain(
      `${MAINNET_DEFAULT_BLOCK_EXPLORER_URL}address/${address}`,
    );
    expect(wrapper.html()).toContain(shortenAddress(address));
    expect(wrapper.html()).toContain('label test');
  });

  it('should render and call getTokenAccounts in componenDidMount and return a list of accounts', async () => {
    expect(await props.getCustodianAccounts.called).toBe(true);

    wrapper.update();

    expect(wrapper.state('tokenAccounts')).toStrictEqual([
      {
        address,
        balance: props.metaMaskAccounts[address.toLowerCase()]?.balance,
        labels,
        name: props.custodian.name,
      },
    ]);
  });

  it('should render and call getTokenAccounts in componenDidMount and not return a list of accounts if connectRequests is empty', async () => {
    const nextProps = {
      connectRequests: null,
    };

    wrapper = mount(
      <InteractiveReplacementTokenPage {...props} {...nextProps} />,
      {
        context: { t: (str) => `${str}_t` },
      },
    );

    expect(props.history.push.calledWith(props.mostRecentOverviewPage)).toBe(
      true,
    );
  });

  it('runs removeAddTokenConnectRequest on cancel click', () => {
    const connectRequest = props.connectRequests[0];
    const cancelButton = wrapper.find(
      '.btn-default.page-container__footer-button',
    );

    cancelButton.simulate('click');

    expect(
      props.removeAddTokenConnectRequest.calledWith({
        origin: connectRequest.origin,
        apiUrl: connectRequest.apiUrl,
        token: connectRequest.token,
      }),
    ).toBe(true);
    expect(props.history.push.calledWith(props.mostRecentOverviewPage)).toBe(
      true,
    );
  });

  it('runs setCustodianNewRefreshToken on confirm click', async () => {
    const connectRequest = props.connectRequests[0];
    const confirmButton = wrapper.find(
      '.btn-primary.page-container__footer-button',
    );

    await confirmButton.simulate('click');

    expect(
      props.setCustodianNewRefreshToken.calledWith({
        address,
        newAuthDetails: {
          refreshToken: connectRequest.token,
          refreshTokenUrl: connectRequest.apiUrl,
        },
      }),
    ).toBe(true);
    expect(props.showInteractiveReplacementTokenBanner.called).toBe(true);
    expect(
      props.removeAddTokenConnectRequest.calledWith({
        origin: connectRequest.origin,
        apiUrl: connectRequest.apiUrl,
        token: connectRequest.token,
      }),
    ).toBe(true);
    expect(props.history.push.called).toBe(true);
  });

  it('tries to open new tab with deeplink URL when there is an error', async () => {
    wrapper.setState({
      error: true,
    });

    wrapper.update();

    const confirmButton = wrapper.find(
      '.btn-primary.page-container__footer-button',
    );

    await confirmButton.simulate('click');

    global.platform = { openTab: sinon.spy() };
    const button = wrapper.find({ children: props.custodian.displayName });
    button.simulate('click');
    expect(global.platform.openTab.calledOnce).toBe(true);
    expect(global.platform.openTab.calledWith({ url: props.url })).toBe(true);
    expect(
      wrapper.find('.interactive-replacement-token-page__accounts__error'),
    ).toHaveLength(1);
  });

  it('handles error', () => {
    const confirmButton = wrapper.find(
      '.btn-primary.page-container__footer-button',
    );
    try {
      confirmButton.simulate('click');
    } catch (e) {
      const errorMessage = wrapper.find('.error');
      // eslint-disable-next-line jest/no-conditional-expect
      expect(errorMessage.html()).toContain('testError');
    }
  });
});
