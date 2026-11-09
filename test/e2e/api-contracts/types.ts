import type { ApiConsumerTypeName } from './consumer-types';
import type { ShapeOptions } from './shape-diff';

export type MockPayload = {
  /** Short, unique (per contract) name used in reports. */
  name: string;
  /** Where the mock is registered, so reports point at the file to update. */
  source: string;
  /** The exact payload the E2E mock server responds with. */
  response: unknown;
};

export type LiveRequest = {
  /** Shown in reports instead of the real URL, which may contain secrets. */
  description: string;
  /** Environment variables the request needs; the check is skipped without them. */
  requiredEnv?: string[];
  buildRequest: (env: Record<string, string>) => {
    url: string;
    init?: RequestInit;
  };
};

export type LiveUnavailable = {
  /** Why the live API cannot be queried by the scheduled job. */
  unavailableReason: string;
};

export type ApiContract = {
  /** Unique kebab-case identifier, usable with `--contract`. */
  id: string;
  /** Human-readable method and URL of the mocked endpoint. */
  endpoint: string;
  /** The type the wallet consumes the response as (see `consumer-types.ts`). */
  consumerType: ApiConsumerTypeName;
  /** The wallet code or controller that reads the response. */
  consumedBy: string;
  /** Every mock payload registered for this endpoint that should be checked. */
  mocks: MockPayload[];
  /** How to fetch a real response for drift detection. */
  live: LiveRequest | LiveUnavailable;
  shape?: ShapeOptions;
  /**
   * Known live mismatches that are tracked elsewhere. They stay in the report
   * but do not fail the check. Remove an entry as soon as it is resolved.
   */
  acceptedLiveMismatches?: AcceptedLiveMismatch[];
  /** Incidents caused by unexpected responses from this endpoint. */
  relatedIssues?: string[];
};

export type AcceptedLiveMismatch = {
  /** Normalized path (`[*]` for array items, `.*` for wildcard keys). */
  path: string;
  /** Why the mismatch is accepted and where it is tracked. */
  reason: string;
};
