const path = require('path')
const babel = require('@babel/core');

const extensions = ['.js', '.ts', '.tsx']

module.exports = async (moduleRecord) => {
  // skip dependencies
  // console.log('pre-babel:', moduleRecord.file)
  if (moduleRecord.file.includes('node_modules')) return
  if (!extensions.includes(path.extname(moduleRecord.file))) return

  const babelOpts = normalizeOptions({}, { extensions }, moduleRecord.file);
  let cfg;
  try {
    cfg = babel.loadPartialConfig(babelOpts);
    if (!cfg) return
  } catch (err) {
    throw err;
  }
  const opts = cfg.options;

  // Since Browserify can only handle inline sourcemaps, we override any other
  // values to force inline sourcemaps unless they've been disabled.
  if (opts.sourceMaps !== false) {
    opts.sourceMaps = "inline";
  }

  const result = await new Promise((resolve, reject) => {
    babel.transform(moduleRecord.source, opts, (err, result) => { if (err) reject(err); resolve(result) })
  })
  if (result && result.code) {
    moduleRecord.source = result.code
  }

}


function normalizeOptions(preconfiguredOpts, transformOpts, filename) {
  const basedir = normalizeTransformBasedir(transformOpts);
  const opts = normalizeTransformOpts(transformOpts);

  // Transform options override preconfigured options unless they are undefined.
  if (preconfiguredOpts) {
    for (const key of Object.keys(preconfiguredOpts)) {
      if (opts[key] === undefined) {
        opts[key] = preconfiguredOpts[key];
      }
    }
  }

  // babelify specific options
  var extensions = opts.extensions || babel.DEFAULT_EXTENSIONS;
  var sourceMapsAbsolute = opts.sourceMapsAbsolute;
  delete opts.sourceMapsAbsolute;
  delete opts.extensions;

  var extname = path.extname(filename);
  if (extensions.indexOf(extname) === -1) {
    return null;
  }

  // Browserify doesn't actually always normalize the filename passed
  // to transforms, so we manually ensure that the filename is relative
  const absoluteFilename = path.resolve(basedir, filename);

  Object.assign(opts, {
    cwd: opts.cwd === undefined ? basedir : opts.cwd,
    caller: Object.assign(
      {
        name: "babelify",
      },
      opts.caller
    ),
    filename: absoluteFilename,

    sourceFileName:
      sourceMapsAbsolute
        ? absoluteFilename
        : undefined,
  });

  return opts;
}

function normalizeTransformBasedir(opts) {
  return path.resolve(opts._flags && opts._flags.basedir || ".");
}

function normalizeTransformOpts(opts) {
  opts = Object.assign({}, opts);

  // browserify cli options
  delete opts._;
  // "--opt [ a b ]" and "--opt a --opt b" are allowed:
  if (opts.ignore && opts.ignore._) opts.ignore = opts.ignore._;
  if (opts.only && opts.only._) opts.only = opts.only._;
  if (opts.plugins && opts.plugins._) opts.plugins = opts.plugins._;
  if (opts.presets && opts.presets._) opts.presets = opts.presets._;

  // browserify specific options
  delete opts._flags;
  delete opts.basedir;
  delete opts.global;

  return opts;
}