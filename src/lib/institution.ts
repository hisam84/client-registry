export function buildInstitutionData(body: any) {
  const dateOrNull = (v: any) => (v ? new Date(v) : null);
  const strOrNull = (v: any) => (v === undefined || v === null || v === "" ? null : String(v));

  return {
    instituteName: String(body.instituteName),
    instituteNameBangla: strOrNull(body.instituteNameBangla),
    domain: strOrNull(body.domain),
    category: strOrNull(body.category) ?? "Website",
    instituteType: strOrNull(body.instituteType) ?? "School",
    issueDate: dateOrNull(body.issueDate),
    expireDate: dateOrNull(body.expireDate),
    actualExpireDate: dateOrNull(body.actualExpireDate),
    student: strOrNull(body.student),
    condition: strOrNull(body.condition),
    btclUsername: strOrNull(body.btclUsername),
    btclPassword: strOrNull(body.btclPassword),
    btclMobileNo: strOrNull(body.btclMobileNo),
    btclEmail: strOrNull(body.btclEmail),
    btclEmailPassword: strOrNull(body.btclEmailPassword),
    instituteHead: strOrNull(body.instituteHead),
    contact1: strOrNull(body.contact1),
    contact2: strOrNull(body.contact2),
    inChargeTeacher: strOrNull(body.inChargeTeacher),
    designation: strOrNull(body.designation),
    inChargeTeacherContact: strOrNull(body.inChargeTeacherContact),
    subDistrict: strOrNull(body.subDistrict),
    district: strOrNull(body.district),
    address: strOrNull(body.address),
    customFields: body.customFields && typeof body.customFields === "object" ? body.customFields : {},
  };
}
