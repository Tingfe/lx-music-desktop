import { log as writeLog } from '@common/utils'
import { formatLogValue } from '@common/utils/privacy'

export default {
  r_info(...params: any[]) {
    writeLog.info(...params)
  },
  r_warn(...params: any[]) {
    writeLog.warn(...params)
  },
  r_error(...params: any[]) {
    writeLog.error(...params)
  },
  info(...params: any[]) {
    // if (global.lx.isEnableSyncLog) writeLog.info(...params)
    console.log(...params.map(formatLogValue))
  },
  warn(...params: any[]) {
    // if (global.lx.isEnableSyncLog) writeLog.warn(...params)
    console.warn(...params.map(formatLogValue))
  },
  error(...params: any[]) {
    // if (global.lx.isEnableSyncLog) writeLog.error(...params)
    console.warn(...params.map(formatLogValue))
  },
}
