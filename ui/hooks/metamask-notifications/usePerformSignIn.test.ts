import { renderHook, act } from '@testing-library/react-hooks';
import * as redux from 'react-redux';
import { usePerformSignIn } from './usePerformSignIn';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

describe('useSession', () => {
  it('should initialize correctly', () => {
    (redux.useSelector as jest.Mock).mockReturnValue(false);
    const { result } = renderHook(() => usePerformSignIn());
    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle sign in correctly', async () => {
    const { result } = renderHook(() => usePerformSignIn());
    await act(async () => {
      await result.current.handleSignIn();
    });
    expect(result.current.loading).toBe(false);
  });

  it('should set error on sign in failure', async () => {
    const dispatchMock = jest.fn().mockRejectedValue(new Error('Failed'));
    (redux.useDispatch as jest.Mock).mockImplementation(() => dispatchMock);
    const { result } = renderHook(() => usePerformSignIn());
    await act(async () => {
      await result.current.handleSignIn();
    });
    expect(result.current.error).toBe('Failed');
  });
});
