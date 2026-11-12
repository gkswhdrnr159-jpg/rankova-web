# RANKOVA 관리자 CMS 설정

1. RANKOVA에 연결할 기존 Supabase 프로젝트를 확인합니다. SQL Editor에서 `select to_regclass('public.rankova_inquiries'), to_regclass('public.rankova_content');`를 실행합니다. 문의 테이블이 없다면 `supabase/migrations/202611120001_rankova_guest.sql`을 먼저 적용합니다.
2. CMS 테이블이 아직 없다면 `supabase/migrations/202611120002_rankova_cms.sql`을 한 번 실행합니다. 두 게임의 가격표 85개 항목, 기존 공지, 홈 제목과 부제, FAQ, 사이트 메타데이터가 초기값으로 등록됩니다. 기존 주문·상품·문의 데이터는 보존됩니다.
3. Auth에서 사용자 가입과 익명 로그인을 끕니다. 기존 관리자 계정을 사용하거나 대시보드에서 직접 생성하고 `docs/supabase-setup.md`의 SQL로 `rankova_admin` 권한을 부여합니다.
4. 프로젝트의 신규 키를 `.env.local`에 설정하고 개발 서버를 재시작합니다.

   ```dotenv
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...
   ```

5. `/admin/login`에 로그인합니다. 미리보기로 내용을 확인한 뒤 공개로 저장하면 방문자 화면에 반영됩니다. 메인 배너와 사이트 메타데이터는 공개 항목 중 노출 순서가 가장 앞선 항목을 사용합니다.
6. 이미지는 이미지 관리에서 먼저 업로드한 뒤 콘텐츠 편집 화면에서 선택합니다. 교체할 때는 새 이미지로 참조를 바꿔 저장합니다. 비공개 콘텐츠를 포함해 어디에도 연결되지 않은 기존 이미지만 삭제할 수 있습니다.
7. 두 게임 가격표의 탭, 공지 공개/비공개 전환, 후기의 작성 구분과 이미지, 문의 상태 변경을 테스트 프로젝트에서 검증합니다. 일반 계정과 로그아웃 상태에서는 관리자 화면 및 비공개 이미지 미리보기에 접근할 수 없어야 합니다.

기존 Sites 공개 버전은 정적 배포입니다. CMS 저장 결과와 Supabase Auth, Storage, 문의 접수를 공개 주소에서 사용하려면 서버 런타임을 포함한 배포가 필요합니다.
