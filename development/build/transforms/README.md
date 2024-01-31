# Local Browserify Transforms

This directory contains home-grown Browserify transforms.
Each file listed here exports a transform function factory.

## Removing Fenced Code

> `./remove-fenced-code.js`

This transform is responsible for removing code fences from source code at build time.

For example, the following fenced code:

```javascript
this.store.updateStructure({
  ...,
  GasFeeController: this.gasFeeController,
  TokenListController: this.tokenListController,
  ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
  SnapController: this.snapController,
  ///: END:ONLY_INCLUDE_IN
});
```

Is transformed to the following if the `build-flask` feature is not included in the current build:

```javascript
this.store.updateStructure({
  ...,
  GasFeeController: this.gasFeeController,
  TokenListController: this.tokenListController,
});
```

Note that multiple build types can be specified by separating them with
commands inside the parameter parentheses:

```javascript
///: BEGIN:ONLY_INCLUDE_IN(build-beta,build-flask)
```

It's critical that this transform runs before anything else processes our code.
For details, see [`@metamask/build-utils`](https://github.com/MetaMask/core/tree/main/packages/build-utils).

### Gotchas

By default, the transform will invoke ESLint on files that are modified by the transform.
This is our first line of defense against creating unsyntactic code using code fences, and the transform will error if linting fails.
(Live reloading will continue to work if enabled.)
To toggle this behavior via build system arguments, see [the build system readme](../README.md).
