import { httpGet } from './request'
import { compareVer } from '@common/utils'
import { getReleaseInfo } from './releaseManifest'

const repository = 'Tingfe/lx-music-desktop'
const manifestUrls = [
  `https://fastly.jsdelivr.net/gh/${repository}@release-info/desktop.json`,
  `https://gcore.jsdelivr.net/gh/${repository}@release-info/desktop.json`,
  `https://cdn.jsdelivr.net/gh/${repository}@release-info/desktop.json`,
  `https://raw.githubusercontent.com/${repository}/release-info/desktop.json`,
]

export const getVersionInfo = async(includePreRelease = false) => {
  return getReleaseInfo(httpGet, manifestUrls, includePreRelease, compareVer)
}
