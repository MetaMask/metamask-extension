import {
  E2E_QUALITY_GATE_FAILURE_ANNOTATION_TITLE,
  E2E_QUALITY_GATE_FAILURE_ANNOTATION_MESSAGE,
  escapeWorkflowCommandData,
  escapeWorkflowCommandProperty,
  getE2eQualityGateFailurePaths,
  hasE2eQualityGateFailure,
} from './e2e-quality-gate.mts';

describe('E2E quality gate failures', () => {
  it('returns only changed or new tests that actually failed', () => {
    expect(
      getE2eQualityGateFailurePaths({
        changedOrNewTests: [
          'test/e2e/tests/changed.spec.ts',
          'test/e2e/tests/passed.spec.ts',
        ],
        failedTests: [
          'test/e2e/tests/changed.spec.ts',
          'test/e2e/tests/ordinary.spec.ts',
        ],
      }),
    ).toStrictEqual(['test/e2e/tests/changed.spec.ts']);
  });

  it('does not signal failures when the quality gate is skipped', () => {
    expect(
      getE2eQualityGateFailurePaths({
        changedOrNewTests: [],
        failedTests: ['test/e2e/tests/changed.spec.ts'],
      }),
    ).toStrictEqual([]);
  });

  it('detects the exact quality-gate annotation title', () => {
    expect(
      hasE2eQualityGateFailure(
        [{ title: E2E_QUALITY_GATE_FAILURE_ANNOTATION_TITLE }],
      ),
    ).toBe(true);
  });

  it('explains why the test failure is terminal', () => {
    expect(E2E_QUALITY_GATE_FAILURE_ANNOTATION_MESSAGE).toBe(
      'This changed or new E2E test failed. CI will not retry it automatically; review the failure output and fix the test before rerunning CI.',
    );
  });

  it('does not match arbitrary annotation text', () => {
    // Only the emitter's exact title can make an E2E failure terminal; test
    // output that looks similar must not be able to spoof that decision.
    expect(
      hasE2eQualityGateFailure([
        { title: 'E2E quality gate failure: test/e2e/tests/changed.spec.ts' },
        { title: 'Ordinary E2E failure' },
      ]),
    ).toBe(false);
  });

  it('escapes workflow-command properties', () => {
    // These are command-syntax boundaries, not display-formatting cases.
    expect(
      escapeWorkflowCommandProperty('test%,:\r\n::error title=injected'),
    ).toBe('test%25%2C%3A%0D%0A%3A%3Aerror title=injected');
  });

  it('escapes workflow-command data', () => {
    expect(escapeWorkflowCommandData('message%\r\n::error')).toBe(
      'message%25%0D%0A::error',
    );
  });
});
