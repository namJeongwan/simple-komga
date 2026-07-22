<script>
  // Komga sets a same-origin session cookie (KOMGA-SESSION) after login, so a
  // plain <img src> to /api is authenticated automatically — no blob/fetch, and
  // native lazy-loading + browser caching work. Retry a couple times in case the
  // cookie isn't seeded yet on a cold reload.
  let { src, alt = '' } = $props()
  let tries = 0
  function retry(e) {
    if (tries >= 2) return
    tries += 1
    const img = e.currentTarget
    setTimeout(() => { img.src = src + (src.includes('?') ? '&' : '?') + '_r=' + tries }, 400)
  }
</script>

<img {src} {alt} loading="lazy" decoding="async" onerror={retry} />
<style> img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 8px; background:#1a1a1f; } </style>
