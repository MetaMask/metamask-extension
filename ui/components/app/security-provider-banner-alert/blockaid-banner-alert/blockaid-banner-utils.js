import {
  FALSE_POSITIVE_REPORT_BASE_URL,
  UTM_SOURCE,
} from '../../../../../shared/constants/security-provider';

export const getReportUrl = (encodedData) => {
  return `${FALSE_POSITIVE_REPORT_BASE_URL}?data=${encodeURIComponent(
    encodedData.toString('base64'),
  )}&utm_source=${UTM_SOURCE}`;
};
