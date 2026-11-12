# RANKOVA 비회원 주문과 관리자 설정

1. 테스트용 Supabase 프로젝트의 SQL Editor에서 `supabase/migrations/202611120001_rankova_guest.sql`을 한 번 실행합니다. 게임별 테스트 상품과 기준 요금이 등록됩니다.
2. Supabase Auth의 사용자 가입과 익명 로그인을 끄고 이메일·비밀번호 로그인을 활성화합니다. Auth Users에서 확인된 이메일과 강력한 비밀번호를 가진 운영자 계정을 직접 생성합니다. SQL Editor에서 아래 문을 실행합니다. UUID는 방금 생성한 운영자의 ID로 교체합니다.

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
     || '{"rankova_admin": true}'::jsonb
   where id = '관리자-UUID'::uuid;
   ```

   운영자 권한을 회수하려면 해당 계정의 `raw_app_meta_data`에서 `rankova_admin` 키를 삭제합니다. 앱은 각 관리자 요청에서 Supabase의 사용자 정보를 다시 확인합니다.

3. 프로젝트 루트에 `.env.local`을 열고 해당 테스트 프로젝트의 Connect 화면에서 Project URL, Settings → API Keys에서 신규 Publishable 키와 Secret 키를 확인해 입력합니다. Secret 키는 서버 전용입니다. 기존 마이그레이션을 이미 적용한 프로젝트에서는 SQL을 다시 실행하지 않습니다.

   ```dotenv
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...
   ```

4. `pnpm dev`를 다시 실행합니다. 게임 페이지에서 서비스와 티어를 선택하고 테스트 연락처로 주문을 접수합니다. 주문번호와 조회 코드를 복사해 `/orders`에서 조회합니다. 코드가 틀리면 주문 정보가 표시되지 않습니다.
5. `/admin/login`으로 로그인합니다. 주문과 상담 상태를 변경하고 상품의 활성 여부, 기본 요금, 티어당 추가 요금을 설정합니다. 주문을 완료로 바꾸면 대시보드의 완료 건수와 견적 합계에 반영됩니다.

조회 코드는 주문 성공 화면에서 한 번 표시되며 DB에는 해시만 저장됩니다. 고객 연락처는 주문 처리 또는 문의 답변용으로 한 항목만 수집합니다. 조회 결과에는 연락처가 포함되지 않습니다. Supabase 연결 전에는 예시 견적을 확인할 수 있습니다.


