# simple-komga (Manga Reader PWA) — Design

> 2026-07-22 · 상태: 설계 승인 대기

## 1. 목적

Komga를 백엔드로 두고, **웹툰 스타일의 친숙한 UI**를 가진 PWA 만화 리더를 만든다.
기존 Komga/Kavita의 두 가지 페인포인트를 없애는 것이 핵심:

1. **UI가 안 친숙함** → 웹툰처럼 익숙하고 깔끔한 화면
2. **라이브러리 세팅 등 번거로운 삽질** → 최종 사용자는 세팅 화면을 볼 일이 없다. 열면 바로 읽는다.

## 2. 핵심 원칙

- **세팅 제로**: 라이브러리 구성은 관리자(개발자)가 백엔드에서 1회 완료. 사용자는 로그인 → 바로 읽기.
- **친숙한 UI**: 웹툰 감성. 다크 모드 기본.
- **백엔드 재활용**: Komga 스톡 그대로 사용. fork 안 함. 업스트림 업데이트 자유.
- **YAGNI**: MVP는 온라인 전용. 오프라인 소장은 Phase 2.

## 3. 아키텍처

```
[PWA 프론트엔드]  ← 사용자가 보는 유일한 얼굴
     │ 같은 출처(/api) 호출
[caddy]  /       → PWA 정적 파일 서빙
         /api/*  → Komga(127.0.0.1:25600) 리버스 프록시
     │
[Komga]  백엔드 전용. 라이브러리 사전 세팅됨(블리치). UI 노출 안 함.

전체 tailscale HTTPS 뒤 (https://macmini.tail993f0c.ts.net)
```

- PWA와 API가 **같은 출처** → CORS 불필요, 인증 단순.
- Komga는 얼굴을 내밀지 않고 REST API만 제공.

## 4. 컴포넌트 / 화면 (MVP)

| # | 화면 | 내용 | Komga API |
|---|------|------|-----------|
| 1 | 로그인 | Komga 계정(`jwnam`)으로 인증 | `GET /api/v1/users/me` (Basic) |
| 2 | 홈 | 시리즈 표지 카드 그리드 (현재 블리치 1종) | `GET /api/v1/series`, `.../thumbnail` |
| 3 | 시리즈 | 화(권) 목록 + "이어보기" 배지 | `GET /api/v1/series/{id}/books` |
| 4 | 뷰어 | 멀티모드 리더 + 위치 자동저장 | `GET /api/v1/books/{id}/pages`, page 이미지, `PATCH .../read-progress` |

### 뷰어 읽기 모드 (MVP)
- 세로 무한스크롤 (웹툰식) — **기본값**
- 페이지 넘김: 좌→우 / 우→좌
- 맞춤: 너비 / 높이
- 진도: 마지막 본 페이지 자동 저장·복원 (Komga read-progress API → 웹↔폰 동기화)

## 5. 데이터 흐름

1. 로그인 → 자격증명 검증(`/api/v1/users/me`) → 세션/토큰 브라우저 저장
2. 홈 → 시리즈 목록 + 썸네일 로드
3. 시리즈 선택 → 책 목록 + 각 책의 read-progress로 "이어보기" 계산
4. 책 열기 → 페이지 수 조회 → 이미지 스트리밍 → 스크롤/넘김에 따라 진도 PATCH

## 6. 인증

- Komga는 HTTP Basic / API Key / 세션 쿠키 지원.
- MVP: 로그인 폼 → Basic으로 `/api/v1/users/me` 검증 → 성공 시 자격증명을 안전 저장(브라우저), 이후 요청에 사용.
- (세부 방식은 구현계획에서 확정)

## 7. 기술 스택

- **Svelte + Vite** (PWA 플러그인 `vite-plugin-pwa`)
- 정적 빌드 산출물을 caddy가 서빙
- 개발: 맥북 로컬 repo `~/app/simple-komga` (Komga fork 아님, 신규)
- 배포: 빌드 → macmini caddy 볼륨으로 정적 파일 전달

## 8. 배포

- macmini의 caddy 설정 변경:
  - `/` → PWA 정적 파일
  - `/api/*` → `komga:25600`
- 전부 기존 tailscale HTTPS(`tailscale serve`) 뒤 유지.
- Kavita는 사용 안 하면 컨테이너 내림(선택).

## 9. 범위 밖 (Phase 2+)

- **오프라인 "소장"**: Service Worker 캐시 + 다운로드 관리 UI
- 여러 시리즈 대량 관리, 검색/필터 고도화
- 전환 애니메이션 등 감성 폴리시

## 10. 성공 기준 (MVP)

- 로그인 후 블리치가 홈에 뜬다 (세팅 화면 없음).
- 화를 열어 세로 스크롤/페이지 넘김으로 읽을 수 있다.
- 껐다 켜도 마지막 본 위치에서 이어본다.
- 웹 브라우저 + iOS 홈화면 추가(PWA) 둘 다 동작.
