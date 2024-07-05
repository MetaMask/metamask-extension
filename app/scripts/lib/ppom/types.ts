import { SecurityAlertSource } from '../../../../shared/constants/security-provider';

export type SecurityAlertResponse = {
  description?: string;
  features?: string[];
  providerRequestsCount?: Record<string, number>;
  reason: string;
  result_type: string;
  securityAlertId?: string;
  source?: SecurityAlertSource;
};
