import { getLogger, Logger as Log4js } from 'log4js'
import { Logger } from './logger'
import { Level } from './types'

export class DefaultLogger implements Logger {
  private readonly logger: Log4js
  private readonly isEnabled: boolean

  constructor(channelName: string, isEnabled = true) {
    this.logger = getLogger(channelName)
    this.isEnabled = isEnabled
  }

  /**
   * @inheritDoc
   */
  public debug(message: string, args: unknown[] = []): void {
    this.log(Level.DEBUG, message, args)
  }

  /**
   * @inheritDoc
   */
  public info(message: string, args: unknown[] = []): void {
    this.log(Level.INFO, message, args)
  }

  /**
   * @inheritDoc
   */
  public warn(message: string, args: unknown[] = []): void {
    this.log(Level.WARNING, message, args)
  }

  /**
   * @inheritDoc
   */
  public error(message: string, args: unknown[] = []): void {
    this.log(Level.ERROR, message, args)
  }

  /**
   * @inheritDoc
   */
  public fatal(message: string, args: unknown[] = []): void {
    this.log(Level.FATAL, message, args)
  }

  private log(level: Level, message: string, args: unknown[]) {
    if (!this.isEnabled) {
      return
    }

    this.logger.log(level, message, ...args)
  }
}
