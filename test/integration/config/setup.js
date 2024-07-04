require('@babel/register');
require('ts-node').register({ transpileOnly: true });

require('../../helpers/setup-helper');

global.metamask = {};
