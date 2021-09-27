import { Configuration, configure, getLogger, Logger as Log4js } from 'log4js'
import { Logger } from './logger'
import { Level } from './level'

export class DefaultLogger implements Logger {
  private readonly logger: Log4js
  private readonly isEnabled: boolean

  constructor(
    configuration: Configuration,
    channelName: string,
    isEnabled = true,
  ) {
    configure(configuration)

    this.logger = getLogger(channelName)
    this.isEnabled = isEnabled
  }

  /**
   * {@inheritDoc}
   */
  public debug(message: string, args: [] = []): void {
    this.log(Level.DEBUG, message, args)
  }

  /**
   * {@inheritDoc}
   */
  public info(message: string, args: [] = []): void {
    this.log(Level.INFO, message, args)
  }

  /**
   * {@inheritDoc}
   */
  public warn(message: string, args: [] = []): void {
    this.log(Level.WARNING, message, args)
  }

  /**
   * {@inheritDoc}
   */
  public error(message: string, args: [] = []): void {
    this.log(Level.ERROR, message, args)
  }

  /**
   * {@inheritDoc}
   */
  public fatal(message: string, args: [] = []): void {
    this.log(Level.FATAL, message, args)
  }

  private log(level: Level, message: string, args: []) {
    if (!this.isEnabled) {
      return
    }

    this.logger.log(level, message, ...args)
  }
}
