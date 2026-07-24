import { addMessages, init, locale, _ } from 'svelte-i18n'

const messages = {
  ko: {
    common: {
      back: '뒤로',
      settings: '설정',
      list: '목록',
      none: '없음',
      language: '언어 변경',
      logout: '로그아웃',
    },
    login: {
      tagline: '내 서재',
      accountHint: 'Komga 계정',
      email: '이메일',
      password: '비밀번호',
      submit: '로그인',
      submitting: '로그인 중…',
      failed: '로그인 실패',
    },
    home: {
      title: '내 만화',
      sync: '라이브러리 동기화',
      dashboard: '관리자 설정 (Komga)',
      lastSync: '최근 수동 동기화: {time}',
      syncFailed: '동기화 실패: {error}',
      logoutFailed: '로그아웃 실패: {error}',
      searchPlaceholder: '제목·화 검색',
      search: '검색',
      loadFailed: '불러오기 실패: {error}',
      searching: '검색 중…',
      series: '시리즈',
      chapters: '콘텐츠',
      noResults: '결과 없음',
      items: '{count}개',
      filters: {
        open: '필터',
        title: '필터',
        close: '필터 닫기',
        apply: '적용',
        reset: '초기화',
        library: '라이브러리',
        genre: '장르',
        tag: '태그',
        seriesStatus: '연재 상태',
        readStatus: '읽기 상태',
        ongoing: '연재 중',
        ended: '완결',
        hiatus: '휴재',
        abandoned: '중단',
        unread: '안 읽음',
        inProgress: '읽는 중',
        read: '완독',
        noMetadata: '등록된 항목 없음',
      },
    },
    series: {
      fallbackTitle: '시리즈',
      content: '콘텐츠 {count}개',
      summary: '작품 소개',
      publisher: '출판사',
      status: '상태',
      language: '언어',
      ageRating: '이용 등급',
      ageRatingValue: '{age}세 이상',
      totalBookCount: '전체 콘텐츠',
      totalBookCountValue: '{count}개',
      orderLabel: '화 정렬',
      newestFirst: '최신순',
      oldestFirst: '1화부터',
      genres: '장르',
      tags: '태그',
      alternateTitles: '다른 제목',
      links: '관련 링크',
      statuses: {
        ended: '완결',
        ongoing: '연재 중',
        abandoned: '중단',
        hiatus: '휴재',
      },
      roles: {
        writer: '글',
        penciller: '그림',
        inker: '선화',
        colorist: '채색',
        letterer: '글자',
        cover: '표지',
        editor: '편집',
        translator: '번역',
        author: '작가',
      },
    },
    progress: {
      unread: '안 읽음',
      reading: '읽는 중',
      completed: '완독',
    },
    reader: {
      previous: '이전',
      next: '다음',
      mode: '모드',
      scroll: '세로',
      paged: '페이지',
      split: '반쪽',
      splitScroll: '반쪽웹툰',
      direction: '방향',
      ltr: '좌 → 우',
      rtl: '우 → 좌 (일본만화)',
      fit: '맞춤',
      width: '너비',
      height: '높이',
      displayWidth: '폭',
      narrow: '좁게',
      normal: '보통',
      wide: '넓게',
      full: '전체',
    },
  },
  en: {
    common: {
      back: 'Back',
      settings: 'Settings',
      list: 'List',
      none: 'None',
      language: 'Change language',
      logout: 'Sign out',
    },
    login: {
      tagline: 'My library',
      accountHint: 'Komga account',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
      submitting: 'Signing in…',
      failed: 'Sign-in failed',
    },
    home: {
      title: 'My comics',
      sync: 'Sync libraries',
      dashboard: 'Admin settings (Komga)',
      lastSync: 'Last manual sync: {time}',
      syncFailed: 'Sync failed: {error}',
      logoutFailed: 'Could not sign out: {error}',
      searchPlaceholder: 'Search titles and volumes',
      search: 'Search',
      loadFailed: 'Could not load: {error}',
      searching: 'Searching…',
      series: 'Series',
      chapters: 'Content',
      noResults: 'No results',
      items: '{count} items',
      filters: {
        open: 'Filters',
        title: 'Filters',
        close: 'Close filters',
        apply: 'Apply',
        reset: 'Reset',
        library: 'Library',
        genre: 'Genre',
        tag: 'Tag',
        seriesStatus: 'Series status',
        readStatus: 'Reading status',
        ongoing: 'Ongoing',
        ended: 'Completed',
        hiatus: 'On hiatus',
        abandoned: 'Abandoned',
        unread: 'Unread',
        inProgress: 'In progress',
        read: 'Read',
        noMetadata: 'No metadata available',
      },
    },
    series: {
      fallbackTitle: 'Series',
      content: '{count} items',
      summary: 'About',
      publisher: 'Publisher',
      status: 'Status',
      language: 'Language',
      ageRating: 'Age rating',
      ageRatingValue: 'Ages {age}+',
      totalBookCount: 'Total items',
      totalBookCountValue: '{count} items',
      orderLabel: 'Episode order',
      newestFirst: 'Latest',
      oldestFirst: 'First episode',
      genres: 'Genres',
      tags: 'Tags',
      alternateTitles: 'Alternate titles',
      links: 'Links',
      statuses: {
        ended: 'Completed',
        ongoing: 'Ongoing',
        abandoned: 'Abandoned',
        hiatus: 'On hiatus',
      },
      roles: {
        writer: 'Writer',
        penciller: 'Artist',
        inker: 'Inker',
        colorist: 'Colorist',
        letterer: 'Letterer',
        cover: 'Cover',
        editor: 'Editor',
        translator: 'Translator',
        author: 'Author',
      },
    },
    progress: {
      unread: 'Unread',
      reading: 'Reading',
      completed: 'Completed',
    },
    reader: {
      previous: 'Previous',
      next: 'Next',
      mode: 'Mode',
      scroll: 'Vertical',
      paged: 'Paged',
      split: 'Split',
      splitScroll: 'Split scroll',
      direction: 'Direction',
      ltr: 'Left → right',
      rtl: 'Right → left (manga)',
      fit: 'Fit',
      width: 'Width',
      height: 'Height',
      displayWidth: 'Size',
      narrow: 'Narrow',
      normal: 'Normal',
      wide: 'Wide',
      full: 'Full',
    },
  },
}

