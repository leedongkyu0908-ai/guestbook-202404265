# 미니 방명록

이름, 메시지, 작성 시각이 쌓이는 한 페이지짜리 방명록입니다. 회원가입 없이 글을 남기고, 글을 쓸 때 정한 비밀번호로 본인 글의 메시지를 수정하거나 글을 삭제할 수 있습니다.

- 배포 주소: https://guestbook-202404265.vercel.app
- 개발자: 이동규 (202404265)

## 기능

- **작성**: 이름(1~20자), 메시지(1~500자), 비밀번호(4~64자)를 입력해 글을 남깁니다.
- **조회**: 전체 글을 최신 작성 순으로 보여 줍니다. 시각은 한국 시간입니다.
- **수정**: 비밀번호를 입력해 메시지를 고칩니다. 수정된 글에는 "(수정됨 · 시각)"이 붙습니다.
- **삭제**: 비밀번호를 입력해 글을 지웁니다.
- 비밀번호가 틀리면 "비밀번호가 일치하지 않습니다.", 이미 지워진 글이면 "이미 삭제된 글입니다."가 표시됩니다.
- 비밀번호는 scrypt 해시(글마다 다른 salt)로만 저장합니다.

## 기술 스택

Next.js 16 (App Router, Server Actions) · Neon Postgres (`@neondatabase/serverless`) · Tailwind CSS · Vitest + PGlite · Vercel

## 로컬 실행

```bash
npm install
# .env.local 에 DATABASE_URL=postgresql://... (Neon 연결 문자열) 작성
npm run db:init   # 테이블 생성 (여러 번 실행해도 안전)
npm run dev       # http://localhost:3000
```

## 테스트

```bash
npm test
```

방명록 규칙(`lib/guestbook.ts`)을 메모리 Postgres(PGlite)로 검증하므로 DB 연결 없이 실행됩니다.

## 문서

- 용어집: [GLOSSARY.md](GLOSSARY.md)
- 스펙과 작업 티켓: [.scratch/guestbook/](.scratch/guestbook/)
