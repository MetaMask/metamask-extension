jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

jest.mock('yaml', () => ({
  parse: jest.fn(),
}));

const path = require('path');
const { cloneDeep } = require('lodash');
const yamlParseMock = require('yaml').parse;
const { loadBuildTypesConfig } = require('./build-type');

const makeBuildsYml = (() => {
  const { readFileSync } = jest.requireActual('fs');
  const { parse: yamlParse } = jest.requireActual('yaml');
  const buildsYml = yamlParse(
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
      env: expect.any(Array),
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

  it('should throw on duplicate env variables', () => {
    const nextBuildsYml = makeBuildsYml();
    nextBuildsYml.env.push('foo');
    nextBuildsYml.env.push('foo');
    yamlParseMock.mockReturnValueOnce(nextBuildsYml);

    expect(() => loadBuildTypesConfig(null)).toThrow(
      'Array contains duplicated values',
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
      'Failed to parse builds.yml',
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
