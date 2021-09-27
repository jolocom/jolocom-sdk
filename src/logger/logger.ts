export interface Logger {
  /**
   * Adds a log record at the DEBUG level.
   * Detailed debug information.
   *
   * @param message The log message.
   * @param args The log context.
   */
  debug(message: string, args?: unknown[]): void

  /**
   * Adds a log record at the INFO level.
   * Interesting events.
   *
   * @param message The log message.
   * @param args The log context.
   */
  info(message: string, args?: unknown[]): void

  /**
   * Adds a log record at the WARNING level.
   * Exceptional occurrences that are not errors.
   *
   * Examples: Use of deprecated APIs, poor use of an API,
   * undesirable things that are not necessarily wrong.
   *
   * @param message The log message.
   * @param args The log context.
   */
  warn(message: string, args?: unknown[]): void

  /**
   * Adds a log record at the ERROR level.
   * Runtime errors.
   *
   * @param message The log message.
   * @param args The log context.
   */
  error(message: string, args?: unknown[]): void

  /**
   * Adds a log record at the FATAL level.
   * Critical conditions.
   *
   * @param message The log message.
   * @param args The log context.
   */
  fatal(message: string, args?: unknown[]): void
}
