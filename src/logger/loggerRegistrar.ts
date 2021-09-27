import { ServiceContainer } from '../serviceContainer'
import { LoggerConfig } from '@jolocom/sdk'
import { LoggerChannel } from './loggerChannel'
import { configuration } from './config'
import { DefaultLogger } from './defaultLogger'
import { Logger } from './logger'

export class LoggerRegistrar {
  static register(container: ServiceContainer, clientConfig?: LoggerConfig) {
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
    const channelConfig = configuration(clientConfig)
    const isEnabled =
      clientConfig?.isEnabled !== false &&
      clientConfig?.channelsConfig?.[name]?.isEnabled !== false

    return new DefaultLogger(channelConfig, name, isEnabled)
  }
}
