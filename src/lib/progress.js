export function resumePage(readProgress, pagesCount) {
  if (!readProgress || readProgress.completed) return 1
  return Math.min(Math.max(readProgress.page, 1), pagesCount || 1)
}

// Load the page being read first, continue forward to the end, then fill the
// earlier pages from the beginning. This keeps the resume position responsive
// without waiting for each image to approach the viewport.
export function pageLoadPriority(page, currentPage, pagesCount) {
  if (page >= currentPage) return page - currentPage
  return Math.max(pagesCount - currentPage, 0) + page
}

export function percentRead(readProgress, pagesCount) {
  if (!readProgress || !pagesCount) return 0
  if (readProgress.completed) return 100
  return Math.round((readProgress.page / pagesCount) * 100)
}
export function resumeLabel(readProgress) {
  if (!readProgress) return '안 읽음'
  return readProgress.completed ? '완독' : '읽는 중'
}
