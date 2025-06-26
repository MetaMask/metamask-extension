import {
  base64urlencode,
  decodeBase64WithSafeUrlReplacements,
  decodeIdToken,
  padBase64String,
} from './utils';

describe('OAuthService - utils', () => {
  it('should be able to pad base64 string', () => {
    const string = 'Hello';
    const paddedBase64String = padBase64String(btoa(string));

    // base64 string length should be a multiple of 4
    const expectedNumOfPaddings = string.length % 4;
    const paddingAssertionRgx = new RegExp(
      `^[A-Za-z0-9_-]+[=]{${expectedNumOfPaddings}}$`,
      'u',
    );

    expect(paddedBase64String).toBeDefined();
    expect(paddedBase64String).toMatch(paddingAssertionRgx);
  });

  it('should be able to encode url-safe base64 string', () => {
    const string = 'Hello 🥹';
    const bytes = new TextEncoder().encode(string);
    const output = base64urlencode(bytes);
    expect(output).toBeDefined();
    expect(output).toBe('SGVsbG8g8J-luQ');
  });

  it('should be able to decode base64 encoded string with url safe replacements', () => {
    const string = 'Hello 🥹'; // to test unicode characters
    const bytes = new TextEncoder().encode(string);
    const base64String = base64urlencode(bytes);

    const utf8String = decodeBase64WithSafeUrlReplacements(base64String);
    expect(utf8String).toBe(string);
  });

  it('should be able to decode JWT id token', () => {
    const JWT_TOKEN =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJtZXRhbWFzayIsImlhdCI6MTc1MDY1MTMxMiwiZXhwIjoxNzgyMTg3MzEyLCJhdWQiOiJtZXRhbWFzayIsInN1YiI6InVzZXJAZW1haWwuY29tIiwiZW1haWwiOiJ1c2VyQGVtYWlsLmNvbSJ9.MyYlfGNLmUO92AjAa-Xis7MRVGTh9z1yXMnE___vuLU';

    const result = decodeIdToken(JWT_TOKEN);
    const parsedResult = JSON.parse(result);
    expect(parsedResult).toBeDefined();
    expect(parsedResult.iss).toBe('metamask');
    expect(parsedResult.aud).toBe('metamask');
    expect(parsedResult.sub).toBe('user@email.com');
    expect(parsedResult.email).toBe('user@email.com');
  });
});
