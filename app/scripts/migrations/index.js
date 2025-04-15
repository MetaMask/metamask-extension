// Migrations must start at version 1 or later.
// They are objects with a `version` number
// and a `migrate` function.
//
// The `migrate` function receives the previous
// config data format, and returns the new one.

// (we have to turn off that global-require rule for this file in order to do the import-then-export magic)

const migrations = [
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./002').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./003').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./004').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./005').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./006').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./007').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./008').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./009').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./010').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./011').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./012').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./013').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./014').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./015').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./016').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./017').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./018').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./019').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./020').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./021').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./022').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./023').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./024').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./025').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./026').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./027').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./028').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./029').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./030').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./031').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./032').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./033').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./034').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./035').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./036').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./037').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./038').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./039').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./040').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./041').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./042').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./043').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./044').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./045').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./046').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./047').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./048').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./049').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./050').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./051').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./052').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./053').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./054').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./055').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./056').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./057').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./058').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./059').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./060').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./061').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./062').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./063').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./064').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./065').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./066').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./067').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./068').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./069').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./070').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./071').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./072').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./073').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./074').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./075').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./076').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./077').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./078'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./079').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./080').default,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./081'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./082'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./083'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./084'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./085'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./086'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./087'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./088'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./089'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./090'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./091'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./092'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./092.1'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./092.2'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./092.3'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./093'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./094'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./095'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./096'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./097'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./098'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./099'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./100'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./101'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./102'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./103'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./104'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./105'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./106'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./107'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./108'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./109'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./110'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./111'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./112'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./113'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./114'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./115'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./116'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./117'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./118'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./119'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./120'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./120.1'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./120.2'),
  // require('./120.3'), Renamed to 120.6, do not re-use this number
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./120.4'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./120.5'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./120.6'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./121'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./121.1'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./121.2'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./122'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./123'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./124'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./125'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./125.1'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./126'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./126.1'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./127'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./128'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./129'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./130'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./131'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./131.1'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./132'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./133'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./133.1'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./133.2'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./134'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./134.1'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./135'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./136'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./137'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./138'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./139'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./140'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./141'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./142'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./143'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./143.1'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./144'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./145'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./146'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./146.1'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./147'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./148'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./149'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./150'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./151'),
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31978
  // eslint-disable-next-line n/global-require
  require('./152'),
];

export default migrations;
