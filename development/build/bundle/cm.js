require('ses')
const fs = require('fs')
const url = require('url')
// const { makeBundle, makeArchive, parseArchive } = require('@endo/compartment-mapper/bundle.js')

module.exports = {
  makeBundle: _makeBundle,
}

const inertModuleNamespace = createInertModuleNamespace()

async function _makeBundle (bundleConfig) {
  const { makeBundle, search } = await import('@endo/compartment-mapper')
  const { makeReadPowers } = await import('@endo/compartment-mapper/node-powers.js')
  
  const { transforms, manualIgnore = [], builtinModules = {} } = bundleConfig
  const moduleLocation = new URL(
    bundleConfig.entryFiles[0],
    new URL(`file://${bundleConfig.projectDir}/`),
  ).toString();
  
  const exitModules = {}
  manualIgnore.forEach(specifier => {
    exitModules[specifier] = inertModuleNamespace
  })
  manualIgnore.forEach(specifier => {
    exitModules[specifier] = inertModuleNamespace
  })
  Object.entries(builtinModules).forEach(([specifier, moduleNamespace]) => {
    exitModules[specifier] = inertModuleNamespace
  })
  // babel runtime ugh (from transforms)
  exitModules['@babel/runtime'] = inertModuleNamespace
  exitModules['@babel/runtime/helpers/interopRequireDefault'] = inertModuleNamespace
  exitModules['@babel/runtime/regenerator'] = inertModuleNamespace
  exitModules['@babel/runtime/helpers/asyncToGenerator'] = inertModuleNamespace
  exitModules['@babel/runtime/helpers/classCallCheck'] = inertModuleNamespace
  exitModules['@babel/runtime/helpers/createClass'] = inertModuleNamespace
  exitModules['@babel/runtime/helpers/possibleConstructorReturn'] = inertModuleNamespace
  exitModules['@babel/runtime/helpers/getPrototypeOf'] = inertModuleNamespace
  exitModules['@babel/runtime/helpers/assertThisInitialized'] = inertModuleNamespace
  exitModules['@babel/runtime/helpers/inherits'] = inertModuleNamespace
  exitModules['@babel/runtime/helpers/toConsumableArray'] = inertModuleNamespace
  exitModules['babel-runtime/regenerator'] = inertModuleNamespace
  exitModules['babel-runtime/core-js/object/assign'] = inertModuleNamespace
  exitModules['babel-runtime/core-js/object/keys'] = inertModuleNamespace
  exitModules['babel-runtime/core-js/object/define-property'] = inertModuleNamespace
  exitModules['babel-runtime/core-js/json/stringify'] = inertModuleNamespace
  exitModules['babel-runtime/helpers/asyncToGenerator'] = inertModuleNamespace

  // * @callback ModuleTransform
  // * @param {Uint8Array} bytes
  // * @param {string} specifier
  // * @param {string} location
  // * @param {string} packageLocation
  // * @returns {Promise<{bytes: Uint8Array, parser: Language}>}
  // const moduleTransforms = new Proxy({}, {
  //   has (key) {
  //     console.log('has', key)
  //     return true
  //   },
  //   get (key) {
  //     console.log('get', key)
  //     return undefined
  //   },
  //   ownKeys () {
  //     console.log('ownKeys')
  //     return []
  //   },
  // })
  const runMetaMaskTransforms = async (moduleRecord) => {
    // console.log('transforming', specifier, location)
    // console.log(bytes.toString())
    for (const transformFn of transforms) {
      await transformFn(moduleRecord)
    }
  }

  const moduleTransforms = {
    'cjs': async (bytes, specifier, location, packageLocation) => {
      let parserLanguage = 'cjs'
      const moduleRecord = {
        file: location.toString(),
        source: bytes.toString(),
      }
      // workaround for multiformats@9.5.2
      if (location.includes('esm')) {
        parserLanguage = 'mjs'
      }
      // only continue transform if still cjs
      if (parserLanguage === 'cjs') {
        // console.log('transforming', specifier, location)
        // console.log(bytes.toString())
        await runMetaMaskTransforms(moduleRecord)
      }
      const transformedSource = Buffer.from(moduleRecord.source, 'utf8')
      return { bytes: transformedSource, parser: parserLanguage }
    },
    'ts': async (bytes, specifier, location, packageLocation) => {
      let parserLanguage = 'cjs'
      const moduleRecord = {
        file: location.toString(),
        source: bytes.toString(),
      }
      await runMetaMaskTransforms(moduleRecord)
      const transformedSource = Buffer.from(moduleRecord.source, 'utf8')
      return { bytes: transformedSource, parser: parserLanguage }
    },
  }

  const { read } = makeReadPowers({ fs, url });
  const tags = new Set(['browser']);
  const bundle = await makeBundle(read, moduleLocation, { moduleTransforms, exitModules, tags });
  // const {
  //   packageLocation,
  //   packageDescriptorText,
  //   packageDescriptorLocation,
  //   moduleSpecifier,
  // } = await search(read, moduleLocation);
  // console.log({
  //   packageLocation,
  //   packageDescriptorText,
  //   packageDescriptorLocation,
  //   moduleSpecifier,
  // })


}

function createInertModuleNamespace () {

  const inertStaticModuleRecord = {
    imports: [],
    exports: [],
    execute() {
      throw new Error(
        `Assertion failed: compartment graphs built for archives cannot be initialized`,
      );
    },
  };

  const inertModuleNamespace = new Compartment(
    {},
    {},
    {
      resolveHook() {
        return '';
      },
      async importHook() {
        return inertStaticModuleRecord;
      },
    },
  ).module('');

  return inertModuleNamespace;
}