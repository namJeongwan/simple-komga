<script>
  import Router from 'svelte-spa-router'
  import { AUTH_CLEARED_EVENT, hasCredentials } from './lib/auth.js'
  import { getLocalePreference, saveLocalePreference } from './lib/api.js'
  import { applyLocale, locale, saveKomgaStoredLocale } from './lib/i18n.js'
  import Login from './routes/Login.svelte'
  import Home from './routes/Home.svelte'
  import Series from './routes/Series.svelte'
  import Reader from './routes/Reader.svelte'

  const routes = { '/': Home, '/series/:id': Series, '/book/:id': Reader }
  // Gate the whole app: until authenticated we render ONLY our Login screen,
  // so no protected route can fire an unauthenticated API call (which would
  // otherwise trigger the browser's native Basic-auth popup).
  let authed = $state(hasCredentials())

  $effect(() => {
    const signedOut = () => (authed = false)
    globalThis.addEventListener?.(AUTH_CLEARED_EVENT, signedOut)
    return () => globalThis.removeEventListener?.(AUTH_CLEARED_EVENT, signedOut)
  })

  $effect(() => {
    if (!authed) return
    getLocalePreference().then((saved) => {
      if (applyLocale(saved)) {
        saveKomgaStoredLocale(saved)
        return
      }
      saveLocalePreference($locale).catch(() => {})
    }).catch(() => {})
  })
</script>

{#if authed}
  <Router {routes} />
{:else}
  <Login onsuccess={() => (authed = true)} />
{/if}
