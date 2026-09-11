import React from 'react';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import * as actions from '../../store/actions';

const mockNavigate = jest.fn();

// jest.fn() records every call, so the mock component can call it with props
// during render without writing to any external variable (which would violate
// the react-compiler rule). Use getCapturedProps() to read the latest render.
const mockLockRender = jest.fn();

jest.mock('./lock.component', () => {
  return (props: Record<string, unknown>) => {
    mockLockRender(props);
    return <div data-testid="mock-lock" />;
  };
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

const renderLockContainer = async (isUnlocked = false) => {
  const store = configureStore({
    ...mockState,
    metamask: { ...mockState.metamask, isUnlocked },
  });
  const { default: LockContainer } = await import('./lock.container.js');
  const TypedLockContainer = LockContainer as unknown as React.ComponentType;
  return renderWithProvider(<TypedLockContainer />, store);
};

const getCapturedProps = () =>
  (mockLockRender.mock.lastCall?.[0] ?? {}) as Record<string, unknown>;

describe('lock.container', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mapStateToProps', () => {
    it('passes isUnlocked: false when the wallet is locked', async () => {
      await renderLockContainer(false);
      expect(getCapturedProps().isUnlocked).toBe(false);
    });

    it('passes isUnlocked: true when the wallet is unlocked', async () => {
      await renderLockContainer(true);
      expect(getCapturedProps().isUnlocked).toBe(true);
    });
  });

  describe('mapDispatchToProps', () => {
    it('dispatches the lockMetamask action when the lockMetamask prop is called', async () => {
      // Return a plain action so the thunk middleware does not try to hit
      // background APIs during the test.
      const fakeAction = { type: 'LOCK_METAMASK_TEST' };
      jest.spyOn(actions, 'lockMetamask').mockReturnValue(fakeAction as never);

      await renderLockContainer(true);

      const { lockMetamask } = getCapturedProps() as {
        lockMetamask: () => void;
      };
      lockMetamask();

      expect(actions.lockMetamask).toHaveBeenCalledTimes(1);
    });
  });

  describe('mergeProps', () => {
    it('forwards navigate from withRouterHooks to the Lock component', async () => {
      await renderLockContainer();
      expect(getCapturedProps().navigate).toBe(mockNavigate);
    });

    it('does not forward location to the Lock component', async () => {
      await renderLockContainer();
      expect(getCapturedProps().location).toBeUndefined();
    });

    it('does not forward params to the Lock component', async () => {
      await renderLockContainer();
      expect(getCapturedProps().params).toBeUndefined();
    });

    it('still forwards isUnlocked and lockMetamask alongside navigate', async () => {
      await renderLockContainer(true);
      expect(getCapturedProps()).toMatchObject({
        navigate: mockNavigate,
        isUnlocked: true,
        lockMetamask: expect.any(Function),
      });
    });
  });
});
