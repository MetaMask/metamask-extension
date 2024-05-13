import getFetchWithTimeout from '../../../../../shared/modules/fetch-with-timeout';
import { DeleteRegulationAPIResponse } from '../metametrics-data-deletion';

const fetchWithTimeout = getFetchWithTimeout();

export async function createDataDeletionRegulationTask(
  metaMetricsId: string,
): Promise<DeleteRegulationAPIResponse> {
  const segmentSourceId = process.env.SEGMENT_DELETE_API_SOURCE_ID;
  const segmentRegulationEndpoint = process.env.SEGMENT_REGULATIONS_ENDPOINT;

  try {
    const response: unknown = await fetchWithTimeout(
      `${segmentRegulationEndpoint}/regulations/sources/${segmentSourceId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/vnd.segment.v1+json' },
        body: JSON.stringify({
          regulationType: 'DELETE_ONLY',
          subjectType: 'USER_ID',
          subjectIds: [metaMetricsId],
        }),
      },
    );
    return response as DeleteRegulationAPIResponse;
  } catch (error: unknown) {
    throw new Error('Analytics Deletion Task Error');
  }
}

export async function fetchDeletionRegulationStatus(
  deleteRegulationId: string,
): Promise<DeleteRegulationAPIResponse> {
  const segmentRegulationEndpoint = process.env.SEGMENT_REGULATIONS_ENDPOINT;

  try {
    const response: unknown = await fetchWithTimeout(
      `${segmentRegulationEndpoint}/regulations/${deleteRegulationId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/vnd.segment.v1+json' },
      },
    );
    return response as DeleteRegulationAPIResponse;
  } catch (error: unknown) {
    throw new Error('Analytics Deletion Task Error');
  }
}
