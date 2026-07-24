<script>
  import { onDestroy } from 'svelte'
  import { Languages, LogOut, RefreshCw, Settings, SlidersHorizontal } from 'lucide-svelte'
  import {
    getSeries, getFilterOptions, searchBooks, getMe, getLastSync, logout, syncLibraries, saveLocalePreference, thumbUrl,
  } from '../lib/api.js'
  import { _, applyLocale, locale, saveKomgaStoredLocale } from '../lib/i18n.js'
  import Cover from '../components/Cover.svelte'
  import FilterSheet from '../components/FilterSheet.svelte'

  const blankFilters = () => ({ libraryIds: [], genres: [], tags: [], statuses: [], readStatuses: [] })
  let allSeries = $state([]); let error = $state(''); let isAdmin = $state(false)
  let query = $state(''); let resSeries = $state([]); let resBooks = $state([]); let searching = $state(false)
  let filters = $state(blankFilters())
  let filterOptions = $state({ libraries: [], genres: [], tags: [] })
  let filterOpen = $state(false)
  let syncing = $state(false); let lastSync = $state(null)
  const komgaUrl = '/komga/'
  let timer
  let refreshTimers = []
  let searchSerial = 0
  let filterCount = $derived(Object.values(filters).reduce((sum, values) => sum + values.length, 0))
  let active = $derived(query.trim().length > 0 || filterCount > 0)

  async function loadSeries() {
    try { allSeries = await getSeries() } catch (e) { error = String(e) }
  }

  $effect(() => { loadSeries() })
  $effect(() => {
    getFilterOptions().then((options) => (filterOptions = options)).catch(() => {})
  })
  $effect(() => {
    getMe().then(async (m) => {
      const admin = (m.roles || []).includes('ADMIN')
      if (admin) {
        try { lastSync = await getLastSync() } catch {}
      }
      isAdmin = admin
    }).catch(() => {})
  })

  function formatSyncTime(value, activeLocale) {
    if (!value) return $_('common.none')
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return $_('common.none')
    return new Intl.DateTimeFormat(activeLocale, {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(date)
  }

  function toggleLanguage() {
    const next = $locale === 'ko' ? 'en' : 'ko'
    applyLocale(next)
    saveKomgaStoredLocale(next)
    saveLocalePreference(next).catch(() => {})
  }

  async function signOut() {
    error = ''
    try {
      await logout()
    } catch (e) {
      error = $_('home.logoutFailed', { values: { error: String(e) } })
    }
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
      error = $_('home.syncFailed', { values: { error: String(e) } })
    } finally {
      syncing = false
    }
  }

  onDestroy(() => {
    clearTimeout(timer)
    refreshTimers.forEach(clearTimeout)
  })

  async function runSearch(term, selectedFilters) {
    const q = term.trim()
    const selectedCount = Object.values(selectedFilters).reduce((sum, values) => sum + values.length, 0)
    if (!q && !selectedCount) {
      searchSerial += 1
      resSeries = []
      resBooks = []
      searching = false
      return
    }
    const serial = ++searchSerial
    searching = true
    error = ''
    try {
      const [series, books] = await Promise.all([
        getSeries(q, selectedFilters),
        q && !selectedCount ? searchBooks(q) : Promise.resolve([]),
      ])
      if (serial !== searchSerial) return
      resSeries = series
      resBooks = books
    } catch (err) {
      if (serial === searchSerial) error = String(err)
    } finally {
      if (serial === searchSerial) searching = false
    }
  }

  function onInput(e) {
    query = e.target.value
    clearTimeout(timer)
    timer = setTimeout(() => runSearch(query, filters), 300)
  }

  function applyFilters(value) {
    filters = {
      libraryIds: [...value.libraryIds],
      genres: [...value.genres],
      tags: [...value.tags],
      statuses: [...value.statuses],
      readStatuses: [...value.readStatuses],
    }
    filterOpen = false
    clearTimeout(timer)
    runSearch(query, filters)
  }
</script>

<header class="top">
  <h1>{$_('home.title')}</h1>
  <div class="actions">
    {#if isAdmin}
      <button class="icon-button" onclick={syncNow} disabled={syncing} aria-label={$_('home.sync')} title={$_('home.sync')}>
        <span class:spinning={syncing}><RefreshCw size={19} /></span>
      </button>
    {/if}
    <button class="icon-button" onclick={toggleLanguage} aria-label={$_('common.language')} title={$_('common.language')}>
      <Languages size={19} />
    </button>
    <button class="icon-button" onclick={signOut} aria-label={$_('common.logout')} title={$_('common.logout')}>
      <LogOut size={19} />
    </button>
    {#if isAdmin}
      <a class="icon-button" href={komgaUrl} title={$_('home.dashboard')}><Settings size={20} /></a>
    {/if}
  </div>
</header>
{#if isAdmin}
  <p class="sync-time">{$_('home.lastSync', { values: { time: formatSyncTime(lastSync, $locale) } })}</p>
{/if}

<div class="searchbar">
  <input type="search" placeholder={$_('home.searchPlaceholder')} value={query} oninput={onInput} aria-label={$_('home.search')} />
  <button
    class="filter-button"
    class:active={filterCount > 0}
    type="button"
    aria-label={$_('home.filters.open')}
    aria-expanded={filterOpen}
    onclick={() => (filterOpen = true)}
  >
    <SlidersHorizontal size={19} />
    {#if filterCount}<span class="filter-count">{filterCount}</span>{/if}
  </button>
</div>

{#if error}<p class="err">{$_('home.loadFailed', { values: { error } })}</p>{/if}

{#if active}
  {#if searching}<p class="hint">{$_('home.searching')}</p>{/if}
  {#if resSeries.length}
    <h2 class="sec">{$_('home.series')}</h2>
    <div class="grid">
      {#each resSeries as s (s.id)}
        <a class="card" href={`#/series/${s.id}`}>
          <Cover src={thumbUrl('series', s.id)} alt={s.name} />
          <div class="meta"><span class="name">{s.name}</span><span class="count">{$_('home.items', { values: { count: s.booksCount } })}</span></div>
        </a>
      {/each}
    </div>
  {/if}
  {#if resBooks.length}
    <h2 class="sec">{$_('home.chapters')}</h2>
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
    <p class="hint">{$_('home.noResults')}</p>
  {/if}
{:else}
  <div class="grid">
    {#each allSeries as s (s.id)}
      <a class="card" href={`#/series/${s.id}`}>
        <Cover src={thumbUrl('series', s.id)} alt={s.name} />
        <div class="meta"><span class="name">{s.name}</span><span class="count">{$_('home.items', { values: { count: s.booksCount } })}</span></div>
      </a>
    {/each}
  </div>
{/if}

{#if filterOpen}
  <FilterSheet
    options={filterOptions}
    value={filters}
    onapply={applyFilters}
    onclose={() => (filterOpen = false)}
  />
{/if}

<style>
  .top {
    display: flex; align-items: center; justify-content: space-between;
    padding: max(16px, calc(env(safe-area-inset-top, 0px) + 8px)) max(16px, env(safe-area-inset-right, 0px)) 8px max(16px, env(safe-area-inset-left, 0px));
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
  .searchbar {
    display: grid; grid-template-columns: minmax(0, 1fr) 44px; gap: 8px;
    padding: 0 max(16px, env(safe-area-inset-right, 0px)) 12px max(16px, env(safe-area-inset-left, 0px));
  }
  .searchbar input {
    width: 100%; min-width: 0; padding: 11px 14px; background: #14141a; border: 1px solid #26262f;
    border-radius: 12px; color: var(--fg); font-size: 16px;
  }
  .searchbar input:focus { outline: none; border-color: var(--accent); }
  .filter-button {
    position: relative; display: grid; width: 44px; height: 44px; padding: 0; place-items: center;
    border: 1px solid #26262f; border-radius: 12px; background: #14141a; color: var(--fg);
  }
  .filter-button.active { border-color: var(--accent); color: var(--accent); }
  .filter-count {
    position: absolute; top: -6px; right: -6px; display: grid; min-width: 20px; height: 20px; padding: 0 5px; place-items: center;
    border: 2px solid var(--bg); border-radius: 999px; background: var(--accent); color: #04140a; font-size: 10px; font-weight: 800;
  }
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
