/* eslint-disable jest/no-standalone-expect */
import { fuzz } from './JsonRpcFuzz2';

describe('Fuzz', () => {
  it.fuzz('should ', async (data) => {
    await fuzz(data);
    expect(true).toStrictEqual(true);
  });
});
