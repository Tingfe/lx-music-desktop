import { SYNC_CODE } from '@common/constants_sync'
import { aesEncrypt } from '../utils'
import { getConnectionInfo } from './client'
import { request } from './utils'

const getRequestUrl = (clientId: string, key: string, clientIdToRemove?: string) => {
  const connection = getConnectionInfo()
  if (!connection) throw new Error(SYNC_CODE.connectServiceFailed)
  const url = new URL(`${connection.urlInfo.httpProtocol}//${connection.urlInfo.hostPath}/devices`)
  url.searchParams.set('i', clientId)
  url.searchParams.set('t', aesEncrypt(SYNC_CODE.msgConnect, key))
  if (clientIdToRemove) url.searchParams.set('clientId', clientIdToRemove)
  return url.href
}

export const getRemoteDevices = async(): Promise<LX.Sync.RemoteDevices> => {
  const connection = getConnectionInfo()
  if (!connection) throw new Error(SYNC_CODE.connectServiceFailed)
  const { text, code } = await request(getRequestUrl(connection.keyInfo.clientId, connection.keyInfo.key))
  if (code != 200) throw new Error(SYNC_CODE.connectServiceFailed)
  const data = JSON.parse(text) as { devices?: LX.Sync.RemoteDevices }
  return data.devices ?? []
}

export const removeRemoteDevice = async(clientId: string) => {
  const connection = getConnectionInfo()
  if (!connection) throw new Error(SYNC_CODE.connectServiceFailed)
  const { code } = await request(getRequestUrl(connection.keyInfo.clientId, connection.keyInfo.key, clientId), { method: 'DELETE' })
  if (code != 204) throw new Error(SYNC_CODE.connectServiceFailed)
}
