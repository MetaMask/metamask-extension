import { readFileSync } from 'node:fs';
import { LEGACY_APIS, readApiMemberNames } from './legacy-apis';

jest.mock('node:fs', () => ({
  ...jest.requireActual('node:fs'),
  readFileSync: jest.fn(),
}));

const mockReadFileSync = jest.mocked(readFileSync);

describe('readApiMemberNames', () => {
  describe('MetamaskController.getApi', () => {
    const legacyApi = LEGACY_APIS['MetamaskController.getApi'];

    it('reads named, shorthand, method, and spread properties of the returned object', () => {
      mockReadFileSync.mockReturnValue(
        `class MetamaskController {
          getApi() {
            return { named: this.named, shorthand, method() {}, ...this.otherApi };
          }
        }`,
      );

      const names = readApiMemberNames(legacyApi);

      expect(names).toStrictEqual(
        new Set(['named', 'shorthand', 'method', '...this.otherApi']),
      );
    });

    it('ignores nested objects and other methods', () => {
      mockReadFileSync.mockReturnValue(
        `class MetamaskController {
          getState() { return { ignored: true }; }
          getApi() { return { present: { nested: true } }; }
        }`,
      );

      const names = readApiMemberNames(legacyApi);

      expect(names).toStrictEqual(new Set(['present']));
    });

    it('fails when getApi is not present', () => {
      mockReadFileSync.mockReturnValue('class MetamaskController {}');

      expect(() => readApiMemberNames(legacyApi)).toThrow(
        'MetamaskController.getApi was not found',
      );
    });

    it('fails when getApi has more than one return statement', () => {
      mockReadFileSync.mockReturnValue(
        `class MetamaskController {
          getApi() {
            return { a: this.a };
            return { b: this.b };
          }
        }`,
      );

      expect(() => readApiMemberNames(legacyApi)).toThrow(
        'MetamaskController.getApi has more than one return statement',
      );
    });
  });
});
