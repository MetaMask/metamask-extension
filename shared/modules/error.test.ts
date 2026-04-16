import log from 'loglevel';
import {
  isErrorWithMessage,
  logErrorWithMessage,
  createErrorFromNetworkRequest,
} from './error';

jest.mock('loglevel');

describe('error module', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('isErrorWithMessage', () => {
    it('returns true when passed an instance of an Error', () => {
      expect(isErrorWithMessage(new Error('test'))).toBe(true);
    });

    it('returns false when passed a string', () => {
      expect(isErrorWithMessage('test')).toBe(false);
    });
  });

  describe('logErrorWithMessage', () => {
    it('calls loglevel.error with the error.message when passed an instance of Error', () => {
      logErrorWithMessage(new Error('test'));
      expect(log.error).toHaveBeenCalledWith('test');
    });

    it('calls loglevel.error with string representation of parameter passed in when parameter is not an instance of Error', () => {
      logErrorWithMessage({ test: 'test' });
      expect(log.error).toHaveBeenCalledWith({ test: 'test' });
    });
  });

  describe('createErrorFromNetworkRequest', () => {
    it('parses JSON response with error field', async () => {
      const response = {
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }),
      } as unknown as Response;

      const error = await createErrorFromNetworkRequest(
        response,
        'Request failed',
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(
        'Request failed: error: Unauthorized, statusCode: 401',
      );
    });

    it('parses JSON response with message field when error field is absent', async () => {
      const response = {
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ message: 'Bad request payload' }),
      } as unknown as Response;

      const error = await createErrorFromNetworkRequest(
        response,
        'Request failed',
      );

      expect(error.message).toBe(
        'Request failed: error: Bad request payload, statusCode: 400',
      );
    });

    it('falls back to Unknown error for JSON response without error or message fields', async () => {
      const response = {
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ code: 'INTERNAL' }),
      } as unknown as Response;

      const error = await createErrorFromNetworkRequest(
        response,
        'Server error',
      );

      expect(error.message).toBe(
        'Server error: error: Unknown error, statusCode: 500',
      );
    });

    it('parses text/plain response', async () => {
      const response = {
        status: 503,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: jest.fn().mockResolvedValue('Service Unavailable'),
      } as unknown as Response;

      const error = await createErrorFromNetworkRequest(
        response,
        'Request failed',
      );

      expect(error.message).toBe(
        'Request failed:  error: Service Unavailable, statusCode: 503',
      );
    });

    it('handles response with data property for unknown content types', async () => {
      const response = {
        status: 502,
        headers: new Headers({ 'content-type': 'application/octet-stream' }),
        data: 'Bad Gateway detail',
      } as unknown as Response;

      const error = await createErrorFromNetworkRequest(
        response,
        'Gateway error',
      );

      expect(error.message).toBe(
        'Gateway error:  error: Bad Gateway detail, statusCode: 502',
      );
    });

    it('falls back to Unknown error for unknown content types without data property', async () => {
      const response = {
        status: 500,
        headers: new Headers({ 'content-type': 'application/xml' }),
      } as unknown as Response;

      const error = await createErrorFromNetworkRequest(
        response,
        'Request failed',
      );

      expect(error.message).toBe(
        'Request failed:  error: Unknown error, statusCode: 500',
      );
    });

    it('works without an error prefix', async () => {
      const response = {
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      } as unknown as Response;

      const error = await createErrorFromNetworkRequest(response);

      expect(error.message).toBe('error: Not found, statusCode: 404');
    });

    it('returns a generic HTTP error when response parsing throws', async () => {
      const response = {
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockRejectedValue(new Error('parse error')),
      } as unknown as Response;

      const error = await createErrorFromNetworkRequest(
        response,
        'Request failed',
      );

      expect(error.message).toBe('Request failed:  HTTP 500 error');
    });

    it('handles response with no headers', async () => {
      const response = {
        status: 401,
        headers: null,
      } as unknown as Response;

      const error = await createErrorFromNetworkRequest(
        response,
        'Auth failed',
      );

      expect(error.message).toBe(
        'Auth failed:  error: Unknown error, statusCode: 401',
      );
    });
  });
});
