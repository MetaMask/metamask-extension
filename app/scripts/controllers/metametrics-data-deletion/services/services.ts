import getFetchWithTimeout from '../../../../../shared/modules/fetch-with-timeout';
import { DeleteRegulationAPIResponse } from '../metametrics-data-deletion';

const analyticsDataDeletionSourceId =
  process.env.ANALYTICS_DATA_DELETION_SOURCE_ID;
const analyticsDataDeletionEndpoint =
  process.env.ANALYTICS_DATA_DELETION_ENDPOINT;

const fetchWithTimeout = getFetchWithTimeout();

export async function createDataDeletionRegulationTask(
  metaMetricsId: string,
): Promise<DeleteRegulationAPIResponse> {
  if (!analyticsDataDeletionEndpoint || !analyticsDataDeletionSourceId) {
    throw new Error('Segment API source ID or endpoint not found');
  }

  const response = await fetchWithTimeout(
    `${analyticsDataDeletionEndpoint}/regulations/sources/${analyticsDataDeletionSourceId}`,
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
  if (!analyticsDataDeletionEndpoint) {
    throw new Error('Segment API source ID or endpoint not found');
  }
  const response = await fetchWithTimeout(
    `${analyticsDataDeletionEndpoint}/regulations/${deleteRegulationId}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/vnd.segment.v1+json' },
    },
  );
  return response.json();
}
