import {
  graphql,
  graphqlMutationLegacy,
  formatQuery,
  formatPageQuery,
  formatPageQueryWithCount,
  formatJsonField,
  decodeId,
  formatMutation,
  formatGQLString,
  graphqlWithVariables,
} from "@openimis/fe-core";

const FAMILY_HEAD_PROJECTION =
  "headInsuree{id,uuid,chfId,lastName,otherNames,email,phone,dob,gender{code},camuNumber,status}";

const FAMILY_FULL_PROJECTION = (mm) => [
  "id",
  "uuid",
  "poverty",
  "confirmationNo",
  "confirmationType{code}",
  "familyType{code}",
  "address",
  "validityFrom",
  "validityTo",
  "status",
  FAMILY_HEAD_PROJECTION,
  "location" + mm.getProjection("location.Location.FlatProjection"),
  "clientMutationId",
  "jsonExt",
];

export const FAMILY_PICKER_PROJECTION = ["id", "uuid", "headInsuree{id chfId uuid lastName otherNames}"];

const INSUREE_FULL_PROJECTION = (mm) => [
  "id",
  "uuid",
  "chfId",
  "lastName",
  "otherNames",
  "dob",
  "age",
  "validityFrom",
  "validityTo",
  "status",
  "statusComment",
  "biometricsStatus",
  "biometricsIsMaster",
  "photoUrl",
  `family{${FAMILY_FULL_PROJECTION(mm).join(",")}}`,
  `photo{id,uuid,date,folder,filename,officerId,photo}`,
  "gender{code}",
  "education{id}",
  "profession{id}",
  "marital",
  "cardIssued",
  "currentVillage" + mm.getProjection("location.Location.FlatProjection"),
  "currentAddress",
  "typeOfId{code}",
  "passport",
  "relationship{id}",
  "head",
  "email",
  "phone",
  "healthFacility" + mm.getProjection("location.HealthFacilityPicker.projection"),
  "jsonExt",
  "camuNumber",
];

export const INSUREE_PICKER_PROJECTION = ["id", "uuid", "chfId", "lastName", "otherNames"];

export function fetchInsureeGenders() {
  const payload = formatQuery("insureeGenders", null, ["code"]);
  return graphql(payload, "INSUREE_GENDERS");
}

export function fetchInsuree(mm, chfid) {
  let payload = formatPageQuery(
    "insurees",
    [`chfId:"${chfid}", ignoreLocation:true`],
    [
      "id",
      "uuid",
      "chfId",
      "lastName",
      "otherNames",
      "dob",
      "age",
      "validityFrom",
      "validityTo",
      "gender{code}",
      `family{id}`,
      "photo{folder,filename,photo}",
      "gender{code, gender, altLanguage}",
      "photoUrl",
      "camuNumber",
      "status",
      "statusComment",
      "biometricsStatus",
      "biometricsIsMaster",
      "healthFacility" + mm.getProjection("location.HealthFacilityPicker.projection"),
      "jsonExt",
    ],
  );
  return graphql(payload, "INSUREE_INSUREE");
}

export function fetchInsureeFull(mm, uuid) {
  let payload = formatPageQuery("insurees", [`uuid:"${uuid}"`], INSUREE_FULL_PROJECTION(mm), "clientMutationId");
  return graphql(payload, "INSUREE_INSUREE");
}

export function fetchInsureesForPicker(mm, filters) {
  let payload = formatPageQueryWithCount("insurees", filters, INSUREE_FULL_PROJECTION(mm));
  return graphql(payload, "INSUREE_INSUREES");
}

export function clearInsuree() {
  return (dispatch) => {
    dispatch({ type: "INSUREE_INSUREE_CLEAR" });
  };
}

export function fetchFamilySummaries(mm, filters) {
  let projections = [
    "id",
    "uuid",
    "poverty",
    "confirmationNo",
    "validityFrom",
    "validityTo",
    "status",

    "headInsuree{id,uuid,chfId,lastName,otherNames,email,phone, dob,camuNumber}",
    "location" + mm.getProjection("location.Location.FlatProjection"),
  ];
  const payload = formatPageQueryWithCount("families", filters, projections);
  return graphql(payload, "INSUREE_FAMILIES");
}
export function fetchPendingForApproval(mm, familyUuid, headInsureeChfId) {
  let filters = [];
  // if (!!familyUuid) {
  //   filters.push(`uuid: "${familyUuid}"`, "showHistory: true");
  // } else {
  //   filters.push(`headInsuree_ChfId: "${headInsureeChfId}"`);
  // }
  const payload = formatPageQuery("approverFamilies", filters, FAMILY_FULL_PROJECTION(mm));
  return graphql(payload, "INSUREE_PENDINGAPPROVAL");
}

