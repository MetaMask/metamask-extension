/**
 * @jest-environment node
 */
import { ControllerMessenger } from '@metamask/base-controller';
import { EthAccountType } from '@metamask/keyring-api';
import {
  AlertController,
  AllowedActions,
  AllowedEvents,
  AlertControllerMessenger,
  AlertControllerGetStateAction,
  AlertControllerStateChangeEvent,
  AlertControllerOptions,
  getDefaultAlertControllerState,
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

type WithControllerOptions = Partial<AlertControllerOptions>;

type WithControllerCallback<ReturnValue> = ({
  controller,
}: {
  controller: AlertController;
  messenger: ControllerMessenger<
    AllowedActions | AlertControllerGetStateAction,
    AllowedEvents | AlertControllerStateChangeEvent
  >;
}) => ReturnValue;

type WithControllerArgs<ReturnValue> =
  | [WithControllerCallback<ReturnValue>]
  | [WithControllerOptions, WithControllerCallback<ReturnValue>];

async function withController<ReturnValue>(
  ...args: WithControllerArgs<ReturnValue>
): Promise<ReturnValue> {
  const [{ ...rest }, fn] = args.length === 2 ? args : [{}, args[0]];
  const { ...alertControllerOptions } = rest;

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

  const controller = new AlertController({
    messenger: alertControllerMessenger,
    ...alertControllerOptions,
  });

  return await fn({
    controller,
    messenger: controllerMessenger,
  });
}

describe('AlertController', () => {
  describe('default state', () => {
    it('should be same as AlertControllerState initialized', async () => {
      await withController(({ controller }) => {
        expect(controller.state).toStrictEqual(
          getDefaultAlertControllerState(),
        );
      });
    });
  });

  describe('alertEnabledness', () => {
    it('should default unconnectedAccount of alertEnabledness to true', async () => {
      await withController(({ controller }) => {
        expect(
          controller.state.alertEnabledness.unconnectedAccount,
        ).toStrictEqual(true);
      });
    });

    it('should set unconnectedAccount of alertEnabledness to false', async () => {
      await withController(({ controller }) => {
        controller.setAlertEnabledness('unconnectedAccount', false);
        expect(
          controller.state.alertEnabledness.unconnectedAccount,
        ).toStrictEqual(false);
      });
    });
  });

  describe('unconnectedAccountAlertShownOrigins', () => {
    it('should default unconnectedAccountAlertShownOrigins', async () => {
      await withController(({ controller }) => {
        expect(
          controller.state.unconnectedAccountAlertShownOrigins,
        ).toStrictEqual({});
      });
    });

    it('should set unconnectedAccountAlertShownOrigins', async () => {
      await withController(({ controller }) => {
        controller.setUnconnectedAccountAlertShown('testUnconnectedOrigin');
        expect(
          controller.state.unconnectedAccountAlertShownOrigins,
        ).toStrictEqual({
          testUnconnectedOrigin: true,
        });
      });
    });
  });

  describe('web3ShimUsageOrigins', () => {
    it('should default web3ShimUsageOrigins', async () => {
      await withController(({ controller }) => {
        expect(controller.state.web3ShimUsageOrigins).toStrictEqual({});
      });
    });

    it('should set origin of web3ShimUsageOrigins to recorded', async () => {
      await withController(({ controller }) => {
        controller.setWeb3ShimUsageRecorded('testWeb3ShimUsageOrigin');
        expect(controller.state.web3ShimUsageOrigins).toStrictEqual({
          testWeb3ShimUsageOrigin: 1,
        });
      });
    });
    it('should set origin of web3ShimUsageOrigins to dismissed', async () => {
      await withController(({ controller }) => {
        controller.setWeb3ShimUsageAlertDismissed('testWeb3ShimUsageOrigin');
        expect(controller.state.web3ShimUsageOrigins).toStrictEqual({
          testWeb3ShimUsageOrigin: 2,
        });
      });
    });
  });

  describe('selectedAccount change', () => {
    it('should set unconnectedAccountAlertShownOrigins to {}', async () => {
      await withController(({ controller, messenger }) => {
        messenger.publish('AccountsController:selectedAccountChange', {
          id: '',
          address: '0x1234567',
          options: {},
          methods: [],
          scopes: ['eip155'],
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
      });
    });
  });
});
