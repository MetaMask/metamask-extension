# Local Browserify Transforms

This directory contains home-grown Browserify transforms.
Each file listed here exports a transform function factory.

## Removing Fenced Code

> `./remove-fenced-code.js`

When creating builds that support different features, it is desirable to exclude
unsupported features, files, and dependencies at build time. Undesired files and
dependencies can be excluded wholesale, but the _use_ of undesired modules in
files that should otherwise be included – i.e. import statements and references
to those imports – cannot.

To support the exclusion of the use of undesired modules at build time, we
introduce the concept of code fencing to our build system. Our code fencing
syntax amounts to a tiny DSL, which is specified below.

The transform concatenates each file into a single string, and a string parser
identifies any fences in the file. If any fences that should not be included in
the current build are found, the fences and the lines that they wrap are
deleted. The transform errors if a malformed fence line is identified.

For example, the following fenced code:

```javascript
this.store.updateStructure({
  ...,
  GasFeeController: this.gasFeeController,
  TokenListController: this.tokenListController,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  SnapController: this.snapController,
  ///: END:ONLY_INCLUDE_IN
});
```

Is transformed to the following if the build type is not `beta`:

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
///: BEGIN:ONLY_INCLUDE_IN(beta,flask)
```

### Gotchas

By default, the transform will invoke ESLint on files that are modified by the transform.
This is our first line of defense against creating unsyntactic code using code fences, and the transform will error if linting fails.
(Live reloading will continue to work if enabled.)
To toggle this behavior via build system arguments, see [the build system readme](../README.md).

### Code Fencing Syntax

> In the specification, angle brackets, `< >`, indicate required tokens, while
> straight brackets, `[ ]`, indicate optional tokens.
>
> Alphabetical characters identify the name and purpose of a token. All other
> characters, including parentheses, `( )`, are literals.

A fence line is a single-line JavaScript comment, optionally surrounded by
whitespace, in the following format:

```text
///: <terminus>:<command>[(parameters)]

|__| |________________________________|
  |                  |
  |                  |
sentinel         directive
```

The first part of a fence line is the `sentinel`, which is always the string
"`///:`". If the first four non-whitespace characters of a line are not the
`sentinel`, the line will be ignored by the parser. The `sentinel` must be
succeeded by a single space character, or parsing will fail.

The remainder of the fence line is called the `directive`.
The directive consists of a `terminus`, `command`, and (optionally) `parameters`.

- The `terminus` is one of the strings `BEGIN` and `END`. It must be followed by
  a single colon, `:`.
- The `command` is a string of uppercase alphabetical characters, optionally
  including underscores, `_`. The possible commands are listed later in this
  specification.
- The `parameters` are a comma-separated list of RegEx `\w` strings. They must
  be parenthesized, only specified for `BEGIN` directives, and valid for the
  command of the directive.

A valid code fence consists of two fence lines surrounding one or more lines of
non-fence lines. The first fence line must consist of a `BEGIN` directive, and
the second an `END` directive. The command of both directives must be the same,
and the parameters (if any) must be valid for the command.

If an invalid fence is detected, parsing will fail, and the transform stream
will end with an error.

### Commands

#### `ONLY_INCLUDE_IN`

This, the only command defined so far, is used to exclude lines of code
depending on the type of the current build. If a particular set of lines should
only be included in a particular build type, say `beta`, they should be wrapped
as follows:

```javascript
///: BEGIN:ONLY_INCLUDE_IN(beta)
console.log('I am only included in beta builds.');
///: END:ONLY_INCLUDE_IN
```

At build time, the fences and the fenced lines will be removed if the build is
not `beta`.

Parameters are required for this command, and they must be provided as a
comma-separated list of one or more of:

- `main` (the build system default build type)
- `beta`
- `flask`
