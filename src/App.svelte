<script>
  import Router from 'svelte-spa-router'
  import Login from './routes/Login.svelte'
  import Home from './routes/Home.svelte'
  import Series from './routes/Series.svelte'
  import Reader from './routes/Reader.svelte'

  const routes = {
    '/': Home,
    '/login': Login,
    '/series/:id': Series,
    '/book/:id': Reader,
  }
</script>

<Router {routes} />
