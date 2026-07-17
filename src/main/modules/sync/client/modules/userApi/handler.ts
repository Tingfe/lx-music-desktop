import { getSyncData, overwriteSyncData } from '@main/modules/userApi'
import { onUserApiChanged } from '@main/modules/userApi/event'
import { sendUserApiListChanged } from '@main/modules/winMain/rendererEvent/userApi'
import { SYNC_CLOSE_CODE } from '@common/constants_sync'

let applyingRemoteData = false
let unregister: (() => void) | null

const handler: LX.Sync.ClientSyncHandlerUserApiActions<LX.Sync.Client.Socket> = {
  async onUserApiSyncData(socket, data) {
    if (!socket.moduleReadys.userApi) return
    applyingRemoteData = true
    try {
      sendUserApiListChanged(await overwriteSyncData(data))
    } finally {
      applyingRemoteData = false
    }
  },
  async user_api_sync_get_data() {
    return getSyncData()
  },
  async user_api_sync_set_data(socket, data) {
    applyingRemoteData = true
    try {
      sendUserApiListChanged(await overwriteSyncData(data))
    } finally {
      applyingRemoteData = false
    }
  },
  async user_api_sync_finished(socket) {
    socket.moduleReadys.userApi = true
    unregister?.()
    unregister = onUserApiChanged(() => {
      if (applyingRemoteData || !socket.moduleReadys.userApi) return
      void getSyncData().then(data => {
        void socket.remoteQueueUserApi.onUserApiSyncData(data).catch(() => {
          socket.close(SYNC_CLOSE_CODE.failed)
        })
      }).catch(() => {
        socket.close(SYNC_CLOSE_CODE.failed)
      })
    })
    socket.onClose(() => unregister?.())
  },
}

export default handler
