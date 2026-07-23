<script>
  import { onDestroy } from 'svelte'
  import { RefreshCw, Settings } from 'lucide-svelte'
  import { getSeries, searchBooks, getMe, getLastSync, syncLibraries, thumbUrl } from '../lib/api.js'
  import Cover from '../components/Cover.svelte'
  let allSeries = $state([]); let error = $state(''); let isAdmin = $state(false)
  let query = $state(''); let resSeries = $state([]); let resBooks = $state([]); let searching = $state(false)
  let syncing = $state(false); let lastSync = $state(null)
  const komgaUrl = '/komga/'
  let timer
  let refreshTimers = []
  let active = $derived(query.trim().length > 0)

  async function loadSeries() {
    try { allSeries = await getSeries() } catch (e) { error = String(e) }
  }

  $effect(() => { loadSeries() })
  $effect(() => {
    getMe().then(async (m) => {
      const admin = (m.roles || []).includes('ADMIN')
      if (admin) {
        try { lastSync = await getLastSync() } catch {}
      }
      isAdmin = admin
    }).catch(() => {})
  })

  function formatSyncTime(value) {
    if (!value) return '없음'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '없음'
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(date)
  }

  async function syncNow() {
    if (syncing) return
    syncing = true
    error = ''
    try {
      lastSync = await syncLibraries()
      refreshTimers.forEach(clearTimeout)
      refreshTimers = [3000, 10000, 30000].map((delay) => setTimeout(loadSeries, delay))
    } catch (e) {
      error = '동기화 실패: ' + String(e)
    } finally {
      syncing = false
    }
  }

  onDestroy(() => {
    clearTimeout(timer)
    refreshTimers.forEach(clearTimeout)
  })

  function onInput(e) {
    query = e.target.value
    clearTimeout(timer)
    const q = query.trim()
    if (!q) { resSeries = []; resBooks = []; searching = false; return }
    searching = true
    timer = setTimeout(async () => {
      try {
        const [s, b] = await Promise.all([getSeries(q), searchBooks(q)])
        resSeries = s; resBooks = b
      } catch (err) { error = String(err) }
      searching = false
    }, 300)
  }
</script>

<header class="top">
  <h1>내 만화</h1>
  {#if isAdmin}
    <div class="actions">
      <button class="icon-button" onclick={syncNow} disabled={syncing} aria-label="라이브러리 동기화" title="라이브러리 동기화">
        <span class:spinning={syncing}><RefreshCw size={19} /></span>
      </button>
      <a class="icon-button" href={komgaUrl} title="관리자 설정 (Komga)"><Settings size={20} /></a>
    </div>
  {/if}
</header>
{#if isAdmin}
  <p class="sync-time">최근 수동 동기화: {formatSyncTime(lastSync)}</p>
{/if}

<div class="searchbar">
  <input type="search" placeholder="제목·화 검색" value={query} oninput={onInput} aria-label="검색" />
</div>

{#if error}<p class="err">불러오기 실패: {error}</p>{/if}

{#if active}
  {#if searching}<p class="hint">검색 중…</p>{/if}
  {#if resSeries.length}
    <h2 class="sec">시리즈</h2>
    <div class="grid">
      {#each resSeries as s (s.id)}
        <a class="card" href={`#/series/${s.id}`}>
          <Cover src={thumbUrl('series', s.id)} alt={s.name} />
          <div class="meta"><span class="name">{s.name}</span><span class="count">{s.booksCount}권</span></div>
        </a>
      {/each}
    </div>
  {/if}
  {#if resBooks.length}
    <h2 class="sec">화</h2>
    <div class="grid">
      {#each resBooks as b (b.id)}
        <a class="card" href={`#/book/${b.id}`}>
          <Cover src={thumbUrl('book', b.id)} alt={b.name} />
          <div class="meta"><span class="name">{b.name}</span><span class="count">{b.seriesTitle}</span></div>
        </a>
      {/each}
    </div>
  {/if}
  {#if !searching && !resSeries.length && !resBooks.length}
    <p class="hint">결과 없음</p>
  {/if}
{:else}
  <div class="grid">
    {#each allSeries as s (s.id)}
      <a class="card" href={`#/series/${s.id}`}>
        <Cover src={thumbUrl('series', s.id)} alt={s.name} />
        <div class="meta"><span class="name">{s.name}</span><span class="count">{s.booksCount}권</span></div>
      </a>
    {/each}
  </div>
{/if}

<style>
  .top {
    display: flex; align-items: center; justify-content: space-between;
    padding: max(16px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 8px max(16px, env(safe-area-inset-left, 0px));
  }
  h1 { font-size: 20px; margin: 0; }
  .actions { display: flex; align-items: center; gap: 4px; }
  .icon-button {
    display: flex; width: 40px; height: 40px; align-items: center; justify-content: center;
    border: 0; border-radius: 10px; background: none; color: var(--fg); text-decoration: none; cursor: pointer;
  }
  .icon-button:disabled { opacity: .45; cursor: default; }
  .spinning { animation: spin .8s linear infinite; }
  .sync-time {
    margin: -4px 0 8px; padding: 0 max(16px, env(safe-area-inset-right, 0px)) 0 max(16px, env(safe-area-inset-left, 0px));
    color: var(--muted); font-size: 11px; text-align: right;
  }
  .searchbar { padding: 0 max(16px, env(safe-area-inset-right, 0px)) 12px max(16px, env(safe-area-inset-left, 0px)); }
  .searchbar input {
    width: 100%; min-width: 0; padding: 11px 14px; background: #14141a; border: 1px solid #26262f;
    border-radius: 12px; color: var(--fg); font-size: 15px;
  }
  .searchbar input:focus { outline: none; border-color: var(--accent); }
  .sec { font-size: 14px; color: var(--muted); margin: 4px 16px 8px; }
  .hint { color: var(--muted); padding: 8px 16px; }
  .grid {
    display: grid; width: 100%; min-width: 0;
    grid-template-columns: repeat(auto-fill, minmax(min(120px, 100%), 1fr)); gap: 12px;
    padding: 0 max(16px, env(safe-area-inset-right, 0px)) max(24px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
  }
  .card { min-width: 0; max-width: 100%; overflow: hidden; }
  .meta { display: flex; min-width: 0; justify-content: space-between; gap: 6px; padding-top: 6px; font-size: 13px; }
  .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .count { color: var(--muted); flex: 0 0 auto; } .err { color:#ff5a5a; padding:0 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