export const supportedLocales = ['ko', 'en']

export function normalizeLocale(value) {
  if (!value || typeof value !== 'string') return null
  const exact = supportedLocales.find((candidate) => candidate.toLowerCase() === value.toLowerCase())
  if (exact) return exact
  const language = value.split(/[-_]/)[0].toLowerCase()
  return supportedLocales.includes(language) ? language : null
}

export function getKomgaStoredLocale(storage = globalThis.localStorage) {
  try {
    const persisted = JSON.parse(storage?.getItem('vuex') ?? 'null')
    return normalizeLocale(persisted?.persistedState?.locale)
  } catch {
    return null
  }
}

export function saveKomgaStoredLocale(value, storage = globalThis.localStorage) {
  const normalized = normalizeLocale(value)
  if (!normalized) return false
  try {
    const persisted = JSON.parse(storage?.getItem('vuex') ?? 'null')
    if (!persisted?.persistedState) return false
    persisted.persistedState.locale = normalized
    storage.setItem('vuex', JSON.stringify(persisted))
    return true
  } catch {
    return false
  }
}

export function resolveInitialLocale(
  storage = globalThis.localStorage,
  languages = globalThis.navigator?.languages ?? [globalThis.navigator?.language],
) {
  const komgaLocale = getKomgaStoredLocale(storage)
  if (komgaLocale) return komgaLocale
  for (const language of languages ?? []) {
    const normalized = normalizeLocale(language)
    if (normalized) return normalized
  }
  return 'ko'
}

Object.entries(messages).forEach(([name, values]) => addMessages(name, values))
init({ fallbackLocale: 'ko', initialLocale: resolveInitialLocale() })

locale.subscribe((value) => {
  if (value && globalThis.document?.documentElement) document.documentElement.lang = value
})

export function applyLocale(value) {
  const normalized = normalizeLocale(value)
  if (normalized) locale.set(normalized)
  return normalized
}

export { _, locale }
