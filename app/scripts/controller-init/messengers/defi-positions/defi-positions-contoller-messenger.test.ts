import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getDeFiPositionsControllerInitMessenger,
  getDeFiPositionsControllerMessenger,
} from './defi-positions-controller-messenger';

describe('getDefiPositionsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const defiPositionsControllerMessenger =
      getDeFiPositionsControllerMessenger(messenger);

    expect(defiPositionsControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});

describe('getDeFiPositionsControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const defiPositionsControllerInitMessenger =
      getDeFiPositionsControllerInitMessenger(messenger);

    expect(defiPositionsControllerInitMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
