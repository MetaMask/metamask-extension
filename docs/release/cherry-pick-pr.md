# What is Cherry-pick?
Is the process of choosing and applying specific commits from one branch to another. This technique allows developers to selectively move individual commits without merging the entire branch.

# When do we cherry-pick?
We use cherry-pick on this specific scenario - Incorporating specific bug fixes into a release branch without bringing in other changes from the development branch.
Cherry-picking should be used carefully because it can mess up the testing and build process. It's usually best to avoid it, especially when close to the release date. We should push back on the developer to be consistent and fair. If something really important needs to be added at the last minute, a project manager might ask for it to be cherry-picked and we might have to do it.

# Who is responsible for what?
- A cherry-pick PR should originate from a PR that has already been merged into the develop branch, ensuring it has been approved and tested.
- This cherry-pick PR should then be announced in the release channel to keep everyone informed, rather than through direct messages. The delivery team is responsible for reviewing, approving, and merging these PRs based on their priority and severity.
- Currently, developers have the ability to merge and it should not be merged themselves.

# How to create a cherry-pick PR?
1. Merge the Pull Request (PR) into the Develop Branch: Ensure the PR is fully merged into the develop branch to incorporate all recent changes.
2. Create a New Branch from the Release Branch (For example v11.6.0): Branch off from the release branch v11.6.0. You might name this new branch to reflect its purpose, such as v11.6.0-cherry-pick-1.
3. Cherry-Pick Commits from Develop to the New Branch: Selectively cherry-pick the required commits from the develop branch to your newly created branch (v11.6.0-cherry-pick-1). Carefully resolve any conflicts that occur during this process.
4. Push the New Branch and Initiate a PR Against the Release Branch: After successfully cherry-picking the commits and resolving conflicts, push the new branch to the repository. Subsequently, initiate a PR that targets the original release branch (v11.6.0). In the PR's description, detail any significant merge conflicts that were addressed. If no conflicts were encountered, include a statement such as, "There were no merge conflicts when picking these commits."
5. Notify for Review: After creating the PR, please notify in the release thread(metamask-release-updates) against the given release version.
