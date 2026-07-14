/**
 * @jest-environment jsdom
 */
import ScreenTokenSelection from '../screens/token-selection/token-selection';
import TokenSelection from './token-selection';

// Route barrel stays a thin re-export; coverage lives under screens/token-selection.
describe('Ramps TokenSelection route entry', () => {
  it('re-exports the token selection screen', () => {
    expect(TokenSelection).toBe(ScreenTokenSelection);
  });
});
