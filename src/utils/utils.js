import _ from "lodash";

export function insureeLabel(insuree) {
  if (!insuree) return "";
  return `${_.compact([insuree.lastName,  _.startCase(_.toLower(insuree.otherNames))]).join(" ")}${
    !!insuree.camuNumber ? ` (${insuree.camuNumber})` : !!insuree.chfId ? ` (${insuree.chfId})` : ""
  }`;
}

export function familyLabel(family) {
  return !!family && !!family.headInsuree ? insureeLabel(family.headInsuree) : "";
}
