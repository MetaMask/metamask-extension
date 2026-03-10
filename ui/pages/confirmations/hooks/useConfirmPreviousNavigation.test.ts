import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as ConfirmContext from '../context/confirm';
import {
  CONFIRM_RETURN_TO_KEY,
  RETURN_TO_PREVIOUS_TYPES,
  setConfirmReturnTo,
  useConfirmPreviousNavigation,
} from './useConfirmPreviousNavigation';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => async (fn: () => Promise<unknown>) => {
    if (fn) {
      await fn();
    }
  },
}));

describe('useConfirmPreviousNavigation', () => {
  afterEach(() => {
    jest.clearAllMocks();
    sessionStorage.removeItem(CONFIRM_RETURN_TO_KEY);
  });

  const renderHook = () => {
    const { result } = renderHookWithProvider(
      useConfirmPreviousNavigation,
      mockState,
    );
    return result.current;
  };

  it('returns navigateBackToPrevious method', () => {
    jest
      .spyOn(ConfirmContext, 'useConfirmContext')
      .mockReturnValue({} as unknown as ConfirmContext.ConfirmContextType);

    const result = renderHook();

    expect(result.navigateBackToPrevious).toBeDefined();
  });

  it('navigates to stored path for musdConversion type', () => {
    sessionStorage.setItem(CONFIRM_RETURN_TO_KEY, '/asset/0x1/0xabc');

    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { type: 'musdConversion' },
    } as unknown as ConfirmContext.ConfirmContextType);

    const result = renderHook();
    result.navigateBackToPrevious();

    expect(mockUseNavigate).toHaveBeenCalledWith('/asset/0x1/0xabc');
    expect(sessionStorage.getItem(CONFIRM_RETURN_TO_KEY)).toBeNull();
  });

  it('navigates to stored path for musdClaim type', () => {
    sessionStorage.setItem(CONFIRM_RETURN_TO_KEY, '/asset/0x1/0xdef');

    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { type: 'musdClaim' },
    } as unknown as ConfirmContext.ConfirmContextType);

    const result = renderHook();
    result.navigateBackToPrevious();

    expect(mockUseNavigate).toHaveBeenCalledWith('/asset/0x1/0xdef');
    expect(sessionStorage.getItem(CONFIRM_RETURN_TO_KEY)).toBeNull();
  });

  it('navigates to DEFAULT_ROUTE when no stored path exists', () => {
    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { type: 'musdConversion' },
    } as unknown as ConfirmContext.ConfirmContextType);

    const result = renderHook();
    result.navigateBackToPrevious();

    expect(mockUseNavigate).toHaveBeenCalledWith('/');
  });

  it('does not navigate for non-matching types', () => {
    sessionStorage.setItem(CONFIRM_RETURN_TO_KEY, '/some-page');

    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { type: 'contractInteraction' },
    } as unknown as ConfirmContext.ConfirmContextType);

    const result = renderHook();
    result.navigateBackToPrevious();

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });
});

describe('setConfirmReturnTo', () => {
  afterEach(() => {
    sessionStorage.removeItem(CONFIRM_RETURN_TO_KEY);
  });

  it('stores pathname and search in sessionStorage', () => {
    setConfirmReturnTo('/asset/0x1/0xabc', '?tab=tokens');

    expect(sessionStorage.getItem(CONFIRM_RETURN_TO_KEY)).toBe(
      '/asset/0x1/0xabc?tab=tokens',
    );
  });

  it('stores pathname only when search is empty', () => {
    setConfirmReturnTo('/asset/0x1/0xabc');

    expect(sessionStorage.getItem(CONFIRM_RETURN_TO_KEY)).toBe(
      '/asset/0x1/0xabc',
    );
  });
});

describe('RETURN_TO_PREVIOUS_TYPES', () => {
  it('includes musdConversion and musdClaim', () => {
    expect(RETURN_TO_PREVIOUS_TYPES).toContain('musdConversion');
    expect(RETURN_TO_PREVIOUS_TYPES).toContain('musdClaim');
  });
});
