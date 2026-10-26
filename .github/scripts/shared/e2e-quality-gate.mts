export const E2E_QUALITY_GATE_FAILURE_ANNOTATION_TITLE =
  'E2E quality gate failed';

export const E2E_QUALITY_GATE_FAILURE_ANNOTATION_MESSAGE =
  'This changed or new E2E test failed. CI will not retry it automatically; review the failure output and fix the test before rerunning CI.';

export type CheckAnnotation = {
  title?: string;
};

// Workflow-command properties use commas and colons as separators. Encode
// those along with percent and line breaks so a test path cannot modify the
// annotation metadata or inject a second command.
export function escapeWorkflowCommandProperty(value: string): string {
  return value
    .replace(/%/gu, '%25')
    .replace(/\r/gu, '%0D')
    .replace(/\n/gu, '%0A')
    .replace(/:/gu, '%3A')
    .replace(/,/gu, '%2C');
}

// Command data starts after `::`, so only percent and line breaks are control
// characters here; colons and commas remain readable in the annotation text.
export function escapeWorkflowCommandData(value: string): string {
  return value
    .replace(/%/gu, '%25')
    .replace(/\r/gu, '%0D')
    .replace(/\n/gu, '%0A');
}

export function getE2eQualityGateFailurePaths({
  changedOrNewTests,
  failedTests,
}: {
  changedOrNewTests: string[];
  failedTests: string[];
}): string[] {
  const failedTestPaths = new Set(failedTests);
  return changedOrNewTests.filter((testPath) => failedTestPaths.has(testPath));
}

export function hasE2eQualityGateFailure(
  annotations: CheckAnnotation[],
): boolean {
  // This exact title is the producer-consumer contract between the E2E job,
  // triage, and CI status gate. Never infer terminal status from arbitrary
  // test output that happens to resemble a quality-gate failure.
  return annotations.some(
    (annotation) =>
      annotation.title === E2E_QUALITY_GATE_FAILURE_ANNOTATION_TITLE,
  );
}
