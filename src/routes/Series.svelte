<script>
  import { getBooks, thumbUrl } from '../lib/api.js'
  import { resumeLabel, percentRead } from '../lib/progress.js'
  import Cover from '../components/Cover.svelte'
  let { params } = $props()
  let books = $state([]); let error = $state('')
  $effect(() => { getBooks(params.id).then((b) => (books = b)).catch((e) => (error = String(e))) })
</script>

<header class="top"><a href="#/" class="back">‹</a><h1>블리치</h1></header>
{#if error}<p class="err">{error}</p>{/if}
<ul class="list">
  {#each books as b (b.id)}
    <li>
      <a class="row" href={`#/book/${b.id}`}>
        <div class="thumb"><Cover src={thumbUrl('book', b.id)} alt={b.name} /></div>
        <div class="info">
          <span class="name">{b.name}</span>
          <span class="badge" class:done={b.readProgress?.completed}>{resumeLabel(b.readProgress)}</span>
          <div class="bar"><i style={`width:${percentRead(b.readProgress, b.pagesCount)}%`}></i></div>
        </div>
      </a>
    </li>
  {/each}
</ul>

<style>
  .top { display:flex; align-items:center; gap:10px; padding:12px 16px; } .back{font-size:24px;} h1{font-size:18px;margin:0;}
  .list { list-style:none; margin:0; padding:0 8px 24px; }
  .row { display:flex; gap:12px; padding:10px 8px; align-items:center; }
  .thumb { width:52px; flex:0 0 52px; }
  .info { display:flex; flex-direction:column; gap:4px; flex:1; }
  .badge { font-size:12px; color:var(--muted); } .badge.done { color: var(--accent); }
  .bar { height:3px; background:#26262e; border-radius:2px; overflow:hidden; }
  .bar i { display:block; height:100%; background:var(--accent); } .err{color:#ff5a5a;padding:0 16px;}
</style>
