import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import _ from "lodash";

import { withTheme, withStyles } from "@material-ui/core/styles";
import ReplayIcon from "@material-ui/icons/Replay";
import { Typography, Button, Tooltip, IconButton, Grid, } from "@material-ui/core";
import {
  formatMessageWithValues,
  withModulesManager,
  withHistory,
  historyPush,
  journalize,
  Form,
  parseData,
  ProgressOrError,
  Helmet,
  FormattedMessage,
  formatMessage,
  PublishedComponent
} from "@openimis/fe-core";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import {
  fetchInsureeFull,
  fetchFamily,
  clearInsuree,
  fetchInsureeMutation,
  fetchInsureeDocuments,
  updateExternalDocuments,
  sendEmail,
  printReport,
  approverInsureeComparison,
} from "../actions";
import { RIGHT_INSUREE, INSUREE_REJECT_REASON } from "../constants";
import { insureeLabel } from "../utils/utils";
import FamilyDisplayPanel from "./FamilyDisplayPanel";
import InsureeMasterPanel from "../components/InsureeMasterPanel";
import RejectDialog from "../dialogs/RejectDialog";
import HelpIcon from "@material-ui/icons/Help";
// import { approverCountCheck } from "../actions";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@material-ui/core";
import FileCopyIcon from "@material-ui/icons/FileCopy";

