import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getAssetsContractControllerInitMessenger,
  getAssetsContractControllerMessenger,
} from './assets-contract-controller-messenger';

describe('getAssetsContractControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsContractControllerMessenger =
      getAssetsContractControllerMessenger(messenger);

    expect(assetsContractControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getAssetsContractControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsContractControllerInitMessenger =
      getAssetsContractControllerInitMessenger(messenger);

    expect(assetsContractControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
