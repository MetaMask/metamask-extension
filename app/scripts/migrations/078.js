import { cloneDeep } from 'lodash';
import { METAMETRICS_PARTICIPATION } from '../../../shared/constants/metametrics';

const version = 78;

/**
 * Prior to this version of the data structure, the MetaMetrics Controller had
 * a 'participateInMetaMetrics' key in its store that was a boolean value. The
 * problem with this mechanism is that we defaulted this value to null and used
 * the null value as a way to determine if the user had not yet opted in or out
 * of metrics. This was predominately used in the onboarding flow, but has also
 * been used elsewhere for edge cases. This migration moves away this boolean
 * flag and towards a enum where the value may be 'NOT_STARTED', 'PARTICIPATE'
 * or 'DO_NOT_PARTICIPATE'. The new store key is 'metaMetricsParticipatonMode'.
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

function transformState(state) {
  const MetaMetricsController = state?.MetaMetricsController || {};

  let metaMetricsParticipationMode = METAMETRICS_PARTICIPATION.NOT_CHOSEN;

  if (MetaMetricsController?.participateInMetaMetrics === false) {
    metaMetricsParticipationMode = METAMETRICS_PARTICIPATION.DO_NOT_PARTICIPATE;
  } else if (MetaMetricsController?.participateInMetaMetrics === true) {
    metaMetricsParticipationMode = METAMETRICS_PARTICIPATION.PARTICIPATE;
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
