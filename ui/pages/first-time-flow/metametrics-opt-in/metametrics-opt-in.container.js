import { connect } from 'react-redux';
import { setMetaMetricsParticipationMode } from '../../../store/actions';
import MetaMetricsOptIn from './metametrics-opt-in.component';

const firstTimeFlowTypeNameMap = {
  create: 'Selected Create New Wallet',
  import: 'Selected Import Wallet',
};

const mapStateToProps = (state) => {
  const { firstTimeFlowType, metaMetricsParticipationMode } = state.metamask;

  return {
    firstTimeSelectionMetaMetricsName:
      firstTimeFlowTypeNameMap[firstTimeFlowType],
    metaMetricsParticipationMode,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setMetaMetricsParticipationMode: (val) =>
      dispatch(setMetaMetricsParticipationMode(val)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(MetaMetricsOptIn);
