# What is Master-Sync?
Master-sync refers to the process of synchronizing the master branch with changes from the develop branch. This involves getting all commits from the master onto develop and merging the histories of the two branches.

# Executing the Master-Sync Process
1. Initiate the Master-Sync:
    * Execute the command `yarn master-sync`. This command will create or update a local master-sync branch, preparing it for a master-sync pull request.
2. Push the branch to the remote repository:
    * After the script completes successfully, the next step is to push the master-sync branch to the remote repository. This action often requires a force push, so use `git push --force`.
3. Creating and managing the pull request:
    * Once the branch is pushed, create a PR for the master-sync branch. After the PR is created, ensure all continuous integration jobs pass successfully.
    * It is crucial to merge the PR directly without opting for the "squash and merge" option. Using "squash and merge" would lead to the loss of individual commit histories, which is undesirable for a master-sync operation.
4. Enabling the merge commit option:
    * Merge commit option is not enabled, please reach out to the repository administrators (Dan Miller or Mark Stacey) to temporarily enable merge commits for the operation.
5. Handling updates from the develop branch:
    * Avoid updating the master-sync branch with the latest changes from the develop branch, especially when the 'Update Branch' button is active. This precaution helps maintain the integrity and purpose of the master-sync process.

# Purpose:
This synchronization process is crucial for maintaining a coherent and stable codebase, particularly in projects with multiple contributors. It ensures that everyone is working with the most recent and stable version of the code, thereby reducing the likelihood of conflicts and regressions in the project.