/**
 * An error thrown by a CLI command that has already reported its own failure.
 *
 * The CLI uses this to tell an intentional command failure — whose explanation
 * has already been written to the output — apart from a usage error or an
 * unexpected crash. When this is thrown, the CLI exits with a non-zero status
 * without printing the help text or a stack trace.
 */
export class CommandError extends Error {}
