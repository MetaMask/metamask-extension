const core = require('@actions/core')
const github = require('@actions/github')
const fs = require('node:fs/promises')
const { analyze } = require('./analyze.js')

async function run() {
  try {
    const jsonFilePaths = core.getMultilineInput('json_file_paths')
    const githubToken = core.getInput('github_token')

    const octokit = github.getOctokit(githubToken)
    const context = github.context

    const headLine = '## LavaMoat Policy change analysis'

    let fullAnalysisResult = headLine + '\n\n'

    for (const jsonFilePath of jsonFilePaths) {
      // Read the current JSON file
      const currentJson = JSON.parse(await fs.readFile(jsonFilePath, 'utf8'))

      // Get the base branch JSON content
      const { data: previousFile } = await octokit.rest.repos.getContent({
        ...context.repo,
        path: jsonFilePath,
        ref: context.payload.pull_request.base.sha,
      })

      const previousJson = JSON.parse(
        Buffer.from(previousFile.content, 'base64').toString()
      )

      if(previousJson.resources === undefined) {
        throw Error('No resources found in previous policy.')
      } 
      if(currentJson.resources === undefined) {
        throw Error('No resources found in current policy.')
      }

      // Analyze changes
      const analysisResult = analyze(previousJson.resources, currentJson.resources)
      fullAnalysisResult += `
<details>
<summary>${jsonFilePath}</summary>

${analysisResult}

</details>

`
    }

    // Delete previous comment if it exists
    const { data: comments } = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: context.payload.pull_request.number,
    })

    const botComment = comments.find(
      (comment) =>
        comment.user.type.toLowerCase() === 'bot' &&
        comment.body.startsWith(headLine)
    )

    if (botComment) {
      await octokit.rest.issues.deleteComment({
        ...context.repo,
        comment_id: botComment.id,
      })
    }

    // Post new comment on PR
    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: context.payload.pull_request.number,
      body: fullAnalysisResult,
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}


run()
