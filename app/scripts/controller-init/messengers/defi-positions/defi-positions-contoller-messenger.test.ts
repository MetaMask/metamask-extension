import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getDeFiPositionsControllerInitMessenger,
  getDeFiPositionsControllerMessenger,
} from './defi-positions-controller-messenger';

describe('getDefiPositionsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const defiPositionsControllerMessenger =
      getDeFiPositionsControllerMessenger(messenger);

    expect(defiPositionsControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getDeFiPositionsControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const defiPositionsControllerInitMessenger =
      getDeFiPositionsControllerInitMessenger(messenger);

    expect(defiPositionsControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
