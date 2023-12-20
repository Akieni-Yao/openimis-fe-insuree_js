import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import ReplayIcon from "@material-ui/icons/Replay";
import {
  formatMessageWithValues,
  withModulesManager,
  withHistory,
  historyPush,
  Form,
  ProgressOrError,
  journalize,
  coreConfirm,
  parseData,
  Helmet,
  FormattedMessage
} from "@openimis/fe-core";
import { RIGHT_FAMILY, RIGHT_FAMILY_EDIT } from "../constants";
import FamilyMasterPanel from "./FamilyMasterPanel";

import { fetchFamily, newFamily, createFamily, fetchFamilyMutation, printReport, FamilysendEmail } from "../actions";
import FamilyInsureesOverview from "./FamilyInsureesOverview";
import HeadInsureeMasterPanel from "./HeadInsureeMasterPanel";
import { Button, Tooltip, IconButton, Typography, Grid, Dialog, DialogActions, DialogContent, DialogContentText } from "@material-ui/core";
import { insureeLabel } from "../utils/utils";
import HelpIcon from "@material-ui/icons/Help";
import { formatMessage } from "@openimis/fe-core";
import FileCopyIcon from "@material-ui/icons/FileCopy";

const styles = (theme) => ({
  lockedPage: theme.page.locked,
  approvedBtn: {
    backgroundColor: "#FFFFFF",
    borderColor: "#00913E",
    color: "#00913E",
    borderRadius: "2rem",
  },
  rejectBtn: {
    backgroundColor: "#FFFFFF",
    borderColor: "##FF0000",
    color: "##FF0000",
    borderRadius: "2rem",
  },
  commonBtn: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FF841C",
    color: "#FF841C",
    borderRadius: "2rem",
  },
  noBtnClasses: {
    visibility: "hidden",
  },
  customWidth: {
    maxWidth: 500,
  },
  margin2: {
    display: "flex",
    paddingTop: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
  spanPadding: {
    paddingTop: theme.spacing(1),
    marginRight: "5px",
  },
  dialogBg: {
    backgroundColor: "#FFFFFF",
    width: 300,
    paddingRight: 20,
    paddingLeft: 20,
    paddingTop: 10,
    paddingBootom: 10,
  },
  dialogText: {
    color: "#000000",
    fontWeight: "Bold",
  },
  primaryHeading: {
    font: "normal normal medium 20px/22px Roboto",
    color: "#333333",
  },
  primaryButton: {
    backgroundColor: "#FFFFFF 0% 0% no-repeat padding-box",
    border: "1px solid #999999",
    color: "#999999",
    borderRadius: "4px",
    // fontWeight: "bold",
    "&:hover": {
      backgroundColor: "#FF0000",
      border: "1px solid #FF0000",
      color: "#FFFFFF",
    },
  }, //theme.dialog.primaryButton,
  secondaryButton: {
    backgroundColor: "#FFFFFF 0% 0% no-repeat padding-box",
    border: "1px solid #999999",
    color: "#999999",
    borderRadius: "4px",
    // fontWeight: "bold",
    "&:hover": {
      backgroundColor: "#FF0000",
      border: "1px solid #FF0000",
      color: "#FFFFFF",
    },
  },
});

const INSUREE_FAMILY_PANELS_CONTRIBUTION_KEY = "insuree.Family.panels";
const INSUREE_FAMILY_OVERVIEW_PANELS_CONTRIBUTION_KEY = "insuree.FamilyOverview.panels";
const INSUREE_FAMILY_OVERVIEW_CONTRIBUTED_MUTATIONS_KEY = "insuree.FamilyOverview.mutations";

class FamilyForm extends Component {
  state = {
    lockNew: false,
    reset: 0,
    family: this._newFamily(),
    newFamily: true,
    confirmedAction: null,
    copyText: null,
    isCopied: false,
    email: true,
    success: false,
    notSucess:false,
    education: [
      {
        value: "2",
        label: {
          en: "Primary School",
          fr: "École primaire",
        },
      },
      {
        value: "3",
        label: {
          en: "Secondary School",
          fr: "École secondaire",
        },
      },
      {
        value: "4",
        label: {
          en: "University",
          fr: "Université",
        },
      },
      {
        value: "5",
        label: {
          en: "Postgraduate Studies",
          fr: "Études supérieures",
        },
      },
      {
        value: "6",
        label: {
          en: "PHD",
          fr: "Doctorat",
        },
      },
    ],
    // isFormValid: true,
  };

  _newFamily() {
    let family = {};
    family.jsonExt = {};
    return family;
  }

