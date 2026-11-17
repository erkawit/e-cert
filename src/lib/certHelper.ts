import {
  supabase,
  resolveAssetUrl,
  CertTemplateRow,
  ProjectRow,
  SignatureRow,
  UserAssignProjectRow,
} from "./supabase";
import { CertificateRenderData } from "./pdf";

export async function buildCertificateDataForAssignment(
  assignment: UserAssignProjectRow,
  project: ProjectRow,
  templatesMap?: Map<number, CertTemplateRow>,
  signaturesMap?: Map<number, SignatureRow>
): Promise<CertificateRenderData> {
  let tpl: CertTemplateRow | undefined = templatesMap?.get(
    Number(project._cert_template)
  );
  if (!tpl && project._cert_template) {
    const { data } = await supabase
      .from("_cert_template")
      .select("*")
      .eq("id", Number(project._cert_template))
      .maybeSingle();
    if (data) tpl = data as CertTemplateRow;
  }

  let sig: SignatureRow | undefined = signaturesMap?.get(
    Number(project._signature_id)
  );
  if (!sig && project._signature_id) {
    const { data } = await supabase
      .from("_signature")
      .select("*")
      .eq("id", Number(project._signature_id))
      .maybeSingle();
    if (data) sig = data as SignatureRow;
  }

  const recipientName = `${assignment._front_name || ""}${assignment._fname || ""} ${assignment._lname || ""}`.trim();

  return {
    recipientName,
    projectName: project._project_name,
    trainingLocation: project._training_location || "",
    dateStart: project._date_start_training,
    dateEnd: project._date_end_training,
    idpHours: project._idp_count_hours,
    templateUrl: tpl
      ? resolveAssetUrl(tpl._cert_template_path_file, tpl._cert_template_real_name)
      : "",
    signatureUrl: sig
      ? resolveAssetUrl(sig._signature_self_file_path, sig._signature_self_file_real_name)
      : "",
    signerName: sig?._signature_self_sign_name || "",
    signerPosition1: sig?._signature_self_sign_position || "",
    signerPosition2: sig?._signature_self_sign_position_2 || null,
    signerPosition3: sig?._signature_self_sign_position_3 || null,
  };
}
