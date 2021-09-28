import appRootDir from 'app-root-path'
import { Configuration } from 'log4js'
import { LoggerChannel } from './loggerChannel'
import { LoggerConfig } from '@jolocom/sdk'
import { OutputType } from './outputType'
import { Level } from './level'

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

export const configuration = (clientConfig?: LoggerConfig): Configuration => {
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

  return {
    appenders,
    categories: {
      default: { appenders: [LoggerChannel.SDK], level: defaultCategoryLevel },
      ...categories,
    },
  }
}