  componentDidMount() {
    if (this.props.family_uuid) {
      this.setState(
        (state, props) => ({ family_uuid: props.family_uuid }),
        (e) => this.props.fetchFamily(this.props.modulesManager, this.props.family_uuid),
      );
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.fetchedFamily && !!this.props.fetchedFamily) {
      var family = this.props.family;
      if (family) {
        family.ext = !!family.jsonExt ? JSON.parse(family.jsonExt) : {};
        this.setState({ family, family_uuid: family.uuid, lockNew: false, newFamily: false });
      }
    } else if (prevProps.family_uuid && !this.props.family_uuid) {
      this.setState({ family: this._newFamily(), newFamily: true, lockNew: false, family_uuid: null });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState((state, props) => ({
        family: { ...state.family, clientMutationId: props.mutation.clientMutationId },
      }));
    } else if (prevProps.confirmed !== this.props.confirmed && !!this.props.confirmed && !!this.state.confirmedAction) {
      this.state.confirmedAction();
    }
  }

  _add = () => {
    this.setState(
      (state) => ({
        family: this._newFamily(),
        newFamily: true,
        lockNew: false,
        reset: state.reset + 1,
      }),
      (e) => {
        this.props.add();
        this.forceUpdate();
      },
    );
  };

  reload = () => {
    const { family } = this.state;
    const { clientMutationId, familyUuid } = this.props.mutation;
    if (clientMutationId && !familyUuid) {
      // creation, we need to fetch the new family uuid from mutations logs and redirect to family overview
      this.props.fetchFamilyMutation(this.props.modulesManager, clientMutationId).then((res) => {
        const mutationLogs = parseData(res.payload.data.mutationLogs);
        if (
          mutationLogs &&
          mutationLogs[0] &&
          mutationLogs[0].families &&
          mutationLogs[0].families[0] &&
          mutationLogs[0].families[0].family
        ) {
          const uuid = parseData(res.payload.data.mutationLogs)[0].families[0].family.uuid;
          if (uuid) {
            historyPush(this.props.modulesManager, this.props.history, "insuree.route.familyOverview", [uuid]);
          }
        }
      });
    } else {
      this.props.fetchFamily(
        this.props.modulesManager,
        familyUuid,
        !!family.headInsuree ? family.headInsuree.chfId : null,
        family.clientMutationId,
      );
    }
  };
  doesInsureeChange = () => {
    const { insuree } = this.props;
    if (_.isEqual(insuree, this.state.insuree)) {
      return false;
    }
    return true;
  };
  // onValidation = (isFormValid) => {
  //   if (this.state.isFormValid !== isFormValid) {
  //     this.setState({ isFormValid });
  //   }
  // };
  canSave = () => {
    // if (!this.state.family.location) return false;
    if (!this.state.family.headInsuree) return false;
    // if (!this.state.family.headInsuree?.jsonExt?.createdAt) return false;
    // if (!this.state.family.headInsuree.chfId) return false;
    // if (!this.props.isChfIdValid) return false;
    if (!this.state.family?.jsonExt?.enrolmentType) return false;
    if (!this.state.family.headInsuree.lastName) return false;
    if (!this.state.family.headInsuree.otherNames) return false;
    if (!this.state.family.headInsuree.phone) return false;
    if (!this.state?.family?.headInsuree?.jsonExt?.BirthPlace) return false;
    // if (!this.state?.family?.headInsuree?.jsonExt?.nationality) return false;
    // if (!this.state?.family?.headInsuree?.jsonExt?.nbKids) return false;
    // if (!this.state?.family?.headInsuree?.jsonExt?.civilQuality) return false;
    // if (!this.state?.family?.headInsuree?.jsonExt?.createdAt) return false;
    if (!this.state?.family?.headInsuree?.marital) return false;
    if (!this.state?.family?.headInsuree?.typeOfId) return false;
    if (!this.state?.family?.headInsuree?.passport) return false;
    if (!this.state.family.headInsuree.dob) return false;
    if (!this.state.family?.address) return false;
    if (!this.state.family.headInsuree.gender || !this.state.family?.headInsuree.gender?.code) return false;
    if (
      !!this.state.family.headInsuree.photo &&
      (!this.state.family.headInsuree.photo.date || !this.state.family.headInsuree.photo.officerId)
    )
      return false;
    return true;
  };

