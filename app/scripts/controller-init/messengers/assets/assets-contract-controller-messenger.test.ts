import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getAssetsContractControllerInitMessenger,
  getAssetsContractControllerMessenger,
} from './assets-contract-controller-messenger';

describe('getAssetsContractControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const assetsContractControllerMessenger =
      getAssetsContractControllerMessenger(messenger);

    expect(assetsContractControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});

describe('getAssetsContractControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const assetsContractControllerInitMessenger =
      getAssetsContractControllerInitMessenger(messenger);

    expect(assetsContractControllerInitMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
