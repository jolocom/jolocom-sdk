import { Configuration } from 'log4js'

export enum OutputType {
  CONSOLE = 'console',
  FILE = 'file',
}

export enum LoggerChannel {
  SDK = 'sdk',
  AGENT = 'agent',
  INTERACTION = 'interaction',
}

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

export type LoggerChannelConfig = {
  [name in LoggerChannel]: {
    isEnabled?: boolean
    level?: Level
    outputType?: OutputType
  }
}

export interface LoggerConfig {
  isEnabled?: boolean
  logsDir?: string
  channelsConfig?: LoggerChannelConfig
  customConfig?: Configuration
}
