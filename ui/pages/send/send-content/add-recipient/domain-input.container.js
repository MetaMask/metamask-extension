import { debounce } from 'lodash';
import { connect } from 'react-redux';
import {
  lookupEnsName,
  initializeEnsSlice,
  resetEnsResolution,
} from '../../../../ducks/ens';
import {
  initializeUnsSlice,
  resetUnsResolution,
  prepareResolutionCall,
  updateUdTlds,
} from '../../../../ducks/uns';
import DomainInput from './domain-input.component';
// adding Uns functions to dispatch
function mapDispatchToProps(dispatch) {
  return {
    lookupEnsName: debounce((ensName) => dispatch(lookupEnsName(ensName))),
    prepareResolutionCall: debounce((unsName) =>
      dispatch(prepareResolutionCall(unsName)),
    ),
    initializeUnsSlice: () => dispatch(initializeUnsSlice()),
    updateUdTlds: (tlds) => dispatch(updateUdTlds(tlds)),
    resetUnsResolution: debounce(() => dispatch(resetUnsResolution())),
    initializeEnsSlice: () => dispatch(initializeEnsSlice()),
    resetEnsResolution: debounce(() => dispatch(resetEnsResolution())),
  };
}

export default connect(null, mapDispatchToProps)(DomainInput);
