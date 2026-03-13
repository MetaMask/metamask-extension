import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

type PackageJson = {
  resolutions?: Record<string, string>;
  dependencies?: Record<string, string>;
};

type AuditVulnerability = {
  severity: string;
  via: (
    | string
    | { name: string; severity: string; title: string; url: string }
  )[];
  effects: string[];
  range: string;
  nodes: string[];
  fixAvailable:
    | boolean
    | { name: string; version: string; isSemVerMajor: boolean };
};

type AuditResult = {
  vulnerabilities?: Record<string, AuditVulnerability>;
  metadata?: {
    vulnerabilities: {
      info: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
      total: number;
    };
  };
};

type ParsedPackage = {
  name: string;
  version: string;
};

type PackageAuditResult = {
  name: string;
  version: string;
  hasVulnerabilities: boolean;
  vulnerabilities: AuditVulnerability[];
  severityCounts: {
    info: number;
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
};

/**
 * Extracts package name and version from Yarn patch protocol string
 * Handles various formats:
 * - patch:lodash@npm%3A4.17.21#path/to/patch.patch
 * - patch:lodash@npm:4.17.21#path/to/patch.patch
 * - patch:@scope/package@npm%3A1.2.3#path/to/patch.patch
 * - Nested patches like patch:package@patch%3Apackage@npm%253A1.0.0...
 *
 * @param patchString
 */
function parsePatchProtocol(patchString: string): ParsedPackage | null {
  if (!patchString.startsWith('patch:')) {
    return null;
  }

  // Handle nested patches - extract the innermost package reference
  // URL decode the string to handle %3A -> : and %253A -> %3A -> :
  let decoded = patchString;
  // Keep decoding until no more encoded characters
  while (decoded.includes('%')) {
    const newDecoded = decodeURIComponent(decoded);
    if (newDecoded === decoded) {
      break;
    }
    decoded = newDecoded;
  }

  // Match patterns like:
  // patch:lodash@npm:4.17.21#...
  // patch:@scope/package@npm:1.2.3#...
  // For nested patches, find the first complete package@npm:version pattern
  const match = decoded.match(/patch:(@?[^@]+)@npm:([^#]+?)(?:#|$)/);

  if (!match) {
    return null;
  }

  const name = match[1];
  const version = match[2];

  // Clean up version (remove any trailing patch info)
  const cleanVersion = version.split('#')[0].split('@')[0];

  return { name, version: cleanVersion };
}

/**
 * Gets all unique patched packages from resolutions and dependencies
 */
function getPatchedPackages(packageJson: PackageJson): Map<string, string> {
  const patchedPackages = new Map<string, string>();

  // Check resolutions
  const resolutions = packageJson.resolutions || {};
  for (const value of Object.values(resolutions)) {
    if (typeof value === 'string' && value.startsWith('patch:')) {
      const parsed = parsePatchProtocol(value);
      if (parsed && parsed.version) {
        // Use package name as key to deduplicate
        // Prefer keeping the version if we haven't seen this package before
        if (!patchedPackages.has(parsed.name)) {
          patchedPackages.set(parsed.name, parsed.version);
        }
      }
    }
  }

  // Also check direct dependencies for patches
  const dependencies = packageJson.dependencies || {};
  for (const value of Object.values(dependencies)) {
    if (typeof value === 'string' && value.startsWith('patch:')) {
      const parsed = parsePatchProtocol(value);
      if (parsed && parsed.version) {
        if (!patchedPackages.has(parsed.name)) {
          patchedPackages.set(parsed.name, parsed.version);
        }
      }
    }
  }

  return patchedPackages;
}


/**
 * Runs npm audit on a specific package version using a temporary package.json
 *
 * @param name
 * @param version
 */
function auditPackage(name: string, version: string): PackageAuditResult {
  const packageSpec = `${name}@${version}`;
  const result: PackageAuditResult = {
    name,
    version,
    hasVulnerabilities: false,
    vulnerabilities: [],
    severityCounts: {
      info: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
    },
  };

  try {
    // Create temp directory for audit
    const tempDir = join(process.cwd(), '.temp-audit', `${name.replace(/\//g, '__')}__${version}`);
    const fs = require('fs');
    fs.mkdirSync(tempDir, { recursive: true });

    // Create temporary package.json
    const tempPackageJson = {
      name: 'temp-audit-package',
      version: '1.0.0',
      private: true,
      dependencies: {
        [name]: version,
      },
    };
    fs.writeFileSync(join(tempDir, 'package.json'), JSON.stringify(tempPackageJson, null, 2));

    // Generate package-lock.json (required for npm audit to work)
    execSync('npm install --package-lock-only --ignore-scripts 2>/dev/null || true', {
      encoding: 'utf-8',
      cwd: tempDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });

    // Run npm audit in the temp directory
    const output = execSync('npm audit --json 2>/dev/null || true', {
      encoding: 'utf-8',
      cwd: tempDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    if (!output.trim()) {
      return result;
    }

    const auditResult: AuditResult = JSON.parse(output);

    if (auditResult.vulnerabilities) {
      const vulns = Object.values(auditResult.vulnerabilities);
      result.vulnerabilities = vulns;
      result.hasVulnerabilities = vulns.length > 0;

      // Count severities
      for (const vuln of vulns) {
        const severity = vuln.severity?.toLowerCase() as keyof typeof result.severityCounts;
        if (severity && severity in result.severityCounts) {
          result.severityCounts[severity]++;
        }
      }
    }

    if (auditResult.metadata?.vulnerabilities) {
      const meta = auditResult.metadata.vulnerabilities;
      result.severityCounts = {
        info: meta.info || 0,
        low: meta.low || 0,
        moderate: meta.moderate || 0,
        high: meta.high || 0,
        critical: meta.critical || 0,
      };
      result.hasVulnerabilities = meta.total > 0;
    }

    return result;
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const stdout = err.stdout || '';
    const stderr = err.stderr || '';

    // Try to parse JSON from stdout even if command failed
    if (stdout.trim()) {
      try {
        const auditResult: AuditResult = JSON.parse(stdout);
        if (auditResult.vulnerabilities) {
          const vulns = Object.values(auditResult.vulnerabilities);
          result.vulnerabilities = vulns;
          result.hasVulnerabilities = vulns.length > 0;

          for (const vuln of vulns) {
            const severity = vuln.severity?.toLowerCase() as keyof typeof result.severityCounts;
            if (severity && severity in result.severityCounts) {
              result.severityCounts[severity]++;
            }
          }
        }
      } catch {
        // Could not parse JSON, return empty result
        console.warn(`  ⚠️  Could not audit ${packageSpec}: ${stderr || err.message}`);
      }
    }

    // Clean up temp directory on error
    try {
      const tempDir = join(process.cwd(), '.temp-audit', `${name.replace(/\//g, '__')}__${version}`);
      const fs = require('fs');
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    return result;
  }
}

/**
 * Format severity with color/emoji
 *
 * @param severity
 * @param count
 */
function formatSeverity(severity: string, count: number): string {
  if (count === 0) {
    return '';
  }

  const icons: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    moderate: '🟡',
    low: '🔵',
    info: '⚪',
  };

  return `${icons[severity] || '•'} ${count} ${severity}`;
}

/**
 * Format vulnerability details for display
 *
 * @param vuln
 * @param severityLevels
 * @param minSeverityIndex
 */
function formatVulnerabilityDetails(
  vuln: AuditVulnerability,
  severityLevels: string[],
  minSeverityIndex: number,
): string {
  const lines: string[] = [];

  // Get vulnerability info from the 'via' array, filtered by severity
  for (const via of vuln.via) {
    if (typeof via === 'object' && via.title) {
      // Filter out advisories below the minimum severity threshold
      const viaSeverityIndex = severityLevels.indexOf(
        via.severity?.toLowerCase(),
      );
      if (viaSeverityIndex < minSeverityIndex) {
        continue; // Skip this advisory
      }

      lines.push(`       📋 ${via.title}`);
      lines.push(`          Severity: ${via.severity}`);
      if (via.url) {
        lines.push(`          URL: ${via.url}`);
      }
    }
  }

  // Only add affected/fix info if we have any relevant advisories
  if (lines.length > 0) {
    // Add affected range
    if (vuln.range) {
      lines.push(`          Affected: ${vuln.range}`);
    }

    // Add fix info
    if (vuln.fixAvailable) {
      if (typeof vuln.fixAvailable === 'object') {
        lines.push(
          `          Fix: Upgrade to ${vuln.fixAvailable.name}@${vuln.fixAvailable.version}`,
        );
      } else {
        lines.push(`          Fix available: Yes`);
      }
    } else {
      lines.push(`          Fix available: No`);
    }
  }

  return lines.join('\n');
}

/**
 * Main function to audit all patched packages
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const severityArg = args.find((arg) => arg.startsWith('--severity='));
  const minSeverity = severityArg?.split('=')[1] || 'moderate';
  const jsonOutput = args.includes('--json');
  const verboseOutput = args.includes('--verbose') || args.includes('-v');

  const severityLevels = ['info', 'low', 'moderate', 'high', 'critical'];
  const minSeverityIndex = severityLevels.indexOf(minSeverity);

  if (minSeverityIndex === -1) {
    console.error(`Invalid severity level: ${minSeverity}`);
    console.error(`Valid levels: ${severityLevels.join(', ')}`);
    process.exit(1);
  }

  const packageJsonPath = join(process.cwd(), 'package.json');

  if (!existsSync(packageJsonPath)) {
    console.error('❌ package.json not found in current directory');
    process.exit(1);
  }

  const packageJson: PackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const patchedPackages = getPatchedPackages(packageJson);

  if (patchedPackages.size === 0) {
    if (jsonOutput) {
      console.log(JSON.stringify({ packages: [], vulnerabilities: 0 }));
    } else {
      console.log('✅ No patched packages found in resolutions');
    }
    process.exit(0);
  }

  if (!jsonOutput) {
    console.log('\n' + '='.repeat(70));
    console.log('🔒 Patched Packages Security Audit');
    console.log('='.repeat(70));
    console.log(`\n📦 Found ${patchedPackages.size} unique patched package(s) to audit:\n`);

    // List all packages first
    const sortedPackages = Array.from(patchedPackages.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    for (const [name, version] of sortedPackages) {
      console.log(`   • ${name}@${version}`);
    }
    console.log('\n' + '-'.repeat(70) + '\n');
  }

  const results: PackageAuditResult[] = [];
  let totalVulnerabilities = 0;
  let relevantVulnerabilities = 0;

  // Create temp audit directory
  const tempAuditDir = join(process.cwd(), '.temp-audit');
  const fs = require('fs');
  fs.mkdirSync(tempAuditDir, { recursive: true });

  for (const [name, version] of Array.from(patchedPackages.entries())) {
    if (!jsonOutput) {
      process.stdout.write(`🔍 Auditing ${name}@${version}...`);
    }

    const result = auditPackage(name, version);
    results.push(result);

    if (!jsonOutput) {
      if (result.hasVulnerabilities) {
        const severities = Object.entries(result.severityCounts)
          .filter(([_, count]) => count > 0)
          .map(([sev, count]) => formatSeverity(sev, count))
          .join(', ');
        console.log(` ⚠️  Vulnerabilities found: ${severities}`);
      } else {
        console.log(' ✅ No vulnerabilities');
      }
    }

    // Count total and relevant vulnerabilities
    for (const [severity, count] of Object.entries(result.severityCounts)) {
      totalVulnerabilities += count;
      if (severityLevels.indexOf(severity) >= minSeverityIndex) {
        relevantVulnerabilities += count;
      }
    }
  }

  // Clean up temp audit directory
  try {
    fs.rmSync(tempAuditDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }

  // Output results
  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          packages: results,
          totalVulnerabilities,
          relevantVulnerabilities,
          minSeverity,
        },
        null,
        2,
      ),
    );
  } else {
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 Audit Summary');
    console.log('='.repeat(70));

    const vulnerablePackages = results.filter((r) => r.hasVulnerabilities);
    const safePackages = results.filter((r) => !r.hasVulnerabilities);

    if (vulnerablePackages.length > 0) {
      console.log(
        `\n⚠️  ${vulnerablePackages.length} package(s) with vulnerabilities:\n`,
      );

      for (const pkg of vulnerablePackages) {
        const severities = Object.entries(pkg.severityCounts)
          .filter(([_, count]) => count > 0)
          .map(([sev, count]) => formatSeverity(sev, count))
          .join(', ');
        console.log(`   • ${pkg.name}@${pkg.version}`);
        console.log(`     ${severities}`);

        // Print detailed vulnerability info if verbose mode
        if (verboseOutput && pkg.vulnerabilities.length > 0) {
          // Filter vulnerabilities to only show those meeting the minimum severity threshold
          const relevantVulns = pkg.vulnerabilities.filter((vuln) => {
            const vulnSeverity = vuln.severity?.toLowerCase();
            const vulnSeverityIndex = severityLevels.indexOf(vulnSeverity);
            return vulnSeverityIndex >= minSeverityIndex;
          });

          for (const vuln of relevantVulns) {
            const details = formatVulnerabilityDetails(
              vuln,
              severityLevels,
              minSeverityIndex,
            );
            if (details) {
              console.log(details);
            }
          }

          if (relevantVulns.length > 0) {
            console.log(''); // Add spacing between packages
          }
        }
      }
    }

    if (safePackages.length > 0) {
      console.log(`\n✅ ${safePackages.length} package(s) with no known vulnerabilities:\n`);
      for (const pkg of safePackages) {
        console.log(`   • ${pkg.name}@${pkg.version}`);
      }
    }

    console.log('\n' + '-'.repeat(70));
    console.log(`Total vulnerabilities found: ${totalVulnerabilities}`);
    console.log(`Vulnerabilities >= ${minSeverity}: ${relevantVulnerabilities}`);
    console.log('-'.repeat(70) + '\n');

    if (relevantVulnerabilities > 0) {
      console.log('❌ Some patched packages have known vulnerabilities.');
      console.log('   Review the audit output and determine if:');
      console.log('   1. Your patch addresses these vulnerabilities');
      console.log('   2. The vulnerabilities affect your use case');
      console.log('   3. You need to upgrade the base package version\n');
      console.log('   To ignore specific advisories, add them to npmAuditIgnoreAdvisories');
      console.log('   in .yarnrc.yml with documentation explaining why.\n');
    } else {
      console.log('✅ All patched packages passed audit.\n');
    }
  }

  // Exit with error code if relevant vulnerabilities found
  process.exit(relevantVulnerabilities > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
