import { cloneDeep } from 'lodash';
import { MetaMetricsParticipation } from '../../../shared/constants/metametrics';

type MetaMaskState = Record<string, any>;
type VersionedState = {
  meta: { version: number };
  data: MetaMaskState;
};

export const version = 106;

/**
 * Prior to this version of the data structure, the MetaMetrics Controller had
 * a 'participateInMetaMetrics' key in its store that was a boolean value. The
 * problem with this mechanism is that we defaulted this value to null and used
 * the null value as a way to determine if the user had not yet opted in or out
 * of metrics. This was predominately used in the onboarding flow, but has also
 * been used elsewhere for edge cases. This migration moves away this boolean
 * flag and towards a enum where the value may be 'NOT_STARTED', 'PARTICIPATE'
 * or 'DO_NOT_PARTICIPATE'. The new store key is 'metaMetricsParticipatonMode'.
 *
 * @param originalVersionedData
 */
export async function migrate(
  originalVersionedData: VersionedState,
): Promise<VersionedState> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  const state = versionedData.data;
  const newState = transformState(state);
  versionedData.data = newState;

  return versionedData;
}

function transformState(state: MetaMaskState): MetaMaskState {
  const MetaMetricsController = state?.MetaMetricsController || {};

  let metaMetricsParticipationMode =
    MetaMetricsController?.metaMetricsParticipationMode ??
    MetaMetricsParticipation.NotChosen;

  if (MetaMetricsController.metaMetricsParticipationMode === undefined) {
    if (MetaMetricsController?.participateInMetaMetrics === false) {
      metaMetricsParticipationMode = MetaMetricsParticipation.DoNotParticipate;
    } else if (MetaMetricsController?.participateInMetaMetrics === true) {
      metaMetricsParticipationMode = MetaMetricsParticipation.Participate;
    }
  }

  delete MetaMetricsController.participateInMetaMetrics;

  return {
    ...state,
    MetaMetricsController: {
      ...MetaMetricsController,
      metaMetricsParticipationMode,
    },
  };
}
