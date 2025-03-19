#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const chalk = require('chalk');

const createStaticServer = require('./create-static-server');
const { parsePort } = require('./lib/parse-port');

const fsStat = fs.stat;
const DEFAULT_PORT = 9080;

const onResponse = (request, response) => {
  if (response.statusCode >= 400) {
    console.log(
      chalk`{gray '-->'} {red ${response.statusCode}} ${request.url}`,
    );
  } else if (response.statusCode >= 200 && response.statusCode < 300) {
    console.log(
      chalk`{gray '-->'} {green ${response.statusCode}} ${request.url}`,
    );
  } else {
    console.log(
      chalk`{gray '-->'} {green.dim ${response.statusCode}} ${request.url}`,
    );
  }
};
const onRequest = (request, response) => {
  console.log(chalk`{gray '<--'} {blue [${request.method}]} ${request.url}`);
  response.on('finish', () => onResponse(request, response));
};

const startServer = ({ port, rootDirectory }) => {
  const server = createStaticServer({ public: rootDirectory });

  server.on('request', onRequest);

  server.listen(port, () => {
    console.log(`Running at http://localhost:${port}`);
  });
};

const parseDirectoryArgument = async (pathString) => {
  const resolvedPath = path.resolve(pathString);
  const directoryStats = await fsStat(resolvedPath);
  if (!directoryStats.isDirectory()) {
    throw new Error(`Invalid path '${pathString}'; must be a directory`);
  }
  return resolvedPath;
};

const main = async () => {
  const args = process.argv.slice(2);

  const options = {
    port: process.env.port || DEFAULT_PORT,
    rootDirectory: path.resolve('.'),
  };

  while (args.length) {
    if (/^(--port|-p)$/u.test(args[0])) {
      if (args[1] === undefined) {
        throw new Error('Missing port argument');
      }
      options.port = parsePort(args[1]);
      args.splice(0, 2);
    } else {
      options.rootDirectory = await parseDirectoryArgument(args[0]);
      args.splice(0, 1);
    }
  }

  startServer(options);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
