import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import _ from "lodash";

import { withTheme, withStyles } from "@material-ui/core/styles";
import ReplayIcon from "@material-ui/icons/Replay";
import { Typography, Button, Tooltip, IconButton, Grid } from "@material-ui/core";
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
} from "@openimis/fe-core";
import {
  fetchInsureeFull,
  fetchFamily,
  clearInsuree,
  fetchInsureeMutation,
  fetchInsureeDocuments,
  updateExternalDocuments,
  sendEmail,
  printReport,
} from "../actions";
import { RIGHT_INSUREE } from "../constants";
import { insureeLabel } from "../utils/utils";
import FamilyDisplayPanel from "./FamilyDisplayPanel";
import InsureeMasterPanel from "../components/InsureeMasterPanel";
import RejectDialog from "../dialogs/RejectDialog";
import HelpIcon from "@material-ui/icons/Help";
import { approverCountCheck } from "../actions";

const styles = (theme) => ({
  page: theme.page,
  lockedPage: theme.page.locked,
  approvedBtn: {
    backgroundColor: '#FFFFFF',
    marginRight: "5px",
    borderColor: "#00913E",
    color: "#00913E",
    borderRadius: "2rem",
  },
  rejectBtn: {
    backgroundColor: '#FFFFFF',
    marginRight: "5px",
    borderColor: "##FF0000",
    color: "##FF0000",
    borderRadius: "2rem",
  },
  commonBtn: {
    backgroundColor: '#FFFFFF',
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
  margin2: {
    display: "flex",
    paddingTop: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
  spanPadding: {
    paddingTop: theme.spacing(1),
    marginRight: '5px'
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
    } 
    else if (!!this.props.family_uuid && (!this.props.family || this.props.family.uuid !== this.props.family_uuid)) {
      this.props.fetchFamily(this.props.modulesManager, this.props.family_uuid);
    } else if (!!this.props.family_uuid) {
      let insuree = { ...this.state.insuree };
      insuree.family = { ...this.props.family };
      this.setState({ insuree });
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
    if (!this.state.insuree?.jsonExt?.insureeEnrolmentType) return false;
    if (!this.state.insuree?.jsonExt?.createdAt) return false;
    if (!this.state.insuree.lastName) return false;
    if (!this.state.insuree.otherNames) return false;
    if (!this.state.insuree.dob) return false;
    if (!this.state.insuree.gender || !this.state.insuree.gender?.code) return false;
    // if (!this.state.isFormValid == true) return false;
    // if (this.state.lockNew) return false;
    // if (!!this.state.insuree.photo && (!this.state.insuree.photo.date || !this.state.insuree.photo.officerId))
    //   return false;
    return true;
  };

  _save = (insuree) => {
    this.setState(
      { lockNew: true }, // avoid duplicates
      (e) => this.props.save(insuree),
    );
  };
  _approveorreject = (insuree) => {
    if (insuree.status !== "APPROVED")
      this.props.updateExternalDocuments(this.props.modulesManager, this.props.documentsData, insuree.chfId);
    this.setState(
      { lockNew: true }, // avoid duplicates
      (e) => this.props.save(insuree),
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
        docsStatus = "Pre Registered";
        break;
      case "APPROVED":
        selectedClass = this.props.classes.approvedBtn;
        docsStatus = "Approved";
        break;
      case "REJECTED":
        selectedClass = this.props.classes.rejectBtn;
        docsStatus = "Rejected";
        break;
      case "REWORK":
        selectedClass = this.props.classes.commonBtn;
        docsStatus = "Rework";
        break;
      case "WAITING_FOR_DOCUMENT_AND_BIOMETRIC":
        selectedClass = this.props.classes.commonBtn;
        docsStatus = "Waiting for document and biometric";
        break;
      case "WAITING_FOR_APPROVAL":
        selectedClass = this.props.classes.commonBtn;
        docsStatus = "Waiting For Approval";
        break;
      case "WAITING_FOR_QUEUE":
        selectedClass = this.props.classes.commonBtn;
        docsStatus = "Waiting For Queue";
        break;
      default:
        selectedClass = this.props.classes.noBtnClasses;
        break;
    }
    return { selectedClass, docsStatus };
  };
  statusButton = (data) => {
    const { selectedClass, docsStatus } = this.getStatusClass(data.status);
    return (
      <Grid className={this.props.classes.margin2}>
        <Typography component="span" className={this.props.classes.spanPadding}>
          STATUS : 
        </Typography>
        <Button className={selectedClass} variant="outlined">
          {docsStatus}
        </Button>
        {data.status == "REWORK" || data.status == "REJECTED" ? (
          <Tooltip
            placement="bottom"
            arrow
            classes={{ tooltip: this.props.classes.customWidth }}
            title={data.statusComment}
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
    const printWindow = window.open('', 'Print Window', 'width=600, height=400');
    printWindow.document.open();

    if (contentType === 'pdf') {
      // printWindow.print(`<embed type="application/pdf" width="100%" height="100%" src="data:application/pdf;base64,${base64Data}" />`);
      printWindow.document.write(`<embed type="application/pdf" width="100%" height="100%" src="data:application/pdf;base64,${base64Data}" />`);
    } else {
      printWindow.document.write(`<img src="data:image/png;base64,${base64Data}" />`);
    }

    printWindow.document.close();
    // printWindow.print();
  }
  emailButton = (edited) => {
    console.log(edited, "edited")
    this.props.sendEmail(this.props.modulesManager, edited)
  }
  printReport = async (edited) => {
    console.log(edited, "edited")
    const data = await this.props.printReport(this.props.modulesManager, edited)
    console.log(data,"base64Data")
    const base64Data = data?.payload?.data?.sentNotification?.data;
    // const base64Data = "JVBERi0xLjMKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgaHR0cDovL3d3dy5yZXBvcnRsYWIuY29tCjEgMCBvYmoKPDwKL0YxIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMSAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL0NvbnRlbnRzIDcgMCBSIC9NZWRpYUJveCBbIDAgMCA2MTIgNzkyIF0gL1BhcmVudCA2IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9QYWdlTW9kZSAvVXNlTm9uZSAvUGFnZXMgNiAwIFIgL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL0F1dGhvciAoYW5vbnltb3VzKSAvQ3JlYXRpb25EYXRlIChEOjIwMjMxMDMwMTUzMzQyLTA1JzAwJykgL0NyZWF0b3IgKFJlcG9ydExhYiBQREYgTGlicmFyeSAtIHd3dy5yZXBvcnRsYWIuY29tKSAvS2V5d29yZHMgKCkgL01vZERhdGUgKEQ6MjAyMzEwMzAxNTMzNDItMDUnMDAnKSAvUHJvZHVjZXIgKFJlcG9ydExhYiBQREYgTGlicmFyeSAtIHd3dy5yZXBvcnRsYWIuY29tKSAKICAvU3ViamVjdCAodW5zcGVjaWZpZWQpIC9UaXRsZSAodW50aXRsZWQpIC9UcmFwcGVkIC9GYWxzZQo+PgplbmRvYmoKNiAwIG9iago8PAovQ291bnQgMSAvS2lkcyBbIDMgMCBSIF0gL1R5cGUgL1BhZ2VzCj4+CmVuZG9iago3IDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDEwNwo+PgpzdHJlYW0KR2FwUWgwRT1GLDBVXEgzVFxwTllUXlFLaz90Yz5JUCw7VyNVMV4yM2loUEVNXz9DVzRLSVNpOTBNakdeMixGUyM8UkM2OzwhW0dfO1s+dUlhPWYkajwhXlREI2dpXSY9NVgsWzNyQlkzfj5lbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA4CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA3MyAwMDAwMCBuIAowMDAwMDAwMTA0IDAwMDAwIG4gCjAwMDAwMDAyMTEgMDAwMDAgbiAKMDAwMDAwMDQwNCAwMDAwMCBuIAowMDAwMDAwNDcyIDAwMDAwIG4gCjAwMDAwMDA3NjggMDAwMDAgbiAKMDAwMDAwMDgyNyAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9JRCAKWzwxZjdiYzY3M2JmYzMzMWRiMTY3YmEwNjM4MjYxM2M2NT48MWY3YmM2NzNiZmMzMzFkYjE2N2JhMDYzODI2MTNjNjU+XQolIFJlcG9ydExhYiBnZW5lcmF0ZWQgUERGIGRvY3VtZW50IC0tIGRpZ2VzdCAoaHR0cDovL3d3dy5yZXBvcnRsYWIuY29tKQoKL0luZm8gNSAwIFIKL1Jvb3QgNCAwIFIKL1NpemUgOAo+PgpzdGFydHhyZWYKMTAyNAolJUVPRgo="
    const contentType = 'pdf';
    if (base64Data) {
      this.displayPrintWindow(base64Data, contentType)
    }
    // console.log(decodeURI(data?.payload?.data?.sentNotification?.data), "decode data");
  }
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
      approverData
    } = this.props;
    const { insuree, clientMutationId, payload, statusCheck, email } = this.state;

    // const documentsData = [
    //   {
    //     "id": "34",
    //     "documentId": "ad303dbf-f6f2-4da3-9d47-cadc55c5e05c",
    //     "documentName": "Declaration of employment",
    //     "documentPath": "Declaration of employment.pdf",
    //     "documentStatus": "APPROVED",
    //     "comments": null,
    //     "tempCamu": "T1915102023003719",
    //     "isVerified": false,
    //   },
    //   {
    //     "id": "35",
    //     "documentId": "71ac4acf-bc58-46a9-a437-25a282386c5f",
    //     "documentName": "Salary slips",
    //     "documentPath": "Salary slips.pdf",
    //     "documentStatus": "APPROVED",
    //     "comments": null,
    //     "tempCamu": "T1915102023003719",
    //     "isVerified": false,
    //   },
    //   {
    //     "id": "36",
    //     "documentId": "208dc2e3-e132-400a-bc26-d9799110acbe",
    //     "documentName": "Copy of passport",
    //     "documentPath": "Copy of passport.pdf",
    //     "documentStatus": "APPROVED",
    //     "comments": null,
    //     "tempCamu": "T1915102023003719",
    //     "isVerified": false,
    //   },
    // ];
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
    const allApprovedOrRejected =
      documentsData &&
      documentsData.every(
        (document) => document.documentStatus === "APPROVED" || document.documentStatus === "REJECTED",
      );
    const hasReject =
      (allApprovedOrRejected && documentsData.some((document) => document.documentStatus === "REJECTED")) ||
      (allApprovedOrRejected && !this.state.insuree.biometricsIsMaster);
    const allApproved =
      documentsData && documentsData.length > 0
        ? documentsData.every((document) => document.documentStatus === "APPROVED") &&
          this.state.insuree.biometricsIsMaster
        : false;
    console.log("approverData", approverData);
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
              titleParams={{ label: insureeLabel(this.state.insuree) }}
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
              email={insuree_uuid}
              printButton={this.printReport}
              approverData={approverData}
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
      </div>
    );
  }
}

const mapStateToProps = (state, props) => (
  console.log("state",state),{
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
      approverCountCheck
    })(injectIntl(withTheme(withStyles(styles)(InsureeForm)))),
  ),
);
