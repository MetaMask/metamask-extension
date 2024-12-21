# LavaMoat Policy Review process in metamask-extension

When there's a need to change policy (because of new or updated packages that require a different set of capabilities), please follow these steps:

> In the initial soft-launch of the process the approval from policy reviewers is not mandatory, but it will be in the near future.

### Engineer on the dev team:
   1. Notice the `validate-lavamoat-policy-*` circleci job fail because dependency updates or changes need a policy update.
   2. (optional) Generate an updated policy and give it a cursory look in local development whenever you’re testing the change.
      - If you're confident your update is complete, you can push it to the PR branch.
   3. To generate a complete set of new policies, call `metamaskbot` for help:
       - put `@metamaskbot update-policies` in a comment on the PR. When it produces changes, they need to be reviewed. The following steps assume update-policies produced changes.
      - *Note the response from the bot points to instructions on how to review the policy for your convenience. https://lavamoat.github.io/guides/policy-diff/*
   4. Analyze the diff of policy.json and use the understanding of the codebase and change being made to decide whether the capabilities added make sense in that context. Leave a comment listing any doubts you have with brief explanations or if everything is in order \- saying so and explaining why the most powerful capabilities are there (like access to child_process.exec in node or network access in the browser)
      *Remember the Security Reviewer comes with more security expertise but less intimate knowledge of the codebase and the change you’ve built, so you are the most qualified to know whether the dependency needs the powers detected by   LavaMoat or not.*
      - You can use these questions to guide your analysis:
         1. What new powers (globals and builtins) do you see? Why should the package be allowed to use these new powers? Explain if possible
         2. What new packages do you see? Did you intend to introduce them? If you didn’t, which package did? (can you see them in `packages` field in policy of any other package that you updated or introduced?)
      - The comment is mandatory even if you don’t understand the policy change, in which case you’re expected to state so (it’s ok to not understand)
      - Note: this could be enforced by a job that is only passing if the comment was made
      - Note: we’d introduce more tooling to summarize and analyze policy and post that as a comment on the PR
   5. Mention `policy-reviewers` group in your comment.
      policy-reviewers group includes security liaisons and their involvement is not limited to (but likely focused more around) their respective teams’ PRs.

### L1 Security Reviewer:
   1.  Look at the policy and the comment from the Developer. Approve the PR if they match and the policy change seems safe. Address questions the Developer had and discuss if the policy change doesn’t seem right.
   2. If changes are hard to explain or seem dangerous, escalate to a review of the dependency and its powers by mentioning `supply-chain`
### (optional) L2 Security Reviewer:
   1. Review the dependency in question and inform the PR reviewers whether it’s deemed malicious or safe.
