export interface Logger {
  /**
   * Adds a log record at the DEBUG level.
   * Detailed debug information.
   *
   * @param message
   * @param args
   */
  debug(message: string, args?: []): void

  /**
   * Adds a log record at the INFO level.
   * Interesting events.
   *
   * @param message
   * @param args
   */
  info(message: string, args?: []): void

  /**
   * Adds a log record at the WARNING level.
   * Exceptional occurrences that are not errors.
   *
   * Examples: Use of deprecated APIs, poor use of an API,
   * undesirable things that are not necessarily wrong.
   *
   * @param message
   * @param args
   */
  warn(message: string, args?: []): void

  /**
   * Adds a log record at the ERROR level.
   * Runtime errors.
   *
   * @param message
   * @param args
   */
  error(message: string, args?: []): void

  /**
   * Adds a log record at the FATAL level.
   * Critical conditions.
   *
   * @param message
   * @param args
   */
  fatal(message: string, args?: []): void
}
