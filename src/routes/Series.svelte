<script>
  import { getBooks, getSeriesById, thumbUrl } from '../lib/api.js'
  import { percentRead, resumeLabelKey } from '../lib/progress.js'
  import { _, locale } from '../lib/i18n.js'
  import Cover from '../components/Cover.svelte'
  let { params } = $props()
  let books = $state([]); let series = $state(null); let error = $state('')

  function normalizedSeries(value) {
    return {
      ...value,
      metadata: {
        summary: '',
        publisher: '',
        status: '',
        language: '',
        readingDirection: '',
        ageRating: null,
        totalBookCount: null,
        genres: [],
        tags: [],
        alternateTitles: [],
        links: [],
        ...(value.metadata ?? {}),
      },
      authors: value.authors ?? [],
    }
  }

  $effect(() => {
    Promise.all([getBooks(params.id), getSeriesById(params.id)])
      .then(([b, value]) => { books = b; series = normalizedSeries(value) })
      .catch((e) => (error = String(e)))
  })

  const knownRoles = new Set(['writer', 'penciller', 'inker', 'colorist', 'letterer', 'cover', 'editor', 'translator', 'author'])
  const knownStatuses = new Set(['ended', 'ongoing', 'abandoned', 'hiatus'])

  function roleLabel(role) {
    return knownRoles.has(role) ? $_(`series.roles.${role}`) : role
  }

  function statusLabel(status) {
    const value = status?.toLowerCase()
    return knownStatuses.has(value) ? $_(`series.statuses.${value}`) : status
  }

  function languageLabel(language, activeLocale) {
    if (!language) return ''
    try { return new Intl.DisplayNames([activeLocale], { type: 'language' }).of(language) || language }
    catch { return language }
  }
</script>

