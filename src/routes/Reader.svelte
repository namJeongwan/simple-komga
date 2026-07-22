<script>
  import { fly } from 'svelte/transition'
  import { getBook, getPages, pageUrl, saveProgress } from '../lib/api.js'
  import { getAuthHeader } from '../lib/auth.js'
  import { resumePage } from '../lib/progress.js'

  let { params } = $props()

  // ── persisted reader settings ──
  const load = (k, d) => { try { return localStorage.getItem('reader-' + k) ?? d } catch { return d } }
  let mode = $state(load('mode', 'scroll'))   // scroll | paged | split | split-scroll
  let dir = $state(load('dir', 'ltr'))        // ltr | rtl
  let fit = $state(load('fit', 'width'))      // width | height
  $effect(() => { try { localStorage.setItem('reader-mode', mode) } catch {} })
  $effect(() => { try { localStorage.setItem('reader-dir', dir) } catch {} })
  $effect(() => { try { localStorage.setItem('reader-fit', fit) } catch {} })

  let pages = $state([])        // [{number}]
  let pagesCount = $state(0)
  let current = $state(1)       // current page number (for progress)
  let idx = $state(0)           // index into `views` (paged / split modes)
  let controls = $state(false)  // toolbar/settings overlay visible
  let navDir = $state(1)        // last navigation direction, for slide animation
  let saveTimer

  const isPaged = $derived(mode === 'paged' || mode === 'split')
  const isScroll = $derived(mode === 'scroll' || mode === 'split-scroll')
  const isSplit = $derived(mode === 'split' || mode === 'split-scroll')

  // views: full pages, or two halves per page ordered by direction
  const views = $derived(buildViews(pages, isSplit, dir))
  function buildViews(pgs, split, d) {
    if (!split) return pgs.map((p) => ({ page: p.number, half: null }))
    const order = d === 'rtl' ? ['R', 'L'] : ['L', 'R']
    return pgs.flatMap((p) => order.map((h) => ({ page: p.number, half: h })))
  }

  function persist(page) {
    current = page
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveProgress(params.id, page, page >= pagesCount), 800)
  }

  $effect(() => {
    Promise.all([getBook(params.id), getPages(params.id)]).then(([book, pg]) => {
      pages = pg
      pagesCount = book.pagesCount || pg.length
      const start = resumePage(book.readProgress, pagesCount)
      current = start
      const i = views.findIndex((v) => v.page === start)
      idx = i >= 0 ? i : 0
    })
  })

  function realign() {
    const i = views.findIndex((v) => v.page === current)
    idx = i >= 0 ? i : 0
  }
  function setMode(m) { mode = m; realign() }
  function setDir(d) { dir = d; realign() }

  function authedSrc(node, number) {
    let url = ''
    fetch(pageUrl(params.id, number), { headers: { Authorization: getAuthHeader() } })
      .then((r) => r.blob())
      .then((b) => { url = URL.createObjectURL(b); node.src = url })
    return { destroy() { if (url) URL.revokeObjectURL(url) } }
  }

  function go(delta) {
    const ni = idx + delta
    if (ni < 0 || ni >= views.length) return
    navDir = delta
    idx = ni
    persist(views[idx].page)
  }

  // pointer: distinguish swipe / tap-zones
  let sx = 0, sy = 0
  function pdown(e) { sx = e.clientX; sy = e.clientY }
  function pup(e) {
    const dx = e.clientX - sx, dy = e.clientY - sy
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { go(dx < 0 ? 1 : -1); return }
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const w = window.innerWidth
      if (e.clientX < w * 0.33) go(dir === 'rtl' ? 1 : -1)
      else if (e.clientX > w * 0.67) go(dir === 'rtl' ? -1 : 1)
      else controls = !controls
    }
  }

  function trackScroll(node, page) {
    const ob = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) persist(page) }),
      { threshold: 0.5 },
    )
    ob.observe(node)
    return { destroy() { ob.disconnect() } }
  }
</script>

