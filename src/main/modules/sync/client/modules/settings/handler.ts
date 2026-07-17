import { SYNC_CLOSE_CODE } from '@common/constants_sync'

const syncedKeys: Array<keyof LX.AppSetting> = [
  'common.langId',
  'common.sourceNameType',
  'player.togglePlayMethod',
  'player.playQuality',
  'player.playbackRate',
  'player.isSavePlayTime',
  'player.isShowLyricTranslation',
  'player.isShowLyricRoma',
  'search.isShowHotSearch',
  'search.isShowHistorySearch',
  'list.isClickPlayList',
  'list.isShowSource',
  'list.isSaveScrollLocation',
  'list.addMusicLocationType',
  'theme.id',
  'theme.lightId',
  'theme.darkId',
]

let applyingRemoteData = false
let unregister: (() => void) | null

const getSyncData = (): LX.Sync.SettingsSyncData => {
  const data: LX.Sync.SettingsSyncData = {}
  for (const key of syncedKeys) data[key] = global.lx.appSetting[key]
  return data
}

const applySyncData = (data: LX.Sync.SettingsSyncData) => {
  const next: Partial<LX.AppSetting> = {}
  for (const key of syncedKeys) {
    if (key in data) next[key] = data[key] as never
  }
  global.lx.event_app.update_config(next)
}

const handler: LX.Sync.ClientSyncHandlerSettingsActions<LX.Sync.Client.Socket> = {
  async onSettingsSyncData(socket, data) {
    if (!socket.moduleReadys.settings) return
    applyingRemoteData = true
    try {
      applySyncData(data)
    } finally {
      applyingRemoteData = false
    }
  },
  async settings_sync_get_data() {
    return getSyncData()
  },
  async settings_sync_set_data(socket, data) {
    applyingRemoteData = true
    try {
      applySyncData(data)
    } finally {
      applyingRemoteData = false
    }
  },
  async settings_sync_finished(socket) {
    socket.moduleReadys.settings = true
    unregister?.()
    const listener = (keys: Array<keyof LX.AppSetting>) => {
      if (applyingRemoteData || !socket.moduleReadys.settings || !keys.some(key => syncedKeys.includes(key))) return
      void socket.remoteQueueSettings.onSettingsSyncData(getSyncData()).catch(() => {
        socket.close(SYNC_CLOSE_CODE.failed)
      })
    }
    global.lx.event_app.on('updated_config', listener)
    unregister = () => global.lx.event_app.off('updated_config', listener)
    socket.onClose(() => unregister?.())
  },
}

export default handler
