import InsureeMainMenu from "./menus/InsureeMainMenu";
import FamiliesPage from "./pages/FamiliesPage";
import InsureePage from "./pages/InsureePage";
import FamilyPage from "./pages/FamilyPage";
import { CappedItemServicePage } from "./pages/CappedItemServicePage";
import InsureesPage from "./pages/InsureesPage";
import { ProfilePage } from "./pages/ProfilePage";
import FamilyOverviewPage from "./pages/FamilyOverviewPage";
import Enquiry from "./components/Enquiry";
import InsureeOfficerPicker from "./pickers/InsureeOfficerPicker";
import FamilyPicker from "./pickers/FamilyPicker";
import InsureePicker from "./pickers/InsureePicker";
import InsureeChfIdPicker from "./pickers/InsureeChfIdPicker";
import InsureeGenderPicker from "./pickers/InsureeGenderPicker";
import EducationPicker from "./pickers/EducationPicker";
import ProfessionPicker from "./pickers/ProfessionPicker";
import IdentificationTypePicker from "./pickers/IdentificationTypePicker";
import CountryPicker from "./pickers/CountryPicker";
import InsureeMaritalStatusPicker from "./pickers/InsureeMaritalStatusPicker";
import FamilyPovertyStatusPicker from "./pickers/FamilyPovertyStatusPicker";
import ConfirmationTypePicker from "./pickers/ConfirmationTypePicker";
import FamilyTypePicker from "./pickers/FamilyTypePicker";
import PhotoStatusPicker from "./pickers/PhotoStatusPicker";
import RelationPicker from "./pickers/RelationPicker";
import InsureeNumberInput from "./pickers/InsureeNumberInput";
import InsureeAvatar from "./components/InsureeAvatar";
import InsureeCappedItemServiceLink from "./components/InsureeCappedItemServiceLink";
import InsureeProfileLink from "./components/InsureeProfileLink";
import InsureeSummary from "./components/InsureeSummary";
import InsureeFirstServicePointDisplay from "./components/InsureeFirstServicePointDisplay";
import InsureeFirstServicePointPanel from "./components/InsureeFirstServicePointPanel";
import InsureeDocuments from "./components/InsureeDocuments";
import InsureeAddress from "./components/InsureeAddress";
import FamilyDisplayPanel from "./components/FamilyDisplayPanel";
import { familyLabel } from "./utils/utils";
import messages_en from "./translations/en.json";
import reducer from "./reducer";
import { FAMILY_PICKER_PROJECTION, INSUREE_PICKER_PROJECTION } from "./actions";
import { decodeId } from "@openimis/fe-core";
import EnrolledFamiliesReport from "./reports/EnrolledFamiliesReport";
import InsureeFamilyOverviewReport from "./reports/InsureeFamilyOverviewReport";
import InsureeMissingPhotoReport from "./reports/InsureeMissingPhotoReport";
import InsureePendingEnrollmentReport from "./reports/InsureePendingEnrollmentReport";
import RejectCommentPicker from "./pickers/RejectCommentPicker";
import ReviewerPicker from "./pickers/ReviwerPicker";
import PendingApproval from "./components/PendingApproval";
import PolicySummary from "./components/PolicySummary";

const ROUTE_INSUREE_FAMILIES = "insuree/families";
const ROUTE_INSUREE_FAMILY_OVERVIEW = "insuree/families/familyOverview";
const ROUTE_INSUREE_FAMILY = "insuree/family";
const ROUTE_INSUREE_INSUREES = "insuree/insurees";
const ROUTE_INSUREE_INSUREE = "insuree/insurees/insuree";
const ROUTE_INSUREE_PENDINGAPPROVAL = "insuree/insurees/pendingapproval";

