import { ServiceContainer } from '../serviceContainer'
import { LoggerConfig } from '../types'
import { LoggerChannel } from './loggerChannel'
import { configure } from './config'
import { DefaultLogger } from './defaultLogger'
import { Logger } from './logger'

export class LoggerRegistrar {
  static register(container: ServiceContainer, clientConfig?: LoggerConfig) {
    configure(clientConfig)

    Object.values(LoggerChannel).forEach(channel => {
      const loggerChannel = LoggerRegistrar.createLoggerChannel(
        channel,
        clientConfig,
      )

      container.register(`logger.${channel}`, loggerChannel)
    })
  }

  private static createLoggerChannel(
    name: LoggerChannel,
    clientConfig?: LoggerConfig,
  ): Logger {
    const isEnabled =
      clientConfig?.isEnabled !== false &&
      clientConfig?.channelsConfig?.[name]?.isEnabled !== false

    return new DefaultLogger(name, isEnabled)
  }
}
