import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  MISSING,
  VALID,
  INVALID,
} from '../../../../shared/lib/deep-links/verify';
import { createEvent } from './metrics';

describe('createEvent', () => {
  describe('basic functionality', () => {
    it('should create event with minimal required properties', () => {
      const url = new URL('https://example.com/test-route');
      const signature = MISSING;

      const result = createEvent({ signature, url });

      expect(result).toEqual({
        category: MetaMetricsEventCategory.DeepLink,
        event: MetaMetricsEventName.DeepLinkUsed,
        properties: {
          route: '/test-route',
          signature: MISSING,
        },
        sensitiveProperties: {},
      });
    });

    it('should handle empty pathname', () => {
      const url = new URL('https://example.com');
      const signature = VALID;

      const result = createEvent({ signature, url });

      expect(result.properties.route).toBe('/');
      expect(result.properties.signature).toBe(VALID);
    });

    it('should handle complex pathname', () => {
      const url = new URL('https://example.com/deep/nested/route');
      const signature = INVALID;

      const result = createEvent({ signature, url });

      expect(result.properties.route).toBe('/deep/nested/route');
      expect(result.properties.signature).toBe(INVALID);
    });
  });

  describe('signature status handling', () => {
    const url = new URL('https://example.com/test');

    it('should handle MISSING signature status', () => {
      const result = createEvent({ signature: MISSING, url });
      expect(result.properties.signature).toBe(MISSING);
    });

    it('should handle VALID signature status', () => {
      const result = createEvent({ signature: VALID, url });
      expect(result.properties.signature).toBe(VALID);
    });

    it('should handle INVALID signature status', () => {
      const result = createEvent({ signature: INVALID, url });
      expect(result.properties.signature).toBe(INVALID);
    });
  });

  describe('URL parameters handling', () => {
    it('should ignore sig parameter', () => {
      const url = new URL('https://example.com/test?sig=some-signature-value');
      const signature = VALID;

      const result = createEvent({ signature, url });

      expect(result.properties).not.toHaveProperty('sig');
      expect(result.sensitiveProperties).not.toHaveProperty('sig');
    });

    it('should handle attributionId parameter', () => {
      const url = new URL('https://example.com/test?attributionId=attr-123');
      const signature = MISSING;

      const result = createEvent({ signature, url });

      expect(result.properties.attribution_id).toBe('attr-123');
    });

    it('should handle all UTM parameters', () => {
      const url = new URL(
        'https://example.com/test?' +
          'utm_campaign=summer-sale&' +
          'utm_content=banner&' +
          'utm_medium=email&' +
          'utm_source=newsletter&' +
          'utm_term=crypto-wallet',
      );
      const signature = VALID;

      const result = createEvent({ signature, url });

      expect(result.properties.utm_campaign).toBe('summer-sale');
      expect(result.properties.utm_content).toBe('banner');
      expect(result.properties.utm_medium).toBe('email');
      expect(result.properties.utm_source).toBe('newsletter');
      expect(result.properties.utm_term).toBe('crypto-wallet');
    });

    it('should handle non-UTM parameters as sensitive', () => {
      const url = new URL(
        'https://example.com/test?' +
          'customParam=secret-value&' +
          'userToken=abc123&' +
          'sessionId=xyz789',
      );
      const signature = MISSING;

      const result = createEvent({ signature, url });

      expect(result.sensitiveProperties).toEqual({
        customParam: 'secret-value',
        userToken: 'abc123',
        sessionId: 'xyz789',
      });
    });

    it('should handle mixed parameter types', () => {
      const url = new URL(
        'https://example.com/deep-link?' +
          'attributionId=attr-456&' +
          'utm_campaign=winter-promo&' +
          'utm_source=google&' +
          'sig=signature-to-ignore&' +
          'privateData=sensitive&' +
          'utm_medium=cpc&' +
          'userId=user123',
      );
      const signature = VALID;

      const result = createEvent({ signature, url });

      expect(result.properties).toEqual({
        route: '/deep-link',
        signature: VALID,
        attribution_id: 'attr-456',
        utm_campaign: 'winter-promo',
        utm_source: 'google',
        utm_medium: 'cpc',
      });

      expect(result.sensitiveProperties).toEqual({
        privateData: 'sensitive',
        userId: 'user123',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty parameter values', () => {
      const url = new URL(
        'https://example.com/test?utm_campaign=&attributionId=',
      );
      const signature = MISSING;

      const result = createEvent({ signature, url });

      expect(result.properties.utm_campaign).toBe('');
      expect(result.properties.attribution_id).toBe('');
    });

    it('should handle URL with no search parameters', () => {
      const url = new URL('https://example.com/test');
      const signature = VALID;

      const result = createEvent({ signature, url });

      expect(result.properties).toEqual({
        route: '/test',
        signature: VALID,
      });
      expect(result.sensitiveProperties).toEqual({});
    });

    it('should handle URL with encoded parameters', () => {
      const url = new URL(
        'https://example.com/test?utm_campaign=hello%20world&customParam=test%26value',
      );
      const signature = INVALID;

      const result = createEvent({ signature, url });

      expect(result.properties.utm_campaign).toBe('hello world');
      expect(result.sensitiveProperties.customParam).toBe('test&value');
    });

    it('should handle duplicate parameter names (last value wins)', () => {
      const url = new URL(
        'https://example.com/test?utm_campaign=first&utm_campaign=second',
      );
      const signature = MISSING;

      const result = createEvent({ signature, url });

      expect(result.properties.utm_campaign).toBe('second');
    });
  });

  describe('return value structure', () => {
    it('should always return correct event structure', () => {
      const url = new URL('https://example.com/test');
      const signature = VALID;

      const result = createEvent({ signature, url });

      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('event');
      expect(result).toHaveProperty('properties');
      expect(result).toHaveProperty('sensitiveProperties');

      expect(result.category).toBe(MetaMetricsEventCategory.DeepLink);
      expect(result.event).toBe(MetaMetricsEventName.DeepLinkUsed);
      expect(typeof result.properties).toBe('object');
      expect(typeof result.sensitiveProperties).toBe('object');
    });

    it('should always include route and signature in properties', () => {
      const url = new URL('https://example.com/any-route');
      const signature = MISSING;

      const result = createEvent({ signature, url });

      expect(result.properties).toHaveProperty('route');
      expect(result.properties).toHaveProperty('signature');
      expect(typeof result.properties.route).toBe('string');
      expect(result.properties.signature).toBe(signature);
    });
  });
});
