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
    resetUnsResolution: debounce(() => dispatch(resetUnsResolution())),
    initializeEnsSlice: () => dispatch(initializeEnsSlice()),
    resetEnsResolution: debounce(() => dispatch(resetEnsResolution())),
  };
}

export default connect(null, mapDispatchToProps)(DomainInput);
