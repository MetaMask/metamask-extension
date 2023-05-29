const colors = {
  'metamask-ui': 'green',
  'metamask-inpage': 'red',
  'metamask-contentscript': 'cornflowerblue',
  'metamask-background': 'yellow',
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
