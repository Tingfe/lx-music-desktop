const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const root = path.join(__dirname, '..')
const desktop = fs.existsSync(path.join(root, 'src/renderer'))
const base = desktop ? 'src/renderer' : 'src'
const load = (file, deps = {}, globals = {}, append = '') => {
  const module = { exports: {} }
  const source = fs.readFileSync(path.join(root, file), 'utf8') + append
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText
  vm.runInNewContext(code, {
    module, exports: module.exports, Buffer, URL, Uint8Array, console, setTimeout, clearTimeout,
    require(name) {
      if (name in deps) return deps[name]
      if (['pako', 'zlib', 'crypto', 'url'].includes(name)) return require(name)
      throw new Error('Unexpected dependency: ' + name)
    }, ...globals,
  }, { filename: file })
  return module.exports
}
const compareVer = (a, b) => {
  const aa = a.split('.').map(Number), bb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if (aa[i] !== bb[i]) return aa[i] < bb[i] ? -1 : 1
  return 0
}
test('QQ search uses current desktop request and reads current response shape', async() => {
  let request
  const sdk = load(base + '/utils/musicSdk/tx/musicSearch.js', {
    '../../index': {}, '../utils': {}, './utils': { signRequest: async body => {
      request = body
      return { body: { code: 0, 'music.search.SearchCgiService': { code: 0, data: { body: { song: { list: [] } }, meta: { sum: 0 } } } } }
    } },
  }).default
  const data = await sdk.musicSearch('fixture', 2, 50)
  assert.equal(request['music.search.SearchCgiService'].method, 'DoSearchForQQMusicDesktop')
  assert.equal(request['music.search.SearchCgiService'].param.page_num, 2)
  assert.match(request['music.search.SearchCgiService'].param.searchid, /^[0-9A-F]{32}[0-9]{5}$/)
  assert.equal(data.meta.sum, 0)
})

test('Kugou shared playlist fetches every page without dropping songs', async() => {
  const sdk = load(base + '/utils/musicSdk/kg/songList.js', {
    '../../request': {}, '../../index': {},
    './vendors/infSign.min': {}, '@renderer/utils/musicSdk/kg/vendors/infSign.min': {},
    './util': { signatureParams: () => 'fixture-signature' },
  }).default
  const pages = []
  sdk.createHttp = async url => {
    const page = Number(new URL(url).searchParams.get('page'))
    pages.push(page)
    const items = Array.from({ length: page === 3 ? 1 : 50 }, (_, i) => ({ hash: String((page - 1) * 50 + i) }))
    return { info: [{ count: 101, name: 'fixture' }], list: { info: items } }
  }
  sdk.getMusicInfos = async items => items
  const result = await sdk.getListDetailByGcidChain('fixture-id', 'fixture-chain')
  assert.deepEqual(pages, [1, 2, 3])
  assert.equal(result.list.length, 101)
  assert.equal(result.total, 101)
})

test('automatic source matching excludes live and instrumental versions', async() => {
  let name = 'Fixture Song (Live)'
  const deps = { './api-source': {}, './versionChars': load(base + '/utils/musicSdk/versionChars.ts') }
  for (const id of ['kw', 'kg', 'tx', 'wy', 'mg', 'xm']) deps['./' + id] = {}
  deps['./kw'] = { musicSearch: { search: async() => ({ list: [{ name, singer: 'Fixture Singer', interval: '03:05', albumName: 'Fixture Album' }] }) } }
  for (const id of ['kw', 'kg', 'tx', 'wy', 'mg', 'bd']) deps['./' + id + '/index'] = deps['./' + id] || {}
  const module = load(base + '/utils/musicSdk/index.js', deps)
  const sdk = desktop ? module.default : module
  const original = { name: 'Fixture Song', singer: 'Fixture Singer', interval: '03:00', albumName: 'Fixture Album', source: 'wy' }
  assert.equal((await sdk.findMusic(original)).length, 0)
  name = 'Fixture Song (Instrumental)'
  assert.equal((await sdk.findMusic(original)).length, 0)
  name = 'Fixture Song'
  assert.equal((await sdk.findMusic(original)).length, 1)
})

