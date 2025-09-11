import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getAssetsContractControllerMessenger } from './assets-contract-controller-messenger';

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
