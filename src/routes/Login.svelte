<script>
  import { push } from 'svelte-spa-router'
  import { login } from '../lib/api.js'
  let user = $state(''); let pass = $state(''); let error = $state(''); let busy = $state(false)
  async function submit(e) {
    e.preventDefault(); busy = true; error = ''
    const ok = await login(user, pass)
    busy = false
    if (ok) push('/'); else error = '로그인 실패'
  }
</script>

<form onsubmit={submit} class="login">
  <h1>simple-komga</h1>
  <label>아이디<input aria-label="아이디" bind:value={user} autocapitalize="off" /></label>
  <label>비밀번호<input aria-label="비밀번호" type="password" bind:value={pass} /></label>
  <button disabled={busy}>로그인</button>
  {#if error}<p class="err">{error}</p>{/if}
</form>

<style>
  .login { max-width: 320px; margin: 20vh auto; display: flex; flex-direction: column; gap: 12px; padding: 0 16px; }
  input { width: 100%; padding: 10px; background:#1a1a1f; border:1px solid #2a2a33; border-radius:8px; color:var(--fg); }
  button { padding: 12px; background: var(--accent); border: 0; border-radius: 8px; font-weight: 700; }
  .err { color: #ff5a5a; }
</style>
