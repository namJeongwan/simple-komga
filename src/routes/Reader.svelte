<script>
  import { fly } from 'svelte/transition'
  import { ArrowLeft, Settings } from 'lucide-svelte'
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
  let controls = $state(false)  // corner chrome (back + gear) visible
  let settings = $state(false)  // settings panel (opened via gear) visible
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
  function toggleChrome() { controls = !controls; if (!controls) settings = false }

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
      else toggleChrome()
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

<!-- corner chrome: light tap reveals back (top-left) + gear (top-right) -->
{#if controls}
  <button class="corner tl" transition:fly={{ y: -10, duration: 120 }} onclick={() => history.back()} aria-label="뒤로"><ArrowLeft size={22} /></button>
  <button class="corner tr" transition:fly={{ y: -10, duration: 120 }} onclick={() => (settings = !settings)} aria-label="설정"><Settings size={20} /></button>
  <div class="pageind" transition:fly={{ y: 10, duration: 120 }}>{current} / {pagesCount}</div>

  {#if settings}
    <div class="settings-panel" transition:fly={{ y: -10, duration: 120 }}>
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
          <button class:on={dir === 'rtl'} onclick={() => setDir('rtl')}>우 → 좌 (일본만화)</button>
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
  {/if}
{/if}

{#if isScroll}
  <div class="scroll" class:fit-h={fit === 'height'} onclick={toggleChrome}>
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
  .corner {
    position: fixed; top: 14px; z-index: 21; width: 42px; height: 42px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(20,20,26,.82); backdrop-filter: blur(8px);
    border: 1px solid #2a2a33; border-radius: 50%; color: var(--fg);
    font-size: 22px; line-height: 1; cursor: pointer;
  }
  .corner.tl { left: 14px; }
  .corner.tr { right: 14px; font-size: 19px; }
  .pageind {
    position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 21;
    background: rgba(20,20,26,.82); backdrop-filter: blur(8px); border: 1px solid #2a2a33;
    border-radius: 999px; padding: 5px 12px; font-size: 12px; color: var(--muted);
  }
  .settings-panel {
    position: fixed; top: 64px; right: 14px; z-index: 21; width: min(88vw, 360px);
    background: rgba(20,20,26,.96); backdrop-filter: blur(10px);
    border: 1px solid #2a2a33; border-radius: 14px; padding: 6px 14px 14px;
    box-shadow: 0 12px 40px rgba(0,0,0,.5);
  }
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