test('GD single-track cache clearing preserves other tracks and invalidates in-flight cache writes', async() => {
  const gd = load(base + '/utils/musicSdk/gd-studio.js')
  let calls = 0
  const api = gd.createGdStudioApi(() => ({ promise: Promise.resolve({ statusCode: 200, body: { url: 'https://audio.example.invalid/fixture', br: 320 } }), cancelHttp() {} }), () => true)
  await api.getMusicUrl({ songmid: '1' }).promise
  await api.getMusicUrl({ songmid: '2' }).promise
  assert.equal(api.hasMusicUrl({ meta: { songId: '1' } }), true)
  api.clearMusicUrl({ meta: { songId: '1' } })
  assert.equal(api.hasMusicUrl({ songmid: '1' }), false)
  assert.equal(api.hasMusicUrl({ songmid: '2' }), true)
  let resolve
  const pendingApi = gd.createGdStudioApi(() => {
    calls++
    return { promise: new Promise(r => { resolve = r }), cancelHttp() {} }
  }, () => true)
  const pending = pendingApi.getMusicUrl({ songmid: '3' })
  await Promise.resolve()
  pendingApi.clearMusicUrl({ songmid: '3' })
  resolve({ statusCode: 200, body: { url: 'https://audio.example.invalid/fixture', br: 320 } })
  await pending.promise
  assert.equal(pendingApi.hasMusicUrl({ songmid: '3' }), false)
  assert.equal(calls, 1)
})

test('pure JS QRC decoding handles empty, malformed and encrypted lyric fixtures', async() => {
  const qrc = load(base + '/utils/musicSdk/tx/qrcDecode.js', {}, {},
    '\nexport const encryptFixture = (bytes) => { const schedule = tripledes_key_setup(QRC_KEY, DES_ENCRYPT); const result = new Uint8Array(Math.ceil(bytes.length / 8) * 8); result.set(bytes); const block = new Uint8Array(8); for (let i = 0; i < result.length; i += 8) { tripledes_crypt(result.subarray(i, i + 8), schedule, block); result.set(block, i); } return Buffer.from(result).toString("hex") }\n')
  const text = '[00:01.005]Fixture lyric 歌词'
  const encrypted = qrc.encryptFixture(require('node:zlib').deflateSync(Buffer.from(text)))
  assert.equal(await qrc.decodeQrc(encrypted), text)
  assert.equal(await qrc.decodeQrc(''), '')
  assert.equal(await qrc.decodeQrc('invalid'), '')
})