  updateCanSave = () => {
    const { family } = this.props;
    if (_.isEqual(family, this.state.family)) {
      return false;
    }
    return true;
  };
  _save = (family) => {
    const EducationNameByVal = () => {
      const { education } = this.state;
      if (!!family?.headInsuree?.education?.id) {
        for (let i = 0; i < education?.length; i++) {
          if (education[i].value == family?.headInsuree?.education?.id) {
            return education[i].label.fr;
          }
        }
      }

      return undefined;
    };
    const educationName = EducationNameByVal();
    const headInsureeJsonExt = family.headInsuree.jsonExt;
    if (!headInsureeJsonExt.hasOwnProperty("civilQuality")) {
      !!headInsureeJsonExt?.relationship && headInsureeJsonExt?.relationship.id == 8
        ? (headInsureeJsonExt.civilQuality = "Depedent Beneficiary spouse")
        : !!headInsureeJsonExt?.relationship && headInsureeJsonExt?.relationship.id == 4
          ? (headInsureeJsonExt.civilQuality = "Depedent Beneficiary child")
          : (headInsureeJsonExt.civilQuality = "Main Beneficiary");
    }
    if (!headInsureeJsonExt.hasOwnProperty("nationality")) {
      headInsureeJsonExt.nationality = "CG";
    }
    if (!headInsureeJsonExt.hasOwnProperty("insureeEnrolmentType")) {
      headInsureeJsonExt.insureeEnrolmentType = family.jsonExt.enrolmentType;
    }
    if (!headInsureeJsonExt.hasOwnProperty("insureeaddress")) {
      headInsureeJsonExt.insureeaddress = family.address;
    }
    if (!headInsureeJsonExt.hasOwnProperty("insureelocations")) {
      headInsureeJsonExt.insureelocations = family.location;
    }
    if (!headInsureeJsonExt.hasOwnProperty("dateValidFrom")) {
      headInsureeJsonExt.dateValidFrom = new Date().toISOString().slice(0, 10);
    }
    if (!headInsureeJsonExt.hasOwnProperty("nbKids")) {
      headInsureeJsonExt.nbKids = 0;
    }
    if (!!family.headInsuree.education) {
      headInsureeJsonExt.education = {
        education: !!educationName ? educationName : "",
      };
    }
    headInsureeJsonExt.createdAt = "";
    this.setState(
      { lockNew: !family.uuid }, // avoid duplicates
      (e) => this.props.save(family),
    );
  };
  handleCopyClick = (familyText) => {
    // const { copyText } = this.state; // Assuming copyText is stored in component state

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(familyText)
        .then(() => {
          this.setState({ isCopied: true });
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    }
  };

  onEditedChanged = (family) => {
    this.setState({ family, newFamily: false });
  };

  onActionToConfirm = (title, message, confirmedAction) => {
    this.setState({ confirmedAction }, this.props.coreConfirm(title, message));
  };

  getStatusClass = (status) => {
    let selectedClass = null;
    let docsStatus = null;

    switch (status) {
      case "PRE_REGISTERED":
        selectedClass = this.props.classes.approvedBtn;
        docsStatus = "buttonStatus.preRegistered";
        break;
      case "APPROVED":
        selectedClass = this.props.classes.approvedBtn;
        docsStatus = "buttonStatus.approved";
        break;
      case "ACTIVE":
        selectedClass = this.props.classes.approvedBtn;
        docsStatus = "buttonStatus.active";
        break;
      case "REJECTED":
        selectedClass = this.props.classes.rejectBtn;
        docsStatus = "buttonStatus.rejected";
        break;
      case "REWORK":
        selectedClass = this.props.classes.commonBtn;
        docsStatus = "buttonStatus.rework";
        break;
      case "WAITING_FOR_DOCUMENT_AND_BIOMETRIC":
        selectedClass = this.props.classes.commonBtn;
        docsStatus = "buttonStatus.waitingDocumentBiometric";
        break;
      case "WAITING_FOR_APPROVAL":
        selectedClass = this.props.classes.commonBtn;
        docsStatus = "buttonStatus.waitingApproval";
        break;
      case "WAITING_FOR_QUEUE":
        selectedClass = this.props.classes.commonBtn;
        docsStatus = "buttonStatus.waitingQueue";
        break;
      // case "WAITING_FOR_DOCUMENT_REWORK":
      //   selectedClass = this.props.classes.commonBtn;
      //   docsStatus = "buttonStatus.waitingDocumentRework";

      //   break;
      // case "WAITING_FOR_BIOMETRIC_REWORK":
      //   selectedClass = this.props.classes.commonBtn;
      //   docsStatus = "buttonStatus.waitingBiometricRework";

      //   break;
      case "WAITING_FOR_DOCUMENT":
        selectedClass = this.props.classes.commonBtn;
        docsStatus = "buttonStatus.waitingDocument";

        break;
      case "WAITING_FOR_BIOMETRIC":
        selectedClass = this.props.classes.commonBtn;
        docsStatus = "buttonStatus.waitingBiometric";

        break;
      default:
        selectedClass = this.props.classes.noBtnClasses;
        break;
    }
    return { selectedClass, docsStatus };
  };

  displayPrintWindow = (base64Data, contentType) => {
    const printWindow = window.open("", "Print Window", "width=600, height=400");
    printWindow.document.open();

    if (contentType === "pdf") {
      // printWindow.print(`<embed type="application/pdf" width="100%" height="100%" src="data:application/pdf;base64,${base64Data}" />`);
      printWindow.document.write(
        `<embed type="application/pdf" width="100%" height="100%" src="data:application/pdf;base64,${base64Data}" />`,
      );
    } else {
      printWindow.document.write(`<img src="data:image/png;base64,${base64Data}" />`);
    }

    printWindow.document.close();
    // printWindow.print();
  };

  printReport = async (edited) => {
    const data = await this.props.printReport(this.props.modulesManager, edited);
    const base64Data = data?.payload?.data?.sentNotification?.data;

    const contentType = "pdf";
    if (base64Data) {
      this.displayPrintWindow(base64Data, contentType);
    }
    console.log(decodeURI(data?.payload?.data?.sentNotification?.data), "decode data");
  };
  emailButton = async (edited) => {
    const message = await this.props.FamilysendEmail(this.props.modulesManager, edited);
    if (!!message?.payload?.data?.sentNotification?.data) {
      // If the email was sent successfully, update the success state and message
      this.setState({
        success: true,
        successMessage: `${message?.payload?.data?.sentNotification?.message}`//"Email Sent Scodeuccessfully",
      });
    } else {
      // If the email send was not successful, you can also set success to false here
      // and provide an appropriate error message.
      this.setState({
        success: false,
        notSucess:true,
        successMessage: `${message?.payload?.data?.sentNotification?.message}`//"Email sending failed",
      });
    }
  };
  cancel = () => {
    this.setState({
      success: false,
      notSucess:false
    });
  };
  render() {
    const {
      modulesManager,
      classes,
      state,
      rights,
      family_uuid,
      fetchingFamily,
      fetchedFamily,
      errorFamily,
      insuree,
      overview = false,
      openFamilyButton,
      readOnly = false,
      add,
      save,
      back,
      mutation,
    } = this.props;
    const { family, newFamily } = this.state;

    if (!rights.includes(RIGHT_FAMILY)) return null;
    let runningMutation = !!family && !!family.clientMutationId;
    let contributedMutations = modulesManager.getContribs(INSUREE_FAMILY_OVERVIEW_CONTRIBUTED_MUTATIONS_KEY);
    for (let i = 0; i < contributedMutations.length && !runningMutation; i++) {
      runningMutation = contributedMutations[i](state);
    }
    let actions = [];
    if (family_uuid || !!family.clientMutationId) {
      let button = null;
      if (family.status !== null) {
        const { selectedClass, docsStatus } = this.getStatusClass(family.status);
        button = (
          <Grid className={classes.margin2}>
            <Typography component="span" className={classes.spanPadding}>
              STATUS :
            </Typography>
            <Button variant="outlined" className={selectedClass}>
              {formatMessage(this.props.intl, "insuree", docsStatus)}
            </Button>
            {/* {family.status === "REWORK" || family.status === "REJECTED" ? (
              <Tooltip
                placement="right"
                arrow
                classes={{ tooltip: this.props.classes.customWidth }}
                title={family.statusComment}
              >
                <IconButton>
                  <HelpIcon />
                </IconButton>
              </Tooltip>
            ) : null} */}
          </Grid>
        );
      }

      actions.push({ button });

      actions.push(
        // {
        //   icon: family.status !== null && (
        //     // const { selectedClass, docsStatus } = this.getStatusClass(i);
        //     // return(
        //       <>
        //       <Button variant="outlined" className={selectedClass}>
        //         {docsStatus}
        //       </Button>
        //       {(family.status == "REWORK" || family.status == "REJECTED" || family.status == "WAITING_FOR_APPROVAL") &&
        //       !!family.statusComment ? (
        //         <Tooltip
        //           placement="bottom"
        //           arrow
        //           classes={{ tooltip: this.props.classes.customWidth }}
        //           title={family.statusComment}
        //         >
        //           <IconButton>
        //             <HelpIcon />
        //           </IconButton>
        //         </Tooltip>
        //       ) : null}
        //     </>
        //   ),
        // },
        {
          doIt: this.reload,
          icon: <ReplayIcon />,
          onlyIfDirty: !readOnly && !runningMutation,
        },
      );
    }

    const getCopyLabel = () => {
      const { headInsuree } = this.state.family;
      const label = insureeLabel(this.state.family.headInsuree);
      return (
        <React.Fragment>
          {label}
          {!!headInsuree?.camuNumber || !!headInsuree?.chfId ? (
            <IconButton
              size="small"
              onClick={() =>
                this.handleCopyClick(
                  !!headInsuree?.camuNumber ? headInsuree?.camuNumber : !!headInsuree?.chfId ? headInsuree?.chfId : "",
                )
              }
              style={{ marginLeft: "4px" }}
              color="inherit"
            >
              <FileCopyIcon />
            </IconButton>
          ) : null}
          {this.state.isCopied ? "Copied!" : ""}
        </React.Fragment>
      );
    };
    return (
      <div className={!!runningMutation ? classes.lockedPage : null}>
        <Helmet
          title={formatMessageWithValues(
            this.props.intl,
            "insuree",
            !!this.props.overview ? "FamilyOverview.title" : "Family.title",
            { label: insureeLabel(this.state.family.headInsuree) },
          )}
        />

        <ProgressOrError progress={fetchingFamily} error={errorFamily} />
        {((!!fetchedFamily && !!family && family.uuid === family_uuid) || !family_uuid) && (
          <Form
            module="insuree"
            title="FamilyOverview.title"
            titleParams={{ label: getCopyLabel() }}
            // titleParams={{ label: insureeLabel(this.state.family.headInsuree) }}
            edited_id={family_uuid}
            edited={family}
            reset={this.state.reset}
            back={back}
            add={!!add && !newFamily ? this._add : null}
            readOnly={readOnly || runningMutation || !!family.validityTo}
            actions={actions}
            openFamilyButton={openFamilyButton}
            overview={overview}
            HeadPanel={FamilyMasterPanel}
            Panels={overview ? [FamilyInsureesOverview] : [HeadInsureeMasterPanel]}
            contributedPanelsKey={
              overview ? INSUREE_FAMILY_OVERVIEW_PANELS_CONTRIBUTION_KEY : INSUREE_FAMILY_PANELS_CONTRIBUTION_KEY
            }
            family={family}
            insuree={insuree}
            onEditedChanged={this.onEditedChanged}
            canSave={!!family_uuid ? this.updateCanSave : this.canSave}
            save={!!save ? this._save : null}
            onActionToConfirm={this.onActionToConfirm}
            openDirty={save}
            user={this.props.state.core.user}
            // onValidation={this.onValidation}
            printButton={this.printReport}
            emailButton={this.emailButton}
            email={family_uuid}
            print={family_uuid}
          />
        )}
        {!!this.state.success ?
          <Dialog open={this.state.success} onClose={this.cancel} maxWidth="md">
            <DialogContent className={classes.dialogBg}>
              <DialogContentText className={classes.primaryHeading}>
                {/* {this.state.successMessage} */}
                {<FormattedMessage
                  module="insuree"
                  id="success"
                  // values={this.state.successMessage}
                />}
              </DialogContentText>
            </DialogContent>
            <DialogActions className={classes.dialogBg}>
              <Button onClick={this.cancel} className={classes.secondaryButton}>
                <FormattedMessage module="core" id="ok" />
              </Button>
            </DialogActions>
          </Dialog>
          : <Dialog open={this.state.notSucess} onClose={this.cancel} maxWidth="md">
            <DialogContent className={classes.dialogBg}>
              <DialogContentText className={classes.primaryHeading}>
                {/* {this.state.successMessage} */}
                {<FormattedMessage
                  module="insuree"
                  id="notvalid"
                  // values={this.state.successMessage}
                />}
              </DialogContentText>
            </DialogContent>
            <DialogActions className={classes.dialogBg}>
              <Button onClick={this.cancel} className={classes.secondaryButton}>
                <FormattedMessage module="core" id="ok" />
              </Button>
            </DialogActions>
          </Dialog>}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  fetchingFamily: state.insuree.fetchingFamily,
  errorFamily: state.insuree.errorFamily,
  fetchedFamily: state.insuree.fetchedFamily,
  family: state.insuree.family,
  submittingMutation: state.insuree.submittingMutation,
  mutation: state.insuree.mutation,
  insuree: state.insuree.insuree,
  confirmed: state.core.confirmed,
  state: state,
  isChfIdValid: state.insuree?.validationFields?.insureeNumber?.isValid,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    { fetchFamilyMutation, fetchFamily, newFamily, createFamily, journalize, coreConfirm, printReport, FamilysendEmail },
    dispatch,
  );
};

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(FamilyForm)))),
  ),
);
