<script>
  import Router, { push } from 'svelte-spa-router'
  import { hasCredentials } from './lib/auth.js'
  import Login from './routes/Login.svelte'
  import Home from './routes/Home.svelte'
  import Series from './routes/Series.svelte'
  import Reader from './routes/Reader.svelte'

  const routes = { '/': Home, '/login': Login, '/series/:id': Series, '/book/:id': Reader }
  function guard(e) {
    if (!hasCredentials() && e.detail.location !== '/login') push('/login')
  }
</script>

<Router {routes} on:routeLoading={guard} />