<!-- controls overlay (hidden until tapped) -->
{#if controls}
  <div class="overlay" transition:fly={{ y: -12, duration: 150 }}>
    <div class="bar">
      <button class="back" onclick={() => history.back()} aria-label="뒤로">‹</button>
      <span class="pageno">{current} / {pagesCount}</span>
      <span class="sp"></span>
    </div>
    <div class="settings">
      <div class="row">
        <span class="lbl">모드</span>
        <div class="opts">
          <button class:on={mode === 'scroll'} onclick={() => setMode('scroll')}>세로</button>
          <button class:on={mode === 'paged'} onclick={() => setMode('paged')}>페이지</button>
          <button class:on={mode === 'split'} onclick={() => setMode('split')}>반쪽</button>
          <button class:on={mode === 'split-scroll'} onclick={() => setMode('split-scroll')}>반쪽웹툰</button>
        </div>
      </div>
      <div class="row">
        <span class="lbl">방향</span>
        <div class="opts">
          <button class:on={dir === 'ltr'} onclick={() => setDir('ltr')}>좌 → 우</button>
          <button class:on={dir === 'rtl'} onclick={() => setDir('rtl')}>우 → 좌</button>
        </div>
      </div>
      <div class="row">
        <span class="lbl">맞춤</span>
        <div class="opts">
          <button class:on={fit === 'width'} onclick={() => (fit = 'width')}>너비</button>
          <button class:on={fit === 'height'} onclick={() => (fit = 'height')}>높이</button>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if isScroll}
  <div class="scroll" class:fit-h={fit === 'height'} onclick={() => (controls = !controls)}>
    {#each views as v (v.page + (v.half ?? ''))}
      {#if v.half}
        <div class="half {v.half === 'L' ? 'left' : 'right'}">
          <img use:authedSrc={v.page} use:trackScroll={v.page} alt={`p${v.page}`} />
        </div>
      {:else}
        <img use:authedSrc={v.page} use:trackScroll={v.page} alt={`p${v.page}`} />
      {/if}
    {/each}
  </div>
{:else}
  <div class="stage" onpointerdown={pdown} onpointerup={pup}>
    {#key idx}
      {@const v = views[idx]}
      {#if v}
        <div class="slide" class:fit-h={fit === 'height'} in:fly={{ x: navDir * 40, duration: 150 }}>
          {#if v.half}
            <div class="half {v.half === 'L' ? 'left' : 'right'}">
              <img use:authedSrc={v.page} alt={`p${v.page}`} />
            </div>
          {:else}
            <img use:authedSrc={v.page} alt={`p${v.page}`} />
          {/if}
        </div>
      {/if}
    {/key}
  </div>
{/if}

<style>
  .overlay { position: fixed; inset: 0 0 auto 0; z-index: 20; }
  .bar {
    display: flex; align-items: center; gap: 8px; padding: 10px 14px;
    background: rgba(14,14,16,.94); backdrop-filter: blur(8px); border-bottom: 1px solid #24242d;
  }
  .back { background: none; border: 0; color: var(--fg); font-size: 24px; line-height: 1; }
  .pageno { color: var(--muted); font-size: 13px; }
  .sp { flex: 1; }
  .settings { background: rgba(14,14,16,.94); backdrop-filter: blur(8px); padding: 8px 14px 14px; border-bottom: 1px solid #24242d; }
  .row { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
  .lbl { width: 40px; font-size: 13px; color: var(--muted); flex: 0 0 auto; }
  .opts { display: flex; flex-wrap: wrap; gap: 6px; }
  .opts button {
    background: #1a1a1f; border: 1px solid #2a2a33; color: var(--fg);
    border-radius: 8px; padding: 6px 12px; font-size: 13px;
  }
  .opts .on { background: var(--accent); color: #05130a; border-color: var(--accent); font-weight: 700; }

  .scroll { min-height: 100dvh; }
  .scroll img { display: block; width: 100%; }
  .scroll.fit-h img { width: auto; height: 100dvh; margin: 0 auto; }

  .stage { min-height: 100dvh; display: flex; align-items: center; justify-content: center; overflow: hidden; touch-action: pan-y; }
  .slide { width: 100%; display: flex; align-items: center; justify-content: center; }
  .slide > img { max-width: 100%; max-height: 100dvh; display: block; }
  .slide.fit-h > img { max-height: 100dvh; width: auto; }

  /* half-page: image scaled to 2x container width; show left or right portion */
  .half { width: 100%; overflow: hidden; }
  .half img { display: block; width: 200%; }
  .half.right img { transform: translateX(-50%); }
</style>
