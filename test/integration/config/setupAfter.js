// This file is for Jest-specific setup only and runs before our Jest tests.
import { jestPreviewConfigure } from 'jest-preview';
import '../config/assets/index.css';
import '../../helpers/setup-after-helper';

// Integration tests use 'integration' snapshot type
if (!process.env.WARNINGS_SNAPSHOT_TYPE) {
  process.env.WARNINGS_SNAPSHOT_TYPE = 'integration';
}

// Setup console warnings/errors snapshot validation
import { setupConsoleCapture } from '../../jest/console-capture';

setupConsoleCapture();

// Should be path from root of your project
jestPreviewConfigure({
  publicFolder: 'test/integration/config/assets', // No need to configure if `publicFolder` is `public`
});
