import React from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Paper, Grid, Typography, Divider, Checkbox, FormControlLabel } from "@material-ui/core";
import {
  formatMessage,
  withTooltip,
  FormattedMessage,
  PublishedComponent,
  FormPanel,
  TextInput,
  Contributions,
  withModulesManager,
  ConstantBasedPicker,
} from "@openimis/fe-core";
import _ from "lodash";
import { MAX_BIRTHPLACE_LENGTH, MAX_PHONE_LENGTH } from "../constants";
const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: "100%",
  },
});
const MAX_MAIN_ACTIVITY_LENGTH = 30;
const INSUREE_INSUREE_CONTRIBUTION_KEY = "insuree.Insuree";
const INSUREE_INSUREE_DOCUMENTS_KEY = "insuree.Insuree.documents";
const INSUREE_INSUREE_PANELS_CONTRIBUTION_KEY = "insuree.Insuree.panels";
const CAMU_ENROLMENT_TYPE = [
  "public_Employees",
  "private_sector_employees",
  "Selfemployed_and_liberal_professions",
  "CRF_and_CNSS_pensioners",
  "student",
  "vulnerable_Persons",
];
const CAMU_CIVIL_QUALITY = ["Main Beneficiary", "Depedent Beneficiary spouse", "Depedent Beneficiary child"];
class InsureeMasterPanel extends FormPanel {
  constructor(props) {
    super(props);
    this.phoneValidation = props.modulesManager.getConf(
      "policyHolder",
      "policyHolderForm.phoneValidation",
      {
        regex: /^[0-9]*$/,
        regexMsg: {
          en: formatMessage(
            props.intl,
            "policyHolder",
            "phoneValidation.regexMsg.en"
          ),
          fr: formatMessage(
            props.intl,
            "policyHolder",
            "phoneValidation.regexMsg.fr"
          ),
        },
      }
    );
  }
  // The one from FormPanel does not allow jsonExt patching
  updateExts = (updates) => {
    let data = { ...this.state.data };
    if (data["jsonExt"] === undefined) {
      data["jsonExt"] = updates;
    } else {
      data["jsonExt"] = { ...data["jsonExt"], ...updates };
    }
    if (!data["jsonExt"].dateValidFrom) {
      data["jsonExt"].dateValidFrom = new Date().toISOString().slice(0, 10);
    }
    if (updates?.insureelocations) {
      data["jsonExt"].insureelocations = updates.insureelocations;
    } else if (this.props.family?.location) {
      data["jsonExt"].insureelocations = this.props.family?.location;
    } else if (this.props.edited?.family?.location && !updates?.insureelocations) {
      data["jsonExt"].insureelocations = this.props.edited?.family?.location;
    }

    this.props.onEditedChanged(data);
  };
  componentDidUpdate(prevProps, prevState, snapshot) {
    this._componentDidUpdate(prevProps, prevState, snapshot);
    const { edited } = this.props;
    if (prevProps.edited !== edited) {
      let isFormValid = true;
      if (
        !!this.regexError("phone", edited.phone) ||
        !!this.regexError("email", edited.email)
      ) {
        isFormValid = false;
      }
      // this.props.onValidation(isFormValid);
    }
  }
  regexError = (field, value) => {
    if (!!value) {
      let validation = this[`${field}Validation`];
      return !!validation && !validation["regex"].test(value)
        ? validation["regexMsg"][this.props.intl.locale]
        : false;
    }
    return false;
  };
  render() {
    const {
      intl,
      classes,
      edited,
      title = "Insuree.title",
      titleParams = { label: "" },
      readOnly = true,
      actions,
      edited_id,
    } = this.props;
    return (
      <Grid container>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Grid container className={classes.tableTitle}>
              <Grid item xs={3} container alignItems="center" className={classes.item}>
                <Typography variant="h5">
                  <FormattedMessage module="insuree" id={title} values={titleParams} />
                </Typography>
              </Grid>
              <Grid item xs={9}>
                <Grid container justify="flex-end">
                  {!!edited &&
                    !!edited.family &&
                    !!edited.family.headInsuree &&
                    edited.family.headInsuree.id !== edited.id && (
                      <Grid item xs={3}>
                        <PublishedComponent
                          pubRef="insuree.RelationPicker"
                          withNull={true}
                          nullLabel={formatMessage(this.props.intl, "insuree", `Relation.none`)}
                          readOnly={readOnly}
                          value={!!edited && !!edited.relationship ? edited.relationship.id : ""}
                          onChange={(v) => this.updateAttribute("relationship", { id: v })}
                        />
                      </Grid>
                    )}
                  {!!actions &&
                    actions.map((a, idx) => {
                      return (
                        <Grid item key={`form-action-${idx}`} className={classes.paperHeaderAction}>
                          {withTooltip(a.button, a.tooltip)}
                        </Grid>
                      );
                    })}
                </Grid>
              </Grid>
            </Grid>
            <Divider />
            <Grid container className={classes.item}>
              <Grid item xs={4} className={classes.item}>
                <PublishedComponent
                  pubRef="insuree.InsureeNumberInput"
                  module="insuree"
                  label="Insuree.chfId"
                  required={false}
                  readOnly={true}
                  value={edited?.chfId}
                  edited_id={edited_id}
                  onChange={(v) => this.updateAttribute("chfId", v)}
                />
              </Grid>

              {/* New Added Fields */}

              <Grid item xs={4} className={classes.item}>
                <TextInput
                  pubRef="insuree"
                  module="insuree"
                  label="Camu No."
                  required={false}
                  readOnly={true}
                  value={!!edited && !!edited?.camuNumber ? edited?.camuNumber : ""}
                  // value={!!edited && !!edited.temporary_number ? edited.temporary_number : ""}
                  // edited_id={edited_id}
                  onChange={(v) => this.updateAttribute("temporary_number", v)}
                />
              </Grid>
              <Grid item xs={2} className={classes.item}>
                <TextInput
                  module="insuree"
                  label="niu"
                  required={false}
                  inputProps={{ maxLength: MAX_MAIN_ACTIVITY_LENGTH }}
                  value={!!edited && !!edited.jsonExt ? edited.jsonExt.insureeniu : ""}
                  onChange={(v) => this.updateExts({ insureeniu: v })}
                // readOnly={isPolicyHolderPortalUser}
                />
              </Grid>
              <Grid item xs={3} className={classes.item}>
                <TextInput
                  // pubRef="insuree"
                  module="insuree"
                  label="Insuree.placeofbirth"
                  required={false}
                  inputProps={{ maxLength: MAX_BIRTHPLACE_LENGTH }}
                  // error={this.regexError("email", edited.email)}


                  // readOnly={readOnly}
                  value={!edited?.jsonExt?.BirthPlace ? "" : edited?.jsonExt?.BirthPlace}
                  // edited_id={edited_id}
                  onChange={(v) => this.updateExts({ BirthPlace: v })}
                />
              </Grid>
              <Grid item xs={3} className={classes.item}>
                <ConstantBasedPicker
                  module="insuree"
                  label="Family.enrolmentType"
                  required={true}
                  readOnly={readOnly}
                  value={!!edited && !!edited.jsonExt ? edited.jsonExt.insureeEnrolmentType : null}
                  onChange={(value) => this.updateExts({ insureeEnrolmentType: value })}
                  constants={CAMU_ENROLMENT_TYPE}
                  withNull
                />
              </Grid>
              <Grid item xs={3} className={classes.item}>
                <PublishedComponent
                  pubRef="core.DatePicker"
                  module="insuree"
                  label="Insuree.Created on"
                  required={false}
                  maxDate={!!edited && !!edited.dateValidTo && edited.dateValidTo}
                  value={
                    !!edited && !!edited?.jsonExt?.dateValidFrom
                      ? edited.jsonExt.dateValidFrom
                      : new Date().toISOString().slice(0, 10) // Set the default value to today's date
                  }
                  onChange={(v) => this.updateExts({ dateValidFrom: v ? v : new Date().toISOString().slice(0, 10) })}
                  readOnly={(!!edited && !!edited.id) || readOnly}
                />
              </Grid>
              <Grid item xs={3} className={classes.item}>
                <PublishedComponent
                  pubRef="location.RegionPicker"
                  withNull
                  label={formatMessage(intl, "insuree", "insuree.createdAt")}
                  filterLabels={false}
                  value={!!edited && !!edited?.createdAt ? edited.createdAt : null}
                  onChange={(v) => this.updateExts({ createdAt: v })}
                  readOnly={readOnly}
                />
              </Grid>
              <Grid item xs={12}>
                <PublishedComponent
                  pubRef="location.DetailedLocation"
                  withNull={true}
                  readOnly={
                    !!edited &&
                      !!edited.family &&
                      !!edited.family.headInsuree &&
                      edited.family.headInsuree.id !== edited.id
                      ? readOnly
                      : true
                  }
                  required={true}
                  value={
                    edited_id
                      ? edited?.jsonExt?.insureelocations
                      : edited?.family?.location
                        ? edited?.family?.location
                        : this.props?.family?.location
                  }
                  // value={!edited?.jsonExt?.insureelocations ? "" : edited?.jsonExt?.insureelocations}
                  onChange={(v) => this.updateExts({ insureelocations: v })}
                  filterLabels={false}
                />
              </Grid>

              <Grid item xs={4} className={classes.item}>
                <TextInput
                  module="insuree"
                  label="Family.address"
                  multiline
                  rows={2}
                  required={false}
                  // readOnly={readOnly}
                  // value={!!edited && !!edited.jsonExt.address ? edited.jsonExt.address : ""}
                  value={!edited && !edited?.jsonExt?.insureeaddress ? "" : edited?.jsonExt?.insureeaddress}
                  onChange={(v) => this.updateExts({ insureeaddress: v })}
                />
              </Grid>

              <Grid item xs={4} className={classes.item}>
                <TextInput
                  module="insuree"
                  label="Insuree.lastName"
                  required={true}
                  readOnly={readOnly}
                  value={!!edited && !!edited.lastName ? edited.lastName : ""}
                  onChange={(v) => this.updateAttribute("lastName", v)}
                />
              </Grid>
              <Grid item xs={4} className={classes.item}>
                <TextInput
                  module="insuree"
                  label="Insuree.otherNames"
                  required={true}
                  readOnly={readOnly}
                  value={!!edited && !!edited.otherNames ? edited.otherNames : ""}
                  onChange={(v) => this.updateAttribute("otherNames", v)}
                />
              </Grid>
              <Grid item xs={8}>
                <Grid container>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="core.DatePicker"
                      value={!!edited ? edited.dob : null}
                      module="insuree"
                      label="Insuree.dob"
                      readOnly={readOnly}
                      required={true}
                      maxDate={new Date()}
                      onChange={(v) => this.updateAttribute("dob", v)}
                    />
                  </Grid>
                  <Grid item xs={2} className={classes.item}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          color="primary"
                          checked={!!edited && !!edited.jsonExt && edited.jsonExt.approx}
                          disabled={readOnly}
                          onChange={(e) => {
                            // console.log("e", e, e.target.checked);
                            this.updateExts({ approx: e.target.checked });
                          }}
                        />
                      }
                      label={formatMessage(intl, "insuree", "approx")}
                    />
                  </Grid>

                  <Grid item xs={2} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.InsureeGenderPicker"
                      value={!!edited && !!edited.gender ? edited?.gender?.code : ""}
                      module="insuree"
                      readOnly={readOnly}
                      // withNull={true}
                      required={true}
                      onChange={(v) => this.updateAttribute("gender", { code: v })}
                    />
                  </Grid>
                  <Grid item xs={2} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.InsureeMaritalStatusPicker"
                      value={!!edited && !!edited?.marital ? edited?.marital : ""}
                      module="insuree"
                      readOnly={readOnly}
                      withNull={true}
                      // nullLabel="InsureeMaritalStatus.N"
                      onChange={(v) => this.updateAttribute("marital", v)}
                    />
                  </Grid>
                  <Grid item xs={2} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.CountryPicker"
                      value={!!edited && !!edited.jsonExt ? edited?.jsonExt?.nationality : ""}
                      module="insuree"
                      readOnly={readOnly}
                      withNull={true}
                      label={"insuree.NationalityPicker.label"}
                      onChange={(v) => this.updateExts({ nationality: v })}
                    />
                  </Grid>
                  <Grid item xs={2} className={classes.item}>
                    <TextInput
                      module="insuree"
                      label="Insuree.nbKids"
                      readOnly={readOnly}
                      type="number"
                      value={!!edited && !!edited.jsonExt ? edited?.jsonExt?.nbKids : ""}
                      onChange={(v) => this.updateExts({ nbKids: v })}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          color="primary"
                          checked={!!edited && !!edited?.cardIssued}
                          disabled={readOnly}
                          onChange={(v) => this.updateAttribute("cardIssued", !edited || !edited?.cardIssued)}
                        />
                      }
                      label={formatMessage(intl, "insuree", "Insuree.cardIssued")}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <ConstantBasedPicker
                      module="insuree"
                      label="Family.civilQuality"
                      required={false}
                      readOnly={readOnly}
                      value={!!edited && !!edited.jsonExt ? edited?.jsonExt?.civilQuality : null}
                      onChange={(value) => this.updateExts({ civilQuality: value })}
                      constants={CAMU_CIVIL_QUALITY}
                      withNull
                    />
                  </Grid>

