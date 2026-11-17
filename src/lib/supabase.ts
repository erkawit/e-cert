import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://vvzbsfvigsllnoktknve.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_xlKVojG1MyalCDSV5kU_qA_BLQdzTTX";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserRow {
  id: number;
  _user: string;
  _pass: string;
  _front_name: string;
  _fname: string;
  _lname: string;
  _position: string;
  _lposition: string;
  _part: string | null;
  _authentication_level: string;
  _datetime_create: string;
}

export interface ProjectRow {
  id: number;
  _project_name: string;
  _details_project: string;
  _idp_count_hours: string | null;
  _training_location: string;
  _user_create: string;
  _date_start_training: string | null;
  _date_end_training: string | null;
  _time_start: string;
  _time_end: string | null;
  _cert_template: string | null;
  _signature_id: string | null;
  _status_publish: string;
  _datetime_create: string;
}

export interface CertTemplateRow {
  id: number;
  _cert_template_name: string;
  _cert_template_real_name: string | null;
  _cert_template_path_file: string;
  _cert_template_lname_file: string;
  _user_upload: string;
  _datetime_create: string;
  _use: string;
}

export interface SignatureRow {
  id: number;
  _signature_self_sign_name: string;
  _signature_self_sign_position: string;
  _signature_self_sign_position_2: string | null;
  _signature_self_sign_position_3: string | null;
  _signature_self_file_name: string;
  _signature_self_file_real_name: string;
  _signature_self_file_path: string;
  _signature_self_select: string;
  _signature_work_now: string | null;
  _datetime_upload: string;
}

export interface UserAssignProjectRow {
  id: number;
  _project_id: number;
  _user_id: string;
  _front_name: string | null;
  _fname: string | null;
  _lname: string | null;
  _position: string | null;
  _lposition: string | null;
  _part: string | null;
  _datetime_assign: string;
}

export interface LookupRow {
  id: number;
  _use?: string;
  _front_name?: string;
  _position?: string;
  _lposition?: string;
  _part?: string;
  _authentication_level?: string;
}

/**
 * Resolves asset path from legacy DB values (e.g. "../../cert/" or "cert/")
 * or full Supabase Storage URLs into a fetchable browser URL.
 */
export function resolveAssetUrl(pathFile: string | null | undefined, fileName: string | null | undefined): string {
  if (!fileName) return "";
  if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
    return fileName;
  }
  const cleanPath = (pathFile || "").replace(/^(\.\.\/)+/, "").replace(/^\/+/, "");
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return `${cleanPath.replace(/\/$/, "")}/${fileName}`;
  }
  return `/${cleanPath}${fileName}`;
}
