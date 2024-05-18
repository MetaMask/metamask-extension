import getFetchWithTimeout from '../../../../../shared/modules/fetch-with-timeout';
import { DeleteRegulationAPIResponse } from '../metametrics-data-deletion';

const segmentSourceId = process.env.SEGMENT_DELETE_API_SOURCE_ID;
const segmentRegulationEndpoint = process.env.SEGMENT_REGULATIONS_ENDPOINT;

const fetchWithTimeout = getFetchWithTimeout();

export async function createDataDeletionRegulationTask(
  metaMetricsId: string,
): Promise<DeleteRegulationAPIResponse> {
  if (!segmentRegulationEndpoint) {
    throw new Error('Segment API source ID or endpoint not found');
  }

  const response = await fetchWithTimeout(
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
  return response.json();
}

export async function fetchDeletionRegulationStatus(
  deleteRegulationId: string,
): Promise<DeleteRegulationAPIResponse> {
  if (!segmentSourceId || !segmentRegulationEndpoint) {
    throw new Error('Segment API source ID or endpoint not found');
  }
  const response = await fetchWithTimeout(
    `${segmentRegulationEndpoint}/regulations/${deleteRegulationId}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/vnd.segment.v1+json' },
    },
  );
  return response.json();
}
