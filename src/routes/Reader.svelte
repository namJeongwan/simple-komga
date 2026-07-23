<script>
  import { onDestroy, tick } from 'svelte'
  import { fly } from 'svelte/transition'
  import { push, replace } from 'svelte-spa-router'
  import { ArrowLeft, Settings, ChevronLeft, ChevronRight, List } from 'lucide-svelte'
  import { getBook, getBooks, getPages, pageUrl, saveProgress } from '../lib/api.js'
  import { pageLoadPriority, resumePage } from '../lib/progress.js'

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
  let loadedBookId = $state('')
  let scrollNode = $state(null)
  let restoring = false
  let loadToken = 0
  let saveTimer
  let pendingProgress = null

  const isScroll = $derived(mode === 'scroll' || mode === 'split-scroll')
  const isSplit = $derived(mode === 'split' || mode === 'split-scroll')

  const views = $derived(buildViews(pages, isSplit, dir))
  function buildViews(pgs, split, d) {
    // w/h are carried so each slot can reserve its aspect-ratio before the image
    // loads — otherwise collapsed 0-height images defeat native lazy-loading.
    if (!split) return pgs.map((p) => ({ page: p.number, half: null, w: p.width, h: p.height }))
    const order = d === 'rtl' ? ['R', 'L'] : ['L', 'R']
    // landscape image (w>h) = 2-page spread → split into halves by direction;
    // portrait image = single page → keep whole.
    return pgs.flatMap((p) => {
      const spread = (p.width || 0) > (p.height || 1)
      if (!spread) return [{ page: p.number, half: null, w: p.width, h: p.height }]
      return order.map((h) => ({ page: p.number, half: h, w: (p.width || 0) / 2, h: p.height }))
    })
  }

  function flushProgress() {
    clearTimeout(saveTimer)
    if (!pendingProgress) return
    const pending = pendingProgress
    pendingProgress = null
    saveProgress(pending.bookId, pending.page, pending.completed).catch(() => {})
  }

  function persist(page) {
    current = page
    if (!loadedBookId) return
    clearTimeout(saveTimer)
    pendingProgress = { bookId: loadedBookId, page, completed: page >= pagesCount }
    saveTimer = setTimeout(flushProgress, 800)
  }

  $effect(() => {
    const id = params.id
    const token = ++loadToken
    flushProgress()
    resetPriorityLoader()
    loadedBookId = ''
    pages = []
    pagesCount = 0
    book = null
    prevId = null
    nextId = null
    restoring = true

    Promise.all([getBook(id), getPages(id)]).then(async ([b, pg]) => {
      if (token !== loadToken) return
      book = b
      pages = pg
      pagesCount = b.pagesCount || pg.length
      const start = resumePage(b.readProgress, pagesCount)
      current = start
      loadedBookId = id
      const nextViews = buildViews(pg, isSplit, dir)
      const i = nextViews.findIndex((v) => v.page === start)
      idx = i >= 0 ? i : 0

      await tick()
      if (token !== loadToken) return
      if (isScroll) {
        scrollNode?.querySelector(`[data-page="${start}"]`)?.scrollIntoView({ block: 'start' })
      }
      requestAnimationFrame(() => {
        if (token === loadToken) restoring = false
      })

      if (b.seriesId) {
        getBooks(b.seriesId).then((list) => {
          if (token !== loadToken) return
          const j = list.findIndex((x) => x.id === id)
          prevId = j > 0 ? list[j - 1].id : null
          nextId = j >= 0 && j < list.length - 1 ? list[j + 1].id : null
        }).catch(() => {})
      }
    }).catch(() => {
      if (token === loadToken) restoring = false
    })
  })

  function realign() {
    const i = views.findIndex((v) => v.page === current)
    idx = i >= 0 ? i : 0
  }
  async function scrollToCurrent() {
    await tick()
    scrollNode?.querySelector(`[data-page="${current}"]`)?.scrollIntoView({ block: 'start' })
  }
  function setMode(m) { mode = m; realign(); if (m === 'scroll' || m === 'split-scroll') scrollToCurrent() }
  function setDir(d) { dir = d; realign(); if (isScroll) scrollToCurrent() }
  function toggleChrome() { controls = !controls; if (!controls) settings = false }
  function openBook(id) { if (id) { flushProgress(); window.scrollTo(0, 0); replace('/book/' + id) } }
  function toSeries() { if (book?.seriesId) push('/series/' + book.seriesId) }

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
      (es) => es.forEach((e) => { if (!restoring && e.isIntersecting) persist(page) }),
      { threshold: 0.5 },
    )
    ob.observe(node)
    return { destroy() { ob.disconnect() } }
  }

  // Explicit one-at-a-time queue. The current page wins, followed by the pages
  // ahead of it; earlier pages are filled after reaching the end.
  let loaderGeneration = 0
  let loadQueue = []
  let activeLoad = 0
  let taskSequence = 0
  let pumpScheduled = false

  function resetPriorityLoader() {
    loaderGeneration += 1
    loadQueue = []
    activeLoad = 0
  }

  function schedulePump() {
    if (pumpScheduled) return
    pumpScheduled = true
    queueMicrotask(() => {
      pumpScheduled = false
      loadQueue.sort((a, b) => a.priority - b.priority || a.sequence - b.sequence)
      if (activeLoad || !loadQueue.length) return
      const task = loadQueue.shift()
      if (task.cancelled || task.generation !== loaderGeneration) { schedulePump(); return }
      task.started = true
      activeLoad = 1
      const finish = () => {
        if (task.finished) return
        task.finished = true
        task.node.removeEventListener('load', finish)
        task.node.removeEventListener('error', finish)
        if (task.generation === loaderGeneration) activeLoad = 0
        schedulePump()
      }
      task.finish = finish
      task.node.addEventListener('load', finish)
      task.node.addEventListener('error', finish)
      task.node.src = task.url
      if (task.node.complete) queueMicrotask(finish)
    })
  }

  function priorityLoad(node, initial) {
    let task

    function enqueue(config) {
      task = {
        node,
        url: config.url,
        priority: config.priority,
        sequence: taskSequence++,
        generation: loaderGeneration,
        started: false,
        finished: false,
        cancelled: false,
      }
      loadQueue.push(task)
      schedulePump()
    }

    function cancel() {
      if (!task || task.finished || task.cancelled) return
      task.cancelled = true
      if (task.started) {
        task.node.removeEventListener('load', task.finish)
        task.node.removeEventListener('error', task.finish)
        if (task.generation === loaderGeneration) activeLoad = 0
      }
      schedulePump()
    }

    enqueue(initial)
    return {
      update(config) {
        if (task.url === config.url) {
          task.priority = config.priority
          schedulePump()
          return
        }
        cancel()
        node.removeAttribute('src')
        enqueue(config)
      },
      destroy: cancel,
    }
  }

  onDestroy(() => { flushProgress(); resetPriorityLoader() })
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

