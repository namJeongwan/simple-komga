import { beforeEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte'
import Reader from '../src/routes/Reader.svelte'
import * as api from '../src/lib/api.js'

vi.mock('svelte-spa-router', () => ({ push: vi.fn() }))

class FakeIntersectionObserver {
  constructor(callback) { this.callback = callback }
  observe() {}
  disconnect() {}
}

const pages = Array.from({ length: 5 }, (_, i) => ({ number: i + 1, width: 800, height: 1200 }))

beforeEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  localStorage.setItem('reader-mode', 'scroll')
  global.IntersectionObserver = FakeIntersectionObserver
  global.requestAnimationFrame = (callback) => { callback(); return 1 }
  Element.prototype.scrollIntoView = vi.fn()
  vi.spyOn(api, 'getPages').mockResolvedValue(pages)
  vi.spyOn(api, 'getBooks').mockResolvedValue([
    { id: 'b17', name: '17화' },
    { id: 'b18', name: '18화' },
  ])
  vi.spyOn(api, 'saveProgress').mockResolvedValue(undefined)
})

test('restores the saved scroll position and loads from that page first', async () => {
  vi.spyOn(api, 'getBook').mockResolvedValue({
    id: 'b17', name: '17화', seriesId: 'series', pagesCount: 5,
    readProgress: { page: 3, completed: false },
  })

  const { container } = render(Reader, { props: { params: { id: 'b17' } } })

  await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled())
  expect(Element.prototype.scrollIntoView.mock.contexts[0].dataset.page).toBe('3')

  const image = (page) => container.querySelector(`img[alt="p${page}"]`)
  await waitFor(() => expect(image(3).getAttribute('src')).toContain('/books/b17/pages/3'))
  expect(image(1).hasAttribute('src')).toBe(false)
  expect(image(4).hasAttribute('src')).toBe(false)

  await fireEvent.load(image(3))
  await waitFor(() => expect(image(4).getAttribute('src')).toContain('/books/b17/pages/4'))
  await fireEvent.load(image(4))
  await waitFor(() => expect(image(5).getAttribute('src')).toContain('/books/b17/pages/5'))
  await fireEvent.load(image(5))
  await waitFor(() => expect(image(1).getAttribute('src')).toContain('/books/b17/pages/1'))
})

test('replaces page image URLs when the route moves to another book', async () => {
  vi.spyOn(api, 'getBook').mockImplementation(async (id) => ({
    id, name: id === 'b17' ? '17화' : '18화', seriesId: 'series', pagesCount: 5,
    readProgress: { page: 1, completed: false },
  }))

  const view = render(Reader, { props: { params: { id: 'b17' } } })
  await waitFor(() => expect(view.container.querySelector('img[src]')?.getAttribute('src')).toContain('/books/b17/'))

  await view.rerender({ params: { id: 'b18' } })

  await waitFor(() => expect(view.container.querySelector('img[src]')?.getAttribute('src')).toContain('/books/b18/'))
  expect([...view.container.querySelectorAll('img')].some((img) => img.getAttribute('src')?.includes('/books/b17/'))).toBe(false)
})
