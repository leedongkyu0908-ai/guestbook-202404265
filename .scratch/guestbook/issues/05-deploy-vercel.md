# 05: Vercel 배포

**What to build:** 방명록이 Vercel 주소에서 동작한다. 누구나 배포된 사이트에서 글을 작성·조회하고, 글쓴이는 글 비밀번호로 수정·삭제할 수 있다. 스펙: `.scratch/guestbook/spec.md`.

**Blocked by:** 03 (메시지 수정), 04 (글 삭제)

**Status:** ready-for-agent

- [x] `npm run build`와 `npm test`가 통과한다
- [x] 운영 Neon DB에 `npm run db:init`으로 스키마가 적용되어 있다
- [x] Vercel 프로젝트에 `DATABASE_URL` 환경변수가 등록되어 있다 (연결 문자열은 저장소에 커밋하지 않는다)
- [ ] 배포된 사이트에서 작성·조회·수정·삭제, 비밀번호 불일치·글 없음 안내, 개발자 이름·학번 표시를 수동 확인했다
- [x] 배포 주소를 README에 적었다
