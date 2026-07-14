/**
 * @jest-environment jsdom
 */
import ScreenBuildQuote from '../screens/build-quote/build-quote';
import BuildQuote from './build-quote';

// Route barrel stays a thin re-export; coverage lives under screens/build-quote.
describe('Ramps BuildQuote route entry', () => {
  it('re-exports the build quote screen', () => {
    expect(BuildQuote).toBe(ScreenBuildQuote);
  });
});
