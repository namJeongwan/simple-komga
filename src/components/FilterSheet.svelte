<script>
  import { onMount } from 'svelte'
  import { X } from 'lucide-svelte'
  import { _ } from '../lib/i18n.js'

  let { options, value, onapply, onclose } = $props()
  let initialized = false
  let draft = $state({ libraryIds: [], genres: [], tags: [], statuses: [], readStatuses: [] })

  $effect.pre(() => {
    if (initialized) return
    draft = {
      libraryIds: [...(value.libraryIds ?? [])],
      genres: [...(value.genres ?? [])],
      tags: [...(value.tags ?? [])],
      statuses: [...(value.statuses ?? [])],
      readStatuses: [...(value.readStatuses ?? [])],
    }
    initialized = true
  })

  const seriesStatuses = [
    ['ONGOING', 'ongoing'],
    ['ENDED', 'ended'],
    ['HIATUS', 'hiatus'],
    ['ABANDONED', 'abandoned'],
  ]
  const readStatuses = [
    ['UNREAD', 'unread'],
    ['IN_PROGRESS', 'inProgress'],
    ['READ', 'read'],
  ]

  function toggle(key, item) {
    const selected = draft[key].includes(item)
    draft = {
      ...draft,
      [key]: selected ? draft[key].filter((value) => value !== item) : [...draft[key], item],
    }
  }

  function reset() {
    draft = { libraryIds: [], genres: [], tags: [], statuses: [], readStatuses: [] }
  }

  onMount(() => {
    const previousOverflow = document.body.style.overflow
    const onKeydown = (event) => { if (event.key === 'Escape') onclose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeydown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeydown)
    }
  })
</script>

<div class="layer">
  <button class="backdrop" type="button" aria-label={$_('home.filters.close')} onclick={onclose}></button>
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="filter-title">
    <header>
      <h2 id="filter-title">{$_('home.filters.title')}</h2>
      <button class="close" type="button" aria-label={$_('home.filters.close')} onclick={onclose}><X size={21} /></button>
    </header>

    <div class="content">
      {#if options.libraries.length > 1}
        <fieldset>
          <legend>{$_('home.filters.library')}</legend>
          <div class="chips">
            {#each options.libraries as library (library.id)}
              <button
                type="button"
                class:selected={draft.libraryIds.includes(library.id)}
                aria-pressed={draft.libraryIds.includes(library.id)}
                onclick={() => toggle('libraryIds', library.id)}
              >{library.name}</button>
            {/each}
          </div>
        </fieldset>
      {/if}

      <fieldset>
        <legend>{$_('home.filters.genre')}</legend>
        {#if options.genres.length}
          <div class="chips">
            {#each options.genres as genre (genre)}
              <button
                type="button"
                class:selected={draft.genres.includes(genre)}
                aria-pressed={draft.genres.includes(genre)}
                onclick={() => toggle('genres', genre)}
              >{genre}</button>
            {/each}
          </div>
        {:else}
          <p class="empty">{$_('home.filters.noMetadata')}</p>
        {/if}
      </fieldset>

      {#if options.tags.length}
        <fieldset>
          <legend>{$_('home.filters.tag')}</legend>
          <div class="chips">
            {#each options.tags as tag (tag)}
              <button
                type="button"
                class:selected={draft.tags.includes(tag)}
                aria-pressed={draft.tags.includes(tag)}
                onclick={() => toggle('tags', tag)}
              >{tag}</button>
            {/each}
          </div>
        </fieldset>
      {/if}

      <fieldset>
        <legend>{$_('home.filters.seriesStatus')}</legend>
        <div class="chips">
          {#each seriesStatuses as [status, key] (status)}
            <button
              type="button"
              class:selected={draft.statuses.includes(status)}
              aria-pressed={draft.statuses.includes(status)}
              onclick={() => toggle('statuses', status)}
            >{$_(`home.filters.${key}`)}</button>
          {/each}
        </div>
      </fieldset>

      <fieldset>
        <legend>{$_('home.filters.readStatus')}</legend>
        <div class="chips">
          {#each readStatuses as [status, key] (status)}
            <button
              type="button"
              class:selected={draft.readStatuses.includes(status)}
              aria-pressed={draft.readStatuses.includes(status)}
              onclick={() => toggle('readStatuses', status)}
            >{$_(`home.filters.${key}`)}</button>
          {/each}
        </div>
      </fieldset>
    </div>

    <footer>
      <button class="reset" type="button" onclick={reset}>{$_('home.filters.reset')}</button>
      <button class="apply" type="button" onclick={() => onapply(draft)}>{$_('home.filters.apply')}</button>
    </footer>
  </div>
</div>

<style>
  .layer { position: fixed; inset: 0; z-index: 50; }
  .backdrop {
    position: absolute; inset: 0; width: 100%; height: 100%; padding: 0;
    border: 0; background: rgba(0,0,0,.58); backdrop-filter: blur(3px);
  }
  .sheet {
    position: absolute; right: 0; bottom: 0; left: 0;
    display: flex; width: 100%; max-height: min(82dvh, calc(100dvh - env(safe-area-inset-top, 0px) - 8px));
    flex-direction: column; overflow: hidden;
    border: 1px solid #2a2a33; border-bottom: 0; border-radius: 22px 22px 0 0;
    background: rgba(20,20,25,.98); box-shadow: 0 -18px 50px rgba(0,0,0,.45);
  }
  header { display: flex; flex: 0 0 auto; align-items: center; justify-content: space-between; padding: 16px 18px 10px; }
  h2 { margin: 0; font-size: 18px; }
  .close { display: grid; width: 38px; height: 38px; padding: 0; place-items: center; border: 0; border-radius: 50%; background: #292930; color: var(--fg); }
  .content { overflow-y: auto; padding: 2px 18px 16px; overscroll-behavior: contain; }
  fieldset { margin: 16px 0 0; padding: 0; border: 0; }
  legend { margin-bottom: 9px; color: #c8c8ce; font-size: 13px; font-weight: 700; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chips button {
    min-height: 36px; padding: 7px 12px; border: 1px solid #34343d; border-radius: 999px;
    background: #202027; color: #d7d7dc; font: inherit; font-size: 13px;
  }
  .chips button.selected { border-color: var(--accent); background: rgba(0,213,100,.15); color: #56ef9e; }
  .empty { margin: 0; color: var(--muted); font-size: 13px; }
  footer {
    display: grid; flex: 0 0 auto; grid-template-columns: minmax(0, .7fr) minmax(0, 1.3fr); gap: 10px;
    padding: 12px 18px max(14px, env(safe-area-inset-bottom, 0px));
    border-top: 1px solid #292930; background: rgba(20,20,25,.98);
  }
  footer button { min-height: 44px; border: 0; border-radius: 12px; font: inherit; font-weight: 700; }
  .reset { background: #292930; color: var(--fg); }
  .apply { background: var(--accent); color: #04140a; }

  @media (min-width: 700px) {
    .sheet {
      top: 50%; bottom: auto; left: 50%; width: min(520px, calc(100vw - 32px)); max-height: min(720px, calc(100dvh - 48px));
      transform: translate(-50%, -50%); border-bottom: 1px solid #2a2a33; border-radius: 22px;
    }
    footer { padding-bottom: 18px; }
  }
</style>
