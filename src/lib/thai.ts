const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];

const THAI_MONTHS: Record<string, string> = {
  "01": "มกราคม",
  "02": "กุมภาพันธ์",
  "03": "มีนาคม",
  "04": "เมษายน",
  "05": "พฤษภาคม",
  "06": "มิถุนายน",
  "07": "กรกฎาคม",
  "08": "สิงหาคม",
  "09": "กันยายน",
  "10": "ตุลาคม",
  "11": "พฤศจิกายน",
  "12": "ธันวาคม",
};

export function toThaiDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input).replace(/[0-9]/g, (d) => THAI_DIGITS[Number(d)]);
}

export function formatThaiDate(dateStr: string | null | undefined, withBEPrefix = false): string {
  if (!dateStr) return "";
  const parts = dateStr.trim().split("-");
  if (parts.length !== 3) return toThaiDigits(dateStr);
  const year = parseInt(parts[0], 10);
  const month = THAI_MONTHS[parts[1]] || parts[1];
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(day)) return toThaiDigits(dateStr);
  const beYear = year > 2400 ? year : year + 543;
  const formatted = withBEPrefix
    ? `${day} ${month} พ.ศ. ${beYear}`
    : `${day} ${month} ${beYear}`;
  return toThaiDigits(formatted);
}
