import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import { SendPages } from '../../constants/send';
import * as SendContext from '../../context/send';
import { useSendQueryParams } from './useSendQueryParams';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({ pathname: '/send/asset' }),
  useSearchParams: () => [{ get: () => null }],
}));

function renderHook() {
  const { result } = renderHookWithProvider(useSendQueryParams, mockState);
  return result.current;
}

describe('useSendQueryParams', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('call SendContext.updateCurrentPage with correct parameters', () => {
    const mockUpdateCurrentPage = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      updateCurrentPage: mockUpdateCurrentPage,
    } as unknown as SendContext.SendContextType);
    renderHook();
    expect(mockUpdateCurrentPage).toHaveBeenCalledWith(SendPages.ASSET);
  });
});
