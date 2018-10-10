# Welcome to MetaMask!

If you're submitting code to MetaMask, there are some simple things we'd appreciate you doing to help us stay organized!

### Finding the right project

Before taking the time to code and implement something, feel free to open an issue and discuss it! There may even be an issue already open, and together we may come up with a specific strategy before you take your precious time to write code.

There are also plenty of open issues we'd love help with. Search the [`good first issue`](https://github.com/MetaMask/metamask-extension/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) label, or head to Gitcoin and earn ETH for completing projects we've posted bounties on.

If you're picking up a bounty or an existing issue, feel free to ask clarifying questions on the issue as you go about your work.

### Submitting a pull request
When you're done with your project / bugfix / feature and ready to submit a PR, there are a couple guidelines we ask you to follow:

- [ ] **Test it**: For any new programmatic functionality, we like unit tests when possible, so if you can keep your code cleanly isolated, please do add a test file to the `tests` folder.
- [ ] **Add to the CHANGELOG**: Help us keep track of all the moving pieces by adding an entry to the [`CHANGELOG.md`](https://github.com/MetaMask/metamask-extension/blob/develop/CHANGELOG.md) with a link to your PR.
- [ ] **Meet the spec**: Make sure the PR adds functionality that matches the issue you're closing. This is especially important for bounties: sometimes design or implementation details are included in the conversation, so read carefully!
- [ ] **Close the issue**: If this PR closes an open issue, add the line `Fixes #$ISSUE_NUMBER`. Ex. For closing issue 418, include the line `Fixes #418`. If it doesn't close the issue but addresses it partially, just include a reference to the issue number, like `#418`.
- [ ] **Keep it simple**: Try not to include multiple features in a single PR, and don't make extraneous changes outside the scope of your contribution. All those touched files make things harder to review ;)
- [ ] **PR against `develop`**: Submit your PR against the `develop` branch. This is where we merge new features so they get some time to receive extra testing before being pushed to `master` for production. If your PR is a hot-fix that needs to be published urgently, you may submit a PR against the `master` branch, but this PR will receive tighter scrutiny before merging.
- [ ] **Get reviewed by a core contributor**: Make sure you get a `:thumbsup`, `:+1`, or `LGTM` from a user with a `Member` badge before merging.

And that's it! Thanks for helping out.

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
