/**
 * Yarn 4 plugin for script environment hardening.
 *
 * @module
 */

/** @typedef {NonNullable<import('@yarnpkg/core').Hooks['wrapScriptExecution']>} WrapScriptExecutionHook */

/* global makeRunScriptWrapper */

/**
 * Yarn 4 plugin factory for wrapScriptExecution hook.
 *
 * @param {any} require - Yarn's require function
 * @returns {{ hooks: { wrapScriptExecution: Function } }}
 */
module.exports = {
  name: '@yarnpkg/plugin-runner',
  factory: function (/** @type {NodeJS.Require} */ require) {
    const { tmpdir } = require('node:os')
    return {
      hooks: {
        /** @type {WrapScriptExecutionHook} */
        wrapScriptExecution: async (
          executor,
          project,
          locator,
          scriptName,
          extra
        ) => {
          const path = require('node:path')
          const fs = require('node:fs')
          const workspace = project.tryWorkspaceByLocator(locator)

          if (!workspace) {
            // a script is being executed outside of a workspace context, so we
            // can't apply any custom logic.
            // This is the case when a postinstal is running.

            // "Do nothing" - return the original executor immediately
            // without running any custom plugin logic or reading manifests.
            // TODO: implement wrapping these scripts with reasonable defaults
            return executor
          }

          const pkgJson = workspace.manifest.raw
          // Abundance of caution. It seems yarn is not adding
          // any node_modules/.bin locations to the PATH by default.
          const binFolder = `node_modules${path.sep}.bin`
          const berryBin = extra.env.BERRY_BIN_FOLDER

          const wrapper = makeRunScriptWrapper(
            {
              scriptName,
              scriptPayload: extra.script,
              projectRoot: project.cwd,
              pathBinMatcher: (fragment) => {
                if (berryBin && fragment === berryBin) {
                  return true
                }
                return fragment.endsWith(binFolder)
              },
              customizePermissionsConfig: addMandatoryReads.bind({projectRoot: project.cwd }),
              readScriptsConfig: () => {
                return pkgJson.scriptsConfig
              },
            },
            {
              readFileSync: fs.readFileSync,
              pathJoin: path.join,
              pathDelimiter: path.delimiter,
              tmpdir,
              realpathSync: fs.realpathSync,
              lstatSync: fs.lstatSync,
              readlinkSync: fs.readlinkSync,
            }
          )

          // extra.env is a reference to the mutable object, but a
          // different variable containing that reference is used within
          // execute, so we must amend not replace it.
          const newEnv = wrapper.processEnv(extra.env)
          for (const key of Object.keys(extra.env)) {
            delete extra.env[key]
          }
          Object.assign(extra.env, newEnv)
          return executor
        },
      },
    }
  },
}

/**
 * @param {Record<string, boolean | string | string[]>} configOptions
 * @param {NodeJS.ProcessEnv} _env
 */
function addMandatoryReads(configOptions, _env) {
  if (!configOptions['--permission']) {
    return
  }
  if(Array.isArray(configOptions['--allow-fs-read']) && configOptions['--allow-fs-read'].includes('./')) {
    configOptions['--allow-fs-read'].push(this.projectRoot)
    configOptions['--allow-fs-read'].push(this.projectRoot.toUpperCase())
  }
  configOptions['--allow-fs-tmp'] = true // yarn always uses tmp dirs.
}

;;
/// <reference path="./make-run-script-wrapper.global.d.ts" />

/**
 * @param {MakeRunScriptWrapperOptions} param0
 * @param {MakeRunScriptWrapperIO} param1
 * @returns {MakeRunScriptWrapper}
 */
