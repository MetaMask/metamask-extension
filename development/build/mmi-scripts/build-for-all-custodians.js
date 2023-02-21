/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable node/no-extraneous-require */
const { spawn } = require('child_process');

const CONFIG_URL =
  'https://mmi-configuration-api.codefi.network/v1/configuration';

async function go() {
  const custodians = await fetch(`${CONFIG_URL}/default`)
    .then((response) => response.json())
    .then((data) => data.custodians);

  const custodianPrefixes = new Set();

  for (const custodian of custodians) {
    const prefix = custodian.name.split('-')[0];
    custodianPrefixes.add(prefix);
  }

  console.log(custodianPrefixes);

  for (const prefix of custodianPrefixes) {
    if (['gk8', 'gnosis', 'jupiter'].includes(prefix)) {
      continue;
    }

    console.log('begin building for', prefix);

    await execute('yarn', ['dist'], {
      env: {
        ...process.env,
        MMI_CONFIGURATION_SERVICE_URL: `${CONFIG_URL}/custodian?matchCustodian=${prefix}`,
      },
    });

    await execute('mv', [
      'builds/metamask-mmi-chrome-10.18.1-mmi.3.zip',
      `builds/${prefix}-metamask-mmi-chrome-10.18.1-mmi.3.zip`,
    ]);

    console.log('done with', prefix);
  }
}

go();

function execute(command, args, opts) {
  return new Promise((resolve, reject) => {
    const ls = spawn(command, args, opts);

    ls.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    ls.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    ls.on('error', (error) => {
      console.log(`error: ${error.message}`);
      reject(error.message);
    });

    ls.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      resolve(code);
    });
  });
}