<header class="top"><a href="#/" class="back" aria-label={$_('common.back')}>‹</a><h1>{series?.name || $_('series.fallbackTitle')}</h1></header>
{#if error}<p class="err">{error}</p>{/if}
{#if series}
  <section class="overview">
    <div class="series-cover"><Cover src={thumbUrl('series', series.id)} alt={series.name} /></div>
    <div class="facts">
      {#each series.authors as author}
        <div class="fact"><span>{roleLabel(author.role)}</span><strong>{author.name}</strong></div>
      {/each}
      {#if series.metadata.publisher}
        <div class="fact"><span>{$_('series.publisher')}</span><strong>{series.metadata.publisher}</strong></div>
      {/if}
      {#if series.metadata.status}
        <div class="fact"><span>{$_('series.status')}</span><strong>{statusLabel(series.metadata.status)}</strong></div>
      {/if}
      {#if series.metadata.language}
        <div class="fact"><span>{$_('series.language')}</span><strong>{languageLabel(series.metadata.language, $locale)}</strong></div>
      {/if}
      {#if series.metadata.ageRating !== null}
        <div class="fact"><span>{$_('series.ageRating')}</span><strong>{$_('series.ageRatingValue', { values: { age: series.metadata.ageRating } })}</strong></div>
      {/if}
      {#if series.metadata.totalBookCount !== null}
        <div class="fact"><span>{$_('series.totalBookCount')}</span><strong>{$_('series.totalBookCountValue', { values: { count: series.metadata.totalBookCount } })}</strong></div>
      {/if}
    </div>
  </section>

  {#if series.metadata.summary}
    <section class="metadata-section">
      <h2>{$_('series.summary')}</h2>
      <p class="summary">{series.metadata.summary}</p>
    </section>
  {/if}

  {#if series.metadata.genres.length}
    <section class="metadata-section">
      <h2>{$_('series.genres')}</h2>
      <div class="chips">{#each series.metadata.genres as genre}<span>{genre}</span>{/each}</div>
    </section>
  {/if}

  {#if series.metadata.tags.length}
    <section class="metadata-section">
      <h2>{$_('series.tags')}</h2>
      <div class="chips">{#each series.metadata.tags as tag}<span>{tag}</span>{/each}</div>
    </section>
  {/if}

  {#if series.metadata.alternateTitles.length}
    <section class="metadata-section">
      <h2>{$_('series.alternateTitles')}</h2>
      <div class="alternate-titles">
        {#each series.metadata.alternateTitles as alternate}
          <span>{alternate.label ? `${alternate.label}: ` : ''}{alternate.title}</span>
        {/each}
      </div>
    </section>
  {/if}

  {#if series.metadata.links.length}
    <section class="metadata-section">
      <h2>{$_('series.links')}</h2>
      <div class="links">
        {#each series.metadata.links as link}
          <a href={link.url} target="_blank" rel="noreferrer">{link.label || link.url}</a>
        {/each}
      </div>
    </section>
  {/if}
{/if}
<h2 class="content-title">{$_('series.content', { values: { count: books.length } })}</h2>
<ul class="list">
  {#each books as b (b.id)}
    <li>
      <a class="row" href={`#/book/${b.id}`}>
        <div class="thumb"><Cover src={thumbUrl('book', b.id)} alt={b.name} /></div>
        <div class="info">
          <span class="name">{b.name}</span>
          <span class="badge" class:done={b.readProgress?.completed}>{$_(resumeLabelKey(b.readProgress))}</span>
          <div class="bar"><i style={`width:${percentRead(b.readProgress, b.pagesCount)}%`}></i></div>
        </div>
      </a>
    </li>
  {/each}
</ul>

<style>
  .top { display:flex; width:100%; min-width:0; max-width:100%; align-items:center; gap:10px; padding:max(12px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 12px max(16px, env(safe-area-inset-left, 0px)); }
  .back{font-size:24px; flex:0 0 auto;}
  h1{min-width:0; margin:0; overflow:hidden; font-size:18px; text-overflow:ellipsis; white-space:nowrap;}
  .overview { display:flex; width:100%; min-width:0; max-width:100%; gap:18px; padding:8px max(16px, env(safe-area-inset-right, 0px)) 18px max(16px, env(safe-area-inset-left, 0px)); }
  .series-cover { width:112px; flex:0 0 112px; }
  .facts { display:flex; flex-direction:column; justify-content:center; gap:8px; min-width:0; }
  .fact { display:grid; grid-template-columns:minmax(58px, auto) minmax(0, 1fr); align-items:baseline; gap:10px; font-size:13px; }
  .fact span { color:var(--muted); }
  .fact strong { font-weight:500; overflow-wrap:anywhere; }
  .metadata-section { width:100%; min-width:0; max-width:100%; padding:0 max(16px, env(safe-area-inset-right, 0px)) 18px max(16px, env(safe-area-inset-left, 0px)); }
  .metadata-section h2, .content-title { margin:0 0 8px; font-size:14px; }
  .summary { margin:0; color:#c8c8ce; font-size:14px; line-height:1.65; white-space:pre-line; overflow-wrap:anywhere; }
  .chips { display:flex; flex-wrap:wrap; gap:6px; }
  .chips span { padding:5px 9px; border-radius:999px; background:#202027; color:#d7d7dc; font-size:12px; }
  .alternate-titles, .links { display:flex; flex-direction:column; align-items:flex-start; gap:6px; color:#c8c8ce; font-size:13px; }
  .links a { color:var(--accent); overflow-wrap:anywhere; }
  .content-title { width:100%; min-width:0; max-width:100%; padding:4px max(16px, env(safe-area-inset-right, 0px)) 0 max(16px, env(safe-area-inset-left, 0px)); }
  .list { width:100%; min-width:0; max-width:100%; list-style:none; margin:0; padding:0 max(8px, env(safe-area-inset-right, 0px)) max(24px, env(safe-area-inset-bottom, 0px)) max(8px, env(safe-area-inset-left, 0px)); }
  .row { display:flex; width:100%; min-width:0; max-width:100%; gap:12px; padding:10px 8px; align-items:center; }
  .thumb { width:52px; flex:0 0 52px; }
  .info { display:flex; min-width:0; flex:1; flex-direction:column; gap:4px; }
  .info .name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .badge { font-size:12px; color:var(--muted); } .badge.done { color: var(--accent); }
  .bar { height:3px; background:#26262e; border-radius:2px; overflow:hidden; }
  .bar i { display:block; height:100%; background:var(--accent); } .err{color:#ff5a5a;padding:0 16px;}
  @media (max-width: 420px) {
    .overview { gap:14px; }
    .series-cover { width:88px; flex-basis:88px; }
    .fact { grid-template-columns:52px minmax(0, 1fr); gap:8px; font-size:12px; }
  }
</style>
