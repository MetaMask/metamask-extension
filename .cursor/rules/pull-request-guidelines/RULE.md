---
description: Guidelines for Creating and Reviewing Pull Requests
alwaysApply: true
---

Reference: [MetaMask Pull Request Guidelines](https://github.com/MetaMask/contributor-docs/blob/main/docs/pull-requests.md)

# MetaMask Extension - Pull Request Guidelines

## Creating Pull Requests

### Write Comprehensive Descriptions

- **ALWAYS fill out the pull request description**
- Explain not only WHAT was changed, but WHY
- Write for people outside your team and for future readers
- Save reviewers' time by providing context directly in the PR

#### Answer These Questions:

1. **What is the context behind your changes?**
   - Share domain-specific information
   - Set the stage for reviewers
   - Link to issues, but also summarize the context

2. **What is the purpose of your changes?**
   - What's insufficient about the current state?
   - What's the user story?
   - What problem are you solving?

3. **What is your solution?**
   - How do your changes satisfy the need?
   - Are there non-obvious changes to explain?
   - If UI changes, include screenshots or videos

#### Description Template:

```markdown
## Context
[Explain the background, domain-specific information, and any relevant history]

## Problem
[Describe what's insufficient about current behavior or what user need exists]

## Solution
[Explain your approach and how it addresses the problem]

## Implementation Notes
[Call out any non-obvious changes, complex logic, or design decisions]

## Screenshots/Videos (if applicable)
[Add visual documentation for UI changes]
```

#### Examples of Good Descriptions:

- https://github.com/MetaMask/metamask-extension/pull/19970
- https://github.com/MetaMask/metamask-extension/pull/18629
- https://github.com/MetaMask/metamask-mobile/pull/6677
- https://github.com/MetaMask/snaps/pull/1708
- https://github.com/MetaMask/metamask-extension/pull/21370
- https://github.com/MetaMask/metamask-mobile/pull/9450

### Write Good Commit Messages

- **Apply the same guidelines to commit messages as PR descriptions**
- If you create a PR from a single commit, GitHub copies the commit message to the PR description
- Focus on good commit messages BEFORE pushing = less work later
- Good commit messages are visible in Git history, not just GitHub

#### Resources for Commit Messages:

- ["Explain the context" - GitHub Blog](https://github.blog/2022-06-30-write-better-commits-build-better-projects/#explain-the-context)
- ["My favourite Git commit" by David Thompson](https://dhwthompson.com/2019/my-favourite-git-commit)
- ["How to Write a Git Commit Message"](https://commit.style)

### Add PR Comments

- **Use PR comments to call attention to specific changes**
- Keep PR description succinct, add details in comments
- Open a review on GitHub and comment on your own PR at key locations
- Explain non-obvious implementation details inline

Example:
```
💡 This refactoring was necessary because the previous approach didn't
handle edge cases when the user switches networks mid-transaction.
```

Reference: ["Leaving Comments on My Own Pull Requests" by Hector Castro](https://hector.dev/2021/02/24/leaving-comments-on-my-own-pull-requests/)

### Create Smaller Pull Requests

- **Large PRs are extremely painful to review**
- Small PRs reduce conflicts and make commit history clearer
- Break tasks into smaller pieces ahead of time
- Decompose changes into separate focused PRs

#### Guidelines:

- Each PR should focus on a single purpose
- If using "and" in the PR title, consider splitting it
- Plan out code changes and identify natural separation points
- Prototype if needed to understand how to decompose the work

Example:
```
❌ WRONG: Large unfocused PR
"Add token management and update network handling and refactor state"

✅ CORRECT: Focused PRs
PR 1: "Add token validation logic"
PR 2: "Implement token addition UI"
PR 3: "Add token removal functionality"
```

## Reviewing Pull Requests

### Be Compassionate

- **Assume good intent on the part of the author**
- Be mindful of constraints, tradeoffs, or priorities
- Consider invisible context that may have guided the PR
- Respect the author's work and effort

### Go Beyond Surface Level

- Standards and best practices are important BUT
- **Focus on whether the solution solves the underlying user story soundly**
- Evaluate the approach, not just code style
- Consider edge cases and long-term maintainability

### Be Curious, Not Curt

- **Open dialogue instead of forcing ideas**
- Use questions and suggestions, not commands

Examples:
```
❌ WRONG: Commanding
"Delete this comment"
"Rename this variable"
"Change this approach"

✅ CORRECT: Collaborative
"I'm worried that this approach would..."
"I'm wondering if it makes sense to..."
"Should we consider...?"
"What do you think about...?"
"Is it worth it to...?"
"Did you mean to...?"
```

### Show, Don't Tell

- **Use GitHub's suggestion feature**
- Helps authors understand and incorporate ideas quickly
- Prevents extended back-and-forth discussions

Example:
````markdown
```suggestion
const activeAccounts = accounts.filter(account => account.isActive);
```
````

### Highlight Non-Blocking Comments

- **Use prefixes for lower-importance suggestions**
- Communicate that suggestions are optional
- Common prefixes: `Nit:`, `Nitpick:`, `Optional:`

Example:
```
Nit: Jest has a `jest.mocked` function you could use here instead of
`jest.MockFunction`. That should let you clean this up a bit if you wanted.
```

### Let Go of Your Code

- **No two people think exactly alike**
- Different approaches can both be valid
- If reviewing changes to your own code, stay objective
- State your position with context, but respect author's decision
- The author has the right to make the final call

### Praise Good Work

- **Acknowledge great work when you see it**
- Positive feedback motivates and builds team culture
- Call out clever solutions, thorough testing, or clear documentation

Example:
```
✨ This is a really elegant solution! The error handling here is
particularly well thought out.
```

### Take Criticism Offline

- **Fundamental disagreements may need a conversation**
- Video calls can resolve differences more quickly
- Prevents public heated discussions
- Protects everyone's reputation
- More nuanced communication possible

### Use "Request Changes" Sparingly

- **"Request changes" blocks merging until resolved**
- Places an X next to your review
- Use only when changes truly cannot be merged
- Always explain your reasoning clearly

When to use:
- Security vulnerabilities
- Breaking changes without migration
- Fundamentally flawed approach
- Missing critical functionality

When NOT to use:
- Style preferences
- Minor improvements
- Non-blocking suggestions
- Nitpicks

## Receiving Feedback

### Be Open to Other Perspectives

- **Different approaches may be motivated by different values**
- Others' perspectives may reveal blind spots
- Consider context and constraints you may not have
- Feedback is about improving the code, not criticizing you

### Assume Positive Intent

- **Handle brusque or unclear comments gracefully**
- Don't take negative tone personally
- Ask for clarification if needed
- Focus on the technical content

Example response:
```
Thanks for the feedback! Could you help me understand what specific
concerns you have about this approach? I'd like to address them properly.
```

### Point to Updates

- **Link to commits that address feedback**
- Helps reviewers check your work efficiently
- Allows discussions to reach resolution
- Find commits in the "Conversation" view

Example:
```
Good catch! Updated in abc1234.
```

Tips:
- Copy commit ID from Conversation view
- GitHub will auto-link when you paste
- Can also type commit ID directly in comment

### Employ Alternate Communication

- **Sense tension? Reach out directly**
- Offer a video call to talk through concerns
- Prevents misunderstandings from escalating
- Builds stronger team relationships

## Maintaining Pull Requests

### Communicate Takeovers

- **If taking over someone else's PR, let them know**
- Avoid surprises
- Provide context for why you're taking over
- Credit original author appropriately

Example:
```
@original-author I need to move forward with this work to unblock other
features. I'll be taking over this PR and will make sure to preserve your
commits and credit your work. Thanks for getting this started!
```

### Rebase with Caution

- **Once you receive comments, avoid rebasing or amending history**
- Push each new change as a new commit instead

#### Why Avoid Rebasing Active PRs:

1. **Preserves timeline order in Conversation view**
   - Reviewers revisit PRs multiple times
   - Timeline helps them catch up on changes
   - Rebasing moves all commits to the end
   - Makes it hard to locate new changes

2. **Prevents conversations from being marked outdated**
   - Rebasing re-creates commits
   - GitHub thinks old commits are outdated
   - Active conversations get buried
   - Reviewers may ignore "outdated" discussions

3. **Smoother workflow for co-authors**
   - Rewriting history causes pull errors for others
   - Forces others to reset their branches
   - Can lead to frustration and confusion

#### When Rebasing Is Acceptable:

- Rebase on a recent commit (not base branch)
- Minimize range of affected commits
- Choose commit after last conversation entry
- **Always inform reviewers and collaborators**

Example:
```
⚠️ I needed to rebase this PR to fix a merge conflict. All reviewers
have been notified. Please re-review if needed.
```

## Merging Pull Requests

### Clean Up the Commit Message

- **Review the commit message before clicking "Squash & Merge"**
- Default message varies by repository configuration
- May contain: PR description, commit message, or concatenated commits

#### Guidelines:

1. **Ensure message describes the change well**
2. **Replace commit lists with PR description if clearer**
3. **DO NOT modify the commit title format**
   - Must be: `Pull request title (#number)`
   - Automated scripts depend on this format
   - Edit PR title before merging if needed

Example:
```
❌ WRONG: Modified format
Add token validation

This PR adds token validation...

✅ CORRECT: Preserve format
Add token validation (#12345)

This PR adds token validation...
```

## Best Practices Checklist

### Before Creating a PR:
- [ ] Code is complete and tested
- [ ] All tests pass locally
- [ ] Code follows style guidelines
- [ ] No console.logs or debug code
- [ ] Branch is up to date with base branch
- [ ] Commit messages are clear and descriptive

### When Creating a PR:
- [ ] PR title is clear and descriptive
- [ ] Description answers: context, problem, solution
- [ ] Screenshots/videos included for UI changes
- [ ] Linked to relevant issues
- [ ] Added self-review comments for complex changes
- [ ] PR is as small as reasonably possible
- [ ] Single focused purpose (no "and" in title)

### When Reviewing a PR:
- [ ] Read description and understand context
- [ ] Assume good intent
- [ ] Focus on solving user story, not just style
- [ ] Use questions, not commands
- [ ] Use suggestion feature for code changes
- [ ] Mark non-blocking comments with "Nit:"
- [ ] Praise good work
- [ ] Use "Request changes" only when necessary
- [ ] Consider offline discussion if needed

### When Receiving Feedback:
- [ ] Assume positive intent
- [ ] Be open to other perspectives
- [ ] Link to commits that address feedback
- [ ] Ask for clarification when needed
- [ ] Consider video call if tension arises

### When Maintaining a PR:
- [ ] Avoid rebasing after receiving comments
- [ ] Push new changes as new commits
- [ ] Communicate if taking over someone's PR
- [ ] Keep reviewers informed of major changes
- [ ] Respond to all feedback (even if just acknowledging)

### When Merging a PR:
- [ ] All conversations resolved or acknowledged
- [ ] All required approvals received
- [ ] CI/CD checks passing
- [ ] Commit message reviewed and cleaned up
- [ ] Title format preserved: `Title (#number)`
- [ ] Final message accurately describes change

## Communication Examples

### Requesting Review:
```
@reviewer This PR adds token validation logic. I'd especially appreciate
feedback on the approach in `validateToken()` (lines 45-78) as I had to
make some tradeoffs there.
```

### Responding to Feedback:
```
Great point about edge cases! I've added additional validation and tests
for those scenarios in commit abc1234. Let me know if this addresses your
concerns.
```

### Explaining Complex Changes:
```
💡 The reason for this seemingly complex approach is that we need to
maintain backwards compatibility with the old API while supporting the
new format. This will be simplified in the next major version.
```

### Suggesting Improvements:
```
This looks good! One thought: have you considered using memoization here?
It might improve performance for large token lists. Not blocking though,
just something to think about.
```

### Taking Work Offline:
```
I have some thoughts about the overall architecture here that might be
better discussed in person. Would you be available for a quick call
tomorrow to talk through some alternatives?
```

## References

- [MetaMask Pull Request Guidelines](https://github.com/MetaMask/contributor-docs/blob/main/docs/pull-requests.md)
- [GitHub - Write Better Commits](https://github.blog/2022-06-30-write-better-commits-build-better-projects/)
- [How to Write a Git Commit Message](https://commit.style)

