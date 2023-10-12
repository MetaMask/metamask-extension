# Getting Started

## Running a Jest test

```bash
> yarn jest <path>
```

## Debugging

### Debugging Jest in VS Code

1. Open **VS Code**
2. Open the “Run and Debug” panel (⇧⌘D)
3. Click the “JavaScript Debug Terminal” button to open the Terminal
4. Run Jest using Node

    ```bash
    > yarn jest --watch <path>
    ```

Additional methods and information to debug in VS Code can be found [here](https://jestjs.io/docs/troubleshooting#debugging-in-vs-code)

### Debugging Jest on Chrome DevTools

1. Run Jest using Node with the V8 Inspector

    ```bash
    > node --inspect ./node_modules/.bin/jest --watch -i <path>

    or

    > node --inspect ./node_modules/.bin/jest <path>
    ```

    **Options:**

    ```jsx
    node:

    			--inspect=[host:]port
                 Activate inspector on host:port.  Default is 127.0.0.1:9229.

                 V8 Inspector integration allows attaching Chrome DevTools and IDEs
    						 to Node.js instances for debugging and profiling.  It uses the
    						 Chrome DevTools Protocol.

    jest:

    			--watch                       Watch files for changes and rerun tests
                                        related to changed files. If you want to
                                        re-run all tests when a file has changed,
                                        use the `--watchAll` option.       [boolean]

    	-i, --runInBand                   Run all tests serially in the current
                                        process (rather than creating a worker pool
                                        of child processes that run tests). This is
                                        sometimes useful for debugging, but such use
                                        cases are pretty rare.             [boolean]
    ```


1. Open Chrome DevTools for Node
    1. Open a **Chromium** browser
    2. Go to [chrome://inspect/#devices](chrome://inspect/#devices)
    3. Click “Open dedicated DevTools for Node” link
