import { partitionRetryableBlockerCascadeJobs } from "./failure-classification.mts";

describe("partitionRetryableBlockerCascadeJobs", () => {
  it("classifies E2E jobs without losing their concrete type", () => {
    // A retryable blocker cascades ordinary downstream jobs, but E2E jobs
    // remain inspectable because a quality-gate annotation can veto retry.
    const jobs = [
      { id: 1, name: "e2e-chrome", conclusion: "failure" },
      {
        id: 2,
        name: "ci-status-gate / CI status gate (controls all-jobs-pass)",
        conclusion: "failure",
      },
      { id: 3, name: "build-dist-webpack", conclusion: "failure" },
    ];

    const result = partitionRetryableBlockerCascadeJobs({
      jobs,
      getCategory: (jobName) => {
        if (jobName.startsWith("e2e-")) return "alwaysRetryable";
        if (jobName.startsWith("ci-status-gate")) return "optional";
        return "retryableOnTransientError";
      },
    });

    expect(result.jobsToClassify).toStrictEqual([jobs[0]]);
    expect(result.jobsToClassify[0].id).toBe(1);
    expect(result.jobsToCascade).toStrictEqual([jobs[1], jobs[2]]);
    expect(result.jobsToCascade[0].conclusion).toBe("failure");
  });
});
