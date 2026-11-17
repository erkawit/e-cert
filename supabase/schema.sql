-- Supabase (PostgreSQL) Schema for e-Cert System
-- Run this in Supabase SQL Editor (Project: vvzbsfvigsllnoktknve)

CREATE TABLE IF NOT EXISTS _authentication_level (
  id BIGSERIAL PRIMARY KEY,
  _authentication_level TEXT NOT NULL,
  _datetime_create TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  _use VARCHAR(10) NOT NULL DEFAULT '1'
);

CREATE TABLE IF NOT EXISTS _cert_template (
  id BIGSERIAL PRIMARY KEY,
  _cert_template_name TEXT NOT NULL,
  _cert_template_real_name TEXT,
  _cert_template_path_file TEXT NOT NULL,
  _cert_template_lname_file VARCHAR(20) NOT NULL,
  _user_upload VARCHAR(20) NOT NULL DEFAULT '1',
  _datetime_create TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  _use VARCHAR(10) NOT NULL DEFAULT '1'
);

CREATE TABLE IF NOT EXISTS _front_name (
  id BIGSERIAL PRIMARY KEY,
  _front_name TEXT NOT NULL,
  _datetime_create TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  _use VARCHAR(10) NOT NULL DEFAULT '1'
);

CREATE TABLE IF NOT EXISTS _lposition (
  id BIGSERIAL PRIMARY KEY,
  _lposition TEXT NOT NULL,
  _datetime_create TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  _use VARCHAR(10) NOT NULL DEFAULT '1'
);

CREATE TABLE IF NOT EXISTS _part (
  id BIGSERIAL PRIMARY KEY,
  _part TEXT NOT NULL,
  _datetime_create TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  _use VARCHAR(10) NOT NULL DEFAULT '1'
);

CREATE TABLE IF NOT EXISTS _position (
  id BIGSERIAL PRIMARY KEY,
  _position TEXT NOT NULL,
  _datetime_create TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  _use VARCHAR(10) NOT NULL DEFAULT '1'
);

CREATE TABLE IF NOT EXISTS _signature (
  id BIGSERIAL PRIMARY KEY,
  _signature_self_sign_name TEXT NOT NULL,
  _signature_self_sign_position TEXT NOT NULL,
  _signature_self_sign_position_2 TEXT,
  _signature_self_sign_position_3 TEXT,
  _signature_self_file_name TEXT NOT NULL,
  _signature_self_file_real_name TEXT NOT NULL,
  _signature_self_file_path TEXT NOT NULL,
  _signature_self_select VARCHAR(10) NOT NULL DEFAULT '1',
  _signature_work_now VARCHAR(10),
  _datetime_upload TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS _project (
  id BIGSERIAL PRIMARY KEY,
  _project_name TEXT NOT NULL,
  _details_project TEXT NOT NULL DEFAULT '',
  _idp_count_hours VARCHAR(20),
  _training_location TEXT NOT NULL DEFAULT '',
  _user_create VARCHAR(20) NOT NULL DEFAULT '1',
  _date_start_training VARCHAR(30),
  _date_end_training VARCHAR(30),
  _time_start VARCHAR(20) NOT NULL DEFAULT '',
  _time_end VARCHAR(20),
  _cert_template VARCHAR(20),
  _signature_id VARCHAR(20),
  _status_publish VARCHAR(10) NOT NULL DEFAULT '1',
  _datetime_create TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS _user (
  id BIGSERIAL PRIMARY KEY,
  _user VARCHAR(100) NOT NULL UNIQUE,
  _pass VARCHAR(255) NOT NULL,
  _front_name VARCHAR(20) NOT NULL DEFAULT '1',
  _fname TEXT NOT NULL,
  _lname TEXT NOT NULL,
  _position VARCHAR(20) NOT NULL DEFAULT '1',
  _lposition VARCHAR(20) NOT NULL DEFAULT '1',
  _part VARCHAR(20),
  _authentication_level VARCHAR(20) NOT NULL DEFAULT '2',
  _datetime_create TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS _user_assign_project (
  id BIGSERIAL PRIMARY KEY,
  _project_id INTEGER NOT NULL,
  _user_id VARCHAR(20) NOT NULL DEFAULT '0',
  _front_name TEXT,
  _fname TEXT,
  _lname TEXT,
  _position TEXT,
  _lposition TEXT,
  _part TEXT,
  _datetime_assign TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) with open policies for the app's publishable key
-- (You can tighten these policies later if you migrate to Supabase Auth)
ALTER TABLE _authentication_level ENABLE ROW LEVEL SECURITY;
ALTER TABLE _cert_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE _front_name ENABLE ROW LEVEL SECURITY;
ALTER TABLE _lposition ENABLE ROW LEVEL SECURITY;
ALTER TABLE _part ENABLE ROW LEVEL SECURITY;
ALTER TABLE _position ENABLE ROW LEVEL SECURITY;
ALTER TABLE _signature ENABLE ROW LEVEL SECURITY;
ALTER TABLE _project ENABLE ROW LEVEL SECURITY;
ALTER TABLE _user ENABLE ROW LEVEL SECURITY;
ALTER TABLE _user_assign_project ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    '_authentication_level', '_cert_template', '_front_name', '_lposition',
    '_part', '_position', '_signature', '_project', '_user', '_user_assign_project'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all for anon" ON %I', t);
    EXECUTE format('CREATE POLICY "Allow all for anon" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- Storage buckets for certificate templates and signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('cert', 'cert', true), ('sign', 'sign', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read cert_sign" ON storage.objects;
CREATE POLICY "Public Read cert_sign" ON storage.objects FOR SELECT USING (bucket_id IN ('cert', 'sign'));

DROP POLICY IF EXISTS "Public Insert cert_sign" ON storage.objects;
CREATE POLICY "Public Insert cert_sign" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('cert', 'sign'));
