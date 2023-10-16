import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import _ from "lodash";

import { withTheme, withStyles } from "@material-ui/core/styles";
import ReplayIcon from "@material-ui/icons/Replay";
import { Typography, Button } from "@material-ui/core";
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
} from "../actions";
import { RIGHT_INSUREE } from "../constants";
import { insureeLabel } from "../utils/utils";
import FamilyDisplayPanel from "./FamilyDisplayPanel";
import InsureeMasterPanel from "../components/InsureeMasterPanel";
import RejectDialog from "../dialogs/RejectDialog";

const styles = (theme) => ({
  page: theme.page,
  lockedPage: theme.page.locked,
  approvedBtn: {
    marginRight: "5px",
    borderColor: "#00913E",
    color: "#00913E",
    borderRadius: "2rem",
  },
  rejectBtn: {
    marginRight: "5px",
    borderColor: "##FF0000",
    color: "##FF0000",
    borderRadius: "2rem",
  },
  commonBtn: {
    marginRight: "5px",
    borderColor: "#FF841C",
    color: "#FF841C",
    borderRadius: "2rem",
  },
  noBtnClasses: {
    visibility: "hidden",
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

  canSave = () => {
    const doesInsureeChange = this.doesInsureeChange();
    if (!doesInsureeChange) return false;
    // if (!this.props.isInsureeNumberValid) return false;
    // if (!this.state.insuree.chfId) return false;
    if (!this.state.insuree.lastName) return false;
    if (!this.state.insuree.otherNames) return false;
    if (!this.state.insuree.dob) return false;
    if (!this.state.insuree.gender || !this.state.insuree.gender?.code) return false;
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
    console.log("CHECKPAYL", insuree);
    // this.props.updateExternalDocuments(this.props.modulesManager, this.props.documentsData, insuree.chfId);
    this.setState(
      { lockNew: true }, // avoid duplicates
      (e) => this.props.save(insuree),
    );
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
    // console.log("insuree",insuree);
    this.setState({ insuree, newInsuree: false });
  };
  getStatusClass = (status) => {
    switch (status) {
      case "PRE_REGISTERED":
      case "APPROVED":
        return this.props.classes.approvedBtn;
      case "REJECT":
        return this.props.classes.rejectBtn;
      case "REWORK":
      case "PENDING_FOR_REVIEW":
      case "AWAIT FOR DOCUMENTS":
        return this.props.classes.commonBtn;
      default:
        return this.props.classes.noBtnClasses;
    }
  };
  statusButton = (data) => {
    return (
      <>
        <Typography>STATUS :</Typography>
        <Button className={this.getStatusClass(data.status)} variant="outlined">
          {data.status}
        </Button>
      </>
    );
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
    } = this.props;
    const { insuree, clientMutationId, payload, statusCheck } = this.state;

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
        // icon: <Button variant="outlined">APPROVED</Button>,
        icon: this.statusButton(insuree),
      },
    ];
    const allApprovedOrRejected =
      documentsData &&
      documentsData.every(
        (document) => document.documentStatus === "APPROVED" || document.documentStatus === "REJECTED",
      );
    const hasReject = allApprovedOrRejected && documentsData.some((document) => document.documentStatus === "REJECTED");
    // Check if all documents have a status of "APPROVED"
    const allApproved =
      documentsData && documentsData.length > 0
        ? documentsData.every((document) => document.documentStatus === "APPROVED")
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
            />
          )}
        <RejectDialog
          isOpen={this.state.confirmDialog}
          onClose={this.handleDialogClose}
          payload={payload}
          approveorreject={this._approveorreject}
          statusCheck={statusCheck}
          classes={classes}
        />
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
    })(injectIntl(withTheme(withStyles(styles)(InsureeForm)))),
  ),
);
