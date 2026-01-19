import { ErrorCodes } from '../types';
import { createSuccessResponse, createErrorResponse } from './response';

describe('utils/response', () => {
  describe('createSuccessResponse', () => {
    it('creates response with required fields', () => {
      const startTime = Date.now() - 100;
      const result = { clicked: true };

      const response = createSuccessResponse(result, 'mm-test-123', startTime);

      expect(response.ok).toBe(true);
      expect(response.result).toEqual(result);
      expect(response.meta.sessionId).toBe('mm-test-123');
      expect(response.meta.durationMs).toBeGreaterThanOrEqual(100);
      expect(response.meta.timestamp).toBeDefined();
    });

    it('handles undefined sessionId', () => {
      const response = createSuccessResponse(
        { data: 'test' },
        undefined,
        Date.now(),
      );

      expect(response.ok).toBe(true);
      expect(response.meta.sessionId).toBeUndefined();
    });

    it('calculates duration correctly', () => {
      const startTime = Date.now() - 500;
      const response = createSuccessResponse({}, 'sess', startTime);

      expect(response.meta.durationMs).toBeGreaterThanOrEqual(500);
      expect(response.meta.durationMs).toBeLessThan(1000);
    });
  });

  describe('createErrorResponse', () => {
    it('creates error response with code and message', () => {
      const startTime = Date.now() - 50;

      const response = createErrorResponse(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
        'No session found',
        undefined,
        'mm-sess-123',
        startTime,
      );

      expect(response.ok).toBe(false);
      expect(response.error.code).toBe(ErrorCodes.MM_NO_ACTIVE_SESSION);
      expect(response.error.message).toBe('No session found');
      expect(response.meta.sessionId).toBe('mm-sess-123');
      expect(response.meta.durationMs).toBeGreaterThanOrEqual(50);
    });

    it('includes optional details', () => {
      const details = { input: { testId: 'btn' }, reason: 'timeout' };

      const response = createErrorResponse(
        ErrorCodes.MM_TARGET_NOT_FOUND,
        'Element not found',
        details,
        'sess',
        Date.now(),
      );

      expect(response.error.details).toEqual(details);
    });

    it('handles undefined details', () => {
      const response = createErrorResponse(
        ErrorCodes.MM_INVALID_INPUT,
        'Invalid',
        undefined,
        undefined,
        Date.now(),
      );

      expect(response.error.details).toBeUndefined();
    });
  });
});
