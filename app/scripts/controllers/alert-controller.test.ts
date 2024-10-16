/**
 * @jest-environment node
 */
import { ControllerMessenger } from '@metamask/base-controller';
import { KeyringControllerStateChangeEvent } from '@metamask/keyring-controller';
import { SnapControllerStateChangeEvent } from '@metamask/snaps-controllers';
import { EthAccountType } from '@metamask/keyring-api';
import {
  AlertControllerActions,
  AlertControllerEvents,
  AlertController,
  AllowedActions,
  AllowedEvents,
  AlertControllerState,
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
describe('AlertController', () => {
  let controllerMessenger: ControllerMessenger<
    AlertControllerActions | AllowedActions,
    | AlertControllerEvents
    | KeyringControllerStateChangeEvent
    | SnapControllerStateChangeEvent
    | AllowedEvents
  >;
  let alertController: AlertController;

  beforeEach(() => {
    controllerMessenger = new ControllerMessenger<
      AllowedActions,
      AllowedEvents
    >();
    controllerMessenger.registerActionHandler(
      'AccountsController:getSelectedAccount',
      () => EMPTY_ACCOUNT,
    );

    const alertMessenger = controllerMessenger.getRestricted({
      name: 'AlertController',
      allowedActions: [`AccountsController:getSelectedAccount`],
      allowedEvents: [`AccountsController:selectedAccountChange`],
    });

    alertController = new AlertController({
      state: {
        unconnectedAccountAlertShownOrigins: {
          testUnconnectedOrigin: false,
        },
        web3ShimUsageOrigins: {
          testWeb3ShimUsageOrigin: 0,
        },
      },
      controllerMessenger: alertMessenger,
    });
  });

  describe('default state', () => {
    it('should be same as AlertControllerState initialized', () => {
      expect(alertController.store.getState()).toStrictEqual({
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
    it('should default unconnectedAccount of alertEnabledness to true', () => {
      expect(
        alertController.store.getState().alertEnabledness.unconnectedAccount,
      ).toStrictEqual(true);
    });

    it('should set unconnectedAccount of alertEnabledness to false', () => {
      alertController.setAlertEnabledness('unconnectedAccount', false);
      expect(
        alertController.store.getState().alertEnabledness.unconnectedAccount,
      ).toStrictEqual(false);
      expect(
        controllerMessenger.call('AlertController:getState').alertEnabledness
          .unconnectedAccount,
      ).toStrictEqual(false);
    });
  });

  describe('unconnectedAccountAlertShownOrigins', () => {
    it('should default unconnectedAccountAlertShownOrigins', () => {
      expect(
        alertController.store.getState().unconnectedAccountAlertShownOrigins,
      ).toStrictEqual({
        testUnconnectedOrigin: false,
      });
      expect(
        controllerMessenger.call('AlertController:getState')
          .unconnectedAccountAlertShownOrigins,
      ).toStrictEqual({
        testUnconnectedOrigin: false,
      });
    });

    it('should set unconnectedAccountAlertShownOrigins', () => {
      alertController.setUnconnectedAccountAlertShown('testUnconnectedOrigin');
      expect(
        alertController.store.getState().unconnectedAccountAlertShownOrigins,
      ).toStrictEqual({
        testUnconnectedOrigin: true,
      });
      expect(
        controllerMessenger.call('AlertController:getState')
          .unconnectedAccountAlertShownOrigins,
      ).toStrictEqual({
        testUnconnectedOrigin: true,
      });
    });
  });

  describe('web3ShimUsageOrigins', () => {
    it('should default web3ShimUsageOrigins', () => {
      expect(
        alertController.store.getState().web3ShimUsageOrigins,
      ).toStrictEqual({
        testWeb3ShimUsageOrigin: 0,
      });
      expect(
        controllerMessenger.call('AlertController:getState')
          .web3ShimUsageOrigins,
      ).toStrictEqual({
        testWeb3ShimUsageOrigin: 0,
      });
    });

    it('should set origin of web3ShimUsageOrigins to recorded', () => {
      alertController.setWeb3ShimUsageRecorded('testWeb3ShimUsageOrigin');
      expect(
        alertController.store.getState().web3ShimUsageOrigins,
      ).toStrictEqual({
        testWeb3ShimUsageOrigin: 1,
      });
      expect(
        controllerMessenger.call('AlertController:getState')
          .web3ShimUsageOrigins,
      ).toStrictEqual({
        testWeb3ShimUsageOrigin: 1,
      });
    });
    it('should set origin of web3ShimUsageOrigins to dismissed', () => {
      alertController.setWeb3ShimUsageAlertDismissed('testWeb3ShimUsageOrigin');
      expect(
        alertController.store.getState().web3ShimUsageOrigins,
      ).toStrictEqual({
        testWeb3ShimUsageOrigin: 2,
      });
      expect(
        controllerMessenger.call('AlertController:getState')
          .web3ShimUsageOrigins,
      ).toStrictEqual({
        testWeb3ShimUsageOrigin: 2,
      });
    });
  });

  describe('selectedAccount change', () => {
    it('should set unconnectedAccountAlertShownOrigins to {}', () => {
      controllerMessenger.publish('AccountsController:selectedAccountChange', {
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
        alertController.store.getState().unconnectedAccountAlertShownOrigins,
      ).toStrictEqual({});
      expect(
        controllerMessenger.call('AlertController:getState')
          .unconnectedAccountAlertShownOrigins,
      ).toStrictEqual({});
    });
  });


  describe('AlertController:getState', () => {
    it('should return the current state of the property', () => {
      const defaultWeb3ShimUsageOrigins = {
        testWeb3ShimUsageOrigin: 0,
      };
      expect(
        alertController.store.getState().web3ShimUsageOrigins,
      ).toStrictEqual(defaultWeb3ShimUsageOrigins);
      expect(
        controllerMessenger.call('AlertController:getState')
          .web3ShimUsageOrigins,
      ).toStrictEqual(defaultWeb3ShimUsageOrigins);
    });
  });

  describe('AlertController:stateChange', () => {
    it('state will be published when there is state change', () => {
      expect(
        alertController.store.getState().web3ShimUsageOrigins,
      ).toStrictEqual({
        testWeb3ShimUsageOrigin: 0,
      });

      controllerMessenger.subscribe(
        'AlertController:stateChange',
        (state: Partial<AlertControllerState>) => {
          expect(state.web3ShimUsageOrigins).toStrictEqual({
            testWeb3ShimUsageOrigin: 1,
          });
        },
      );

      alertController.setWeb3ShimUsageRecorded('testWeb3ShimUsageOrigin');

      expect(
        alertController.store.getState().web3ShimUsageOrigins,
      ).toStrictEqual({
        testWeb3ShimUsageOrigin: 1,
      });
      expect(
        controllerMessenger.call('AlertController:getState')
          .web3ShimUsageOrigins,
      ).toStrictEqual({
        testWeb3ShimUsageOrigin: 1,
      });
    });
  });
});
