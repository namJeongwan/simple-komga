<script>
  import { login } from '../lib/api.js'
  import { _ } from '../lib/i18n.js'
  let { onsuccess } = $props()
  let email = $state(''); let pass = $state(''); let error = $state(''); let busy = $state(false)
  async function submit(e) {
    e.preventDefault(); busy = true; error = ''
    const ok = await login(email, pass)
    busy = false
    if (ok) onsuccess?.(); else error = $_('login.failed')
  }
</script>

<div class="wrap">
  <div class="login-shell">
    <div class="web-preview" aria-hidden="true">
      <div class="phone">
        <div class="speaker"></div>
        <div class="screen">
          <div class="preview-top">
            <strong>simple-komga</strong>
            <span>•••</span>
          </div>
          <div class="preview-search"></div>
          <div class="preview-grid">
            <div class="preview-book coral"><span>01</span></div>
            <div class="preview-book green"><span>02</span></div>
            <div class="preview-book blue"><span>03</span></div>
            <div class="preview-book amber"><span>04</span></div>
          </div>
        </div>
        <div class="home-indicator"></div>
      </div>
    </div>

    <form class="card" autocomplete="on" onsubmit={submit}>
      <div class="brand">
        <h1>simple-komga</h1>
        <p class="tag">{$_('login.tagline')}</p>
      </div>

      <label class="field" for="username">
        <span>{$_('login.email')}</span>
        <input
          id="username"
          name="username"
          aria-label={$_('login.email')}
          type="email"
          bind:value={email}
          placeholder={$_('login.email')}
          inputmode="email"
          autocapitalize="none"
          autocomplete="username"
          spellcheck="false"
          enterkeyhint="next"
          required
        />
      </label>
      <label class="field" for="password">
        <span>{$_('login.password')}</span>
        <input
          id="password"
          name="password"
          aria-label={$_('login.password')}
          type="password"
          bind:value={pass}
          placeholder={$_('login.password')}
          autocomplete="current-password"
          enterkeyhint="go"
          required
        />
      </label>

      <button type="submit" disabled={busy}>{busy ? $_('login.submitting') : $_('login.submit')}</button>
      {#if error}<p class="err">{error}</p>{/if}
      <div class="account-note">
        <span></span>
        <p>{$_('login.accountHint')}</p>
        <span></span>
      </div>
    </form>
  </div>
</div>

<style>
  .wrap {
    min-height: 100dvh; display: flex; align-items: center; justify-content: center;
    padding: max(24px, env(safe-area-inset-top, 0px)) max(20px, env(safe-area-inset-right, 0px)) max(24px, env(safe-area-inset-bottom, 0px)) max(20px, env(safe-area-inset-left, 0px));
    color-scheme: light; background: #fafafa; color: #262626;
  }
  .login-shell {
    width: min(100%, 820px); display: grid; grid-template-columns: 380px 350px;
    align-items: center; justify-content: center; gap: 58px;
  }
  .web-preview { display: flex; justify-content: center; }
  .phone {
    position: relative; width: 326px; height: 650px; padding: 54px 16px 66px;
    border: 5px solid #252525; border-radius: 48px; background: #090909;
    box-shadow: 0 22px 55px rgba(0, 0, 0, .18), inset 0 0 0 2px #555;
  }
  .speaker {
    position: absolute; top: 25px; left: 50%; width: 76px; height: 6px;
    border-radius: 99px; background: #343434; transform: translateX(-50%);
  }
  .screen {
    height: 100%; padding: 22px 16px; overflow: hidden;
    border-radius: 5px; background: #0e0e10; color: #ececf1;
  }
  .preview-top { display: flex; align-items: center; justify-content: space-between; font-size: 15px; }
  .preview-top strong {
    color: #fff; font-family: "Snell Roundhand", "Apple Chancery", cursive;
    font-size: 22px; letter-spacing: -.025em;
  }
  .preview-top span { color: #7c7c87; letter-spacing: 2px; }
  .preview-search {
    height: 35px; margin: 22px 0 18px; border: 1px solid #292932;
    border-radius: 10px; background: #15151a;
  }
  .preview-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 10px; }
  .preview-book {
    position: relative; aspect-ratio: .72; overflow: hidden; border-radius: 9px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .12);
  }
  .preview-book::before {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(145deg, rgba(255,255,255,.5), transparent 42%, rgba(0,0,0,.28));
  }
  .preview-book span {
    position: absolute; right: 10px; bottom: 8px; color: rgba(255,255,255,.9);
    font-size: 28px; font-weight: 800; letter-spacing: -.08em;
  }
  .preview-book.coral { background: linear-gradient(155deg, #ef476f, #79284d); }
  .preview-book.green { background: linear-gradient(155deg, #06d6a0, #087f67); }
  .preview-book.blue { background: linear-gradient(155deg, #4cc9f0, #3a0ca3); }
  .preview-book.amber { background: linear-gradient(155deg, #ffd166, #ef6c35); }
  .home-indicator {
    position: absolute; bottom: 25px; left: 50%; width: 82px; height: 5px;
    border-radius: 99px; background: #454545; transform: translateX(-50%);
  }
  .card {
    width: 100%; max-width: 350px; display: flex; flex-direction: column; gap: 8px;
    background: #fff; border: 1px solid #dbdbdb; border-radius: 2px;
    padding: 46px 40px 30px;
  }
  .brand { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 24px; }
  h1 {
    margin: 0; color: #141414; font-family: "Snell Roundhand", "Apple Chancery", cursive;
    font-size: 38px; font-weight: 700; line-height: 1; letter-spacing: -.045em;
  }
  .tag { margin: 0; font-size: 13px; color: #737373; }
  .field { position: relative; display: block; }
  .field span {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
  }
  input {
    width: 100%; min-width: 0; height: 42px; padding: 9px 10px;
    background: #fafafa; border: 1px solid #dbdbdb; border-radius: 3px;
    color: #262626; font: inherit; font-size: 13px; transition: border-color .15s;
  }
  input::placeholder { color: #737373; opacity: 1; }
  input:focus { outline: none; border-color: #a8a8a8; }
  button {
    width: 100%; margin-top: 8px; min-height: 36px; padding: 8px 12px;
    background: #00b856; color: #fff; border: 0; border-radius: 8px;
    font: inherit; font-weight: 700; font-size: 14px; cursor: pointer;
  }
  button:disabled { opacity: .6; cursor: default; }
  .err { margin: 10px 0 0; color: #ed4956; font-size: 13px; text-align: center; }
  .account-note { display: flex; align-items: center; gap: 14px; margin-top: 20px; }
  .account-note span { height: 1px; flex: 1; background: #dbdbdb; }
  .account-note p {
    margin: 0; color: #737373; font-size: 11px; font-weight: 600;
    text-align: center; white-space: nowrap;
  }

  @media (max-width: 820px) {
    .login-shell { display: block; width: 100%; max-width: 350px; }
    .web-preview { display: none; }
  }

  @media (max-width: 450px) {
    .wrap { align-items: flex-start; padding-top: max(18vh, env(safe-area-inset-top, 0px)); }
    .card { border: 0; padding: 34px 20px 24px; background: transparent; }
  }
</style>
