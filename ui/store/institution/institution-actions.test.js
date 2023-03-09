import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import MetaMaskController from '../../../app/scripts/metamask-controller';
import { _setBackgroundConnection } from '../action-queue';
import {
  showInteractiveReplacementTokenModal,
  showCustodyConfirmLink,
  checkForUnapprovedTypedMessages,
} from './institution-actions';

const middleware = [thunk];
const defaultState = {
  metamask: {
    currentLocale: 'test',
    selectedAddress: '0xFirstAddress',
    provider: { chainId: '0x1' },
    accounts: {
      '0xFirstAddress': {
        balance: '0x0',
      },
    },
    identities: {
      '0xFirstAddress': {},
    },
    cachedBalances: {
      '0x1': {
        '0xFirstAddress': '0x0',
      },
    },
  },
};

const mockStore = (state = defaultState) => configureStore(middleware)(state);
const baseMockState = defaultState.metamask;

describe('#InstitutionActions', () => {
  let background;

  beforeEach(async () => {
    background = sinon.createStubInstance(MetaMaskController, {
      getState: sinon.stub().callsFake((cb) => cb(null, baseMockState)),
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('calls showModal with the property name of showInteractiveReplacementTokenModal', async () => {
    const store = mockStore();

    background.getApi.returns({
      setFeatureFlag: sinon
        .stub()
        .callsFake((_, __, cb) => cb(new Error('error'))),
    });

    _setBackgroundConnection(background.getApi());

    const expectedActions = [
      {
        type: 'UI_MODAL_OPEN',
        payload: { name: 'INTERACTIVE_REPLACEMENT_TOKEN_MODAL' },
      },
    ];

    await store.dispatch(showInteractiveReplacementTokenModal());

    expect(store.getActions()).toStrictEqual(expectedActions);
  });

  it('calls showModal with the property name of showCustodyConfirmLink', async () => {
    const store = mockStore();

    background.getApi.returns({
      setFeatureFlag: sinon
        .stub()
        .callsFake((_, __, cb) => cb(new Error('error'))),
    });

    _setBackgroundConnection(background.getApi());

    const expectedActions = [
      {
        type: 'UI_MODAL_OPEN',
        payload: {
          name: 'CUSTODY_CONFIRM_LINK',
          link: 'link',
          address: '0x1',
          closeNotification: false,
          custodyId: 'custodyId',
        },
      },
    ];

    await store.dispatch(
      showCustodyConfirmLink('link', '0x1', false, 'custodyId'),
    );

    expect(store.getActions()).toStrictEqual(expectedActions);
  });
});

describe('#checkForUnapprovedTypedMessages', () => {
  it('calls checkForUnapprovedTypedMessages and returns the messageData', async () => {
    const messageData = {
      id: 1,
      type: 'tx',
      msgParams: {
        metamaskId: 2,
        data: '0x1',
      },
      custodyId: '123',
      status: 'unapproved',
    };

    expect(
      checkForUnapprovedTypedMessages(messageData, {
        unapprovedTypedMessages: { msg: 'msg' },
      }),
    ).toBe(messageData);
  });
});
