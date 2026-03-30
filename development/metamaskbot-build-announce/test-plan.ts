/**
 * Test Plan Markdown Generator
 *
 * Converts the AI-generated test plan JSON to formatted markdown
 * with collapsible sections for PR comments.
 */

type TestingScenario = {
  area: string;
  riskLevel: 'high' | 'medium' | 'low';
  testSteps: string[];
  whyThisMatters: string;
};

type TestingPlan = {
  prNumber: number;
  prTitle: string;
  generatedAt: string;
  modelUsed: string;
  summary: {
    totalFilesChanged: number;
    totalCommitsInRelease: number;
    releaseRiskScore: string;
    highRiskScenarios: number;
    mediumRiskScenarios: number;
  };
  testScenarios: {
    cherryPickScenarios: TestingScenario[];
    initialScenarios: TestingScenario[];
  };
};

/**
 * Fetches the test plan JSON from the given URL
 */
async function fetchTestPlan(url: string): Promise<TestingPlan | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch test plan: ${response.status}`);
      return null;
    }
    return (await response.json()) as TestingPlan;
  } catch (error) {
    console.warn(`Error fetching test plan: ${error}`);
    return null;
  }
}

/**
 * Formats a single scenario as markdown
 */
function formatScenarioMarkdown(
  scenario: TestingScenario,
  index: number,
): string {
  let md = `### ${index}. ${scenario.area}\n`;
  md += `**Risk Level:** ${scenario.riskLevel.toUpperCase()}\n\n`;
  md += `**Why This Matters:** ${scenario.whyThisMatters}\n\n`;
  md += `**Test Steps:**\n`;
  scenario.testSteps.forEach((step) => {
    md += `${step}\n`;
  });
  md += '\n---\n\n';
  return md;
}

/**
 * Formats scenarios by risk level into collapsible sections
 */
function formatScenariosSection(
  scenarios: TestingScenario[],
  sectionTitle: string,
): string {
  if (scenarios.length === 0) {
    return '';
  }

  const highRisk = scenarios.filter((s) => s.riskLevel === 'high');
  const mediumRisk = scenarios.filter((s) => s.riskLevel === 'medium');
  const lowRisk = scenarios.filter((s) => s.riskLevel === 'low');

  let md = `<details>\n<summary><strong>${sectionTitle} (${scenarios.length})</strong></summary>\n\n`;

  if (highRisk.length > 0) {
    md += `## High Risk Scenarios (${highRisk.length})\n\n`;
    highRisk.forEach((scenario, index) => {
      md += formatScenarioMarkdown(scenario, index + 1);
    });
  }

  if (mediumRisk.length > 0) {
    md += `## Medium Risk Scenarios (${mediumRisk.length})\n\n`;
    mediumRisk.forEach((scenario, index) => {
      md += formatScenarioMarkdown(scenario, index + 1);
    });
  }

  if (lowRisk.length > 0) {
    md += `## Low Risk Scenarios (${lowRisk.length})\n\n`;
    lowRisk.forEach((scenario, index) => {
      md += formatScenarioMarkdown(scenario, index + 1);
    });
  }

  md += `</details>\n\n`;
  return md;
}

/**
 * Extracts team names from scenarios based on area keywords.
 * Uses word boundary matching to avoid false positives (e.g., "sign" in "design").
 */
function extractTeamsFromScenarios(scenarios: TestingScenario[]): string[] {
  const teamKeywords: Record<string, string> = {
    account: 'Accounts',
    wallet: 'Wallet',
    transaction: 'Transactions',
    confirmation: 'Confirmations',
    signing: 'Confirmations',
    swap: 'Swaps',
    bridge: 'Swaps and Bridge',
    network: 'Networks',
    token: 'Assets',
    nft: 'Assets',
    asset: 'Assets',
    permission: 'Permissions',
    dapp: 'Wallet Integrations',
    snap: 'Snaps',
    setting: 'Settings',
    security: 'Security',
    privacy: 'Security',
    onboarding: 'Onboarding',
    'seed phrase': 'Onboarding',
    backup: 'Onboarding',
    notification: 'Notifications',
    phishing: 'Product Safety',
    blockaid: 'Product Safety',
  };

  const teams = new Set<string>();

  scenarios.forEach((scenario) => {
    const areaLower = scenario.area.toLowerCase();
    Object.entries(teamKeywords).forEach(([keyword, team]) => {
      // Use word boundary regex to avoid substring false positives
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(areaLower)) {
        teams.add(team);
      }
    });
  });

  if (teams.size === 0) {
    teams.add('Extension Platform');
  }

  return Array.from(teams).sort();
}

/**
 * Converts the test plan JSON to formatted markdown
 */
function convertTestPlanToMarkdown(plan: TestingPlan): string {
  const { summary, testScenarios } = plan;
  const allScenarios = [
    ...testScenarios.cherryPickScenarios,
    ...testScenarios.initialScenarios,
  ];

  const teams = extractTeamsFromScenarios(allScenarios);

  let md = `## AI Test Plan\n\n`;

  // Stats table
  md += `| Risk Score | High Risk | Medium Risk | Files Changed | Commits |\n`;
  md += `|------------|-----------|-------------|---------------|----------|\n`;
  md += `| **${summary.releaseRiskScore}** | ${summary.highRiskScenarios} | ${summary.mediumRiskScenarios} | ${summary.totalFilesChanged} | ${summary.totalCommitsInRelease} |\n\n`;

  // Cherry-pick scenarios (if any)
  if (testScenarios.cherryPickScenarios.length > 0) {
    md += formatScenariosSection(
      testScenarios.cherryPickScenarios,
      'Cherry-Pick Scenarios',
    );
  }

  // Initial scenarios
  if (testScenarios.initialScenarios.length > 0) {
    md += formatScenariosSection(
      testScenarios.initialScenarios,
      'Release Scenarios',
    );
  }

  // Teams sign-off section
  md += `<details>\n<summary><strong>Teams Sign-off Status</strong></summary>\n\n`;
  md += `**Signed off:** None yet\n\n`;
  md += `**Awaiting sign-off (${teams.length}):**\n`;
  md += teams.join(', ') + '\n\n';
  md += `</details>\n\n`;

  // Footer
  md += `---\n`;
  md += `*Generated by AI Test Plan Analyzer (${plan.modelUsed}) at ${plan.generatedAt}*\n\n`;

  return md;
}

/**
 * Builds the test plan section for the PR comment.
 * Fetches JSON, converts to markdown, and returns both the markdown and JSON link.
 */
export async function buildTestPlanSection(
  hostUrl: string,
  testPlanVersion: string,
): Promise<string> {
  const testPlanFileName = `test-plan-${testPlanVersion}.json`;
  const testPlanUrl = `${hostUrl}/build-test-plan/builds/${testPlanFileName}`;
  const testPlanLink = `<a href="${testPlanUrl}">${testPlanFileName}</a>`;

  // Try to fetch and convert the test plan
  const plan = await fetchTestPlan(testPlanUrl);

  if (plan) {
    const markdown = convertTestPlanToMarkdown(plan);
    return `${markdown}AI generated test plan (JSON): ${testPlanLink}\n\n`;
  }

  // Fallback to just the link if fetch fails
  return `AI generated test plan: ${testPlanLink}\n\n`;
}
