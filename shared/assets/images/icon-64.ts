import mainIcon from './icon-64.png';
import betaIcon from './beta/icon-64.png';
import flaskIcon from './flask/icon-64.png';

const fallbackIcon =
  process.env.METAMASK_BUILD_TYPE === 'flask' ? flaskIcon : mainIcon;
const icon =
  process.env.METAMASK_BUILD_TYPE === 'beta' ? betaIcon : fallbackIcon;

export default icon;
