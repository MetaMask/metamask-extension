# Bundled Assets

Resources in this directory must be referenced through webpack dependencies,
such as static imports or `new URL(..., import.meta.url)`. Webpack emits resource
URLs under `assets/` with content-hashed filenames. This directory is not copied
by CopyPlugin.

- `images/`: images used by application code.
- `animations/`: Rive animations used by application code.

`app/images/` remains the legacy, copied resource directory. Move resources here
in small batches only after checking all consumers, including CSS, HTML,
manifests, tests, and stored paths. Replace runtime path strings with webpack
dependencies and remove the old files so they are not also copied.