function makeRunScriptWrapper(
  {
    scriptName,
    scriptPayload: _scriptPayload, // might be useful to read in the future
    projectRoot,
    pathBinMatcher,
    customizePermissionsConfig,
    readScriptsConfig,
  },
  {
    readFileSync,
    pathJoin,
    pathDelimiter,
    tmpdir,
    realpathSync,
    lstatSync,
    readlinkSync,
  }
) {
  const DEFAULT_PERMISSION_KEY = '#default'

  /** @param {string} filePath */
  function readJsonFile(filePath) {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  }

  /**
   * Additively composes two configuration objects. Arrays are concatenated, and
   * nested objects are recursively merged.
   *
   * @param {any} parent
   * @param {any} config
   */
  function additiveCompose(parent, config) {
    const composed = { ...parent, ...config }
    for (const key of Object.keys(parent)) {
      if (key in config) {
        if (Array.isArray(parent[key]) || Array.isArray(config[key])) {
          composed[key] = [parent[key], config[key]].flat()
        } else if (typeof config[key] === 'object') {
          composed[key] = additiveCompose(parent[key], config[key])
        }
      }
    }
    return composed
  }

  /**
   * Reads and processes a config file
   *
   * @param {string} filePath - The path to the config file
   * @param {number} [depth] - The recursion depth for extend
   * @returns {Record<string, any>} - The processed configuration object
   */
  function readScriptConfig(filePath, depth = 0) {
    const conf = readJsonFile(filePath)
    if (typeof conf !== 'object' || conf === null || depth > 10) {
      throw Error(
        `Failed to load config.${depth > 10 ? ' (maximum extend depth exceeded)' : ''}`
      )
    }
    const { extends: parentPath, ...config } = conf
    if (!parentPath) {
      return config
    }
    const parent = readScriptConfig(
      pathJoin(filePath, '..', parentPath),
      depth + 1
    )

    return additiveCompose(parent, config)
  }

  /**
   * @param {Record<string, string>} configs
   * @param {string} scriptName
   * @returns {string | undefined}
   */
  function prefixMatch(configs, scriptName) {
    const keys = Object.keys(configs)
    const matchingKeys = keys
      .filter((k) => k.endsWith('*'))
      .filter((k) => scriptName.startsWith(k.slice(0, -1)))

    if (matchingKeys.length === 0) {
      return undefined
    }
    // longest prefix match wins
    const bestMatch = matchingKeys.reduce((a, b) =>
      a.length > b.length ? a : b
    )
    return configs[bestMatch]
  }

  /**
   * @param {object} opts
   * @param {Record<string, string> | undefined} opts.scriptsConfig
   * @param {string} [opts.scriptName]
   * @param {string} opts.projectRoot
   * @returns {{ config: Record<string, any>; name?: string }}
   */
  function readConfig({
    scriptsConfig,
    scriptName = DEFAULT_PERMISSION_KEY,
    projectRoot,
  }) {
    if (!scriptsConfig) {
      return { config: {} }
    }
    const configName =
      scriptsConfig[scriptName] ||
      prefixMatch(scriptsConfig, scriptName) ||
      scriptsConfig[DEFAULT_PERMISSION_KEY]

    // config needs to be optional, because it's opt-in first and specifying a default turns it opt-out.
    if (!configName) {
      return { config: {} }
    }
    const configPath = pathJoin(projectRoot, configName)
    let conf
    try {
      conf = readScriptConfig(configPath)
      // process._rawDebug(`Loaded script config from ${configPath}:`, conf)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw Error(
        `[LavaMoat] Error loading script config file "${configPath}": ${message}`,
        { cause: err }
      )
    }
    return {
      config: conf,
      name: configName,
    }
  }

  /**
   * Adds features we'd want in Node.js permissions model and intend to
   * eventually upstream
   *
   * @param {ConfigOptions} configOptions
   * @param {NodeJS.ProcessEnv} env
   * @returns {void}
   */
  function permissionsModelCompatibilityExtensions(configOptions, env) {
    // 1. support env variables as values in allow-fs-*
    /**
     * @param {string} value
     * @returns {string}
     */
    const replaceEnvVar = (value) => {
      const envVarMatch = value.match(/^\$([A-Z_][A-Z0-9_]*)$/i)
      if (envVarMatch) {
        const envVarName = envVarMatch[1]
        if (env[envVarName] !== undefined) {
          return env[envVarName]
        } else {
          console.error(
            `[LavaMoat] Environment variable "${envVarName}" referenced in config but not found in environment`
          )
        }
      }
      return value
    }

    for (const key of ['--allow-fs-read', '--allow-fs-write']) {
      if (Array.isArray(configOptions[key])) {
        configOptions[key] = configOptions[key].map(replaceEnvVar)
      }
    }

    // 2. tmp write - crossplatform
    if (configOptions['--allow-fs-tmp'] === true) {
      delete configOptions['--allow-fs-tmp']
      const tmp = tmpdir()
      let tmpRealPath = tmp
      try {
        tmpRealPath = realpathSync(tmp)
      } catch {
        // if realpathSync fails, it's been restricted by permissions
        try {
          const stats = lstatSync(tmp)
          if (stats.isSymbolicLink()) {
            tmpRealPath = readlinkSync(tmp)
          }
        } catch {
          // silence the error and continue with no separate tmpRealPath
        }
      }
      // write doesn't grant read, sadly
      for (const perm of ['write', 'read']) {
        const allowOption = `--allow-fs-${perm}`
        if (configOptions[allowOption]) {
          if (configOptions[allowOption] === true) {
            continue // all of fs allowed, nothing to add
          }
          if (typeof configOptions[allowOption] === 'string') {
            // need to expand to multiple paths
            configOptions[allowOption] = [configOptions[allowOption]]
          }
          if (!Array.isArray(configOptions[allowOption])) {
            throw Error(
              `Unexpected type for ${allowOption}: ${typeof configOptions[allowOption]}`
            )
          }
        } else {
          // do this for both undefined and false
          configOptions[allowOption] = []
        }
        configOptions[allowOption].push(tmp)
        // because macos is being weird
        if (tmpRealPath !== tmp) {
          configOptions[allowOption].push(tmpRealPath)
        }
      }
    }
  }

  /** @param {ConfigOptions} configOptions */
  function makeFlagsFromConfig(configOptions) {
    return Object.entries(configOptions)
      .map(([arg, value]) => {
        if (typeof value === 'boolean') {
          return value ? arg : ''
        } else if (Array.isArray(value)) {
          return value.map((v) => `${arg}="${v}"`).join(' ')
        } else {
          return `${arg}="${value}"`
        }
      })
      .filter(Boolean)
      .join(' ')
  }

  /**
   * Checks the config obtained from package.json and puts it in as NODE_OPTIONS
   *
   * @param {ConfigOptions} configOptions
   * @param {NodeJS.ProcessEnv} env
   */
  function installNodeOptions(configOptions, env) {
    const existingOptions = env.NODE_OPTIONS
    const inLavaMoatEnvAlready = !!env.LAVAMOAT_RUN_CONF

    if (!configOptions) {
      return existingOptions || ''
    }
    // Calls to run can be nested, so existing NODE_OPTIONS are not to be preserved.
    // If end user needs to set some options, let them put those in the script config json too.
    // If this becomes an issue, we could use a separate env var to distinguish between options we set and options that were there already.

    // If we're not nested, but there are existing options, it's safe to warn the user without being annoying.
    if (
      !inLavaMoatEnvAlready &&
      existingOptions &&
      existingOptions.length > 0
    ) {
      console.error(
        `[LavaMoat] Warning: Replacing existing NODE_OPTIONS. Move them to the relevant JSON file in lavamoat/ if they were intentional.`
      )
    }

    customizePermissionsConfig(configOptions, env)

    permissionsModelCompatibilityExtensions(configOptions, env)

    const confOption = makeFlagsFromConfig(configOptions)

    return confOption.trim()
  }

  /**
   * Filter environment variables based on ban keywords
   *
   * @param {NodeJS.ProcessEnv} env
   * @param {string} lavamoatDir
   * @returns {NodeJS.ProcessEnv}
   */
  function filterEnv(env, lavamoatDir) {
    const banFilePath = pathJoin(lavamoatDir, '.env.ban.json')
    let banConfig

    try {
      banConfig = readJsonFile(banFilePath)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(
        `[LavaMoat] Warning: Failed to read .env.ban.json: ${message}.`
      )
      return env
    }
    let banKeywords = []
    try {
      if (Array.isArray(banConfig)) {
        banKeywords.push(...banConfig)
      } else {
        throw Error(`Expected .env.ban.json to contain an array of keywords`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(
        `[LavaMoat] Warning: Failed to read .env.ban.json: ${message}.`
      )
      return env
    }

    /** @type {NodeJS.ProcessEnv} */
    const filteredEnv = {}
    const bannedEnv = []
    banKeywords = banKeywords.map((keyword) => keyword.toLowerCase())
    for (const [key, value] of Object.entries(env)) {
      if (
        !key.toLowerCase().startsWith('npm_config') &&
        banKeywords.some((keyword) => key.toLowerCase().includes(keyword))
      ) {
        bannedEnv.push(key)
      } else {
        filteredEnv[key] = value
      }
    }
    if (bannedEnv.length > 0) {
      console.error(
        `[LavaMoat] Warning: The following environment variables were banned: ${bannedEnv.join(', ')}`
      )
    }
    return filteredEnv
  }

  /** @param {string} PATH */
  function envPathOpinions(PATH) {
    const pathFragments = PATH.split(pathDelimiter)
    // This is to eliminate bin confusion attacks.
    // Find node_modules/.bin and remove it, put it on the end that gets looked up last when looking for a name in the path.

    /** @type {string[]} */
    const filteredFragments = []
    /** @type {string[]} */
    const nodeModulesBinFragments = []

    for (const fragment of pathFragments) {
      if (pathBinMatcher(fragment)) {
        nodeModulesBinFragments.push(fragment)
      } else {
        filteredFragments.push(fragment)
      }
    }
    // This should preserve order of items.
    const uniqueNodeModulesBinFragments = Array.from(
      new Set(nodeModulesBinFragments)
    )

    // Why would there even be multiple bin fragments? ecause
    // npm happily adds entries for hypothetical node_modules/.bin
    // in all parent dirs
    filteredFragments.push(...uniqueNodeModulesBinFragments)

    return filteredFragments.join(pathDelimiter)
  }

  return {
    processEnv: (existingEnv) => {
      const scriptsConfig = readScriptsConfig(projectRoot)
      const { config, name: configName } = readConfig({
        scriptsConfig,
        scriptName,
        projectRoot,
      })

      // Smell: Windows environment variables are case-insensitive, but Node's process.env
      // might expose it as 'Path' instead of 'PATH'. Checking both ensures it doesn't get wiped out.

      const existingPath = existingEnv.PATH || existingEnv.Path || ''

      const lavamoatDir = pathJoin(projectRoot, 'lavamoat')

      const fixedEnv = {
        ...filterEnv(existingEnv, lavamoatDir),
        LAVAMOAT_RUN_CONF: configName,
        PATH: envPathOpinions(existingPath),
        NODE_OPTIONS: installNodeOptions(config.nodeOptions, existingEnv),
      }
      return fixedEnv
    },
  }
}


