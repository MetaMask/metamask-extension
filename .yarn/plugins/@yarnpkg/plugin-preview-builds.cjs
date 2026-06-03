/**
 * This plugin makes it easier for engineers to use preview builds (prereleases
 * published under `@metamask-previews` or a custom NPM scope). It hooks into
 * Yarn's resolution workflow to alias `@metamask` dependencies to specific
 * versions of preview packages.
 *
 * It assumes that preview builds have been specified using a `previewBuilds`
 * key in `package.json`, for example, this would alias whatever version of
 * `@metamask/network-controller` is being used to
 * `@metamask-previews/network-controller@29.0.0-preview-3ec2a74`.
 *
 *     "previewBuilds": {
 *       "@metamask/network-controller": {
 *         "type": "non-breaking",
 *         "previewVersion": "29.0.0-preview-3ec2a74"
 *       }
 *     }
 *
 * If a dependency is patched, the patch is preserved.
 *
 * There are two ways to specify the `type` within a preview build
 * configuration. If an engineer wants to test breaking changes, they would
 * specify `"breaking"`; otherwise they would specify `"non-breaking"`.
 *
 * To use a custom scope instead of `@metamask-previews`, an optional
 * `previewScope` is supported, e.g.:
 *
 *     "previewBuilds": {
 *       "@metamask/network-controller": {
 *         "type": "non-breaking",
 *         "previewScope": "my-custom-scope"
 *         "previewVersion": "29.0.0-preview-3ec2a74",
 *       }
 *     }
 */

/**
 * @typedef {'breaking' | 'non-breaking'} PreviewBuildType
 *
 * The nature of the changes in the preview build.

 * For breaking changes, only the dependency at the top level will be resolved
 * to the preview build.
 *
 * For non-breaking changes, all instances of the dependency that match the
 * major part of the version range specified in `package.json` will be resolved
 * to the preview build.
 */

/**
 * @typedef {object} PreviewBuildConfiguration
 * @property {PreviewBuildType} type - The nature of the changes in the preview
 * build.
 * @property {string} previewScope - The scope for the preview build (defaults
 * @property {string} previewVersion - The preview version string.
 * to "metamask-previews").
 * @property {string} previewVersion - The preview version string.
 */

/**
 * @typedef {Record<string, PreviewBuildConfiguration>} PreviewBuildConfigurations
 */

/**
 * @typedef {object} ValidatedPreviewBuild
 * @property {PreviewBuildConfiguration} configuration - The validated preview
 * build configuration.
 * @property {YarnDescriptor} originalDependencyDescriptor - The descriptor for
 * the original dependency in `package.json`.
 */

/**
 * @typedef {import('@yarnpkg/core').Configuration} YarnConfiguration
 */

/**
 * @typedef {import('@yarnpkg/core').Descriptor} YarnDescriptor
 */

/**
 * @typedef {import('@yarnpkg/core').Locator} YarnLocator
 */

/**
 * @typedef {import('@yarnpkg/core').Project} YarnProject
 */

