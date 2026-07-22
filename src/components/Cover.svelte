<script>
  import { getAuthHeader } from '../lib/auth.js'
  let { src, alt = '' } = $props()
  let objectUrl = $state('')
  $effect(() => {
    let revoked = false, current = ''
    fetch(src, { headers: { Authorization: getAuthHeader() } })
      .then((r) => r.blob())
      .then((b) => { if (!revoked) { current = URL.createObjectURL(b); objectUrl = current } })
    return () => { revoked = true; if (current) URL.revokeObjectURL(current) }
  })
</script>

<img src={objectUrl} {alt} loading="lazy" />
<style> img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 8px; background:#1a1a1f; } </style>
