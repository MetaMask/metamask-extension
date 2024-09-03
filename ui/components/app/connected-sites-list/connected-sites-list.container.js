import { connect } from 'react-redux';
import { getSnapMetadata } from '../../../selectors';
import ConnectedSitesList from './connected-sites-list.component';

function mapStateToProps(_) {
  return { getSnapName: (id) => getSnapMetadata(id).name };
}

export default connect(mapStateToProps)(ConnectedSitesList);