const styles = (theme) => ({
  page: theme.page,
  lockedPage: theme.page.locked,
  approvedBtn: {
    backgroundColor: "#FFFFFF",
    marginRight: "5px",
    borderColor: "#00913E",
    color: "#00913E",
    borderRadius: "2rem",
  },
  rejectBtn: {
    backgroundColor: "#FFFFFF",
    marginRight: "5px",
    borderColor: "##FF0000",
    color: "##FF0000",
    borderRadius: "2rem",
  },
  commonBtn: {
    backgroundColor: "#FFFFFF",
    marginRight: "5px",
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
  customReasonWidth: {
    maxWidth: 500,
    color: "#FFFFFFF"
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
  customArrow: {
    color: "#eeeaea",
  },
  tooltip: {
    maxWidth: 1000,
    width: "fit-content",
    // width: "auto",
    color: "white",
    backgroundColor: "#eeeaea",
  },
});

const INSUREE_INSUREE_FORM_CONTRIBUTION_KEY = "insuree.InsureeForm";

class InsureeForm extends Component {
  state = {
    lockNew: false,
    reset: 0,
    insuree: this._newInsuree(),
    newInsuree: true,
    confirmDialog: false,
    statusCheck: null,
    payload: null,
    isFormValid: true,
    email: true,
    success: false,
    successMessage: "",
    copyText: null,
    isCopied: false,
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
  };

  _newInsuree() {
    let insuree = {};
    insuree.jsonExt = {};
    return insuree;
  }

  componentDidMount() {
    if (!!this.props.insuree_uuid) {
      this.setState(
        (state, props) => ({ insuree_uuid: props.insuree_uuid }),
        (e) => this.props.fetchInsureeFull(this.props.modulesManager, this.props.insuree_uuid),
      );
    } else if (!!this.props.family_uuid && (!this.props.family || this.props.family.uuid !== this.props.family_uuid)) {
      this.props.fetchFamily(this.props.modulesManager, this.props.family_uuid);
    } else if (!!this.props.family_uuid) {
      let insuree = { ...this.state.insuree };
      insuree.family = { ...this.props.family };
      this.setState({ insuree });
    }

    if (!!this.props.insuree_uuid) {
      this.props.approverInsureeComparison(this.props.modulesManager, this.props.insuree_uuid);
    }
  }

  back = (e) => {
    const { modulesManager, history, family_uuid, insuree_uuid } = this.props;
    if (family_uuid) {
      historyPush(modulesManager, history, "insuree.route.familyOverview", [family_uuid]);
    } else {
      historyPush(modulesManager, history, "insuree.route.insurees");
    }
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.fetchedInsuree !== this.props.fetchedInsuree && !!this.props.fetchedInsuree) {
      var insuree = this.props.insuree || {};
      insuree.jsonExt = !!insuree.jsonExt ? JSON.parse(insuree.jsonExt) : {};
      this.setState({ insuree, insuree_uuid: insuree.uuid, lockNew: false, newInsuree: false });
    } else if (prevProps.insuree_uuid && !this.props.insuree_uuid) {
      this.setState({ insuree: this._newInsuree(), newInsuree: true, lockNew: false, insuree_uuid: null });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState((state, props) => {
        return {
          ...state.insuree,
          reset: this.state.reset + 1,
          clientMutationId: props.mutation.clientMutationId,
        };
      });
    }
  }

  componentWillUnmount = () => {
    this.props.clearInsuree();
  };

  _add = () => {
    this.setState(
      (state) => ({
        insuree: this._newInsuree(),
        newInsuree: true,
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
    const {
      mutation: { clientMutationId },
      insuree_uuid,
      family_uuid,
    } = this.props;

    if (clientMutationId && !insuree_uuid) {
      this.props.fetchInsureeMutation(this.props.modulesManager, clientMutationId).then((res) => {
        const mutationLogs = parseData(res.payload.data.mutationLogs);
        if (mutationLogs?.[0]?.insurees?.[0]?.insuree) {
          const uuid = parseData(res.payload.data.mutationLogs)[0].insurees[0].insuree.uuid;
          uuid && family_uuid
            ? historyPush(this.props.modulesManager, this.props.history, "insuree.route.familyOverview", [family_uuid])
            : historyPush(this.props.modulesManager, this.props.history, "insuree.route.insuree", [uuid]);
        }
      });
    } else {
      family_uuid
        ? historyPush(this.props.modulesManager, this.props.history, "insuree.route.familyOverview", [family_uuid])
        : this.props.fetchInsureeFull(this.props.modulesManager, this.state.insuree_uuid);
    }

    this.setState((state, props) => {
      return {
        ...state.insuree,
        clientMutationId: false,
      };
    });
  };

  doesInsureeChange = () => {
    const { insuree } = this.props;
    if (_.isEqual(insuree, this.state.insuree)) {
      return false;
    }
    return true;
  };
  onValidation = (isFormValid) => {
    if (this.state.isFormValid !== isFormValid) {
      this.setState({ isFormValid });
    }
  };
  canSave = () => {
    const doesInsureeChange = this.doesInsureeChange();
    if (!doesInsureeChange) return false;
    // if (!this.props.isInsureeNumberValid) return false;
    // if (!this.state.insuree.chfId) return false;
    // if (!this.state.insuree?.jsonExt?.insureeEnrolmentType) return false;
    // if (!this.state.insuree?.jsonExt?.createdAt) return false;
    if (!this.state.insuree?.jsonExt?.BirthPlace) return false;
    // if (!this.state.insuree?.jsonExt?.nationality) return false;
    // if (!this.state.insuree?.jsonExt?.nbKids) return false;
    // if (!this.state.insuree?.jsonExt?.civilQuality) return false;
    if (!this.state.insuree.lastName) return false;
    if (!this.state.insuree.phone) return false;
    if (!this.state.insuree.otherNames) return false;
    if (!this.state.insuree.marital) return false;
    if (!this.state.insuree.typeOfId) return false;
    if (!this.state.insuree.passport) return false;
    if (!this.state.insuree.dob) return false;
    if (!this.state.insuree.gender || !this.state.insuree.gender?.code) return false;
    // if (!this.state.isFormValid == true) return false;
    // if (this.state.lockNew) return false;
    // if (!!this.state.insuree.photo && (!this.state.insuree.photo.date || !this.state.insuree.photo.officerId))
    //   return false;
    return true;
  };

  _save = (insureeData) => {
    const EducationNameByVal = () => {
      const { education } = this.state;
      if (!!insureeData?.education?.id) {
        for (let i = 0; i < education?.length; i++) {
          if (education[i].value == insureeData?.education?.id) {
            return education[i].label.fr;
          }
        }
      }
      return undefined;
    };
    const educationName = EducationNameByVal();
    const { insuree } = this.state;
    const headInsureeJsonExt = insureeData?.jsonExt;
    if (!headInsureeJsonExt.hasOwnProperty("civilQuality")) {
      !!insureeData?.relationship && insureeData?.relationship.id == 8
        ? (headInsureeJsonExt.civilQuality = "Depedent Beneficiary spouse")
        : !!insureeData?.relationship && insureeData?.relationship.id == 4
          ? (headInsureeJsonExt.civilQuality = "Depedent Beneficiary child")
          : (headInsureeJsonExt.civilQuality = "Main Beneficiary");
    }
    if (!headInsureeJsonExt.hasOwnProperty("nationality")) {
      headInsureeJsonExt.nationality = "CG";
    }
    if (!headInsureeJsonExt.hasOwnProperty("insureeEnrolmentType")) {
      headInsureeJsonExt.insureeEnrolmentType = JSON.parse(insureeData.family.jsonExt).enrolmentType;
    }
    if (!headInsureeJsonExt.hasOwnProperty("insureeaddress")) {
      headInsureeJsonExt.insureeaddress = insureeData.family.address;
    }
    if (!headInsureeJsonExt.hasOwnProperty("insureelocations")) {
      headInsureeJsonExt.insureelocations = insureeData.family.location;
    }
    if (!headInsureeJsonExt.hasOwnProperty("dateValidFrom")) {
      headInsureeJsonExt.dateValidFrom = new Date().toISOString().slice(0, 10);
    }
    if (!headInsureeJsonExt.hasOwnProperty("nbKids")) {
      headInsureeJsonExt.nbKids = 0;
    }
    if (!headInsureeJsonExt.hasOwnProperty("createdAt")) {
      headInsureeJsonExt.createdAt = "";
    }
    if (!!insureeData.education) {
      headInsureeJsonExt.education = {
        education: !!educationName ? educationName : "",
      };
    }
    console.log("familypayload", insureeData);
    const CheckHead =
      !!insuree && !!insuree.family && !!insuree.family.headInsuree && insuree.family.headInsuree.id !== insuree.id;
    this.setState(
      { lockNew: true }, // avoid duplicates
      (e) => this.props.save({ ...insureeData, checkHead: CheckHead, family_uuid: this.props.family_uuid }),
    );
  };
  _approveorreject = (insureeData) => {
    const { insuree } = this.state;
    // if (insuree.status !== "APPROVED")
    //   this.props.updateExternalDocuments(this.props.modulesManager, this.props.documentsData, insuree.chfId);
    const CheckHead =
      !!insuree && !!insuree.family && !!insuree.family.headInsuree && insuree.family.headInsuree.id !== insuree.id;
    this.setState(
      { lockNew: true }, // avoid duplicates
      (e) => this.props.save({ ...insureeData, documentData: this.props.documentsData, checkHead: CheckHead, family_uuid: this.props.family_uuid }),
    );
    this.handleDialogClose();
  };

  handleDialogOpen = (status, data) => {
    this.setState({ confirmDialog: true });
    this.setState({ statusCheck: status });
    this.setState({ payload: data });
  };
  handleDialogClose = () => {
    this.setState({ confirmDialog: false });
  };

  onEditedChanged = (insuree) => {
    this.setState({ insuree, newInsuree: false });
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
      case "WAITING_FOR_APPROVAL":
        selectedClass = this.props.classes.commonBtn;
        docsStatus = "buttonStatus.waitingApproval";

        break;
      case "WAITING_FOR_QUEUE":
        selectedClass = this.props.classes.commonBtn;
        docsStatus = "buttonStatus.waitingQueue";

        break;
      default:
        selectedClass = this.props.classes.noBtnClasses;
        break;
    }
    return { selectedClass, docsStatus };
  };
  statusButton = (data) => {
    const { selectedClass, docsStatus } = this.getStatusClass(data.status);
    console.log("data.statusComment", data.statusComment)
    const shouldShowIconButton = INSUREE_REJECT_REASON?.some(reason =>
      data?.statusComment?.includes(reason)
    );
    return (
      <Grid className={this.props.classes.margin2}>
        <Typography component="span" className={this.props.classes.spanPadding}>
          STATUS :
        </Typography>
        <Button className={selectedClass} variant="outlined">
          {formatMessage(this.props.intl, "insuree", docsStatus)}
        </Button>
        {(data.status == "REWORK" || data.status == "REJECTED") && shouldShowIconButton ? (
          <Tooltip
            placement="bottom"
            arrow
            classes={{ tooltip: this.props.classes.tooltip, arrow: this.props.classes.customArrow }}
            // title={data.statusComment}
            title={<> <PublishedComponent
              pubRef="insuree.RejectReasonPicker"
              withLabel={false}
              value={!!data.statusComment ? data.statusComment : ""}
              module="insuree"
              readOnly={true}
            /></>}
          // componentsProps={{
          //   tooltip: {
          //     sx: {
          //       bgcolor: "common.white",
          //       "& .MuiTooltip-arrow": {
          //         color: "common.white",
          //       },
          //     },
          //   },
          // }}
          >
            <IconButton>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        ) : null}
      </Grid>
    );
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
  emailButton = async (edited) => {
    const message = await this.props.sendEmail(this.props.modulesManager, edited);
    if (!!message?.payload?.data?.sentNotification?.data) {
      // If the email was sent successfully, update the success state and message
      this.setState({
        success: true,
        successMessage: "Email_sent_successfully",
      });
    } else {
      // If the email send was not successful, you can also set success to false here
      // and provide an appropriate error message.
      this.setState({
        success: false,
        successMessage: "Email sending failed",
      });
    }
  };
  printReport = async (edited) => {
    const data = await this.props.printReport(this.props.modulesManager, edited);
    const base64Data = data?.payload?.data?.sentNotification?.data;

    const contentType = "pdf";
    if (base64Data) {
      this.displayPrintWindow(base64Data, contentType);
    }
  };
  cancel = () => {
    this.setState({
      success: false,
    });
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
  render() {
    const {
      rights,
      insuree_uuid,
      fetchingInsuree,
      fetchedInsuree,
      errorInsuree,
      family,
      family_uuid,
      fetchingFamily,
      fetchedFamily,
      errorFamily,
      readOnly = false,
      classes,
      add,
      save,
      documentsData,
      approverData,
    } = this.props;
    const { insuree, clientMutationId, payload, statusCheck, email } = this.state;

    if (!rights.includes(RIGHT_INSUREE)) return null;
    let runningMutation = !!insuree && !!clientMutationId;
    let actions = [
      {
        doIt: this.reload,
        icon: <ReplayIcon />,
        onlyIfDirty: !readOnly && !runningMutation,
      },
      {
        button: this.statusButton(insuree),
      },
    ];
    const getCopyLabel = () => {
      // const { insuree } = this.state;
      const label = insureeLabel(insuree);
      return (
        <React.Fragment>
          {label}
          {!!insuree.camuNumber || !!insuree.chfId ? (
            <IconButton
              size="small"
              onClick={() =>
                this.handleCopyClick(!!insuree.camuNumber ? insuree.camuNumber : !!insuree.chfId ? insuree.chfId : "")
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
    const allApprovedOrRejected =
      documentsData &&
      documentsData.every(
        (document) => document.documentStatus === "APPROVED" || document.documentStatus === "REJECTED",
      );
    const hasReject =
      documentsData && documentsData.length > 0
        ? (allApprovedOrRejected && documentsData.some((document) => document.documentStatus === "REJECTED")) ||
        (allApprovedOrRejected && !this.state.insuree.biometricsIsMaster)
        : false;
    const allApproved =
      documentsData && documentsData.length > 0
        ? documentsData.every((document) => document.documentStatus === "APPROVED") &&
        this.state.insuree.biometricsIsMaster
        : false;

    return (
      <div className={runningMutation ? classes.lockedPage : null}>
        <Helmet
          title={formatMessageWithValues(this.props.intl, "insuree", "Insuree.title", {
            label: insureeLabel(this.state.insuree),
          })}
        />
        <ProgressOrError progress={fetchingInsuree} error={errorInsuree} />
        <ProgressOrError progress={fetchingFamily} error={errorFamily} />
        {((!!fetchedInsuree && !!insuree && insuree.uuid === insuree_uuid) || !insuree_uuid) &&
          ((!!fetchedFamily && !!family && family.uuid === family_uuid) || !family_uuid) && (
            <Form
              module="insuree"
              title="Insuree.title"
              titleParams={{ label: getCopyLabel() }}
              // titleParams={{ label: insureeLabel(this.state.insuree) }}
              edited_id={insuree_uuid}
              edited={this.state.insuree}
              reset={this.state.reset}
              back={this.back}
              add={!!add && !this.state.newInsuree ? this._add : null}
              readOnly={readOnly || runningMutation || !!insuree.validityTo}
              actions={actions}
              HeadPanel={FamilyDisplayPanel}
              Panels={[InsureeMasterPanel]}
              contributedPanelsKey={INSUREE_INSUREE_FORM_CONTRIBUTION_KEY}
              insuree={this.state.insuree}
              onEditedChanged={this.onEditedChanged}
              canSave={this.canSave}
              save={!!save ? this._save : null}
              openDirty={save}
              hasReject={hasReject}
              allApproved={allApproved}
              approveorreject={this._approveorreject}
              handleDialogOpen={this.handleDialogOpen}
              onValidation={this.onValidation}
              emailButton={this.emailButton}
              email={this.state.insuree?.camuNumber}
              // emailCheck={this.state.insuree?.camuNumber}
              print={this.state.insuree?.camuNumber}
              printButton={this.printReport}
              approverData={approverData}
              success={this.state.success}
            />
          )}
        <RejectDialog
          isOpen={this.state.confirmDialog}
          onClose={this.handleDialogClose}
          payload={payload}
          approveorreject={this._approveorreject}
          statusCheck={statusCheck}
          classes={classes}
          edited={this.state.insuree}
        />
        {this.state.success && (
          <Dialog open={this.state.success} onClose={this.cancel} maxWidth="md">
            <DialogContent className={classes.dialogBg}>
              <DialogContentText className={classes.primaryHeading}>
                <FormattedMessage
                  module="insuree"
                  id="success"
                // values={this.state.successMessage}
                />
              </DialogContentText>
            </DialogContent>
            <DialogActions className={classes.dialogBg}>
              <Button onClick={this.cancel} className={classes.secondaryButton}>
                <FormattedMessage module="core" id="cancel" />
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  fetchingInsuree: state.insuree.fetchingInsuree,
  errorInsuree: state.insuree.errorInsuree,
  fetchedInsuree: state.insuree.fetchedInsuree,
  insuree: state.insuree.insuree,
  fetchingFamily: state.insuree.fetchingFamily,
  errorFamily: state.insuree.errorFamily,
  fetchedFamily: state.insuree.fetchedFamily,
  family: state.insuree.family,
  submittingMutation: state.insuree.submittingMutation,
  mutation: state.insuree.mutation,
  isInsureeNumberValid: state.insuree?.validationFields?.insureeNumber?.isValid,
  documentsData: state.insuree.documentsData,
  approverData: state.insuree.approverData,
});

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, {
      fetchInsureeFull,
      fetchFamily,
      clearInsuree,
      fetchInsureeMutation,
      journalize,
      fetchInsureeDocuments,
      updateExternalDocuments,
      sendEmail,
      printReport,
      approverInsureeComparison,
      // approverCountCheck,
    })(injectIntl(withTheme(withStyles(styles)(InsureeForm)))),
  ),
);