                  <Grid item xs={3} className={classes.item}>
                    {/* <div style={{display:"flex"}}>
                      <div style={{marginTop:"20px"}}>
                        +
                      </div>
                      <div> */}
                    <TextInput
                      module="insuree"
                      label="Insuree.phone"
                      inputProps={{ maxLength: MAX_PHONE_LENGTH }}
                      readOnly={readOnly}
                      value={!!edited && !!edited?.phone ? edited?.phone : ""}
                      error={this.regexError("phone", edited?.phone)}
                      onChange={(v) => this.updateAttribute("phone", v)}
                    />
                    {/* </div>
                    </div> */}

                  </Grid>
                  <Grid item xs={6} className={classes.item}>
                    <TextInput
                      module="insuree"
                      label="Insuree.email"
                      readOnly={readOnly}
                      value={!!edited && !!edited.email ? edited?.email : ""}
                      onChange={(v) => this.updateAttribute("email", v)}
                      
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.ProfessionPicker"
                      module="insuree"
                      value={!!edited && !!edited.profession ? edited?.profession?.id : null}
                      readOnly={readOnly}
                      withNull={true}
                      nullLabel={formatMessage(intl, "insuree", "Profession.none")}
                      onChange={(v) => this.updateAttribute("profession", { id: v })}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.EducationPicker"
                      module="insuree"
                      value={!!edited && !!edited.education ? edited?.education?.id : ""}
                      readOnly={readOnly}
                      withNull={true}
                      // nullLabel={formatMessage(intl, "insuree", "insuree.Education.none")}
                      onChange={(v) => this.updateAttribute("education", { id: v })}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.IdentificationTypePicker"
                      module="insuree"
                      value={!!edited && !!edited.typeOfId ? edited?.typeOfId?.code : null}
                      readOnly={readOnly}
                      withNull={true}
                      nullLabel={formatMessage(intl, "insuree", "IdentificationType.none")}
                      onChange={(v) => this.updateAttribute("typeOfId", { code: v })}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <TextInput
                      module="insuree"
                      label="Insuree.passport"
                      readOnly={readOnly}
                      value={!!edited && !!edited.passport ? edited?.passport : ""}
                      onChange={(v) => this.updateAttribute("passport", !!v ? v : null)}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={4} className={classes.item}>
                <PublishedComponent
                  pubRef="insuree.Avatar"
                  photo={!!edited ? edited.photo : null}
                  readOnly={readOnly}
                  withMeta={true}
                  onChange={(v) => this.updateAttribute("photo", !!v ? v : null)}
                />
              </Grid>
              <Contributions
                {...this.props}
                updateAttribute={this.updateAttribute}
                contributionKey={INSUREE_INSUREE_CONTRIBUTION_KEY}
              />
            </Grid>
            {!!edited && !!edited?.chfId ? (
              <Contributions
                {...this.props}
                updateAttribute={this.updateAttribute}
                contributionKey={INSUREE_INSUREE_DOCUMENTS_KEY}
              />
            ) : null}
          </Paper>
          <Contributions
            edited={edited}
            {...this.props}
            updateAttribute={this.updateAttribute}
            contributionKey={INSUREE_INSUREE_PANELS_CONTRIBUTION_KEY}
          />
        </Grid>
      </Grid>
    );
  }
}

export default withModulesManager(withTheme(withStyles(styles)(InsureeMasterPanel)));
