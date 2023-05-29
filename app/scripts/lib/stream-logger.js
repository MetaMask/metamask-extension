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

export function logPortMessages(...args) {
  logMessage('PortMessageStream', ...args);
}

export function logPostMessages(...args) {
  logMessage('PostMessageStream', ...args);
}

function logMessage(prefix, from, to, out, msg) {
  if (!process.env.METAMASK_DEBUG) {
    return;
  }
  const id = msg?.data?.id || 0;
  const data = msg?.data;
  console.log(
    `%c${prefix} (` +
      `%c${id}` +
      `%c): ` +
      `%c${from.split('metamask-')[1] || from}%c` +
      ` ${out ? '►►►' : '◄◄◄'} ` +
      `%c${to.split('metamask-')[1] || to}`,
    `color: grey;`,
    `color: fuchsia;`,
    `color: grey;`,
    `color: ${colors[from] || 'grey'};`,
    `color: grey;`,
    `color: ${colors[to] || 'grey'};`,
    data || '',
  );
}