if (desktop) {
  test('playlist and song append/move preserve sparse database positions', () => {
    const inserted = [], moved = []
    const helper = {
      queryAllUserList: () => [{ id: 'a', position: 8 }, { id: 'b', position: 21 }],
      insertUserLists: lists => inserted.push(...lists),
      queryMusicInfoByListId: id => [{ id: id + '-last', meta: '{}' }],
      getMusicInfoOrder: () => ({ order: 17 }),
      insertMusicInfoList: list => inserted.push(...list),
      moveMusicInfo: (_, __, list) => moved.push(...list),
    }
    const sdk = load('src/main/worker/dbService/modules/list/index.ts', {
      '@common/constants': { LIST_IDS: { DEFAULT: 'default', LOVE: 'love' } },
      '@common/utils/common': { arrPush: (target, values) => target.push(...values) },
      './dbHelper': helper,
    })
    sdk.getAllUserList()
    sdk.createUserLists(-1, [{ id: 'c' }])
    assert.equal(inserted[0].position, 22)
    sdk.musicsAdd('a', [{ id: 'new', meta: {} }], 'bottom')
    assert.equal(inserted[1].order, 18)
    sdk.musicsMove('b', 'a', [{ id: 'b-last', meta: {} }], 'bottom')
    assert.equal(moved[0].order, 18)
  })

  const stable = (tag = 'v2.12.6') => ({ tag_name: tag, body: 'fixture release', prerelease: false, draft: false })
  const preview = tag => ({ ...stable(tag), prerelease: true })
  const releaseApi = (release, releases = []) => load('src/renderer/utils/update.js', {
    './request': { httpGet: (url, _, callback) => {
      const convert = item => ({ version: item.tag_name.replace(/^v/, '').replace(/-test\.\d+$/, ''), releaseUrl: 'https://github.com/Tingfe/lx-music-desktop/releases/tag/' + item.tag_name })
      callback(null, { statusCode: 200 }, { schemaVersion: 1, stable: convert(release), preview: releases.length ? convert(releases[0]) : null })
    } },
    '@common/utils': { compareVer },
    './releaseManifest': load('src/renderer/utils/releaseManifest.js'),
  })
  test('release selection never replaces a newer stable with an older preview', async() => {
    const api = releaseApi(stable(), [preview('v2.12.5-test.1')])
    assert.equal((await api.getVersionInfo(true)).version, '2.12.6')
  })
  test('preview update uses fork download page and is not advertised as automatic installation', async() => {
    const api = releaseApi(stable('v2.12.3'), [preview('v2.12.7-test.3')])
    const result = await api.getVersionInfo(true)
    assert.equal(result.version, '2.12.7')
    assert.equal(result.manualDownload, true)
    assert.equal(result.releaseUrl, 'https://github.com/Tingfe/lx-music-desktop/releases/tag/v2.12.7-test.3')
    assert.equal((await api.getVersionInfo(false)).version, '2.12.3')
  })

  const flush = async() => { for (let i = 0; i < 30; i++) await Promise.resolve() }
  const updateHook = result => {
    const handlers = {}
    const info = { version: '2.12.3', newVersion: null, isLatest: true, reCheck: false, status: 'checking' }
    const ipc = { getIgnoreVersion: async() => null, getLastStartInfo: async() => '2.12.3', saveLastStartInfo() {} }
    for (const key of ['Available', 'NotAvailable', 'Error', 'Progress', 'Downloaded']) ipc['onUpdate' + key] = fn => { handlers[key] = fn; return () => {} }
    const hook = load('src/renderer/core/useApp/useUpdate.ts', {
      '@common/utils/vueTools': { nextTick: async fn => fn(), onBeforeUnmount() {}, watch() {} },
      '@renderer/utils/ipc': ipc, '@common/utils': { compareVer, isWin: false },
      '@renderer/store': { versionInfo: info, isShowChangeLog: { value: false } },
      '@renderer/utils/update': { getVersionInfo: async() => { if (result instanceof Error) throw result; return typeof result === 'function' ? result() : result } },
      '@renderer/plugins/Dialog': { dialog() {} },
      '@renderer/store/setting': { appSetting: { 'common.isEnablePreReleaseUpdate': true } },
    }, { window: { lx: { isProd: false }, i18n: { t: s => s } }, process: { versions: { app: '2.12.3' } }, localStorage: { getItem: () => null } }).default
    hook()
    return { handlers, info }
  }
  test('not-available native event cannot mask a newer release', async() => {
    const f = updateHook({ version: '2.12.6', desc: '', history: [] })
    f.handlers.NotAvailable()
    await flush()
    assert.equal(f.info.isLatest, false)
    assert.equal(f.info.isUnknown, false)
    assert.equal(f.info.showModal, true)
  })
  test('failed release check is unknown, not latest', async() => {
    const f = updateHook(new Error('offline'))
    f.handlers.NotAvailable()
    await flush()
    assert.equal(f.info.isLatest, false)
    assert.equal(f.info.isUnknown, true)
    assert.equal(f.info.status, 'error')
  })
  test('equal release version is correctly marked latest', async() => {
    const f = updateHook({ version: '2.12.3', desc: '', history: [] })
    f.handlers.NotAvailable()
    await flush()
    assert.equal(f.info.isLatest, true)
    assert.equal(f.info.isUnknown, false)
  })
  test('an older update response cannot overwrite a newer check', async() => {
    const pending = []
    const f = updateHook(() => new Promise(resolve => pending.push(resolve)))
    f.handlers.NotAvailable()
    f.handlers.NotAvailable()
    await flush()
    assert.equal(pending.length, 2)
    pending[1]({ version: '2.12.7', desc: '', history: [] })
    await flush()
    pending[0]({ version: '2.12.3', desc: '', history: [] })
    await flush()
    assert.equal(f.info.newVersion.version, '2.12.7')
    assert.equal(f.info.isLatest, false)
  })
  test('sync redirect refuses host, port, credentials and protocol changes', () => {
    const { isAllowedSyncRedirect } = load('src/main/modules/sync/client/redirect.ts')
    const original = 'wss://sync.example.invalid/socket?i=fixture&t=fixture'
    assert.equal(isAllowedSyncRedirect(original, 'wss://sync.example.invalid/new/socket'), true)
    for (const target of ['ws://sync.example.invalid/socket', 'wss://other.invalid/socket', 'wss://sync.example.invalid:444/socket', 'wss://user:pass@sync.example.invalid/socket', 'https://[invalid']) {
      assert.equal(isAllowedSyncRedirect(original, target), false)
    }
  })
  test('local filename special characters produce complete file URLs', () => {
    const { encodePath } = load('src/common/utils/common.ts', {}, { process })
    const filename = path.join(require('node:os').tmpdir(), 'fixture #1.mp3')
    const result = encodePath(filename)
    assert.equal(result, require('node:url').pathToFileURL(filename).href)
    assert.match(result, /^file:\/\//)
    assert.match(result, /fixture%20%231\.mp3$/)
  })
}
