import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
import { useAdvancedDetailsHandler } from './advanced-details-context';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('useAdvancedDetailsHandler', () => {
  it('throws an error if used outside of useAdvancedDetailsHandlerProvider', () => {
    const { result } = renderHookWithProvider(() =>
      useAdvancedDetailsHandler(),
    );
    expect(result.error).toEqual(
      new Error(
        'useAdvancedDetailsHandler must be used within an AdvancedDetailsProvider',
      ),
    );
  });
});
