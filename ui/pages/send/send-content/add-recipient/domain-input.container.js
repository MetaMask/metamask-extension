import { debounce } from 'lodash';
import { connect } from 'react-redux';
import {
  resetDomainResolution,
  initializeDomainSlice,
  lookupEnsName,
  lookupUnsName,
} from '../../../../ducks/domain';
import DomainInput from './domain-input.component';
// adding Uns functions to dispatch
function mapDispatchToProps(dispatch) {
  return {
<<<<<<< HEAD
    lookupEnsName: debounce(
      (domainName) => dispatch(lookupEnsName(domainName)),
      150,
    ),
    initializeDomainSlice: () => dispatch(initializeDomainSlice()),
    resetDomainResolution: debounce(
      () => dispatch(resetDomainResolution()),
      300,
    ),
<<<<<<< HEAD
=======
    initializeUnsSlice: () => dispatch(initializeUnsSlice()),
    resetUnsResolution: debounce(() => dispatch(resetUnsResolution())),
    initializeEnsSlice: () => dispatch(initializeEnsSlice()),
    resetEnsResolution: debounce(() => dispatch(resetEnsResolution())),
>>>>>>> 47095ebaa (swaps out API with new NPM package)
=======
    lookupEnsName: debounce((domainName) =>
      dispatch(lookupEnsName(domainName)),
    ),
    lookupUnsName: debounce((domainName) =>
      dispatch(lookupUnsName(domainName)),
    ),
    initializeDomainSlice: () => dispatch(initializeDomainSlice()),
    resetDomainResolution: debounce(() => dispatch(resetDomainResolution())),
>>>>>>> 1f8b43e69 (combines UNS and ENS basic resolution into one module and generalizes their state to domains rather than their individual names)
  };
}

export default connect(null, mapDispatchToProps)(DomainInput);
