/**
 * @jest-environment node
 */
import { ControllerMessenger } from '@metamask/base-controller';
import { EthAccountType } from '@metamask/keyring-api';
import {
  AlertController,
  AllowedActions,
  AllowedEvents,
  AlertControllerState,
  AlertControllerMessenger,
  AlertControllerGetStateAction,
  AlertControllerStateChangeEvent,
} from './alert-controller';

const EMPTY_ACCOUNT = {
  id: '',
  address: '',
  options: {},
  methods: [],
  type: EthAccountType.Eoa,
  metadata: {
    name: '',
    keyring: {
      type: '',
    },
    importTime: 0,
  },
};

const setupController = ({
  state,
}: {
  state?: Partial<AlertControllerState>;
}) => {
  const controllerMessenger = new ControllerMessenger<
    AllowedActions | AlertControllerGetStateAction,
    AllowedEvents | AlertControllerStateChangeEvent
  >();
  const alertControllerMessenger: AlertControllerMessenger =
    controllerMessenger.getRestricted({
      name: 'AlertController',
      allowedActions: ['AccountsController:getSelectedAccount'],
      allowedEvents: ['AccountsController:selectedAccountChange'],
    });

  controllerMessenger.registerActionHandler(
    'AccountsController:getSelectedAccount',
    jest.fn().mockReturnValue(EMPTY_ACCOUNT),
  );
  const initialState = {
    unconnectedAccountAlertShownOrigins: {
      testUnconnectedOrigin: false,
    },
    web3ShimUsageOrigins: {
      testWeb3ShimUsageOrigin: 0,
    },
  };
  const controller = new AlertController({
    messenger: alertControllerMessenger,
    state: {
      ...initialState,
      ...state,
    },
  });

  return {
    controller,
    messenger: controllerMessenger,
  };
};

