import { closeWindow } from './main'
import { getUserApis, importApi as handleImportApi, removeApi as handleRemoveApi, setAllowShowUpdateAlert as saveAllowShowUpdateAlert, getUserApiSyncData, overwriteUserApiSyncData } from './utils'
import { loadApi, setAllowShowUpdateAlert as setRendererEventAllowShowUpdateAlert, init } from './rendererEvent/rendererEvent'
import { emitUserApiChanged } from './event'

let userApiId: string | null

export const getApiList = getUserApis

export const importApi = async(script: string): Promise<LX.UserApi.ImportUserApi> => {
  const result = {
    apiInfo: await handleImportApi(script),
    apiList: getUserApis(),
  }
  emitUserApiChanged()
  return result
}
export const removeApi = async(ids: string[]): Promise<LX.UserApi.UserApiInfo[]> => {
  if (userApiId && ids.includes(userApiId)) {
    userApiId = null
    await closeWindow()
  }
  handleRemoveApi(ids)
  emitUserApiChanged()
  return getUserApis()
}

export const setApi = async(id: string) => {
  if (userApiId) {
    userApiId = null
    await closeWindow()
  }
  const apiList = getUserApis()
  if (!apiList.some(a => a.id === id)) return
  userApiId ||= id
  await loadApi(id)
}

export const setAllowShowUpdateAlert = (id: string, enable: boolean) => {
  saveAllowShowUpdateAlert(id, enable)
  setRendererEventAllowShowUpdateAlert(id, enable)
  emitUserApiChanged()
}

export const getSyncData = getUserApiSyncData

export const overwriteSyncData = async(data: LX.Sync.UserApiSyncData) => {
  const list = await overwriteUserApiSyncData(data)
  if (userApiId && list.some(api => api.id == userApiId)) await setApi(userApiId)
  emitUserApiChanged()
  return list
}


export * from './rendererEvent/rendererEvent'

export default () => {
  init()

  global.lx.event_app.on('main_window_close', () => {
    void closeWindow()
  })
}
