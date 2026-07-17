<template lang="pug">
material-modal(:show="modelValue" bg-close teleport="#view" @close="$emit('update:modelValue', false)")
  main(:class="$style.main")
    h2 已连接设备
    ul.scroll(v-if="deviceList.length" :class="$style.content")
      li(v-for="device in deviceList" :key="device.clientId" :class="$style.listItem")
        div(:class="$style.listLeft")
          span(:class="$style.name")
            svg-icon(v-if="device.isMobile" name="phone" style="margin-right: 0.2rem; vertical-align: -0.2em;")
            | {{ device.deviceName }}
          span(:class="$style.desc")
            | {{ device.isOnline ? '在线' : '离线' }} · 上次同步 {{ formatTime(device.lastSyncDate || device.lastConnectDate) }}
        base-btn(:class="$style.listBtn" outline aria-label="移除设备" @click.stop="handleRemove(device.clientId)")
          svg(v-once version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 212.982 212.982" space="preserve")
            use(xlink:href="#icon-delete")
    div(v-else :class="$style.content")
      div(:class="$style.noitem") 暂无已授权设备
  div(:class="$style.footer")
    base-btn(outline @click="getList") 刷新
    div(:class="$style.tips") 移除后，该设备需重新输入同步密钥才能连接。
</template>

<script>
import { ref, watch } from '@common/utils/vueTools'
import { dateFormat } from '@common/utils/common'
import { getSyncRemoteDevices, removeSyncRemoteDevice } from '@renderer/utils/ipc'

export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props) {
    const deviceList = ref([])
    const getList = () => {
      void getSyncRemoteDevices().then(list => {
        deviceList.value = list
      }).catch(() => {
        deviceList.value = []
      })
    }
    watch(() => props.modelValue, val => {
      if (val) getList()
    })
    const handleRemove = clientId => {
      void removeSyncRemoteDevice(clientId).then(getList)
    }
    return {
      deviceList,
      getList,
      handleRemove,
      formatTime: time => time ? dateFormat(time) : '-',
    }
  },
}
</script>

<style lang="less" module>
.main { min-width: 460px; min-height: 200px; display: flex; flex-flow: column nowrap; justify-content: center; }
.main h2 { margin: 15px; font-size: 16px; color: var(--color-font); line-height: 1.3; text-align: center; }
.content { flex: auto; min-height: 100px; max-height: 100%; }
.listItem { display: flex; flex-flow: row nowrap; align-items: center; padding: 10px; }
.listItem:hover { background-color: var(--color-primary-background-hover); }
.listLeft { flex: auto; min-width: 0; display: flex; flex-flow: column nowrap; }
.name { color: var(--color-font); font-size: 14px; word-break: break-all; }
.desc, .tips { color: var(--color-font-label); font-size: 12px; margin-top: 8px; }
.listBtn { flex: none; height: 30px; width: 30px; padding: 0; display: flex; justify-content: center; align-items: center; }
.listBtn svg { width: 60%; }
.noitem { height: 100px; font-size: 18px; color: var(--color-font-label); display: flex; justify-content: center; align-items: center; }
.footer { display: flex; align-items: center; gap: 12px; padding: 8px 15px; }
.tips { flex: auto; margin-top: 0; line-height: 1.25; }
</style>
