-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_admin BOOLEAN DEFAULT FALSE,
  membership_type TEXT DEFAULT 'free',
  vip_status TEXT DEFAULT 'none',
  vip_expiry TIMESTAMP WITH TIME ZONE
);

-- RLS(Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 자신의 데이터만 볼 수 있는 정책
CREATE POLICY "사용자는 자신의 데이터만 조회 가능" 
  ON users FOR SELECT 
  USING (auth.uid() = user_id);

-- 관리자는 모든 데이터 조회 가능 (1111 계정)
CREATE POLICY "관리자는 모든 사용자 조회 가능" 
  ON users FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- 자신의 데이터만 업데이트 가능
CREATE POLICY "사용자는 자신의 데이터만 업데이트 가능" 
  ON users FOR UPDATE 
  USING (auth.uid() = user_id);

-- 관리자는 모든 사용자 업데이트 가능
CREATE POLICY "관리자는 모든 사용자 업데이트 가능" 
  ON users FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- 테이블 생성 함수
CREATE OR REPLACE FUNCTION create_users_table_if_not_exists()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 이미 사용자 테이블이 존재하는지 확인
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    RETURN TRUE;
  END IF;

  -- 사용자 테이블 생성
  CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE,
    membership_type TEXT DEFAULT 'free',
    vip_status TEXT DEFAULT 'none',
    vip_expiry TIMESTAMP WITH TIME ZONE
  );

  -- RLS 활성화
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

  -- 정책 생성
  CREATE POLICY "사용자는 자신의 데이터만 조회 가능" 
    ON public.users FOR SELECT 
    USING (auth.uid() = user_id);

  CREATE POLICY "관리자는 모든 사용자 조회 가능" 
    ON public.users FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE user_id = auth.uid() AND is_admin = TRUE
      )
    );

  CREATE POLICY "사용자는 자신의 데이터만 업데이트 가능" 
    ON public.users FOR UPDATE 
    USING (auth.uid() = user_id);

  CREATE POLICY "관리자는 모든 사용자 업데이트 가능" 
    ON public.users FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE user_id = auth.uid() AND is_admin = TRUE
      )
    );

  CREATE POLICY "새 사용자 등록 허용" 
    ON public.users FOR INSERT 
    WITH CHECK (true);
    
  RETURN TRUE;
END;
$$;
