# Welcome to MetaMask!

If you're submitting code to MetaMask, there are some simple things we'd appreciate you doing to help us stay organized!

## Submitting pull requests

Before taking the time to code and implement something, feel free to open an issue and discuss it! There may even be an issue already open, and together we may come up with a specific strategy before you take your precious time to write code.

### Tests

For any new programmatic functionality, we like unit tests when possible, so if you can keep your code cleanly isolated, please do add a test file to the `tests` folder.

### PR Format

We use [waffle](https://waffle.io/) for project management, and it will automatically keep us organized if you do one simple thing:

If this PR closes the issue, add the line `Fixes #$ISSUE_NUMBER`. Ex. For closing issue 418, include the line `Fixes #418`.

If it doesn't close the issue but addresses it partially, just include a reference to the issue number, like `#418`.

## Before Merging

Make sure you get a `:thumbsup`, `:+1`, or `LGTM` from another collaborator before merging.

## Before Closing Issues

Make sure the relevant code has been reviewed and merged.

### Developing inside a node_modules folder

First make sure you are comfortable with [how require works](https://github.com/maxogden/art-of-node#how-require-works) in node.

We recommend creating a folder somewhere manually called `node_modules`. For example in `~/code/node_modules`. Clone all of your git copies of modules that you want to work on into here, so for example:

- `~/code/node_modules/dat`
- `~/code/node_modules/hyperdrive`

When you run `npm install` inside of `~/code/node_modules/dat`, dat will get its own copy of `hyperdrive` (one if its dependencies) inside `~/code/node_modules/dat/node_modules`. However, if you encounter a bug in hyperdrive that you need to fix, but you want to test your fix in dat, you want dat to use your git copy of hyperdrive at `~/code/node_modules/hyperdrive` and not the npm copy of hyperdrive at `~/code/node_modules/dat/node_modules/hyperdrive`.

How do you get dat to use the git copy of hyperdrive? Just delete the npm copy!

```
rm -rf ~/code/node_modules/dat/node_modules/hyperdrive
```

Now when you run dat, and it tries to `require('hyperdrive')` it first looks in its own `node_modules` folder at `~/code/node_modules/dat/node_modules` but doesnt find hyperdrive. So it goes up to `~/code/node_modules` and finds `hyperdrive` there and uses that one, your git copy.

If you want to switch back to an npm copy, just run `npm install` inside `~/code/node_modules/dat/` and npm will download any missing modules into `~/code/node_modules/dat/node_modules` but wont touch anything in `~/code/node_modules`.

This might seem a bit complicated at first, but is simple once you get the hang of it. Here are some rules to help you get started:

- Never make any meaningful edits to code inside an "npm-managed" node_modules folder (such as `~/code/node_modules/dat/node_modules`), because when you run `npm install` inside those folders it could inadvertently delete all of your edits when installing an updated copy of a module. This has happened to me many times, so I just always use my git copy and delete the npm copy (as described above) to make edits to a module.
- You should never need to run any npm commands in terminal when at your "manually managed"" node_modules folder at `~/code/node_modules`. Never running npm commands at that folder also prevents npm from accidentally erasing your git copies of modules
- The location of your "manually managed" node_modules folder should be somewhere isolated from your normal require path. E.g. if you put it at `~/node_modules`, then when you run `npm install dat` at `~/Desktop` npm might decide to erase your git copy of dat at `~/node_modules/dat` and replace it with a copy from npm, which could make you lose work. Putting your manually managed `node_modules` folder in a sub-folder like `~/code` gets it "out of the way" and prevents accidents like that from happening.
