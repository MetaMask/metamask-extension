import { renderHook, act } from '@testing-library/react-hooks';
import * as redux from 'react-redux';
import * as actions from '../../store/actions';
import { useCreateSession } from './useCreateSession';

jest.mock('../../store/actions', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  enableMetaMetrics: jest.fn(),
  disableMetaMetrics: jest.fn(),
  performSignIn: jest.fn(),
  disableProfileSyncing: jest.fn(),
}));

jest.mock('react-redux', () => {
  const actualRedux = jest.requireActual('react-redux');
  return {
    ...actualRedux,
    useSelector: jest.fn(),
    useDispatch: jest.fn(() =>
      jest.fn((action) => {
        if (typeof action === 'function') {
          return action();
        }
        return action;
      }),
    ),
  };
});

describe('useCreateSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize correctly', () => {
    (redux.useSelector as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);
    const { result } = renderHook(() => useCreateSession());
    expect(result.current.createSession).toBeDefined();
  });

  it('should attempt sign in if profile syncing or MetaMetrics participation is enabled', async () => {
    (redux.useSelector as jest.Mock)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    const { result } = renderHook(() => useCreateSession());
    await act(async () => {
      await result.current.createSession();
    });
    expect(actions.performSignIn).toHaveBeenCalled();
  });
});