const DEFAULT_CONFIG = {
  "translations": [{ key: "en", messages: messages_en }],
  "reducers": [{ key: "insuree", reducer }],
  "reports": [
    {
      key: "insuree_missing_photo",
      component: InsureeMissingPhotoReport,
      isValid: (values) => true,
      getParams: (values) => {
        const params = {};
        if (values.officer) {
          params.officerId = decodeId(values.officer.id);
        }
        if (values.location) {
          params.locationId = decodeId(values.location.id);
        }
        return params;
      },
    },
    {
      key: "insurees_pending_enrollment",
      component: InsureePendingEnrollmentReport,
      isValid: (values) => values.officer && values.location && values.dateFrom && values.dateTo,
      getParams: (values) => ({
        dateFrom: values.dateFrom,
        dateTo: values.dateTo,
        officerId: decodeId(values.officer.id),
        locationId: decodeId(values.location.id),
      }),
    },
    {
      key: "insuree_family_overview",
      component: InsureeFamilyOverviewReport,
      isValid: (values) => values.dateFrom && values.dateTo,
      getParams: (values) => ({
        dateFrom: values.dateFrom,
        dateTo: values.dateTo,
      }),
    },
    {
      key: "enrolled_families",
      component: EnrolledFamiliesReport,
      isValid: (values) => values.location && values.dateFrom && values.dateTo,
      getParams: (values) => ({
        locationId: decodeId(values.location.id),
        dateFrom: values.dateFrom,
        dateTo: values.dateTo,
      }),
    },
  ],
  "refs": [
    { key: "insuree.InsureeOfficerPicker", ref: InsureeOfficerPicker },
    { key: "insuree.InsureeOfficerPicker.projection", ref: ["id", "uuid", "code", "lastName", "otherNames"] },
    { key: "insuree.InsureePicker", ref: InsureePicker },
    { key: "insuree.InsureeChfIdPicker", ref: InsureeChfIdPicker },
    { key: "insuree.InsureePicker.projection", ref: INSUREE_PICKER_PROJECTION },
    { key: "insuree.InsureePicker.sort", ref: "insuree__last_name" },
    { key: "insuree.FamilyPicker", ref: FamilyPicker },
    { key: "insuree.FamilyPicker.projection", ref: FAMILY_PICKER_PROJECTION },
    { key: "insuree.FamilyPicker.sort", ref: "family__head_insuree__lastName" },
    { key: "insuree.familyLabel", ref: familyLabel },
    { key: "insuree.InsureeGenderPicker", ref: InsureeGenderPicker },
    { key: "insuree.InsureeMaritalStatusPicker", ref: InsureeMaritalStatusPicker },
    { key: "insuree.EducationPicker", ref: EducationPicker },
    { key: "insuree.ProfessionPicker", ref: ProfessionPicker },
    { key: "insuree.CountryPicker", ref: CountryPicker },
    { key: "insuree.IdentificationTypePicker", ref: IdentificationTypePicker },
    { key: "insuree.FamilyPovertyStatusPicker", ref: FamilyPovertyStatusPicker },
    { key: "insuree.ConfirmationTypePicker", ref: ConfirmationTypePicker },
    { key: "insuree.FamilyTypePicker", ref: FamilyTypePicker },
    { key: "insuree.PhotoStatusPicker", ref: PhotoStatusPicker },
    { key: "insuree.RelationPicker", ref: RelationPicker },
    { key: "insuree.RejectCommentPicker", ref: RejectCommentPicker },
    { key: "insuree.ReviewerPicker", ref: ReviewerPicker },
    { key: "insuree.InsureeNumberInput", ref: InsureeNumberInput },
    { key: "insuree.TempInsueranceNUmber", ref: "insuree_Temp_Number" },
    // { key: "insuree.BirthPlace", ref: "birth_place" },

    { key: "insuree.route.families", ref: ROUTE_INSUREE_FAMILIES },
    { key: "insuree.route.familyOverview", ref: ROUTE_INSUREE_FAMILY_OVERVIEW },
    { key: "insuree.route.family", ref: ROUTE_INSUREE_FAMILY },
    { key: "insuree.route.insurees", ref: ROUTE_INSUREE_INSUREES },
    { key: "insuree.route.insuree", ref: ROUTE_INSUREE_INSUREE },
    { key: "insuree.route.pendingApproval", ref: ROUTE_INSUREE_PENDINGAPPROVAL },

    { key: "insuree.Avatar", ref: InsureeAvatar },
    { key: "insuree.Summary", ref: InsureeSummary },
    { key: "policyHolder.Summary", ref: PolicySummary },
    { key: "insuree.InsureeFirstServicePointDisplay", ref: InsureeFirstServicePointDisplay },
    { key: "insuree.InsureeFirstServicePointPanel", ref: InsureeFirstServicePointPanel },
    { key: "insuree.InsureeAddress", ref: InsureeAddress },
    { key: "insuree.ProfileLink", ref: InsureeProfileLink },
    { key: "insuree.CappedItemServiceLink", ref: InsureeCappedItemServiceLink },
  ],
  "core.Router": [
    { path: ROUTE_INSUREE_FAMILIES, component: FamiliesPage },
    { path: ROUTE_INSUREE_FAMILY + "/:family_uuid?", component: FamilyPage },
    { path: ROUTE_INSUREE_FAMILY_OVERVIEW + "/:family_uuid", component: FamilyOverviewPage },
    { path: ROUTE_INSUREE_INSUREES, component: InsureesPage },
    { path: ROUTE_INSUREE_INSUREE + "/:insuree_uuid?/:family_uuid?", component: InsureePage },
    { path: "insuree/cappedItemService", component: CappedItemServicePage },
    { path: "insuree/profile", component: ProfilePage },
    { path: "insuree/insurees/pendingapproval", component: PendingApproval },
  ],
  "core.AppBar": [Enquiry],
  "core.MainMenu": [InsureeMainMenu],
  "insuree.InsureeSummaryAvatar": [InsureeAvatar],
  "insuree.InsureeSummaryExt": [InsureeFirstServicePointDisplay],
  "insuree.Insuree.panels": [InsureeFirstServicePointPanel],
  "insuree.Insuree.documents": [InsureeDocuments],
  "policy.Policy.headPanel": [FamilyDisplayPanel],
  "invoice.SubjectAndThirdpartyPicker": [
    {
      type: "insuree",
      picker: InsureePicker,
      pickerProjection: INSUREE_PICKER_PROJECTION,
    },
    {
      type: "family",
      picker: FamilyPicker,
      pickerProjection: FAMILY_PICKER_PROJECTION,
    },
  ],
};

export const InsureeModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
};
