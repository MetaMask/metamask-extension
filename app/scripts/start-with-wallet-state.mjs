import childProcess from 'child_process';

// Default fixtures and flags
const FIXTURES_FLAGS = {
  '--withAccounts': {
    type: 'number',
    defaultValue: 30,
    explanation: 'Specify the number of wallet accounts to generate.',
  },
  '--withConfirmedTransactions': {
    type: 'number',
    defaultValue: 30,
    explanation: 'Specify the number of confirmed transactions to generate.',
  },
  '--withContacts': {
    type: 'number',
    defaultValue: 30,
    explanation:
      'Specify the number of contacts to generate in the address book.',
  },
  '--withErc20Tokens': {
    type: 'boolean',
    defaultValue: true,
    explanation: 'Specify whether to import ERC20 tokens in Mainnet.',
  },
  '--withNetworks': {
    type: 'boolean',
    defaultValue: true,
    explanation: 'Specify whether to load suggested networks.',
  },
  '--withPreferences': {
    type: 'boolean',
    defaultValue: true,
    explanation: 'Specify whether to activate all preferences.',
  },
  '--withUnreadNotifications': {
    type: 'number',
    defaultValue: 30,
    explanation: 'Specify the number of unread notifications to load.',
  },
  '--withStartCommand': {
    type: 'string',
    defaultValue: 'start',
    explanation:
      'Specify the start command for the wallet (put double quotes around a multi-word command like --withStartCommand="webpack --watch").',
  },
};

function startWithWalletState() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log('Available fixture flags:');
    Object.keys(FIXTURES_FLAGS).forEach((key) => {
      console.log(
        `  \x1b[36m${key}\x1b[0m  ${FIXTURES_FLAGS[key].explanation}  (default: \x1b[33m${FIXTURES_FLAGS[key].defaultValue}\x1b[0m)`,
      );
    });
    return;
  }

  const FIXTURES_CONFIG = {};

  Object.keys(FIXTURES_FLAGS).forEach((key) => {
    FIXTURES_CONFIG[key.replace(/^--/u, '')] = FIXTURES_FLAGS[key].defaultValue;
  });

  let invalidArguments = false;

  // Arguments parsing and validation
  args.forEach((arg) => {
    const [key, value] = arg.split('=');
    if (Object.prototype.hasOwnProperty.call(FIXTURES_FLAGS, key)) {
      let valueType;
      switch (FIXTURES_FLAGS[key].type) {
        case 'number':
          valueType = !isNaN(parseFloat(value)) && isFinite(value);
          break;
        case 'boolean':
          valueType = value === 'true' || value === 'false';
          break;
        case 'string':
          valueType = typeof value === 'string';
          break;
        default:
          throw new Error(`Unknown type for argument ${key}`);
      }
      if (valueType) {
        const configKey = key.replace(/^--/u, '');
        if (FIXTURES_FLAGS[key].type === 'number') {
          FIXTURES_CONFIG[configKey] = parseFloat(value);
        } else if (FIXTURES_FLAGS[key].type === 'boolean') {
          FIXTURES_CONFIG[configKey] = value === 'true';
        } else {
          FIXTURES_CONFIG[configKey] = value;
        }
      } else {
        console.error(`Invalid value for argument ${key}: ${value}`);
        invalidArguments = true;
      }
    } else {
      console.error(`Invalid argument: ${key}`);
      invalidArguments = true;
    }
  });

  console.log('Fixture flags:', FIXTURES_CONFIG);
  if (invalidArguments) {
    throw new Error('Invalid arguments');
  }

  const fixturesConfig = JSON.stringify(FIXTURES_CONFIG);

  // Start the wallet with state
  process.env.WITH_STATE = fixturesConfig;
  childProcess.spawn('yarn', [FIXTURES_CONFIG['withStartCommand']], {
    stdio: 'inherit',
    shell: true,
  });
}

startWithWalletState();
