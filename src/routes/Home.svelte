<script>
  import { getSeries, thumbUrl } from '../lib/api.js'
  import Cover from '../components/Cover.svelte'
  let series = $state([]); let error = $state('')
  $effect(() => { getSeries().then((s) => (series = s)).catch((e) => (error = String(e))) })
</script>

<header class="top"><h1>내 만화</h1></header>
{#if error}<p class="err">불러오기 실패: {error}</p>{/if}
<div class="grid">
  {#each series as s (s.id)}
    <a class="card" href={`#/series/${s.id}`}>
      <Cover src={thumbUrl('series', s.id)} alt={s.name} />
      <div class="meta"><span class="name">{s.name}</span><span class="count">{s.booksCount}권</span></div>
    </a>
  {/each}
</div>

<style>
  .top { padding: 16px; } h1 { font-size: 20px; margin: 0; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; padding: 0 16px 24px; }
  .meta { display: flex; justify-content: space-between; padding-top: 6px; font-size: 13px; }
  .count { color: var(--muted); } .err { color:#ff5a5a; padding:0 16px; }
</style>
