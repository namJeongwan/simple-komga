<script>
  import { fly } from 'svelte/transition'
  import { push } from 'svelte-spa-router'
  import { ArrowLeft, Settings, ChevronLeft, ChevronRight, List } from 'lucide-svelte'
  import { getBook, getBooks, getPages, pageUrl, saveProgress } from '../lib/api.js'
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

  let pages = $state([])
  let pagesCount = $state(0)
  let current = $state(1)       // current page number (for progress)
  let idx = $state(0)           // index into `views` (paged / split modes)
  let controls = $state(false)  // top/bottom chrome visible
  let settings = $state(false)  // settings panel (opened via gear) visible
  let navDir = $state(1)        // last navigation direction, for slide animation
  let book = $state(null)       // { name, seriesId, ... }
  let prevId = $state(null), nextId = $state(null)
  let saveTimer

  const isScroll = $derived(mode === 'scroll' || mode === 'split-scroll')
  const isSplit = $derived(mode === 'split' || mode === 'split-scroll')

  const views = $derived(buildViews(pages, isSplit, dir))
  function buildViews(pgs, split, d) {
    if (!split) return pgs.map((p) => ({ page: p.number, half: null }))
    const order = d === 'rtl' ? ['R', 'L'] : ['L', 'R']
    // landscape image (w>h) = 2-page spread → split into halves by direction;
    // portrait image = single page → keep whole.
    return pgs.flatMap((p) => {
      const spread = (p.width || 0) > (p.height || 1)
      return spread ? order.map((h) => ({ page: p.number, half: h })) : [{ page: p.number, half: null }]
    })
  }

  function persist(page) {
    current = page
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveProgress(params.id, page, page >= pagesCount), 800)
  }

  $effect(() => {
    const id = params.id
    Promise.all([getBook(id), getPages(id)]).then(([b, pg]) => {
      book = b
      pages = pg
      pagesCount = b.pagesCount || pg.length
      const start = resumePage(b.readProgress, pagesCount)
      current = start
      const i = views.findIndex((v) => v.page === start)
      idx = i >= 0 ? i : 0
      if (b.seriesId) {
        getBooks(b.seriesId).then((list) => {
          const j = list.findIndex((x) => x.id === id)
          prevId = j > 0 ? list[j - 1].id : null
          nextId = j >= 0 && j < list.length - 1 ? list[j + 1].id : null
        }).catch(() => {})
      }
    })
  })

  function realign() {
    const i = views.findIndex((v) => v.page === current)
    idx = i >= 0 ? i : 0
  }
  function setMode(m) { mode = m; realign() }
  function setDir(d) { dir = d; realign() }
  function toggleChrome() { controls = !controls; if (!controls) settings = false }
  function openBook(id) { if (id) { window.scrollTo(0, 0); push('/book/' + id) } }
  function toSeries() { if (book?.seriesId) push('/series/' + book.seriesId) }

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

<!-- webtoon-style chrome: tap toggles top + bottom bars -->
{#if controls}
  <div class="topbar" transition:fly={{ y: -24, duration: 160 }}>
    <button class="ic" onclick={() => history.back()} aria-label="뒤로"><ArrowLeft size={22} /></button>
    <span class="title">{book?.name ?? ''}</span>
    <button class="ic" onclick={() => (settings = !settings)} aria-label="설정"><Settings size={20} /></button>
  </div>

  <div class="bottombar" transition:fly={{ y: 24, duration: 160 }}>
    <span class="pageno">{current} / {pagesCount}</span>
    <div class="nav">
      <button class="ic" onclick={() => openBook(prevId)} disabled={!prevId} aria-label="이전 권"><ChevronLeft size={22} /></button>
      <button class="ic" onclick={toSeries} aria-label="목록"><List size={20} /></button>
      <button class="ic" onclick={() => openBook(nextId)} disabled={!nextId} aria-label="다음 권"><ChevronRight size={22} /></button>
    </div>
  </div>

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
  .topbar, .bottombar {
    position: fixed; left: 0; right: 0; z-index: 21;
    display: flex; align-items: center; gap: 8px; padding: 10px 12px;
    background: rgba(16,16,20,.92); backdrop-filter: blur(10px);
  }
  .topbar { top: 0; padding-top: max(10px, env(safe-area-inset-top)); border-bottom: 1px solid #23232c; }
  .bottombar { bottom: 0; padding-bottom: max(10px, env(safe-area-inset-bottom)); border-top: 1px solid #23232c; justify-content: space-between; }
  .title { flex: 1; text-align: center; font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ic {
    display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;
    background: none; border: 0; color: var(--fg); cursor: pointer; border-radius: 10px;
  }
  .ic:disabled { opacity: .3; }
  .pageno { font-size: 13px; color: var(--muted); padding-left: 4px; }
  .nav { display: flex; align-items: center; gap: 4px; }

  .settings-panel {
    position: fixed; top: 60px; right: 12px; z-index: 22; width: min(88vw, 360px);
    background: rgba(20,20,26,.97); backdrop-filter: blur(10px);
    border: 1px solid #2a2a33; border-radius: 14px; padding: 6px 14px 14px;
    box-shadow: 0 12px 40px rgba(0,0,0,.5);
  }
  .row { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
  .lbl { width: 40px; font-size: 13px; color: var(--muted); flex: 0 0 auto; }
  .opts { display: flex; flex-wrap: wrap; gap: 6px; }
  .opts button { background: #1a1a1f; border: 1px solid #2a2a33; color: var(--fg); border-radius: 8px; padding: 6px 12px; font-size: 13px; }
  .opts .on { background: var(--accent); color: #05130a; border-color: var(--accent); font-weight: 700; }

  .scroll { min-height: 100dvh; }
  .scroll img { display: block; width: 100%; }
  .scroll.fit-h img { width: auto; height: 100dvh; margin: 0 auto; }

  .stage { min-height: 100dvh; display: flex; align-items: center; justify-content: center; overflow: hidden; touch-action: pan-y; }
  .slide { width: 100%; display: flex; align-items: center; justify-content: center; }
  .slide > img { max-width: 100%; max-height: 100dvh; display: block; }
  .slide.fit-h > img { max-height: 100dvh; width: auto; }

  .half { width: 100%; overflow: hidden; }
  .half img { display: block; width: 200%; }
  .half.right img { transform: translateX(-50%); }
</style>
