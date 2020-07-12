import { routeList } from '../routeList'
import strings from '../locales/strings'
import { ErrorCode, initErrorReporting, reportError } from './errors/index'
export { ErrorCode, initErrorReporting, reportError }

export class AppError extends Error {
  // private code: ErrorCode
  public origError: any
  public navigateTo: routeList
  public code: ErrorCode

  public constructor(
    code = ErrorCode.Unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    origError?: any,
    navigateTo: routeList = routeList.AppInit,
  ) {
    super(strings[code] || strings[ErrorCode.Unknown])
    this.code = code
    this.origError = origError
    this.navigateTo = navigateTo
  }
}

export const errorTitleMessages = [strings.DAMN, strings.OH_NO, strings.UH_OH]
