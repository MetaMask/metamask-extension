import { maskEmail } from './mask-email';

describe('maskEmail', () => {
  it('keeps the first letter and the domain', () => {
    expect(maskEmail('chris@metamask.com')).toBe('c•••@metamask.com');
  });
});
