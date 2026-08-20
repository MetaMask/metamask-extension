import { parseUserFacingError } from './parseUserFacingError';

describe('parseUserFacingError', () => {
  it('matches snapshot for supported error shapes', () => {
    expect({
      errorWithMessage: parseUserFacingError(
        new Error('network down'),
        'fallback',
      ),
      emptyErrorMessage: parseUserFacingError(new Error(''), 'fallback'),
      stringError: parseUserFacingError(' provider unavailable ', 'fallback'),
      emptyString: parseUserFacingError('   ', 'fallback'),
      resourceError: parseUserFacingError(
        { error: 'invalid region' },
        'fallback',
      ),
      emptyResourceError: parseUserFacingError({ error: '  ' }, 'fallback'),
      unknownError: parseUserFacingError({ code: 500 }, 'fallback'),
      nullError: parseUserFacingError(null, 'fallback'),
    }).toMatchSnapshot();
  });
});
