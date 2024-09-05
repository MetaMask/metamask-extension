import { connect } from 'react-redux';
import { getSnapMetadata } from '../../../selectors';
import ConnectedSitesList from './connected-sites-list.component';

function mapStateToProps(state) {
  return { getSnapName: (id) => getSnapMetadata(state, id).name };
}

export default connect(mapStateToProps, null)(ConnectedSitesList);
