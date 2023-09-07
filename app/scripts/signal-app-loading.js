// eslint-disable-next-line import/unambiguous
'use strict';

(({ browserAction }) => {
  browserAction.setBadgeText({ text: '+' });
  browserAction.setBadgeBackgroundColor({ color: '#5DD879' });
})(window.chrome ?? window.browser);
