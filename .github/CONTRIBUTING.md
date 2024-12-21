# Welcome to MetaMask!

If you're submitting code to MetaMask, there are some simple things we'd appreciate you doing to help us stay organized!

### Finding the right project

Before taking the time to code and implement something, feel free to open an issue and discuss it! There may even be an issue already open, and together we may come up with a specific strategy before you take your precious time to write code.

There are also plenty of open issues we'd love help with. Search the [`good first issue`](https://github.com/MetaMask/metamask-extension/contribute) label, or head to Gitcoin and earn ETH for completing projects we've posted bounties on.

If you're picking up a bounty or an existing issue, feel free to ask clarifying questions on the issue as you go about your work.

### Submitting a pull request
When you're done with your project / bugfix / feature and ready to submit a PR, there are a couple guidelines we ask you to follow:

- [ ] **Make sure you followed our [`coding guidelines`](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/CODING_GUIDELINES.md)**: These guidelines aim to maintain consistency and readability across the codebase. They help ensure that the code is easy to understand, maintain, and modify, which is particularly important when working with multiple contributors.
- [ ] **Test it**: For any new programmatic functionality, we like unit tests when possible, so if you can keep your code cleanly isolated, please do add a test file to the `tests` folder.
- [ ] **Meet the spec**: Make sure the PR adds functionality that matches the issue you're closing. This is especially important for bounties: sometimes design or implementation details are included in the conversation, so read carefully!
- [ ] **Close the issue**: If this PR closes an open issue, fill out the "Related issues" section with `Fixes: #$ISSUE_NUMBER`. Ex. For closing issue 418, include the line `Fixes: #418`. If it doesn't close the issue but addresses it partially, just include a reference to the issue number, like `#418`.
- [ ] **Keep it simple**: Try not to include multiple features in a single PR, and don't make extraneous changes outside the scope of your contribution. All those touched files make things harder to review ;)
- [ ] **PR against `main`**: Submit your PR against the `main` branch. This is where we merge new features so they get some time to receive extra testing before being pushed to `master` for production. If your PR is a hot-fix that needs to be published urgently, you may submit a PR against the `master` branch, but this PR will receive tighter scrutiny before merging.
- [ ] **Get reviewed by MetaMask Internal Developers**: All PRs require 2 approvals from MetaMask Internal Developers before merging.
- [ ] **Ensure the PR is correctly labeled.**: More detail about PR labels can be found [here](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/LABELING_GUIDELINES.md).
- [ ] **PR Titles**: Must adhere to the [Conventional Commits specification](https://www.conventionalcommits.org)
  - `<type>[optional scope]: <description>`
  - Example: `feat(parser): add ability to parse arrays`
  - Available types:
    - feat: A new feature
    - fix: A bug fix
    - docs: Documentation only changes
    - style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
    - refactor: A code change that neither fixes a bug nor adds a feature
    - perf: A code change that improves performance
    - test: Adding missing tests or correcting existing tests
    - build: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
    - ci: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
    - chore: Other changes that don't modify src or test files
    - revert: Reverts a previous commit

And that's it! Thanks for helping out.
