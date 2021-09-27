export enum Level {
  /**
   * Detailed debug information.
   */
  DEBUG = 'debug',

  /**
   * Interesting events.
   */
  INFO = 'info',

  /**
   * Exceptional occurrences that are not errors.
   */
  WARNING = 'warn',

  /**
   * Runtime errors.
   */
  ERROR = 'error',

  /**
   * Critical conditions.
   */
  FATAL = 'fatal',
}
