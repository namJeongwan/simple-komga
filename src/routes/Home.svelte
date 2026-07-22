<script>
  import { Settings } from 'lucide-svelte'
  import { getSeries, searchBooks, getMe, thumbUrl } from '../lib/api.js'
  import Cover from '../components/Cover.svelte'
  let allSeries = $state([]); let error = $state(''); let isAdmin = $state(false)
  let query = $state(''); let resSeries = $state([]); let resBooks = $state([]); let searching = $state(false)
  const komgaUrl = `${location.protocol}//${location.hostname}:25600`
  let timer
  let active = $derived(query.trim().length > 0)

  $effect(() => { getSeries().then((s) => (allSeries = s)).catch((e) => (error = String(e))) })
  $effect(() => { getMe().then((m) => (isAdmin = (m.roles || []).includes('ADMIN'))).catch(() => {}) })

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
    <a class="admin" href={komgaUrl} target="_blank" rel="noopener" title="관리자 설정 (Komga)"><Settings size={20} /></a>
  {/if}
</header>

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
  .top { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 8px; }
  h1 { font-size: 20px; margin: 0; }
  .admin { font-size: 20px; text-decoration: none; line-height: 1; }
  .searchbar { padding: 0 16px 12px; }
  .searchbar input {
    width: 100%; padding: 11px 14px; background: #14141a; border: 1px solid #26262f;
    border-radius: 12px; color: var(--fg); font-size: 15px;
  }
  .searchbar input:focus { outline: none; border-color: var(--accent); }
  .sec { font-size: 14px; color: var(--muted); margin: 4px 16px 8px; }
  .hint { color: var(--muted); padding: 8px 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; padding: 0 16px 24px; }
  .meta { display: flex; justify-content: space-between; gap: 6px; padding-top: 6px; font-size: 13px; }
  .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .count { color: var(--muted); flex: 0 0 auto; } .err { color:#ff5a5a; padding:0 16px; }
</style>
