import { debounce } from 'lodash';
import { connect } from 'react-redux';
import {
  lookupEnsName,
  initializeDomainSlice,
  resetDomainResolution,
} from '../../../../ducks/domains';
import DomainInput from './domain-input.component';

function mapDispatchToProps(dispatch) {
  return {
    lookupEnsName: debounce(
      (domainName) => dispatch(lookupEnsName(domainName)),
      150,
    ),
    initializeDomainSlice: () => dispatch(initializeDomainSlice()),
    resetDomainResolution: debounce(
      () => dispatch(resetDomainResolution()),
      300,
    ),
  };
}

export default connect(null, mapDispatchToProps)(DomainInput);
