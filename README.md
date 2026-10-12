# 🔨 우리반 경매장

교사가 코인을 주고, 물건(권한·쿠폰)을 등록하고, 학생들이 코인으로 **밀봉 입찰**하는 학급경영 경매 웹앱입니다.
사회 6학년 2단원 2차시 도입(연습 경매)과 학기말 이벤트 경매(실전)를 하나의 앱으로 운영합니다.

- 스택: Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres + Auth) · Vercel
- 화면: 교사(`/teacher`) · 학생(`/s`) · 전광판(`/display/[경매ID]`)

---

## 1. 처음 배포하기 (약 20분)

### ① Supabase 프로젝트 만들기
1. https://supabase.com → **New project** (Region: Northeast Asia (Seoul) 권장)
2. 왼쪽 메뉴 **SQL Editor** → New query → `supabase/migrations/0001_init.sql` 내용을 통째로 붙여넣고 **Run**
   - "Success. No rows returned" 가 나오면 성공
3. **Authentication → Sign In / Providers → Email**
   - 혼자 쓰실 거면 **Confirm email** 을 꺼 두면 가입 즉시 로그인됩니다.
   - 가입이 끝난 뒤에는 **Allow new users to sign up** 을 꺼서 다른 사람이 가입하지 못하게 하세요.
4. **Project Settings → API** 에서 세 값을 복사해 둡니다.
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (**절대 공개 금지**)

### ② GitHub 에 올리기
```bash
cd class-auction
git init && git add . && git commit -m "우리반 경매장 첫 버전"
gh repo create class-auction --private --source=. --push   # 또는 GitHub 웹에서 저장소 만들고 push
```
`.env.local` 은 `.gitignore` 에 들어 있어 올라가지 않습니다.

### ③ Vercel 배포
1. https://vercel.com → **Add New → Project** → 방금 만든 GitHub 저장소 Import
2. **Environment Variables** 에 4개 입력 (`.env.example` 참고)
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `STUDENT_SESSION_SECRET` : 아무 긴 랜덤 문자열 (예: 키보드로 40자 정도 아무거나)
3. **Deploy** → 발급된 주소(예: `class-auction.vercel.app`)로 접속
4. 이후에는 GitHub 에 push 할 때마다 자동으로 다시 배포됩니다.

### ④ 내 컴퓨터에서 실행 (선택)
```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev                  # http://localhost:3000
```

---

## 2. 첫 사용 순서

1. `/teacher` → 가입·로그인 → **학급 만들기** (6자리 학급 코드 생성)
2. **학생** → 엑셀의 번호·이름을 붙여넣고 등록 → 뜨는 **PIN 카드 인쇄** (이 화면을 닫으면 PIN은 다시 볼 수 없고, 다시 만들기만 가능)
3. **물건** → 경매할 물건 등록 (이모지, 수량, 최소 입찰가)
4. **코인** → 전체 주기 / 골라서 주기 (빼려면 음수, 실수하면 '되돌리기')
5. **경매** → 연습/실전 고르고 물건 선택 → 경매 화면에서 `▶ 입찰 시작` → `■ 마감하기` → `🎉 결과 공개`
6. 교실 TV 에서는 경매 화면의 **📺 전광판 열기** (교사 계정으로 로그인된 브라우저)
7. 학생은 태블릿에서 `주소/s/login` → 학급 코드 → 번호 → PIN 4자리

## 3. 2차시 수업(경매 게임)에서 쓰기

| 순서 | 교사 | 학생 |
|---|---|---|
| 수업 전 | 물건 3개 등록(포토카드·게임 아이템·연필), **연습 경매** 만들기, 학급 설정에서 연습 코인 100 확인 | PIN 로그인 미리 해 두기 |
| 도입 1분 | `▶ 입찰 시작` (제한 시간 3분 추천), 전광판 띄우기 | 물건마다 "내가 낼 수 있는 가격" 입찰 |
| 도입 4분 | `■ 마감하기` → `🎉 결과 공개` | 전광판에서 평균·최고·최저와 점 분포 확인 |
| 발문 | **같은 100코인인데 왜 물건마다, 친구마다 가격이 다를까요?** | |

연습 경매는 진짜 코인과 가방에 영향을 주지 않습니다. 결과 화면의 이름 공개는 경매 만들 때 끌 수 있습니다(기본: 금액만 공개).

## 4. 경매 규칙 (학생 안내용)
- 각자 물건마다 가격을 몰래 써서 냅니다. 마감 전까지 고치거나 취소할 수 있어요.
- 한 경매에서 쓴 금액의 합은 내 코인보다 많을 수 없어요.
- 높은 금액 순서로 수량만큼 낙찰! 낸 금액만큼 코인이 빠져요. (같은 금액이면 먼저 입찰한 사람)
- 코인과 구매권은 우리 반 안에서만 쓰는 가상 화폐예요.

## 5. 구조 메모
- 잔액은 숫자 하나가 아니라 `coin_ledger`(코인 장부)의 합계입니다. 지급·차감·낙찰·되돌리기가 모두 한 줄씩 남습니다.
- 입찰(`place_bid`)과 마감·낙찰(`close_auction`)은 Postgres 함수로, 잔액 확인과 차감이 한 트랜잭션에서 처리됩니다.
- 교사 데이터는 RLS 로 자기 학급만 접근, 학생 요청은 Next.js 서버(`/api/s/*`)가 PIN 세션 쿠키를 확인한 뒤 service role 로 처리합니다.
- 전광판은 2초, 학생 화면은 5초마다 자동 새로고침합니다.

```
src/app/teacher/*     교사 화면 + actions.ts(서버 액션)
src/app/s/*           학생 화면
src/app/display/[id]  전광판
src/app/api/s/*       학생 API (로그인·상태·입찰)
supabase/migrations   테이블·RLS·함수 SQL
```