describe('AlertController', () => {
  describe('default state', () => {
    it('should be same as AlertControllerState initialized', () => {
      const { controller } = setupController({});
      expect(controller.state).toStrictEqual({
        alertEnabledness: {
          unconnectedAccount: true,
          web3ShimUsage: true,
        },
        unconnectedAccountAlertShownOrigins: {
          testUnconnectedOrigin: false,
        },
        web3ShimUsageOrigins: {
          testWeb3ShimUsageOrigin: 0,
        },
      });
    });
  });

  describe('alertEnabledness', () => {
    const { controller, messenger } = setupController({});
    it('should default unconnectedAccount of alertEnabledness to true', () => {
      expect(
        controller.state.alertEnabledness.unconnectedAccount,
      ).toStrictEqual(true);
    });

    it('should set unconnectedAccount of alertEnabledness to false', () => {
      controller.setAlertEnabledness('unconnectedAccount', false);
      expect(
        controller.state.alertEnabledness.unconnectedAccount,
      ).toStrictEqual(false);
      expect(
        messenger.call('AlertController:getState').alertEnabledness
          .unconnectedAccount,
      ).toStrictEqual(false);
    });
  });

  describe('unconnectedAccountAlertShownOrigins', () => {
    const { controller, messenger } = setupController({});
    it('should default unconnectedAccountAlertShownOrigins', () => {
      expect(
        controller.state.unconnectedAccountAlertShownOrigins,
      ).toStrictEqual({
        testUnconnectedOrigin: false,
      });
      expect(
        messenger.call('AlertController:getState')
          .unconnectedAccountAlertShownOrigins,
      ).toStrictEqual({
        testUnconnectedOrigin: false,
      });
    });

    it('should set unconnectedAccountAlertShownOrigins', () => {
      controller.setUnconnectedAccountAlertShown('testUnconnectedOrigin');
      expect(
        controller.state.unconnectedAccountAlertShownOrigins,
      ).toStrictEqual({
        testUnconnectedOrigin: true,
      });
      expect(
        messenger.call('AlertController:getState')
          .unconnectedAccountAlertShownOrigins,
      ).toStrictEqual({
        testUnconnectedOrigin: true,
      });
    });
  });

  describe('web3ShimUsageOrigins', () => {
    const { controller, messenger } = setupController({});
    it('should default web3ShimUsageOrigins', () => {
      expect(controller.state.web3ShimUsageOrigins).toStrictEqual({
        testWeb3ShimUsageOrigin: 0,
      });
      expect(
        messenger.call('AlertController:getState').web3ShimUsageOrigins,
      ).toStrictEqual({
        testWeb3ShimUsageOrigin: 0,
      });
    });

    it('should set origin of web3ShimUsageOrigins to recorded', () => {
      controller.setWeb3ShimUsageRecorded('testWeb3ShimUsageOrigin');
      expect(controller.state.web3ShimUsageOrigins).toStrictEqual({
        testWeb3ShimUsageOrigin: 1,
      });
      expect(
        messenger.call('AlertController:getState').web3ShimUsageOrigins,
      ).toStrictEqual({
        testWeb3ShimUsageOrigin: 1,
      });
    });
    it('should set origin of web3ShimUsageOrigins to dismissed', () => {
      controller.setWeb3ShimUsageAlertDismissed('testWeb3ShimUsageOrigin');
      expect(controller.state.web3ShimUsageOrigins).toStrictEqual({
        testWeb3ShimUsageOrigin: 2,
      });
      expect(
        messenger.call('AlertController:getState').web3ShimUsageOrigins,
      ).toStrictEqual({
        testWeb3ShimUsageOrigin: 2,
      });
    });
  });

  describe('selectedAccount change', () => {
    const { controller, messenger } = setupController({});
    it('should set unconnectedAccountAlertShownOrigins to {}', () => {
      messenger.publish('AccountsController:selectedAccountChange', {
        id: '',
        address: '0x1234567',
        options: {},
        methods: [],
        type: 'eip155:eoa',
        metadata: {
          name: '',
          keyring: {
            type: '',
          },
          importTime: 0,
        },
      });
      expect(
        controller.state.unconnectedAccountAlertShownOrigins,
      ).toStrictEqual({});
      expect(
        messenger.call('AlertController:getState')
          .unconnectedAccountAlertShownOrigins,
      ).toStrictEqual({});
    });
  });

  describe('AlertController:getState', () => {
    const { controller, messenger } = setupController({});
    it('should return the current state of the property', () => {
      const defaultWeb3ShimUsageOrigins = {
        testWeb3ShimUsageOrigin: 0,
      };
      expect(controller.state.web3ShimUsageOrigins).toStrictEqual(
        defaultWeb3ShimUsageOrigins,
      );
      expect(
        messenger.call('AlertController:getState').web3ShimUsageOrigins,
      ).toStrictEqual(defaultWeb3ShimUsageOrigins);
    });
  });

  describe('AlertController:stateChange', () => {
    const { controller, messenger } = setupController({});
    it('state will be published when there is state change', () => {
      expect(controller.state.web3ShimUsageOrigins).toStrictEqual({
        testWeb3ShimUsageOrigin: 0,
      });

      messenger.subscribe(
        'AlertController:stateChange',
        (state: Partial<AlertControllerState>) => {
          expect(state.web3ShimUsageOrigins).toStrictEqual({
            testWeb3ShimUsageOrigin: 1,
          });
        },
      );

      controller.setWeb3ShimUsageRecorded('testWeb3ShimUsageOrigin');

      expect(controller.state.web3ShimUsageOrigins).toStrictEqual({
        testWeb3ShimUsageOrigin: 1,
      });
      expect(
        controller.getWeb3ShimUsageState('testWeb3ShimUsageOrigin'),
      ).toStrictEqual(1);
      expect(
        messenger.call('AlertController:getState').web3ShimUsageOrigins,
      ).toStrictEqual({
        testWeb3ShimUsageOrigin: 1,
      });
    });
  });
});
