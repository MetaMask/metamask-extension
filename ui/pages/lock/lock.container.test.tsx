import React from 'react';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import * as actions from '../../store/actions';

const mockNavigate = jest.fn();

// Capture the latest props the Lock component receives so each test can assert
// against them without coupling to implementation details of the HOC chain.
let capturedProps: Record<string, unknown> = {};

jest.mock('./lock.component', () => {
  const LockComponent = (props: Record<string, unknown>) => {
    capturedProps = props;
    return <div data-testid="mock-lock" />;
  };
  return LockComponent;
});

// withRouterHooks calls useNavigate / useLocation / useParams. Supply a
// stable location with a non-default `params` so that mergeProps tests can
// confirm params is intentionally stripped.
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/lock',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  }),
  useParams: () => ({ id: 'test-param' }),
}));

const renderLockContainer = (isUnlocked = false) => {
  const store = configureStore({
    ...mockState,
    metamask: { ...mockState.metamask, isUnlocked },
  });
  // Use require so the mock for lock.component is already in place before
  // the module resolves its imports.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const LockContainer = require('./lock.container').default;
  return renderWithProvider(<LockContainer />, store);
};

describe('lock.container', () => {
  beforeEach(() => {
    capturedProps = {};
    jest.clearAllMocks();
  });

  describe('mapStateToProps', () => {
    it('passes isUnlocked: false when the wallet is locked', () => {
      renderLockContainer(false);
      expect(capturedProps.isUnlocked).toBe(false);
    });

    it('passes isUnlocked: true when the wallet is unlocked', () => {
      renderLockContainer(true);
      expect(capturedProps.isUnlocked).toBe(true);
    });
  });

  describe('mapDispatchToProps', () => {
    it('dispatches the lockMetamask action when the lockMetamask prop is called', () => {
      // Return a plain action so the thunk middleware does not try to hit
      // background APIs during the test.
      const fakeAction = { type: 'LOCK_METAMASK_TEST' };
      jest
        .spyOn(actions, 'lockMetamask')
        .mockReturnValue(fakeAction as never);

      renderLockContainer(true);

      const { lockMetamask } = capturedProps as { lockMetamask: () => void };
      lockMetamask();

      expect(actions.lockMetamask).toHaveBeenCalledTimes(1);
    });
  });

  describe('mergeProps', () => {
    it('forwards navigate from withRouterHooks to the Lock component', () => {
      renderLockContainer();
      expect(capturedProps.navigate).toBe(mockNavigate);
    });

    it('does not forward location to the Lock component', () => {
      renderLockContainer();
      expect(capturedProps.location).toBeUndefined();
    });

    it('does not forward params to the Lock component', () => {
      renderLockContainer();
      expect(capturedProps.params).toBeUndefined();
    });

    it('still forwards isUnlocked and lockMetamask alongside navigate', () => {
      renderLockContainer(true);
      expect(capturedProps).toMatchObject({
        navigate: mockNavigate,
        isUnlocked: true,
        lockMetamask: expect.any(Function),
      });
    });
  });
});
