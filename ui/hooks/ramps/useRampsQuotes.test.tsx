import { renderHook } from '@testing-library/react-hooks';
import { useRampsQuotes } from './useRampsQuotes';
import { createRampsTestWrapper } from './test-utils';

jest.mock('../../store/controller-actions/ramps-controller', () => ({
  getRampsQuotes: jest.fn(),
  getRampsBuyWidgetData: jest.fn(),
}));

describe('useRampsQuotes', () => {
  it('matches snapshot when query is disabled', () => {
    const { result } = renderHook(() => useRampsQuotes(), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current).toMatchSnapshot();
  });
});
