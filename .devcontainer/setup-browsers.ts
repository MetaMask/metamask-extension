import { execSync } from 'child_process';

function addBrowserToPath(browserName: string) {
  const seleniumOutput = execSync(
    `node_modules/selenium-webdriver/bin/linux/selenium-manager --browser ${browserName}`,
  ).toString();

  let browserCommand = seleniumOutput.split('Browser path: ')[1];
  browserCommand = browserCommand.slice(0, -1); // cut off the newline

  execSync(`sudo ln -sf ${browserCommand} /usr/local/bin/${browserName}-ln`);
}

addBrowserToPath('chrome');
addBrowserToPath('firefox');

execSync(
  `sudo bash -c "echo -e '#! /bin/bash\n/usr/local/bin/chrome-ln --load-extension=${process.cwd()}/dist/chrome' > /usr/local/bin/chrome-mm"`,
);

execSync('sudo chmod 777 /usr/local/bin/chrome-mm');

execSync(
  `sudo bash -c "echo -e '#! /bin/bash\ncd /workspaces/metamask-extension\nyarn tsx .devcontainer/launch-firefox.ts' > /usr/local/bin/firefox-mm"`,
);

execSync('sudo chmod 777 /usr/local/bin/firefox-mm');
