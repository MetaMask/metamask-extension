import { debounce } from 'lodash';
import { connect } from 'react-redux';
import {
  lookupEnsName,
  initializeEnsSlice,
  resetEnsResolution,
} from '../../../../ducks/ens';
import {
  resolveUNS,
  initializeUnsSlice,
  resetUnsResolution,
  resolveMultiChainUNS,
  prepareResolutionCall,
} from '../../../../ducks/uns';
import DomainInput from './domain-input.component';

function mapDispatchToProps(dispatch) {
  return {
    lookupEnsName: debounce((ensName) => dispatch(lookupEnsName(ensName))),
    prepareResolutionCall: debounce((unsName) => dispatch(prepareResolutionCall(unsName))),
    initializeUnsSlice: () => dispatch(initializeUnsSlice()),
    resetUnsResolution: debounce(() => dispatch(resetUnsResolution()), 300),
    initializeEnsSlice: () => dispatch(initializeEnsSlice()),
    resetEnsResolution: debounce(() => dispatch(resetEnsResolution()), 300),
  };
 }

export default connect(null, mapDispatchToProps)(DomainInput);
