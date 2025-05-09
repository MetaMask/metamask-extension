import fs from 'fs';
import path from 'path';

// ANSI escape codes for colors
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';

const SNAP_DIR = path.join(__dirname, 'snap-binaries-and-headers');

type Arguments = {
  snapNameAndVersion?: string;
  help?: boolean;
};

const getArgs = (): Arguments => {
  const args = process.argv.slice(2);
  const result: Arguments = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key] = arg.substring(2).split('=');
      if (key === 'help') {
        result.help = true;
      } else {
        result.snapNameAndVersion = key;
      }
    }
  }
  return result;
};

const fetchSnapData = async (
  snapName: string,
  version: string,
): Promise<{ headers: Record<string, string>; body: Buffer } | undefined> => {
  const url = `https://registry.npmjs.org/@metamask/${snapName}/-/${snapName}-${version}.tgz`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        console.error(
          `${RED}Snap not found in the registry: ${snapName}@${version}${RESET}`,
        );
        process.exit(1);
        return undefined;
      }
      throw new Error(`Failed to fetch snap: ${response.statusText}`);
    }
    const headers = Object.fromEntries(response.headers.entries()) as Record<
      string,
      string
    >;
    const arrayBuffer = await response.arrayBuffer();
    const body = Buffer.from(arrayBuffer);
    return { headers, body };
  } catch (error) {
    console.error(`${RED}Error fetching snap data:${RESET}`, error);
    process.exit(1);
    return undefined;
  }
};

const saveSnapFiles = (
  snapName: string,
  version: string,
  data: { headers: Record<string, string>; body: Buffer },
) => {
  const txtFilePath = path.join(SNAP_DIR, `${snapName}-${version}.txt`);
  const headersFilePath = path.join(
    SNAP_DIR,
    `${snapName}-${version}-headers.json`,
  );

  const relevantHeaders = {
    'Accept-Ranges': 'bytes',
    'Content-Length': data.headers['content-length'],
    'Content-Type': 'application/octet-stream',
    Etag: data.headers.etag,
    Vary: 'Accept-Encoding',
  };

  fs.writeFileSync(txtFilePath, data.body);
  fs.writeFileSync(
    headersFilePath,
    `${JSON.stringify(relevantHeaders, null, 2)}\n`,
  );
  console.log(`${GREEN}Successfully saved:${RESET} ${txtFilePath}`);
  console.log(`${GREEN}Successfully saved:${RESET} ${headersFilePath}`);
};

const deleteOldSnapFiles = (snapName: string, currentVersion: string) => {
  const files = fs.readdirSync(SNAP_DIR);
  files.forEach((file) => {
    if (
      file.startsWith(snapName) &&
      !file.includes(currentVersion) &&
      (file.endsWith('.txt') || file.endsWith('-headers.json'))
    ) {
      const filePath = path.join(SNAP_DIR, file);
      try {
        fs.unlinkSync(filePath);
        console.log(
          `${GREEN}Successfully deleted old file:${RESET} ${filePath}`,
        );
      } catch (error) {
        console.error(`${RED}Error deleting file ${filePath}:${RESET}`, error);
      }
    }
  });
};

const printHelp = () => {
  console.log(
    `${YELLOW}Usage:${RESET} yarn update-snap-binary ${CYAN}--<snapName>-<version>${RESET}`,
  );
  console.log(
    `${YELLOW}Example:${RESET} yarn update-snap-binary ${CYAN}--bip32-example-snap-2.3.0${RESET}`,
  );
  console.log(
    `Please ensure the version format is x.y.z (e.g., 1.2.3)${RESET}`,
  );
};

const main = async () => {
  const args = getArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.snapNameAndVersion) {
    console.error(
      `${RED}Error: Snap name and version not provided. Use --help for usage.${RESET}`,
    );
    process.exit(1);
  }

  const nameAndVersionArg = args.snapNameAndVersion;
  const parts = nameAndVersionArg.split('-');

  if (parts.length < 2) {
    console.error(
      `${RED}Error: Invalid format for snap name and version: "${nameAndVersionArg}". Expected format: <snapName>-<version> (e.g., bip32-example-snap-2.3.0). Use --help for usage.${RESET}`,
    );
    process.exit(1);
  }

  const versionCandidate = parts[parts.length - 1];
  const snapNameParts = parts.slice(0, -1);

  if (!/^\d+\.\d+\.\d+$/u.test(versionCandidate)) {
    console.error(
      `${RED}Error: Invalid version format in "${nameAndVersionArg}". Version part "${versionCandidate}" is not in x.y.z format. Use --help for usage.${RESET}`,
    );
    process.exit(1);
  }

  const version = versionCandidate;
  const snapName = snapNameParts.join('-');

  if (!snapName) {
    console.error(
      `${RED}Error: Could not extract snap name from "${nameAndVersionArg}". Use --help for usage.${RESET}`,
    );
    process.exit(1);
  }

  console.log(
    `Fetching snap: ${CYAN}${snapName}${RESET} version: ${CYAN}${version}${RESET}`,
  );
  const snapData = await fetchSnapData(snapName, version);

  if (snapData) {
    deleteOldSnapFiles(snapName, version);
    saveSnapFiles(snapName, version, snapData);
    console.log(`${GREEN}Snap update process completed.${RESET}`);
  }
};

main().catch((error) => {
  console.error(`${RED}Unhandled error in main function:${RESET}`, error);
  process.exit(1);
});
