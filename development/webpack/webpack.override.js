/**
 * Custom webpack configuration to handle Ledger libraries
 */
module.exports = {
  overrideWebpackConfig: (config) => {
    // Find the vendor JavaScript rule
    const vendorJsRule = config.module.rules.find(
      (rule) =>
        rule.test?.toString().includes('js|mjs') &&
        rule.include?.toString().includes('node_modules'),
    );

    if (vendorJsRule) {
      // Update the exclude to NOT exclude Ledger libraries
      const originalExclude = vendorJsRule.exclude;

      vendorJsRule.exclude = (modulePath) => {
        // Check if the path contains any of the Ledger libraries
        const isLedgerLib = /node_modules\/@ledgerhq\//u.test(modulePath);

        // If it's a Ledger library, don't exclude it
        if (isLedgerLib) {
          return false;
        }

        // Otherwise, use the original exclude logic
        if (typeof originalExclude === 'function') {
          return originalExclude(modulePath);
        }

        if (originalExclude instanceof RegExp) {
          return originalExclude.test(modulePath);
        }

        return false;
      };
    }

    return config;
  },
};