export function fetchFamilyMembers(mm, filters) {
  let projections = [
    "uuid",
    "chfId",
    "otherNames",
    "lastName",
    "head",
    "phone",
    "gender{code}",
    "dob",
    "cardIssued",
    "status",
    "statusComment",
    // "biometrics_status"
  ];
  const payload = formatPageQueryWithCount("familyMembers", filters, projections);
  return graphql(payload, "INSUREE_FAMILY_MEMBERS");
}

export function checkCanAddInsuree(family) {
  let filters = [`familyId:${decodeId(family.id)}`];
  const payload = formatQuery("canAddInsuree", filters, null);
  return graphql(payload, "INSUREE_FAMILY_CAN_ADD_INSUREE");
}

export function selectFamilyMember(member) {
  return (dispatch) => {
    dispatch({ type: "INSUREE_FAMILY_MEMBER", payload: member });
  };
}

export function fetchConfirmationTypes() {
  const payload = formatQuery("confirmationTypes", null, ["code"]);
  return graphql(payload, "INSUREE_CONFIRMATION_TYPES");
}

export function fetchFamilyTypes() {
  const payload = formatQuery("familyTypes", null, ["code"]);
  return graphql(payload, "INSUREE_FAMILY_TYPES");
}

export function newFamily() {
  return (dispatch) => {
    dispatch({ type: "INSUREE_FAMILY_NEW" });
  };
}

export function fetchFamilyMutation(mm, clientMutationId) {
  let payload = formatPageQuery(
    "mutationLogs",
    [`clientMutationId:"${clientMutationId}"`],
    ["id", "families{family{uuid}}"],
  );
  return graphql(payload, "INSUREE_INSUREE");
}

export function fetchInsureeMutation(mm, clientMutationId) {
  let payload = formatPageQuery(
    "mutationLogs",
    [`clientMutationId:"${clientMutationId}"`],
    ["id", "insurees{insuree{uuid}}"],
  );
  return graphql(payload, "INSUREE_INSUREE");
}

export function fetchInsureeOfficers(mm) {
  const payload = formatPageQuery("insureeOfficers", null, mm.getRef("insuree.InsureeOfficerPicker.projection"));
  return graphql(payload, "INSUREE_INSUREE_OFFICERS");
}

export function fetchFamily(mm, familyUuid, headInsureeChfId) {
  let filters = [];
  if (!!familyUuid) {
    filters.push(`uuid: "${familyUuid}"`, "showHistory: true");
  } else {
    filters.push(`headInsuree_ChfId: "${headInsureeChfId}"`);
  }
  const payload = formatPageQuery("families", filters, FAMILY_FULL_PROJECTION(mm));
  return graphql(payload, "INSUREE_FAMILY_OVERVIEW");
}

export function fetchEducations(mm) {
  const payload = formatQuery("educations", null, ["id"]);
  return graphql(payload, "INSUREE_EDUCATIONS");
}

export function fetchProfessions(mm) {
  const payload = formatQuery("professions", null, ["id"]);
  return graphql(payload, "INSUREE_PROFESSIONS");
}

export function fetchCountries(mm) {
  const payload = formatQuery("country", null, ["code"]);
  return graphql(payload, "INSUREE_COUNTRIES");
}

export function fetchIdentificationTypes(mm) {
  const payload = formatQuery("identificationTypes", null, ["code"]);
  return graphql(payload, "INSUREE_IDENTIFICATION_TYPES");
}

export function fetchRelations(mm) {
  const payload = formatQuery("relations", null, ["id"]);
  return graphql(payload, "INSUREE_RELATIONS");
}

export function fetchInsureeSummaries(mm, filters) {
  var projections = [
    "id",
    "uuid",
    "validityFrom",
    "validityTo",
    "chfId",
    "otherNames",
    "lastName",
    "phone",
    "gender{code}",
    "dob",
    "marital",
    "camuNumber",
    "family{uuid,location" + mm.getProjection("location.Location.FlatProjection") + "}",
    "currentVillage" + mm.getProjection("location.Location.FlatProjection"),
  ];
  const payload = formatPageQueryWithCount("insurees", filters, projections);
  return graphql(payload, "INSUREE_INSUREES");
}