{#key loadedBookId}
  {#if isScroll}
    <div class="scroll" class:fit-h={fit === 'height'} onclick={toggleChrome} bind:this={scrollNode}>
      {#each views as v (v.page + (v.half ?? ''))}
        {#if v.half}
          <div data-page={v.page} class="half {v.half === 'L' ? 'left' : 'right'}" style={v.w && v.h ? `aspect-ratio:${v.w}/${v.h}` : ''}>
            <img use:priorityLoad={{ url: pageUrl(loadedBookId, v.page), priority: pageLoadPriority(v.page, current, pagesCount) }} decoding="async" use:trackScroll={v.page} alt={`p${v.page}`} />
          </div>
        {:else}
          <img data-page={v.page} use:priorityLoad={{ url: pageUrl(loadedBookId, v.page), priority: pageLoadPriority(v.page, current, pagesCount) }} decoding="async" use:trackScroll={v.page} alt={`p${v.page}`} style={v.w && v.h ? `aspect-ratio:${v.w}/${v.h}` : ''} />
        {/if}
      {/each}
    </div>
  {:else}
    <div class="stage" onpointerdown={pdown} onpointerup={pup}>
      {#key `${loadedBookId}:${idx}`}
        {@const v = views[idx]}
        {#if v}
          <div class="slide" class:fit-h={fit === 'height'} in:fly={{ x: navDir * 40, duration: 150 }}>
            {#if v.half}
              <div class="half {v.half === 'L' ? 'left' : 'right'}">
                <img src={pageUrl(loadedBookId, v.page)} decoding="async" alt={`p${v.page}`} />
              </div>
            {:else}
              <img src={pageUrl(loadedBookId, v.page)} decoding="async" alt={`p${v.page}`} />
            {/if}
          </div>
        {/if}
      {/key}
    </div>
  {/if}
{/key}

<style>
  .topbar, .bottombar {
    position: fixed; left: 0; right: 0; z-index: 21;
    display: flex; align-items: center; gap: 8px; padding: 10px 12px;
    background: rgba(16,16,20,.92); backdrop-filter: blur(10px);
  }
  .topbar { top: 0; padding-top: max(10px, env(safe-area-inset-top, 0px)); padding-right: max(12px, env(safe-area-inset-right, 0px)); padding-left: max(12px, env(safe-area-inset-left, 0px)); border-bottom: 1px solid #23232c; }
  .bottombar { bottom: 0; padding-right: max(12px, env(safe-area-inset-right, 0px)); padding-bottom: max(10px, env(safe-area-inset-bottom, 0px)); padding-left: max(12px, env(safe-area-inset-left, 0px)); border-top: 1px solid #23232c; justify-content: space-between; }
  .title { flex: 1; text-align: center; font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ic {
    display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;
    background: none; border: 0; color: var(--fg); cursor: pointer; border-radius: 10px;
  }
  .ic:disabled { opacity: .3; }
  .pageno { font-size: 13px; color: var(--muted); padding-left: 4px; }
  .nav { display: flex; align-items: center; gap: 4px; }

  .settings-panel {
    position: fixed; top: 60px; right: max(12px, env(safe-area-inset-right, 0px)); z-index: 22; width: min(88vw, 360px);
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
