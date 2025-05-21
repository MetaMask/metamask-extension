import path from 'path';
import { cloneDeep } from 'lodash';
import { parse as yamlParse } from 'yaml';
import { loadBuildTypesConfig } from './build-type';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

jest.mock('yaml', () => ({
  parse: jest.fn(),
}));

const yamlParseMock = jest.mocked(yamlParse);

const makeBuildsYml = (() => {
  const { readFileSync } = jest.requireActual('fs');
  const { parse } = jest.requireActual('yaml');
  const buildsYml = parse(
    readFileSync(path.resolve(__dirname, '../../builds.yml'), 'utf8'),
  );

  return () => cloneDeep(buildsYml);
})();

describe('loadBuildTypesConfig', () => {
  beforeEach(() => {
    yamlParseMock.mockReset();
  });

  it('should load the build types config', () => {
    yamlParseMock.mockReturnValueOnce(makeBuildsYml());
    const buildTypes = loadBuildTypesConfig();
    expect(buildTypes).toStrictEqual({
      default: 'main',
      buildTypes: expect.any(Object),
      features: expect.any(Object),
      env: expect.any(Object),
    });
  });

  it('should cache the loaded build types config by default', () => {
    yamlParseMock.mockImplementation(() => {
      throw new Error('Should not be called');
    });
    const buildTypes1 = loadBuildTypesConfig();
    const buildTypes2 = loadBuildTypesConfig();
    expect(buildTypes1).toBe(buildTypes2);
  });

  it('should apply build type extensions', () => {
    const nextBuildsYml = makeBuildsYml();
    nextBuildsYml.buildTypes.foo = {
      id: 63,
      extends: 'main',
    };
    yamlParseMock.mockReturnValueOnce(nextBuildsYml);
    const buildTypes = loadBuildTypesConfig(null);
    expect(buildTypes.buildTypes.foo).toStrictEqual({
      ...buildTypes.buildTypes.main,
      id: 63,
      extends: 'main',
    });
  });

  it('should throw if build type id is out of range', () => {
    const nextBuildsYml = makeBuildsYml();
    nextBuildsYml.buildTypes.main.id = 99;
    yamlParseMock.mockReturnValueOnce(nextBuildsYml);

    expect(() => loadBuildTypesConfig(null)).toThrow(
      `Number must be an integer 10 <= 64. Received: 99`,
    );
  });

  it('should throw if build type id is not an integer', () => {
    const nextBuildsYml = makeBuildsYml();
    nextBuildsYml.buildTypes.main.id = 10.5;
    yamlParseMock.mockReturnValueOnce(nextBuildsYml);

    expect(() => loadBuildTypesConfig(null)).toThrow(
      `Expected an integer, but received: 10.5`,
    );
  });

  it('should throw if build type ids are not unique', () => {
    const nextBuildsYml = makeBuildsYml();
    nextBuildsYml.buildTypes.main.id = 64;
    nextBuildsYml.buildTypes.flask.id = 64;
    yamlParseMock.mockReturnValueOnce(nextBuildsYml);

    expect(() => loadBuildTypesConfig(null)).toThrow(
      `Build type ids must be unique. Duplicate ids: ${JSON.stringify(
        [64],
        null,
        2,
      )}`,
    );
  });

  it('should throw if extended build type does not exist', () => {
    const nextBuildsYml = makeBuildsYml();
    nextBuildsYml.buildTypes.main.extends = 'foo';
    yamlParseMock.mockReturnValueOnce(nextBuildsYml);

    expect(() => loadBuildTypesConfig(null)).toThrow(
      `Extended build type "foo" not found`,
    );
  });

  it('should throw on duplicate env variables', () => {
    const nextBuildsYml = makeBuildsYml();
    nextBuildsYml.env.push('foo');
    nextBuildsYml.env.push('foo');
    yamlParseMock.mockReturnValueOnce(nextBuildsYml);

    expect(() => loadBuildTypesConfig(null)).toThrow(
      `Array contains duplicated values: ${JSON.stringify(['foo'], null, 2)}`,
    );
  });

  it('should throw on malformed env variable object', () => {
    const nextBuildsYml = makeBuildsYml();
    nextBuildsYml.env.push({
      foo: 'bar',
      baz: 'qux',
    });
    yamlParseMock.mockReturnValueOnce(nextBuildsYml);

    expect(() => loadBuildTypesConfig(null)).toThrow(
      `Env variable declarations may only have a single property. Received: ${JSON.stringify(
        {
          foo: 'bar',
          baz: 'qux',
        },
        null,
        2,
      )}`,
    );
  });

  it('should throw if default build type is not defined', () => {
    const nextBuildsYml = makeBuildsYml();
    delete nextBuildsYml.buildTypes.main;
    yamlParseMock.mockReturnValueOnce(nextBuildsYml);

    expect(() => loadBuildTypesConfig(null)).toThrow(
      'Default build type "main" does not exist in builds declarations',
    );
  });
});
