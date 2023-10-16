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
} from "@openimis/fe-core";
import { RIGHT_FAMILY, RIGHT_FAMILY_EDIT } from "../constants";
import FamilyMasterPanel from "./FamilyMasterPanel";

import { fetchFamily, newFamily, createFamily, fetchFamilyMutation } from "../actions";
import FamilyInsureesOverview from "./FamilyInsureesOverview";
import HeadInsureeMasterPanel from "./HeadInsureeMasterPanel";
import { Button } from "@material-ui/core";
import { insureeLabel } from "../utils/utils";

const styles = (theme) => ({
  lockedPage: theme.page.locked,
  approvedBtn: {
    borderColor: "#00913E",
    color: "#00913E",
    borderRadius: "2rem",
  },
  rejectBtn: {
    borderColor: "##FF0000",
    color: "##FF0000",
    borderRadius: "2rem",
  },
  commonBtn: {
    borderColor: "#FF841C",
    color: "#FF841C",
    borderRadius: "2rem",
  },
  noBtnClasses: {
    visibility: "hidden",
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

  canSave = () => {
    // if (!this.state.family.location) return false;
    if (!this.state.family.headInsuree) return false;
    // if (!this.state.family.headInsuree.chfId) return false;
    // if (!this.props.isChfIdValid) return false;
    if (!this.state.family.headInsuree.lastName) return false;
    if (!this.state.family.headInsuree.otherNames) return false;
    if (!this.state.family.headInsuree.dob) return false;
    if (
      !!this.state.family.headInsuree.photo &&
      (!this.state.family.headInsuree.photo.date || !this.state.family.headInsuree.photo.officerId)
    )
      return false;
    return true;
  };

  _save = (family) => {
    this.setState(
      { lockNew: !family.uuid }, // avoid duplicates
      (e) => this.props.save(family),
    );
  };

  onEditedChanged = (family) => {
    // console.log("family",family)
    this.setState({ family, newFamily: false });
  };

  onActionToConfirm = (title, message, confirmedAction) => {
    this.setState({ confirmedAction }, this.props.coreConfirm(title, message));
  };

  getStatusClass = (status) => {
    switch (status) {
      case "PRE_REGISTERED":
      case "APPROVED":
        return this.props.classes.approvedBtn;
      case "REJECT":
        return this.props.classes.rejectBtn;
      case "REWORK":
      case "PENDING":
      case "AWAIT FOR DOCUMENTS":
        return this.props.classes.commonBtn;
      default:
        return this.props.classes.noBtnClasses;
    }
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
      actions.push(
        {
          icon: family.status !== null && (
            <Button variant="outlined" className={this.getStatusClass(family.status)}>
              {family.status}
            </Button>
          ),
        },
        {
          doIt: this.reload,
          icon: <ReplayIcon />,
          onlyIfDirty: !readOnly && !runningMutation,
        },
      );
    }
    console.log("family", family);
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
            titleParams={{ label: insureeLabel(this.state.family.headInsuree) }}
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
            canSave={this.canSave}
            save={!!save ? this._save : null}
            onActionToConfirm={this.onActionToConfirm}
            openDirty={save}
          />
        )}
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
    { fetchFamilyMutation, fetchFamily, newFamily, createFamily, journalize, coreConfirm },
    dispatch,
  );
};

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(FamilyForm)))),
  ),
);
