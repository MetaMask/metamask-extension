/**
 * @type RegulationId
 * Response from API after the delete regulation creation.
 */
export type RegulationId = { data: Record<string, string> };

/**
 * @type CurrentRegulationStatus
 * Response from API after the status check of current delete regulation.
 */
export type CurrentRegulationStatus = {
  data: Record<string, Record<string, string>>;
};
