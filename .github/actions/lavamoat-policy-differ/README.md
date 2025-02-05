# JSON Resource Analyzer

This action analyzes changes in the "resources" field of multiple JSON files and performs custom analysis on the changes.

## Inputs

### `json_file_paths`

**Required** Comma-separated list of paths to JSON files in the repository.

### `github_token`

**Required** GitHub token for posting comments on the pull request.

## Usage

To use this action in your workflow, add the following step:

```yaml
- name: Analyze JSON Resources
  uses: your-github-username/json-resource-analyzer@v1
  with:
    json_file_paths: 'path/to/file1.json,path/to/file2.json'
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

Make sure to replace `your-github-username` with your actual GitHub username or organization name.

## Customization

To customize the analysis, modify the `analyze` function in `index.js`.
