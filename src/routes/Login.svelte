<script>
  import { push } from 'svelte-spa-router'
  import { login } from '../lib/api.js'
  let email = $state(''); let pass = $state(''); let error = $state(''); let busy = $state(false)
  async function submit(e) {
    e.preventDefault(); busy = true; error = ''
    const ok = await login(email, pass)
    busy = false
    if (ok) push('/'); else error = '로그인 실패'
  }
</script>

<div class="wrap">
  <form class="card" onsubmit={submit}>
    <div class="brand">
      <svg class="logo" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#131318" />
        <rect x="18" y="12" width="28" height="16" rx="3" fill="var(--accent)" />
        <rect x="18" y="32" width="28" height="9" rx="2" fill="var(--accent)" opacity="0.8" />
        <rect x="18" y="45" width="28" height="7" rx="2" fill="var(--accent)" opacity="0.55" />
      </svg>
      <h1>simple-komga</h1>
      <p class="tag">내 서재</p>
    </div>

    <label>이메일
      <input aria-label="이메일" type="email" bind:value={email}
             placeholder="you@example.com" autocapitalize="off" autocomplete="username" />
    </label>
    <label>비밀번호
      <input aria-label="비밀번호" type="password" bind:value={pass}
             placeholder="••••••••" autocomplete="current-password" />
    </label>

    <button disabled={busy}>{busy ? '로그인 중…' : '로그인'}</button>
    {#if error}<p class="err">{error}</p>{/if}
  </form>
</div>

<style>
  .wrap { min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .card {
    width: 100%; max-width: 340px; display: flex; flex-direction: column; gap: 14px;
    background: #16161c; border: 1px solid #24242d; border-radius: 18px;
    padding: 28px 24px; box-shadow: 0 12px 40px rgba(0,0,0,.45);
  }
  .brand { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 6px; }
  .logo { width: 56px; height: 56px; }
  h1 { font-size: 20px; margin: 6px 0 0; letter-spacing: -.02em; }
  .tag { margin: 0; font-size: 13px; color: var(--muted); }
  label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--muted); }
  input {
    width: 100%; padding: 12px 14px; background: #0f0f13; border: 1px solid #2a2a33;
    border-radius: 10px; color: var(--fg); font-size: 15px; transition: border-color .15s;
  }
  input:focus { outline: none; border-color: var(--accent); }
  button {
    margin-top: 6px; padding: 13px; background: var(--accent); color: #05130a;
    border: 0; border-radius: 10px; font-weight: 800; font-size: 15px; cursor: pointer;
  }
  button:disabled { opacity: .6; cursor: default; }
  .err { margin: 2px 0 0; color: #ff6b6b; font-size: 13px; text-align: center; }
</style>