function formatInsureePhoto(photo) {
  return `{
    ${!!photo.id ? `id: ${decodeId(photo.id)}` : ""}
    ${!!photo.uuid ? `uuid: "${photo.uuid}"` : ""}
    ${!!photo.officerId ? `officerId: ${decodeId(photo.officerId)}` : ""}
    ${!!photo.date ? `date: "${photo.date}"` : ""}
    ${!!photo.photo ? `photo: "${photo.photo}"` : ""}
    ${!!photo.folder ? `folder: ${JSON.stringify(photo.folder)}` : ""}
    ${!!photo.folder ? `filename: ${JSON.stringify(photo.filename)}` : ""}
  }`;
}

function formatInsureeDocument(docs) {
  return `
    ${!!docs.comments ? `comments: "${docs.comments}"` : ""}
    ${!!docs.newStatus ? `newStatus: "${docs.newStatus}"` : ""}
    ${!!docs.documentId ? `documentId: "${docs.documentId}"` : ""}
  `;
}
function formatExternalDocument(docs, tempCamu) {
  const newarray = docs.map((doc) => ({
    documentId: doc.documentId,
    status: doc.documentStatus,
    comments: doc.comments || "",
  }));

  const result = {
    tempCamuNumber: tempCamu || "",
    documentUpdates: newarray,
  };

  const formattedResult = `
    tempCamuNumber: "${result.tempCamuNumber}",
    documentUpdates: [
    ${result.documentUpdates
      .map(
        (update) =>
          `{ documentId: "${update.documentId}", status: "${update.status}", comments: "${update.comments}" }`,
      )
      .join("\n")}
    ]
  `;

  return formattedResult;
}
function formatMail(edited) {
  console.log(edited, "format");
  let reportName = "";
  if (edited?.camuNumber != null) {
    reportName = "enrollment_receipt";
  } else {
    reportName = "pre_enrollment_receipt";
  }
  const formatMail = `uuid: "${edited?.uuid}",  isEmail: ${true},reportName: "${reportName}"`;
  return formatMail;
}
// function formatExternalDocument(docs, tempCamu) {
//   const newarray = docs.map((doc) => ({
//     documentId: doc.documentId,
//     status: doc.documentStatus,
//     comments: doc.comments || "",
//   }));

//   return `
//   ${!!tempCamu ? `tempCamuNumber: "${tempCamu}"` : ""}
//   ${!!docs ? `documentUpdates: ${JSON.stringify(newarray)}` : ""}
//   `;
// }

export function formatInsureeGQL(mm, insuree) {
  return `
    ${insuree.uuid !== undefined && insuree.uuid !== null ? `uuid: "${insuree.uuid}"` : ""}
    ${!!insuree.chfId ? `chfId: "${formatGQLString(insuree.chfId)}"` : ""}
    ${!!insuree.lastName ? `lastName: "${formatGQLString(insuree.lastName)}"` : ""}
    ${!!insuree.otherNames ? `otherNames: "${formatGQLString(insuree.otherNames)}"` : ""}
    ${!!insuree.gender && !!insuree.gender.code ? `genderId: "${insuree.gender.code}"` : ""}
    ${!!insuree.dob ? `dob: "${insuree.dob}"` : ""}
    head: ${!!insuree.head}
    ${!!insuree.marital ? `marital: "${insuree.marital}"` : ""}
    ${!!insuree.passport ? `passport: "${formatGQLString(insuree.passport)}"` : ""}
    ${!!insuree.phone ? `phone: "${formatGQLString(insuree.phone)}"` : ""}
    ${!!insuree.email ? `email: "${formatGQLString(insuree.email)}"` : ""}
    ${!!insuree.currentAddress ? `currentAddress: "${formatGQLString(insuree.currentAddress)}"` : ""}
    ${
      !!insuree.currentVillage && !!insuree.currentVillage.id
        ? `currentVillageId: ${decodeId(insuree.currentVillage.id)}`
        : ""
    }
    ${!!insuree.photo ? `photo:${formatInsureePhoto(insuree.photo)}` : ""}
    cardIssued:${!!insuree.cardIssued}
    ${!!insuree.profession && !!insuree.profession.id ? `professionId: ${insuree.profession.id}` : ""}
    ${!!insuree.education && !!insuree.education.id ? `educationId: ${insuree.education.id}` : ""}
    ${!!insuree.typeOfId && !!insuree.typeOfId.code ? `typeOfIdId: "${insuree.typeOfId.code}"` : ""}
    ${!!insuree.family && !!insuree.family.id ? `familyId: ${decodeId(insuree.family.id)}` : ""}
    ${!!insuree.relationship && !!insuree.relationship.id ? `relationshipId: ${insuree.relationship.id}` : ""}
    ${
      !!insuree.healthFacility && !!insuree.healthFacility.id
        ? `healthFacilityId: ${decodeId(insuree.healthFacility.id)}`
        : ""
    }
    ${!!insuree.status ? `status: "${insuree.status}"` : ""}
    ${!!insuree.statusComment ? `statusComment: "${insuree.statusComment}"` : ""}
    ${!!insuree.jsonExt ? `jsonExt: ${formatJsonField(insuree.jsonExt)}` : ""}
  `;
}

