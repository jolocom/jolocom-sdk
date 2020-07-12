import { ErrorReport } from '../lib/errors/types'

export function initSentry() {
  console.log('initSentry')
}

export function reportErrorToSentry(err: ErrorReport, extraData: any) {
  console.error('reportErrorToSentry:\n', err.error, extraData)
}
