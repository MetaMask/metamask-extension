import {
  provenanceProblems,
  STABLE_RUNNER_SPEC,
  type StableRunnerSpec,
} from './stable-runner-spec';

const SPEC: StableRunnerSpec = {
  cpuModel: ['AMD EPYC 7763'],
  browserVersion: ['131.0.6778.85'],
};

describe('provenanceProblems', () => {
  it('ships with no field constrained', () => {
    expect(STABLE_RUNNER_SPEC).toStrictEqual({});
  });

  it('finds nothing under the empty spec, whatever the job recorded', () => {
    expect(provenanceProblems({ cpuModel: 'anything' })).toStrictEqual([]);
    expect(provenanceProblems({ cpuModel: null })).toStrictEqual([]);
    expect(provenanceProblems(undefined)).toStrictEqual([]);
  });

  it('passes a job whose constrained fields hold allowed values', () => {
    expect(
      provenanceProblems(
        {
          cpuModel: 'AMD EPYC 7763',
          browserVersion: '131.0.6778.85',
          imageOs: 'ubuntu24',
        },
        SPEC,
      ),
    ).toStrictEqual([]);
  });

  it('names the field and the value for a job outside the spec', () => {
    expect(
      provenanceProblems(
        { cpuModel: 'Intel Xeon', browserVersion: '131.0.6778.85' },
        SPEC,
      ),
    ).toStrictEqual([
      'cpuModel "Intel Xeon" is not allowed (allowed: "AMD EPYC 7763")',
    ]);
  });

  it('counts a null or absent field as nonconforming only when it is constrained', () => {
    expect(
      provenanceProblems(
        { cpuModel: 'AMD EPYC 7763', browserVersion: null },
        SPEC,
      ),
    ).toStrictEqual([
      'browserVersion is not recorded (allowed: "131.0.6778.85")',
    ]);
    expect(provenanceProblems(undefined, SPEC)).toHaveLength(2);
    expect(
      provenanceProblems(
        { cpuModel: 'AMD EPYC 7763' },
        { cpuModel: SPEC.cpuModel },
      ),
    ).toStrictEqual([]);
  });
});
