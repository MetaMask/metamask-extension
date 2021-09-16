import { connect } from 'react-redux';
import { getSelectedIdentity } from '../../../selectors';
import SelectedAccount from './selected-account.component';

const mapStateToProps = (state) => ({
  selectedIdentity: getSelectedIdentity(state),
});

export default connect(mapStateToProps)(SelectedAccount);
