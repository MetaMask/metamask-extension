const fs = require('fs');

const dir = 'test/test-results/e2e';

fs.readdirSync(dir).forEach((file) => {
  const currentFile = `${dir}/${file}`;
  let data = fs.readFileSync(currentFile, { encoding: 'utf8', flag: 'r' });
  data = data.substring(data.indexOf('<testsuite'));
  fs.writeFileSync(currentFile, data);
});