module.exports = {
  name: '@yarnpkg/plugin-preview-builds',
  factory: (require) => {
    const { structUtils } = require('@yarnpkg/core');

    /**
     * The scope that all MetaMask packages are published under.
     */
    const METAMASK_NPM_SCOPE = 'metamask';

    /**
     * The default scope for preview builds.
     */
    const DEFAULT_PREVIEW_SCOPE = 'metamask-previews';

    /**
     * Stores validated preview build configurations after `validateProject` runs.
     *
     * @type {Map<string, ValidatedPreviewBuild>}
     */
    const validatedPreviewBuilds = new Map();

    /**
     * Stores resolutions for preview builds that have been created in the
     * `reduceDependency` hook. Used to print a summary in `afterAllInstalled`.
     *
     * @type {Map<string, { sourceDescriptor: YarnDescriptor, targetDescriptor: YarnDescriptor, type: PreviewBuildType }>}
     */
    const resolutions = new Map();

    /**
     * Stores unique error messages to display after installation.
     *
     * @type {Set<string>}
     */
    const errors = new Set();

    /**
     * Extracts the major version from a SemVer-compatible version range.
     *
     * @param {string} semVerVersionRange - The version range (e.g., "^10.0.0",
     * "10.2.3", ">=10.0.0").
     * @returns {number|null} The major version number, or `null` if it can't be
     * determined.
     */
    function getMajorVersion(semVerVersionRange) {
      const cleaned = semVerVersionRange.replace(/^[\^~>=<]+/, '');
      const match = cleaned.match(/^(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    }

    /**
     * Checks if a Yarn descriptor represents a patched dependency.
     *
     * @param {string} rawDescriptorRange - The descriptor range string.
     * @returns {boolean} True if the descriptor is a patch.
     */
    function isPatchedDescriptor(rawDescriptorRange) {
      return rawDescriptorRange.startsWith('patch:');
    }

    /**
     * Formats a Yarn descriptor range or locator reference, colorizing it like
     * Yarn would.
     *
     * @param {YarnConfiguration} configuration - The Yarn configuration (used
     * for color support detection).
     * @param {string} rawRange - The range to format.
     * @returns {string} The formatted range.
     */
    function formatRangeForDisplay(configuration, rawRange) {
      return structUtils.prettyRange(configuration, rawRange);
    }

    /**
     * Formats a descriptor for a dependency, colorizing it like Yarn would.
     *
     * @param {YarnConfiguration} configuration - The Yarn configuration (used
     * for color support detection).
     * @param {YarnDescriptor} descriptor - The source descriptor.
     * @returns {string} The formatted descriptor.
     */
    function formatSourceForDisplay(configuration, descriptor) {
      const locator = structUtils.makeLocator(descriptor, descriptor.range);
      return structUtils.prettyLocator(configuration, locator);
    }

    /**
     * Extracts the patch path from a Yarn descriptor range that represents a
     * patched dependency.
     *
     * @param {string} rawDescriptorRange - The patched descriptor range, e.g.
     * `patch:@scope/package@npm%3Aversion#path/to/patch`.
     * @returns {string|null} The patch file path, or null if not found.
     */
    function extractPatchPath(rawDescriptorRange) {
      const hashIndex = rawDescriptorRange.indexOf('#');
      if (hashIndex === -1) {
        return null;
      }
      return rawDescriptorRange.slice(hashIndex + 1);
    }

    /**
     * Reads the preview builds configuration from the project's package.json,
     * adding default values for optional properties.
     *
     * @param {YarnProject} project - The Yarn project object.
     * @returns {PreviewBuildConfigurations} The value of the `previewBuilds`
     * key in `package.json`, or an empty object if it isn't present.
     */
    function getPreviewBuildConfigurations(project) {
      /** @type {{ previewBuilds?: PreviewBuildConfigurations }} */
      const rawManifest = project.topLevelWorkspace.manifest.raw;
      const rawPreviewBuilds = rawManifest.previewBuilds ?? {};

      return Object.entries(rawPreviewBuilds).reduce(
        (previewBuilds, [packageName, config]) => {
          previewBuilds[packageName] = {
            ...config,
            previewScope: config.previewScope ?? DEFAULT_PREVIEW_SCOPE,
          };
          return previewBuilds;
        },
        /** @type {PreviewBuildConfigurations} */ ({}),
      );
    }

    /**
     * Gets the Yarn descriptor for a dependency from the root manifest.
     *
     * @param {YarnProject} project - The Yarn project object.
     * @param {string} packageName - The package name to look up (e.g.,
     * "@metamask/foo").
     * @returns {YarnDescriptor | null} The descriptor, or null if not found.
     */
    function getDependencyDescriptorFromManifest(project, packageName) {
      const ident = structUtils.parseIdent(packageName);
      const manifest = project.topLevelWorkspace.manifest;
      return manifest.dependencies.get(ident.identHash) ?? null;
    }

    /**
     * Extracts the version range from a Yarn descriptor range.
     * Handles `patch:` protocol, `npm:` protocol, and plain version ranges.
     *
     * @param {string} rawDescriptorRange - The descriptor range string.
     * @returns {string} The extracted version range.
     */
    function extractVersionFromRange(rawDescriptorRange) {
      // `patch:<source>#<patchPath>::<params>`
      if (isPatchedDescriptor(rawDescriptorRange)) {
        const parsed = structUtils.parseRange(rawDescriptorRange);
        // `source` contains the original descriptor like "@<scope>/<name>@npm:<version>"
        if (!parsed.source) {
          throw new Error(
            `Could not extract source from patch range: ${rawDescriptorRange}`,
          );
        }
        return extractVersionFromRange(parsed.source);
      }

      // `npm:<version>` or `npm:@<scope>/<name>@<version>`
      if (rawDescriptorRange.startsWith('npm:')) {
        const { selector } = structUtils.parseRange(rawDescriptorRange);
        // Try to parse as a descriptor (for aliased packages like
        // `@<scope>/<name>@<version>`)
        const descriptor = structUtils.tryParseDescriptor(selector, true);
        if (descriptor) {
          return descriptor.range;
        }
        // It's just a version range
        return selector;
      }

      // Plain version range (e.g., `^10.0.0`)
      return rawDescriptorRange;
    }

    /**
     * Ensures that a preview build configuration object has the correct keys
     * and that the `type` has a valid value.
     *
     * @param {PreviewBuildConfiguration} previewBuildConfiguration - The
     * preview build configuration to validate.
     * @param {string} packageName - The package name for error messages.
     * @returns {string | null} Error message if validation fails, otherwise
     * `null`.
     */
    function validatePreviewBuildConfiguration(
      previewBuildConfiguration,
      packageName,
    ) {
      if (
        typeof previewBuildConfiguration !== 'object' ||
        previewBuildConfiguration === null ||
        Array.isArray(previewBuildConfiguration)
      ) {
        return `Invalid preview build configuration for \`${packageName}\`: Expected an object`;
      }

      const { type, previewVersion } = previewBuildConfiguration;
      const subErrors = [];

      if (!type) {
        subErrors.push('Missing \`type\`');
      }

      if (!previewVersion) {
        subErrors.push('Missing \`previewVersion\`');
      }

      if (type && type !== 'breaking' && type !== 'non-breaking') {
        subErrors.push(
          `Invalid \`type\` "${type}" (must be "breaking" or "non-breaking")`,
        );
      }

      if (subErrors.length > 0) {
        return `Invalid preview build configuration for \`${packageName}\`: ${subErrors.join('; ')}`;
      }

      return null;
    }

    /**
     * Determines what effect a configured preview build has on instances of the
     * dependency in the dependency tree.
     *
     * For breaking changes, only the dependency at the top level will be
     * resolved to the preview build.
     *
     * For non-breaking changes, all instances of the dependency that match the
     * major part of the version range specified in `package.json` will be
     * resolved to the preview build.
     *
     * @param {YarnDescriptor} dependency - The Yarn descriptor for a dependency
     * in the dependency tree.
     * @param {YarnLocator} locator - The Yarn locator for a dependency in the
     * dependency tree.
     * @param {ValidatedPreviewBuild} validatedPreviewBuild - Information about
     * the preview build that corresponds to the dependency.
     * @returns {boolean} True if the dependency should be resolved to the
     * preview build, false otherwise.
     */
    function shouldResolveDependencyToPreviewBuild(
      dependency,
      locator,
      validatedPreviewBuild,
    ) {
      const {
        configuration: { type },
        originalDependencyDescriptor,
      } = validatedPreviewBuild;

      if (type === 'breaking') {
        return locator.reference === 'workspace:.';
      }

      const rootDependencyMajorVersion = getMajorVersion(
        extractVersionFromRange(originalDependencyDescriptor.range),
      );
      const dependencyMajorVersion = getMajorVersion(
        extractVersionFromRange(dependency.range),
      );
      return (
        rootDependencyMajorVersion !== null &&
        dependencyMajorVersion !== null &&
        rootDependencyMajorVersion === dependencyMajorVersion
      );
    }

    /**
     * Constructs a Yarn descriptor for a dependency that will be used to
     * resolve it to a preview build.
     *
     * @param {YarnDescriptor} dependency - The Yarn descriptor for a
     * dependency in the dependency tree.
     * @param {ValidatedPreviewBuild} validatedPreviewBuild - The validated
     * preview build configuration.
     * @returns {YarnDescriptor} A new descriptor pointing to the preview build.
     */
    function createPreviewBuildDescriptor(dependency, validatedPreviewBuild) {
      const {
        configuration: { previewScope, previewVersion },
        originalDependencyDescriptor,
      } = validatedPreviewBuild;

      const previewPackageName = `@${previewScope}/${dependency.name}`;
      const dependencyRange = originalDependencyDescriptor.range;

      let newRange;
      if (isPatchedDescriptor(dependencyRange)) {
        const patchPath = extractPatchPath(dependencyRange);
        if (patchPath) {
          newRange = `patch:${previewPackageName}@npm%3A${previewVersion}#${patchPath}`;
        } else {
          newRange = `npm:${previewPackageName}@${previewVersion}`;
        }
      } else {
        newRange = `npm:${previewPackageName}@${previewVersion}`;
      }

      return structUtils.makeDescriptor(
        structUtils.makeIdent(dependency.scope, dependency.name),
        newRange,
      );
    }

    return {
      hooks: {
        /**
         * Validates the `previewBuilds` key in `package.json` before resolution
         * starts, ensuring all packages specified there correspond to an entry
         * in `dependencies`, and that the configuration objects are valid.
         *
         * @param {YarnProject} project - The Yarn project.
         */
        validateProject: async (project) => {
          const previewBuildConfigurations =
            getPreviewBuildConfigurations(project);
          const packageNames = Object.keys(previewBuildConfigurations);

          if (packageNames.length === 0) {
            return;
          }

          for (const packageName of packageNames) {
            const previewBuildConfiguration =
              previewBuildConfigurations[packageName];

            const error = validatePreviewBuildConfiguration(
              previewBuildConfiguration,
              packageName,
            );
            if (error) {
              errors.add(error);
              continue;
            }

            const originalDependencyDescriptor =
              getDependencyDescriptorFromManifest(project, packageName);
            if (!originalDependencyDescriptor) {
              errors.add(
                `\`${packageName}\` is configured in \`previewBuilds\`, but not found in \`dependencies\``,
              );
              continue;
            }

            validatedPreviewBuilds.set(packageName, {
              configuration: previewBuildConfiguration,
              originalDependencyDescriptor,
            });
          }
        },

        /**
         * Yarn calls this during the resolution phase for each dependency in
         * the dependency tree.
         *
         * This hook allows us to resolve `@metamask` packages to associated
         * preview builds.
         *
         * @param {YarnDescriptor} dependency - The dependency being resolved.
         * @param {YarnProject} project - The Yarn project.
         * @param {YarnLocator} locator - The parent package locator.
         * @returns {Promise<YarnDescriptor>} The resolved descriptor.
         */
        reduceDependency: async (dependency, _project, locator) => {
          if (dependency.scope !== METAMASK_NPM_SCOPE) {
            return dependency;
          }

          const packageName = `@${dependency.scope}/${dependency.name}`;

          const validatedPreviewBuild = validatedPreviewBuilds.get(packageName);
          if (!validatedPreviewBuild) {
            return dependency;
          }

          if (
            !shouldResolveDependencyToPreviewBuild(
              dependency,
              locator,
              validatedPreviewBuild,
            )
          ) {
            return dependency;
          }

          const previewBuildDescriptor = createPreviewBuildDescriptor(
            dependency,
            validatedPreviewBuild,
          );

          const resolutionKey = dependency.descriptorHash;
          resolutions.set(resolutionKey, {
            sourceDescriptor: dependency,
            targetDescriptor: previewBuildDescriptor,
            type: validatedPreviewBuild.configuration.type,
          });

          return previewBuildDescriptor;
        },

        /**
         * Yarn calls this hook after all packages have been installed.
         *
         * This hook is used to print summary information and clear caches.
         *
         * @param {YarnProject} project - The Yarn project.
         */
        afterAllInstalled: (project) => {
          const { configuration } = project;

          if (errors.size > 0) {
            console.log('');
            console.error(
              `[plugin-preview-builds] Preview build configurations were not processed due to the following errors:`,
            );
            errors.forEach((error) => {
              console.error(`  - ${error}`);
            });
            console.log('');
          }

          if (resolutions.size > 0) {
            const workspaceLocator = project.topLevelWorkspace.anchoredLocator;
            console.log('');
            console.log(
              `[plugin-preview-builds] The following dependencies were mapped to preview builds:`,
            );
            for (const {
              sourceDescriptor,
              targetDescriptor,
              type,
            } of resolutions.values()) {
              const source = formatSourceForDisplay(
                configuration,
                sourceDescriptor,
              );
              const target = formatRangeForDisplay(
                configuration,
                targetDescriptor.range,
              );
              const isPatched = isPatchedDescriptor(targetDescriptor.range);
              const arrow = isPatched ? '\n  -> ' : ' -> ';
              if (type === 'breaking') {
                const prettyWorkspace = structUtils.prettyLocator(
                  configuration,
                  workspaceLocator,
                );
                console.log(`- ${prettyWorkspace}/${source}${arrow}${target}`);
              } else {
                console.log(`- ${source}${arrow}${target}`);
              }
            }
            console.log('');
          }

          validatedPreviewBuilds.clear();
          resolutions.clear();
          errors.clear();
        },
      },
    };
  },
};