export function formatFamilyGQL(mm, family) {
  let headInsuree = family.headInsuree;
  headInsuree["head"] = true;
  return `
    ${family.uuid !== undefined && family.uuid !== null ? `uuid: "${family.uuid}"` : ""}
    headInsuree: {${formatInsureeGQL(mm, headInsuree)}}
    ${!!family.location ? `locationId: ${decodeId(family.location.id)}` : ""}
    poverty: ${!!family.poverty}
    ${!!family.familyType && !!family.familyType.code ? `familyTypeId: "${family.familyType.code}"` : ""}
    ${!!family.address ? `address: "${formatGQLString(family.address)}"` : ""}
    ${
      !!family.confirmationType && !!family.confirmationType.code
        ? `confirmationTypeId: "${family.confirmationType.code}"`
        : ""
    }
    ${!!family.confirmationNo ? `confirmationNo: "${formatGQLString(family.confirmationNo)}"` : ""}
    ${!!family.jsonExt ? `jsonExt: ${formatJsonField(family.jsonExt)}` : ""}
    ${!!family.contribution ? `contribution: ${formatJsonField(family.contribution)}` : ""}
  `;
}

export function createFamily(mm, family, clientMutationLabel, additionalRequest = "") {
  let mutation = formatMutation("createFamily", formatFamilyGQL(mm, family), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphqlMutationLegacy(
    mutation.payload,
    ["INSUREE_MUTATION_REQ", "INSUREE_CREATE_FAMILY_RESP", "INSUREE_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
    true,
    additionalRequest,
  );
}
export function updateFamily(mm, family, clientMutationLabel, additionalRequest = "") {
  let mutation = formatMutation("updateFamily", formatFamilyGQL(mm, family), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphqlMutationLegacy(
    mutation.payload,
    ["INSUREE_MUTATION_REQ", "INSUREE_UPDATE_FAMILY_RESP", "INSUREE_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      familyUuid: family.uuid,
    },
    true,
    additionalRequest,
  );
}

export function deleteFamily(mm, family, deleteMembers, clientMutationLabel) {
  let mutation = formatMutation(
    "deleteFamilies",
    `uuids: ["${family.uuid}"], deleteMembers: ${deleteMembers}`,
    clientMutationLabel,
  );
  family.clientMutationId = mutation.clientMutationId;
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["INSUREE_MUTATION_REQ", "INSUREE_DELETE_FAMILY_RESP", "INSUREE_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
    familyUuid: family.uuid,
  });
}

export function createInsuree(mm, insuree, clientMutationLabel) {
  let mutation = formatMutation("createInsuree", formatInsureeGQL(mm, insuree), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphqlMutationLegacy(
    mutation.payload,
    ["INSUREE_MUTATION_REQ", "INSUREE_CREATE_INSUREE_RESP", "INSUREE_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
    true,
    "insurees { id insuree {chfId camuNumber}}",
  );
}

export function updateInsuree(mm, insuree, clientMutationLabel) {
  let mutation = formatMutation("updateInsuree", formatInsureeGQL(mm, insuree), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphqlMutationLegacy(
    mutation.payload,
    ["INSUREE_MUTATION_REQ", "INSUREE_UPDATE_INSUREE_RESP", "INSUREE_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
    true,
    "insurees { id insuree {camuNumber chfId}}",
  );
}

export function removeInsuree(mm, family_uuid, insuree, cancelPolicies, clientMutationLabel) {
  let mutation = formatMutation(
    "removeInsurees",
    `uuid: "${family_uuid}", uuids: ["${insuree.uuid}"], cancelPolicies: ${cancelPolicies}`,
    clientMutationLabel,
  );
  insuree.clientMutationId = mutation.clientMutationId;
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["INSUREE_MUTATION_REQ", "INSUREE_REMOVE_INSUREES_RESP", "INSUREE_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
    familyUuid: family_uuid,
  });
}
export function deleteInsuree(mm, family_uuid, insuree, clientMutationLabel) {
  let mutation = formatMutation(
    "deleteInsurees",
    `${!!family_uuid ? `uuid: "${family_uuid}",` : ""} uuids: ["${insuree.uuid}"]`,
    clientMutationLabel,
  );
  insuree.clientMutationId = mutation.clientMutationId;
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["INSUREE_MUTATION_REQ", "INSUREE_DELETE_INSUREES_RESP", "INSUREE_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
    familyUuid: family_uuid,
  });
}

export function setFamilyHead(mm, family_uuid, insuree_uuid, clientMutationLabel) {
  let mutation = formatMutation(
    "setFamilyHead",
    `uuid: "${family_uuid}", insureeUuid: "${insuree_uuid}"`,
    clientMutationLabel,
  );
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["INSUREE_MUTATION_REQ", "INSUREE_SET_FAMILY_HEAD_RESP", "INSUREE_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
    familyUuid: family_uuid,
  });
}

export function changeFamily(mm, family_uuid, insuree, cancelPolicies, clientMutationLabel) {
  let mutation = formatMutation(
    "changeInsureeFamily",
    `familyUuid: "${family_uuid}", insureeUuid: "${insuree.uuid}", cancelPolicies: ${cancelPolicies}`,
    clientMutationLabel,
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["INSUREE_MUTATION_REQ", "INSUREE_CHANGE_FAMILY_HEAD_RESP", "INSUREE_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      familyUuid: family_uuid,
      insureeUuid: insuree.uuid,
    },
  );
}

export function insureeNumberValidationCheck(mm, variables) {
  return graphqlWithVariables(
    `
    query ($insuranceNumber: String!) {
      insureeNumberValidity(insureeNumber: $insuranceNumber) {
        isValid
        errorCode
        errorMessage
      }
    }
    `,
    variables,
    `INSUREE_NUMBER_VALIDATION_FIELDS`,
  );
}

export function insureeNumberSetValid() {
  return (dispatch) => {
    dispatch({ type: `INSUREE_NUMBER_VALIDATION_FIELDS_SET_VALID` });
  };
}

export function insureeNumberValidationClear() {
  return (dispatch) => {
    dispatch({ type: `INSUREE_NUMBER_VALIDATION_FIELDS_CLEAR` });
  };
}

export function checkIfHeadSelected(insuree) {
  const headSelected = Boolean(insuree) ? true : false;

  return (dispatch) => {
    dispatch({ type: "INSUREE_CHECK_IS_HEAD_SELECTED", payload: { headSelected } });
  };
}

// export function selectTaskGroupUser(center, variables) {
//   graphqlWithVariables(
//     `
//   query TaskGroupByCenter {
//   taskGroupByCenter(center: ${center}) {
//   createdBy
//   modifiedBy
//   createdTime
//   modifiedTime
//   status
//   id
//   uuid
//   name
//   center
//   locationId
//   }
//   }
//   `,
//     {},
//     "TASKGROUP_USER_FILTER_CENTER_SELECTED",
//   );
// }

export const fetchInsureeDocuments = (tempCamu) => {
  const payload = formatQuery(
    "insureeDocuments",
    [`tempCamu: "${tempCamu}"`],
    ["id", "documentId", "documentName", "documentPath", "documentStatus", "comments", "tempCamu"],
  );
  return graphql(payload, "INSUREE_DOCUMENTS");
};

export function updateInsureeDocument(mm, insuree) {
  let mutation = `mutation{updateDocumentStatus(
        ${formatInsureeDocument(mm, insuree)}
    ) {
        success
        message
    }}`;
  return graphql(
    mutation,
    ["INSUREE_MUTATION_REQ", "INSUREE_UPDATE_DOCUMENT_RESP", "INSUREE_MUTATION_ERR"],
    "success message internalId",
  );
}

export function updateExternalDocuments(mm, docs, tempCamu) {
  let mutation = `mutation 
  updateStatusInExternalEndpoint(${formatExternalDocument(docs, tempCamu)}) {
    success
    message
    responses
  }`;
  return graphql(
    mutation,
    ["INSUREE_MUTATION_REQ", "INSUREE_UPDATE_EXTERNAL_DOCUMENT_RESP", "INSUREE_MUTATION_ERR"],
    "success message responses",
  );
}
export function sendEmail(mm, edited) {
  let mutation = `mutation SendNotification{
    sentNotification(${formatMail(edited)}) {
    success
    message
  }}`;
  return graphql(
    mutation,
    ["INSUREE_MUTATION_REQ", "INSUREE_SEND_EMAIL_RESP", "INSUREE_MUTATION_ERR"],
    "success message responses",
  );
}
