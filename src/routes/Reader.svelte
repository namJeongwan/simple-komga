<script>
  import { getBook, getPages, pageUrl, saveProgress } from '../lib/api.js'
  import { getAuthHeader } from '../lib/auth.js'
  import { resumePage } from '../lib/progress.js'
  let { params } = $props()
  let pages = $state([]); let mode = $state('scroll'); let fit = $state('width')
  let pagesCount = $state(0); let current = $state(1); let idx = $state(0)
  let saveTimer

  function authedSrc(node, number) {
    let url = ''
    fetch(pageUrl(params.id, number), { headers: { Authorization: getAuthHeader() } })
      .then((r) => r.blob()).then((b) => { url = URL.createObjectURL(b); node.src = url })
    return { destroy() { if (url) URL.revokeObjectURL(url) } }
  }
  function persist(page) {
    current = page
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveProgress(params.id, page, page >= pagesCount), 800)
  }
  $effect(() => {
    Promise.all([getBook(params.id), getPages(params.id)]).then(([book, pg]) => {
      pages = pg; pagesCount = book.pagesCount || pg.length
      current = resumePage(book.readProgress, pagesCount); idx = current - 1
    })
  })
  // scroll mode: IntersectionObserver marks the visible page
  function trackScroll(node, number) {
    const ob = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) persist(number) }), { threshold: 0.5 })
    ob.observe(node); return { destroy() { ob.disconnect() } }
  }
  function paged(next) {
    const order = mode === 'rtl' ? -1 : 1
    idx = Math.min(Math.max(idx + next * order, 0), pages.length - 1); persist(idx + 1)
  }
</script>

<div class="bar">
  <a href={`#/series/`} onclick={() => history.back()} class="back">‹</a>
  <div class="modes">
    <button class:on={mode==='scroll'} onclick={() => mode='scroll'}>세로</button>
    <button class:on={mode==='ltr'} onclick={() => mode='ltr'}>좌→우</button>
    <button class:on={mode==='rtl'} onclick={() => mode='rtl'}>우→좌</button>
    <button onclick={() => fit = fit==='width'?'height':'width'}>맞춤:{fit==='width'?'너비':'높이'}</button>
  </div>
  <span class="pageno">{current}/{pagesCount}</span>
</div>

{#if mode === 'scroll'}
  <div class="scroll" class:fit-h={fit==='height'}>
    {#each pages as p (p.number)}
      <img use:authedSrc={p.number} use:trackScroll={p.number} alt={`p${p.number}`} />
    {/each}
  </div>
{:else}
  <div class="paged" onclick={(e) => paged(e.clientX > innerWidth/2 ? 1 : -1)}>
    {#key idx}<img use:authedSrc={pages[idx]?.number} class:fit-h={fit==='height'} alt={`p${idx+1}`} />{/key}
  </div>
{/if}

<style>
  .bar { position:sticky; top:0; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 12px; background:rgba(14,14,16,.9); backdrop-filter:blur(6px); z-index:10; }
  .back { font-size:22px; } .modes { display:flex; gap:6px; } .modes button{ background:#1a1a1f;border:1px solid #2a2a33;color:var(--fg);border-radius:6px;padding:4px 8px;font-size:12px;} .modes .on{ background:var(--accent); color:#000; border-color:var(--accent);} .pageno{color:var(--muted);font-size:12px;}
  .scroll img { display:block; width:100%; }
  .scroll.fit-h img { width:auto; height:100vh; margin:0 auto; }
  .paged { min-height: calc(100vh - 44px); display:flex; align-items:center; justify-content:center; }
  .paged img { max-width:100%; } .paged img.fit-h { max-height: calc(100vh - 44px); }
</style>
