<template lang="pug">
dd
  h3 {{ $t('setting__sync_client_mode') }}
  div
    .p.small {{ $t('setting__sync_client_status', { status: clientStatus }) }}
    .p.small {{ $t('setting__sync_client_address', { address: sync.client.status.address.join(', ') || '' }) }}
    .p
      .p.small {{ $t('setting__sync_client_host') }}
      div
        base-input.gap-left(:class="$style.hostInput" :model-value="appSetting['sync.client.host']" :disabled="sync.enable" :placeholder="$t('setting__sync_client_host_tip')" @update:model-value="setSyncClientHost")
    .p(v-if="sync.client.status.status")
      base-btn(outline @click="isShowDeviceListModal = true") 已连接设备
remote-device-list-modal(v-model="isShowDeviceListModal")
</template>

<script>
import { computed, ref } from '@common/utils/vueTools'
import { sync } from '@renderer/store'
import { useI18n } from '@renderer/plugins/i18n'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { debounce } from '@common/utils/common'
import { SYNC_CODE } from '@common/constants_sync'
import RemoteDeviceListModal from './RemoteDeviceListModal.vue'

export default {
  name: 'SettingSyncClient',
  components: {
    RemoteDeviceListModal,
  },
  setup() {
    const t = useI18n()

    const clientStatus = computed(() => {
      let status
      switch (sync.client.status.message) {
        case SYNC_CODE.msgBlockedIp:
          status = t('setting__sync_code_blocked_ip')
          break
        case SYNC_CODE.authFailed:
          status = t('setting__sync_code_fail')
          break
        default:
          status = sync.client.status.message
            ? sync.client.status.message
            : sync.client.status.status
              ? t('setting_sync_status_enabled')
              : t('sync_status_disabled')
          break
      }
      return status
    })

    const setSyncClientHost = debounce(host => {
      updateSetting({ 'sync.client.host': host.trim() })
    }, 500)
    const isShowDeviceListModal = ref(false)


    return {
      appSetting,
      sync,
      setSyncClientHost,
      clientStatus,
      isShowDeviceListModal,
    }
  },
}
</script>

<style lang="less" module>
.hostInput[disabled] {
  opacity: .8 !important;
}

.hostInput {
  min-width: 380px;
}
</style>
