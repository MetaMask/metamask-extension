const WORKFLOW_ID = process.env.CIRCLE_WORKFLOW_ID;
const CIRCLE_TOKEN = process.env.CIRCLE_OIDC_TOKEN_V2;

async function getWorkflowState(): Promise<string> {
  if (!CIRCLE_TOKEN) {
    throw new Error('CircleCI token is not defined');
  }

  const url = `https://circleci.com/api/v2/workflow/${WORKFLOW_ID}`;
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Circle-Token': CIRCLE_TOKEN,
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const body = await response.json();
    console.log(`Workflow status: ${body}`);
    return body.status;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function rerunWorkflow() {
  if (!CIRCLE_TOKEN) {
    throw new Error('CircleCI token is not defined');
  }

  const url = `https://circleci.com/api/v2/workflow/${WORKFLOW_ID}/rerun`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Circle-Token': CIRCLE_TOKEN,
    },
    body: JSON.stringify({
      enable_ssh: false,
      from_failed: true,
      sparse_tree: false,
    })
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const body = await response.json();
    console.log(body);
  } catch (error) {
    console.error('Error:', error);
  }
}

async function rerunWorkflowIfFailed() {
  try {
    const status = await getWorkflowState();
    if (status === 'failed') {
      await rerunWorkflow();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

rerunWorkflowIfFailed();