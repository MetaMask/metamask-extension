import fs from 'fs';
import path from 'path';
import { valid as semverValid } from 'semver';
import { getLocalSnapLatestVersion } from './snap-binary-mocks';

// ANSI escape codes for colors
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';

const SNAP_DIR = path.join(__dirname, 'snap-binaries-and-headers');

type Arguments = {
  snapIdentifier?: string;
  help?: boolean;
};

const getArgs = (): Arguments => {
  const args = process.argv.slice(2);
  const result: Arguments = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const rawArg = arg.substring(2);
      if (rawArg === 'help') {
        result.help = true;
      } else if (rawArg.includes('@')) {
        result.snapIdentifier = rawArg;
      } else {
        console.warn(
          `${YELLOW}Warning: Unrecognized argument format: ${arg}${RESET}`,
        );
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
  const txtFilePath = path.join(SNAP_DIR, `${snapName}@${version}.txt`);
  const headersFilePath = path.join(
    SNAP_DIR,
    `${snapName}@${version}-headers.json`,
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

const deleteOldSnapFiles = (
  snapName: string,
  currentVersionBeingSaved: string,
) => {
  let versionToDelete: string | null = null;

  try {
    const latestExistingVersion = getLocalSnapLatestVersion(snapName);

    if (latestExistingVersion !== currentVersionBeingSaved) {
      versionToDelete = latestExistingVersion;
    }
  } catch (error: unknown) {
    let errorMessage =
      'An unknown error occurred while checking for old versions';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.log(
      `${YELLOW}Info: No existing versions of ${snapName} (using @version format) found to check for deletion, or error: ${errorMessage}${RESET}`,
    );
  }

  if (versionToDelete) {
    console.log(
      `${CYAN}Identified version to delete for ${snapName}: ${versionToDelete}${RESET}`,
    );
    const txtFilePath = path.join(
      SNAP_DIR,
      `${snapName}@${versionToDelete}.txt`,
    );
    const headersFilePath = path.join(
      SNAP_DIR,
      `${snapName}@${versionToDelete}-headers.json`,
    );

    [txtFilePath, headersFilePath].forEach((filePathToDelete) => {
      if (fs.existsSync(filePathToDelete)) {
        try {
          fs.unlinkSync(filePathToDelete);
          console.log(
            `${GREEN}Successfully deleted old file:${RESET} ${filePathToDelete}`,
          );
        } catch (e) {
          console.error(
            `${RED}Error deleting file ${filePathToDelete}:${RESET}`,
            e,
          );
        }
      }
    });
  }
};

const printHelp = () => {
  console.log(
    `${YELLOW}Usage:${RESET} yarn update-snap-binary ${CYAN}--<snapName>@<version>${RESET}`,
  );
  console.log(
    `${YELLOW}Example:${RESET} yarn update-snap-binary ${CYAN}--bip32-example-snap@2.3.0${RESET}`,
  );
  console.log(
    `Please ensure the version is a valid semantic version (e.g., 1.2.3).${RESET}`,
  );
};

const main = async () => {
  const args = getArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.snapIdentifier) {
    console.error(
      `${RED}Error: Snap identifier not provided. Use --help for usage.${RESET}`,
    );
    process.exit(1);
  }

  const parts = args.snapIdentifier.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    console.error(
      `${RED}Error: Invalid format for snap identifier: "${args.snapIdentifier}". Expected format: <snapName>@<version> (e.g., bip32-example-snap@2.3.0). Use --help for usage.${RESET}`,
    );
    process.exit(1);
  }

  const snapName = parts[0];
  const versionCandidate = parts[1];

  if (!semverValid(versionCandidate)) {
    console.error(
      `${RED}Error: Invalid version format in "${args.snapIdentifier}". Version "${versionCandidate}" is not a valid semantic version. Use --help for usage.${RESET}`,
    );
    process.exit(1);
  }
  const version = versionCandidate;

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
