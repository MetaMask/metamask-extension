/**
 * Route Page Object Coverage Report
 *
 * Compares the extension routes (`ROUTES` in ui/helpers/constants/routes.ts)
 * with the route page object registry (test/e2e/route-registry) and reports
 * which routes have an E2E page object, which have none yet, which are not
 * screens, which are missing from the registry, and which registry entries no
 * longer match a route.
 *
 * Usage:
 * yarn test:e2e:route-coverage
 *
 * Output:
 * - Console summary and per-route table
 * - JSON report at test/test-results/e2e/route-coverage-report.json
 */

import * as fs from 'fs';
import * as path from 'path';

import { ROUTES } from '../../../ui/helpers/constants/routes';
import {
  getRouteCoverage,
  ROUTE_PAGE_OBJECT_REGISTRY,
  type RouteCoverageReport,
} from '../route-registry';

export function generateReport(): RouteCoverageReport {
  return getRouteCoverage(ROUTES, ROUTE_PAGE_OBJECT_REGISTRY);
}

function printReport(report: RouteCoverageReport): void {
  const { summary, routes, staleEntries } = report;

  console.log('='.repeat(80));
  console.log('  ROUTE PAGE OBJECT COVERAGE REPORT');
  console.log('='.repeat(80));
  console.log(`  Generated: ${report.generatedAt}`);
  console.log('');
  console.log('  SUMMARY');
  console.log(`  ${'-'.repeat(40)}`);
  const summaryRows: [string, string | number][] = [
    ['Total routes', summary.totalRoutes],
    ['With a page object', summary.withPageObject],
    ['No page object yet', summary.withoutPageObject],
    ['Not a screen', summary.notAScreen],
    ['Not in the registry', summary.unregistered],
    ['Stale registry entries', summary.staleEntries],
    [
      'Coverage',
      `${summary.coveragePercentage}% of screen routes have a page object`,
    ],
  ];
  for (const [label, value] of summaryRows) {
    console.log(`  ${`${label}:`.padEnd(25)}${value}`);
  }
  console.log('');

  const pathCol = 60;
  const statusCol = 16;
  const header = [
    'Route'.padEnd(pathCol),
    'Status'.padEnd(statusCol),
    'Page object',
  ].join(' | ');
  console.log(`  ${header}`);
  console.log(`  ${'-'.repeat(header.length)}`);
  for (const entry of routes) {
    const row = [
      (entry.path || '(empty)').padEnd(pathCol),
      entry.status.toUpperCase().padEnd(statusCol),
      entry.pageObject ?? '-',
    ].join(' | ');
    console.log(`  ${row}`);
  }
  console.log('');

  if (staleEntries.length > 0) {
    console.log('  STALE REGISTRY ENTRIES (not in ROUTES)');
    console.log(`  ${'-'.repeat(40)}`);
    for (const stalePath of staleEntries) {
      console.log(`  - ${stalePath}`);
    }
    console.log('');
  }

  console.log('='.repeat(80));
}

function main(): void {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');

  const report = generateReport();
  printReport(report);

  const jsonOutputDir = path.join(repoRoot, 'test', 'test-results', 'e2e');
  fs.mkdirSync(jsonOutputDir, { recursive: true });
  const jsonOutputPath = path.join(jsonOutputDir, 'route-coverage-report.json');
  fs.writeFileSync(
    jsonOutputPath,
    `${JSON.stringify(report, null, 2)}\n`,
    'utf-8',
  );
  console.log(`JSON report written to: ${jsonOutputPath}`);
}

if (require.main === module) {
  main();
}
