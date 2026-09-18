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
      fetchFailedWithStatus: parseUserFacingError(
        new Error(
          "Fetching 'https://on-ramp.dev-api.cx.metamask.io/v2/quotes?action=buy&region=us-ut' failed with status '401'",
        ),
        'Failed to fetch quote.',
      ),
      fetchFailedWithStatusString: parseUserFacingError(
        "Fetching 'https://on-ramp.dev-api.cx.metamask.io/v2/quotes' failed with status '500'",
        'Failed to fetch quote.',
      ),
      urlOnlyMessage: parseUserFacingError(
        new Error('Request to https://example.com failed'),
        'fallback',
      ),
      statusCodeOnly: parseUserFacingError(
        new Error("Request failed with status '403'"),
        'fallback',
      ),
      resourceFetchError: parseUserFacingError(
        {
          error:
            "Fetching 'https://on-ramp.dev-api.cx.metamask.io/v2/quotes' failed with status '401'",
        },
        'fallback',
      ),
    }).toMatchSnapshot();
  });
});
