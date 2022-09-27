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
    lookupEnsName: debounce((domainName) =>
      dispatch(lookupEnsName(domainName)),
    ),
    lookupUnsName: debounce((domainName) =>
      dispatch(lookupUnsName(domainName)),
    ),
    initializeDomainSlice: () => dispatch(initializeDomainSlice()),
    resetDomainResolution: debounce(() => dispatch(resetDomainResolution())),
  };
}

export default connect(null, mapDispatchToProps)(DomainInput);
