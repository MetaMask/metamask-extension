export type FailureCategory = "alwaysRetryable" | "retryableOnTransientError" | "optional";

export type FailureJob = {
  name: string;
};

export function partitionRetryableBlockerCascadeJobs<JobType extends FailureJob>({
  jobs,
  getCategory,
}: {
  jobs: JobType[];
  getCategory: (jobName: string) => FailureCategory;
}): {
  jobsToClassify: JobType[];
  jobsToCascade: JobType[];
} {
  return jobs.reduce<{
    jobsToClassify: JobType[];
    jobsToCascade: JobType[];
  }>(
    (partition, job) => {
      // E2E jobs normally retry after a transient blocker, but a structured
      // quality-gate annotation can veto that retry. Keep them inspectable;
      // cascade-classify only jobs that cannot contain that terminal signal.
      if (getCategory(job.name) === "alwaysRetryable") {
        partition.jobsToClassify.push(job);
      } else {
        partition.jobsToCascade.push(job);
      }
      return partition;
    },
    { jobsToClassify: [], jobsToCascade: [] },
  );
}
