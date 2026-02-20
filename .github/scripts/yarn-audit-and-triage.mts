import { execSync } from 'child_process';

const USE_CACHED_OUTPUT = true;

let cachedOutput = {
  value: 'minimatch',
  children: {
    ID: 1113371,
    Issue:
      'minimatch has a ReDoS via repeated wildcards with non-matching literal in pattern',
    URL: 'https://github.com/advisories/GHSA-3ppc-4f35-3m26',
    Severity: 'high',
    'Vulnerable Versions': '<10.2.1',
    'Tree Versions': ['3.1.2', '10.1.1'],
    Dependents: [
      'eslint-plugin-n@virtual:a5acec7106050256aaefac033816bdecac3aebdad453fac0728cb8e2a2c2a8103ec57f729c3887e1d31960480e2c9fda0a203d2038f692e6d574577d47ef6f2f#npm:16.6.2',
      'glob@npm:13.0.0',
    ],
  },
};

let output;

if (USE_CACHED_OUTPUT) {
  output = cachedOutput;
} else {
  try {
    // Run audit and output to console
    const stdout = execSync('yarn audit --json', { encoding: 'utf8' });
    console.log('Audit Results:', stdout);
  } catch (error) {
    // execSync throws if exit code is non-zero
    const errorTyped = error as Error & { stdout: string };

    // console.error('Vulnerabilities found or audit failed:', errorTyped.stdout);

    output = JSON.parse(errorTyped.stdout);
  }
}

console.log(output);

// Take output and implement the following rules
// - high sev development dependency advisory:
//   - `Issue` includes the phrase `ReDoS` or `DoS`
//     - re-categorize as low sev
//   - Block all PRs, triage immediately
//
// - low/medium sev development dependency advisory, or deprecation of any dependency:
//   - Create issue, highlight in daily Slack message so that we don't lose focus
//
// - Any severity production dependency advisory
//   - Block RC until resolved
