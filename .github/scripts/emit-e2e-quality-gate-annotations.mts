import { extractTestResults } from './extract-test-results.mts';
import {
  E2E_QUALITY_GATE_FAILURE_ANNOTATION_TITLE,
  E2E_QUALITY_GATE_FAILURE_ANNOTATION_MESSAGE,
  escapeWorkflowCommandData,
  escapeWorkflowCommandProperty,
  getE2eQualityGateFailurePaths,
} from './shared/e2e-quality-gate.mts';
import {
  readChangedAndFilterE2eChangedFiles,
  shouldE2eQualityGateBeSkipped,
} from '../../test/e2e/changedFilesUtil.js';

async function main(): Promise<void> {
  if (shouldE2eQualityGateBeSkipped()) {
    // Skipping the gate deliberately leaves an E2E failure eligible for the
    // ordinary retry policy; do not emit its terminal marker in this case.
    console.log('E2E quality gate is skipped; no annotations emitted.');
    return;
  }

  const { failed } = await extractTestResults('test/test-results/e2e');
  // Selenium and Playwright use different changed-file filters, but a failed
  // changed/new test from either runner has the same terminal retry policy.
  const changedOrNewTests = [
    ...readChangedAndFilterE2eChangedFiles(),
    ...readChangedAndFilterE2eChangedFiles({ playwrightOnly: true }),
  ];
  const failedQualityGateTests = getE2eQualityGateFailurePaths({
    changedOrNewTests,
    failedTests: failed,
  });

  for (const testPath of failedQualityGateTests) {
    // Downstream triage trusts this structured annotation, rather than JUnit
    // or free-form logs, to identify a terminal changed/new E2E failure.
    console.log(
      `::error title=${escapeWorkflowCommandProperty(E2E_QUALITY_GATE_FAILURE_ANNOTATION_TITLE)},file=${escapeWorkflowCommandProperty(testPath)},line=1::${escapeWorkflowCommandData(E2E_QUALITY_GATE_FAILURE_ANNOTATION_MESSAGE)}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
