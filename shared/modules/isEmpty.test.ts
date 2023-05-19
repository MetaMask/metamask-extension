import { isEmpty } from './isEmpty';

describe('isEmpty', () => {
  it('identifies an empty object', () => {
    expect(isEmpty({})).toBeTruthy();
  });
  it('identifies an object that is not empty', () => {
    expect(isEmpty({ key: 'value' })).toBeFalsy();
  });
});
