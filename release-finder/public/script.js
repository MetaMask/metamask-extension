document.addEventListener('DOMContentLoaded', () => {
  const findCommitsButton = document.getElementById('findCommits');
  const commitMessageInput = document.getElementById('commitMessage');
  const resultsDiv = document.getElementById('results');
  const commitForm = document.getElementById('commitForm');

  const submitCommit = async (event) => {
    event.preventDefault();
    const commitMessage = commitMessageInput.value;

    if (!commitMessage) {
      alert('Please enter a commit message.');
      return;
    }

    try {
      const response = await fetch('/find-commits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commitMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      displayResults(data);
    } catch (error) {
      console.error(error);
      alert('An error occurred while fetching data.');
    }
  }

  findCommitsButton.addEventListener('click', submitCommit);
  commitForm.addEventListener('submit', submitCommit);

  function replacePullRequestLinks(inputString) {
    // Define a regular expression pattern to match "(#XXXXX)"
    const pattern = /\(\#(\d{5})\)/g;

    // Replace matched patterns with links
    const replacedString = inputString.replace(pattern, (match, pullRequestNumber) => {
      const githubUrl = `https://github.com/MetaMask/metamask-extension/pull/${pullRequestNumber}`;
      return `<a href='${githubUrl}' target='_blank'>#${pullRequestNumber}</a>`;
    });

    return replacedString;
  }

  function displayResults(data) {
    resultsDiv.innerHTML = '';

    if (data.length === 0) {
      resultsDiv.textContent = 'No commits found with the specified message.';
    } else {
      data.forEach(commitDetails => {
        const commitMessage = replacePullRequestLinks(commitDetails.commitMessage);

        const commitDiv = document.createElement('div');
        commitDiv.classList.add('commit');
        commitDiv.innerHTML = `
          <strong>Commit Hash:</strong> ${commitDetails.commitHash}<br>
          <strong>Commit Message:</strong> ${commitMessage}<br>
          <strong>First release:</strong> <a href="https://github.com/MetaMask/metamask-extension/releases/tag/${commitDetails.earliestReleaseTag}" target='_blank'>
            ${commitDetails.earliestReleaseTag}</a><br><br>
        `;
        resultsDiv.appendChild(commitDiv);
      });
    }
  }
});
