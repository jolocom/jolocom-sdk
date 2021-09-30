import appRootDir from 'app-root-path'
import { LoggerConfig, LoggerChannel, OutputType, Level } from './types'
import { configure as log4jsConfigure } from 'log4js'

const DEFAULT_MAX_LOG_SIZE = 5242880
const appendersConfigMap = (filePath: string) => ({
  file: {
    [LoggerChannel.SDK]: {
      type: 'file',
      filename: filePath + '/sdk.log',
      maxLogSize: DEFAULT_MAX_LOG_SIZE,
    },
    [LoggerChannel.AGENT]: {
      type: 'file',
      filename: filePath + '/sdk_agent.log',
      maxLogSize: DEFAULT_MAX_LOG_SIZE,
    },
    [LoggerChannel.INTERACTION]: {
      type: 'file',
      filename: filePath + '/sdk_interaction.log',
      maxLogSize: DEFAULT_MAX_LOG_SIZE,
    },
  },
  console: {
    [LoggerChannel.SDK]: {
      type: 'console',
    },
    [LoggerChannel.AGENT]: {
      type: 'console',
    },
    [LoggerChannel.INTERACTION]: {
      type: 'console',
    },
  },
})

export const configure = (clientConfig?: LoggerConfig): void => {
  const appenders = {}
  const categories = {}
  let defaultCategoryLevel = Level.INFO

  Object.values(LoggerChannel).forEach(channel => {
    const channelConfig = clientConfig?.channelsConfig?.[channel] || null
    const type = channelConfig?.outputType || OutputType.FILE
    const level = channelConfig?.level || Level.INFO
    const filePath = clientConfig?.logsDir || appRootDir + '/var/log'

    appenders[channel] = appendersConfigMap(filePath)[type][channel]
    categories[channel] = { appenders: [channel], level }

    if (channel === LoggerChannel.SDK) {
      defaultCategoryLevel = level
    }
  })

  log4jsConfigure({
    appenders: {
      ...appenders,
      ...(clientConfig?.customConfig?.appenders || {}),
    },
    categories: {
      default: { appenders: [LoggerChannel.SDK], level: defaultCategoryLevel },
      ...{ ...categories, ...(clientConfig?.customConfig?.categories || {}) },
    },
  })
}
