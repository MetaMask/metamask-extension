import  { createProjectLogger, createModuleLogger }  from '@metamask/utils';

import {
  METAMASK_BACKGROUND,
  METAMASK_CONTENTSCRIPT,
  METAMASK_EXTERNAL,
  METAMASK_INPAGE,
  METAMASK_PHISHING_WARNING_PAGE,
  METAMASK_UI,
} from '../context';

const colors = {
  [METAMASK_UI]: 'green',
  [METAMASK_INPAGE]: 'red',
  [METAMASK_CONTENTSCRIPT]: 'cornflowerblue',
  [METAMASK_BACKGROUND]: 'yellow',
  [METAMASK_PHISHING_WARNING_PAGE]: 'purple',
  [METAMASK_EXTERNAL]: 'grey',
};

const logger = createProjectLogger('message-stream');
const logPortMessage = createModuleLogger(logger, 'port');
const logPostMessage = createModuleLogger(logger, 'post');
logPortMessage.enabled = logPostMessage.enabled = !!process.env.METAMASK_DEBUG;

export function logPortMessages(from, to) {
  return function(data, out) {
    logMessage(logPortMessage, from, to, data, out);
  }
}

export function logPostMessages(from, to) {
  return function(data, out) {
    logMessage(logPostMessage, from, to, data, out);
  }
}

function logMessage(logger, from, to, data, out) {
  const id = data?.data?.id || 0;
  if (!id) {
    return;
  }
  logger(
    `%c(` +
      `%c${id}` +
    `%c): ` +
    `%c${from.split('metamask-')[1] || from}%c` +
    ` ${out ? '►►►' : '◄◄◄'} ` +
    `%c${to.split('metamask-')[1] || to}`,
    `color: grey;`,
    `color: goldenrod;`,
    `color: grey;`,
    `color: ${colors[from] || 'grey'};`,
    `color: grey;`,
    `color: ${colors[to] || 'grey'};`,
    data?.data || '',
  );
}
