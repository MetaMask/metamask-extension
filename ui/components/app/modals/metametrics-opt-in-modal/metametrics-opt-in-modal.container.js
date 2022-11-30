import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { setMetaMetricsParticipationMode } from '../../../../store/actions';
import MetaMetricsOptInModal from './metametrics-opt-in-modal.component';

const mapStateToProps = (_, ownProps) => {
  const { unapprovedTxCount } = ownProps;

  return {
    unapprovedTxCount,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setMetaMetricsParticipationMode: (val) =>
      dispatch(setMetaMetricsParticipationMode(val)),
  };
};

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps),
)(MetaMetricsOptInModal);
