import { submitRequestToBackground } from './background-connection';
import { trackErrorAsAnalytics } from './actions';

jest.mock('./background-connection', () => ({
  ...jest.requireActual('./background-connection'),
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockedSubmitRequestToBackground = jest.mocked(submitRequestToBackground);
const environmentTypeProperty = 'environment_type';

describe('trackErrorAsAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends Error.message over the messenger instead of the Error instance', async () => {
    const error = new Error('Deletion failed');

    await trackErrorAsAnalytics(error, {
      source: 'clear-metametrics-data',
      excludeMetaMetricsId: true,
      environmentType: 'popup',
    });

    expect(mockedSubmitRequestToBackground).toHaveBeenCalledWith(
      'AnalyticsController:trackErrorAsAnalytics',
      [
        'Deletion failed',
        { source: 'clear-metametrics-data' },
        { anonymous: true, [environmentTypeProperty]: 'popup' },
      ],
    );
  });

  it('forwards string and object-with-message errors as JSON-safe strings', async () => {
    await trackErrorAsAnalytics('plain failure', {
      source: 'delete-metametrics-modal',
    });

    expect(mockedSubmitRequestToBackground).toHaveBeenCalledWith(
      'AnalyticsController:trackErrorAsAnalytics',
      ['plain failure', { source: 'delete-metametrics-modal' }, {}],
    );

    mockedSubmitRequestToBackground.mockClear();

    await trackErrorAsAnalytics(
      { message: 'object failure' },
      { source: 'delete-metametrics-modal' },
    );

    expect(mockedSubmitRequestToBackground).toHaveBeenCalledWith(
      'AnalyticsController:trackErrorAsAnalytics',
      ['object failure', { source: 'delete-metametrics-modal' }, {}],
    );
  });

  it('stringifies values without a message property', async () => {
    await trackErrorAsAnalytics({ code: 42 }, { source: 'unknown-source' });

    expect(mockedSubmitRequestToBackground).toHaveBeenCalledWith(
      'AnalyticsController:trackErrorAsAnalytics',
      ['[object Object]', { source: 'unknown-source' }, {}],
    );
  });
});
