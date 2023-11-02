import React, { Fragment } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import _ from "lodash";
import { Checkbox, Paper, IconButton, Grid, Divider, Typography, Tooltip, Button } from "@material-ui/core";
import {
  Search as SearchIcon,
  Add as AddIcon,
  PersonAdd as AddExistingIcon,
  PersonPin as SetHeadIcon,
  Delete as DeleteIcon,
  Clear as RemoveIcon,
} from "@material-ui/icons";
import {
  formatMessage,
  formatMessageWithValues,
  withModulesManager,
  formatDateFromISO,
  historyPush,
  withTooltip,
  FormattedMessage,
  formatSorter,
  sort,
  coreAlert,
  Table,
  PagedDataHandler,
  PublishedComponent,
  ProgressOrError,
} from "@openimis/fe-core";
import EnquiryDialog from "./EnquiryDialog";
import {
  fetchFamilyMembers,
  selectFamilyMember,
  deleteInsuree,
  removeInsuree,
  setFamilyHead,
  changeFamily,
  checkCanAddInsuree,
} from "../actions";
import { RIGHT_INSUREE_DELETE } from "../constants";
import { insureeLabel, familyLabel } from "../utils/utils";
import ChangeInsureeFamilyDialog from "./ChangeInsureeFamilyDialog";
import RemoveInsureeFromFamilyDialog from "./RemoveInsureeFromFamilyDialog";
import HelpIcon from "@material-ui/icons/Help";

const styles = (theme) => ({
  paper: theme.paper.paper,
  paperHeader: theme.paper.header,
  paperHeaderAction: theme.paper.action,
  tableTitle: theme.table.title,
  approvedBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: "#00913E",
    color: "#00913E",
    borderRadius: "2rem",
  },
  rejectBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: "##FF0000",
    color: "##FF0000",
    borderRadius: "2rem",
  },
  commonBtn: {
    backgroundColor: '#FFFFFF',
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
});

class FamilyInsureesOverview extends PagedDataHandler {
  state = {
    enquiryOpen: false,
    chfid: null,
    confirmedAction: null,
    removeInsuree: null,
    changeInsureeFamily: null,
    reset: 0,
    canAddAction: null,
    checkedCanAdd: false,
  };

  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-insuree",
      "familyInsureesOverview.rowsPerPageOptions",
      [5, 10, 20],
    );
    this.defaultPageSize = props.modulesManager.getConf("fe-insuree", "familyInsureesOverview.defaultPageSize", 5);
  }

  componentDidMount() {
    this.setState({ orderBy: null }, (e) => this.onChangeRowsPerPage(this.defaultPageSize));
  }

  familyChanged = (prevProps) =>
    (!prevProps.family && !!this.props.family) ||
    (!!prevProps.family &&
      !!this.props.family &&
      (prevProps.family.uuid == null || prevProps.family.uuid !== this.props.family.uuid));

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.familyChanged(prevProps)) {
      this.query();
    } else if (!prevProps.checkedCanAddInsuree && !!this.props.checkedCanAddInsuree) {
      if (_.isEmpty(this.props.canAddInsureeWarnings)) {
        this.setState({ checkedCanAdd: true }, (e) => this.state?.canAddAction());
      } else {
        let messages = this.props.canAddInsureeWarnings;
        messages.push(formatMessage(this.props.intl, "insuree", "addInsuree.alert.message"));
        this.props.coreAlert(formatMessage(this.props.intl, "insuree", "addInsuree.alert.title"), messages);
      }
    } else if (!!prevProps.alert && !this.props.alert) {
      this.setState({ checkedCanAdd: true }, (e) => this.state?.canAddAction());
    }
  }

  queryPrms = () => {
    let prms = [];
    if (!!this.state.orderBy) {
      prms.push(`orderBy: "${this.state.orderBy}"`);
    }
    if (!!this.props.family && !!this.props.family.uuid) {
      prms.push(`familyUuid:"${this.props.family.uuid}"`);
      return prms;
    }
    return null;
  };

  onDoubleClick = (i, newTab = false) => {
    historyPush(
      this.props.modulesManager,
      this.props.history,
      "insuree.route.insuree",
      [i.uuid, this.props.family.uuid],
      newTab,
    );
  };

  onChangeSelection = (i) => {
    this.props.selectFamilyMember(i[0] || null);
  };

  headers = [
    "Insuree.chfId",
    "Insuree.lastName",
    "Insuree.otherNames",
    "Insuree.gender",
    "Insuree.dob",
    "Insuree.cardIssued",
    "Insuree.status",
    "",
    "",
    "",
  ];

  sorter = (attr, asc = true) => [
    () =>
      this.setState(
        (state, props) => ({ orderBy: sort(state.orderBy, attr, asc) }),
        (e) => this.query(),
      ),
    () => formatSorter(this.state.orderBy, attr, asc),
  ];

  headerActions = [
    this.sorter("chfId"),
    this.sorter("lastName"),
    this.sorter("otherNames"),
    this.sorter("gender"),
    this.sorter("dob"),
    this.sorter("cardIssued"),
  ];

  adornedChfId = (i) => (
    <Fragment>
      <IconButton
        size="small"
        onClick={(e) => !i.clientMutationId && this.setState({ enquiryOpen: true, chfid: i.chfId })}
      >
        <SearchIcon />
      </IconButton>
      {i.chfId}
    </Fragment>
  );

  confirmSetHeadInsuree = (i) => {
    let confirmedAction = () => {
      this.props.setFamilyHead(
        this.props.modulesManager,
        this.props.family.uuid,
        i.uuid,
        formatMessageWithValues(this.props.intl, "insuree", "SetFamilyHead.mutationLabel", { label: insureeLabel(i) }),
      );
    };
    this.props.onActionToConfirm(
      formatMessageWithValues(this.props.intl, "insuree", "setHeadInsureeDialog.title", { label: insureeLabel(i) }),
      formatMessageWithValues(this.props.intl, "insuree", "setHeadInsureeDialog.message", {
        current: insureeLabel(i),
        new: insureeLabel(this.props.family.headInsuree),
      }),
      confirmedAction,
    );
  };

  setHeadInsureeAction = (i) => (
    <Tooltip title={formatMessage(this.props.intl, "insuree", "familySetHeadInsuree.tooltip")}>
      <IconButton onClick={(e) => this.confirmSetHeadInsuree(i)}>
        <SetHeadIcon />
      </IconButton>
    </Tooltip>
  );

  removeInsuree = (cancelPolicies) => {
    let insuree = this.state.removeInsuree;
    this.setState({ removeInsuree: null }, (e) => {
      this.props.removeInsuree(
        this.props.modulesManager,
        this.props.family.uuid,
        insuree,
        cancelPolicies,
        formatMessageWithValues(
          this.props.intl,
          "insuree",
          `RemoveInsuree.${cancelPolicies ? "cancelPolicies" : "keepPolicies"}.mutationLabel`,
          {
            label: insureeLabel(insuree),
            family: familyLabel(this.props.family),
          },
        ),
      );
    });
  };

  removeInsureeAction = (removeInsuree) => (
    <Tooltip title={formatMessage(this.props.intl, "insuree", "familyRemoveInsuree.tooltip")}>
      <IconButton onClick={(e) => this.setState({ removeInsuree })}>
        <RemoveIcon />
      </IconButton>
    </Tooltip>
  );

  confirmDeleteInsuree = (i) => {
    let confirmedAction = () => {
      this.props.deleteInsuree(
        this.props.modulesManager,
        this.props.family.uuid,
        i,
        formatMessageWithValues(this.props.intl, "insuree", "DeleteInsuree.mutationLabel", { label: insureeLabel(i) }),
      );
    };
    this.props.onActionToConfirm(
      formatMessageWithValues(this.props.intl, "insuree", "deleteInsureeDialog.title", { label: insureeLabel(i) }),
      formatMessageWithValues(this.props.intl, "insuree", "deleteInsureeDialog.message", {
        label: insureeLabel(i),
      }),
      confirmedAction,
    );
  };

  deleteInsureeAction = (i) => (
    <Tooltip title={formatMessage(this.props.intl, "insuree", "familyDeleteInsuree.tooltip")}>
      <IconButton onClick={(e) => this.confirmDeleteInsuree(i)}>
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  );

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
      default:
        selectedClass = this.props.classes.noBtnClasses;
        break;
    }
    return { selectedClass, docsStatus };
  };
  isHead = (f, i) => i.chfId === (!!f.headInsuree && f.headInsuree.chfId);

  formatters = [
    (i) => this.adornedChfId(i),
    (i) => i.lastName || "",
    (i) => i.otherNames || "",
    (i) =>
      i.gender && i.gender.code ? formatMessage(this.props.intl, "insuree", `InsureeGender.${i.gender.code}`) : "",
    (i) => formatDateFromISO(this.props.modulesManager, this.props.intl, i.dob),
    (i) => <Checkbox color="primary" readOnly={true} disabled={true} checked={i.cardIssued} />,
    (i) => {
      if (i.status !== null) {
        const { selectedClass, docsStatus } = this.getStatusClass(i.status);
        return (
          <>
            <Button variant="outlined" className={selectedClass}>
            {formatMessage(this.props.intl, "insuree", docsStatus)}
            </Button>
            {i.status === "REWORK" || i.status === "REJECTED" ? (
              <Tooltip
                placement="right"
                arrow
                classes={{ tooltip: this.props.classes.customWidth }}
                title={i.statusComment}
              >
                <IconButton>
                  <HelpIcon />
                </IconButton>
              </Tooltip>
            ) : null}
          </>
        );
      } else {
        return null;
      }
    },

    (i) =>
      !!this.props.readOnly ||
      !this.props.rights.includes(RIGHT_INSUREE_DELETE) ||
      this.isHead(this.props.family, i) ||
      !!i.clientMutationId
        ? null
        : this.setHeadInsureeAction(i),
    (i) =>
      !!this.props.readOnly ||
      !this.props.rights.includes(RIGHT_INSUREE_DELETE) ||
      this.isHead(this.props.family, i) ||
      !!i.clientMutationId
        ? null
        : this.removeInsureeAction(i),
    (i) =>
      !!this.props.readOnly ||
      !this.props.rights.includes(RIGHT_INSUREE_DELETE) ||
      this.isHead(this.props.family, i) ||
      !!i.clientMutationId
        ? null
        : this.deleteInsureeAction(i),
  ];

  addNewInsuree = () =>
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.insuree", [
      "_NEW_",
      this.props.family.uuid,
    ]);
  rowLocked = (i) => !!i.clientMutationId;

  changeInsureeFamily = (cancelPolicies) => {
    let insuree = this.state.changeInsureeFamily;
    this.setState({ changeInsureeFamily: null }, (e) => {
      this.props.changeFamily(
        this.props.modulesManager,
        this.props.family.uuid,
        insuree,
        cancelPolicies,
        formatMessageWithValues(this.props.intl, "insuree", "insureeChangeFamily.mutationLabel", {
          family: familyLabel(this.props.family),
          insuree: insureeLabel(insuree),
        }),
      );
    });
  };

  checkCanAddInsuree = (action) => {
    this.setState(
      {
        canAddAction: action,
        checkedCanAdd: false,
      },
      (e) => this.props.checkCanAddInsuree(this.props.family),
    );
  };

  render() {
    const {
      intl,
      classes,
      pageInfo,
      family,
      familyMembers,
      fetchingFamilyMembers,
      errorFamilyMembers,
      readOnly,
      checkingCanAddInsuree,
      errorCanAddInsuree,
    } = this.props;
    let actions =
      !!readOnly || !!checkingCanAddInsuree || !!errorCanAddInsuree
        ? []
        : [
            {
              button: (
                <div>
                  <PublishedComponent //div needed for the tooltip style!!
                    pubRef="insuree.InsureePicker"
                    IconRender={AddExistingIcon}
                    forcedFilter={["head: false"]}
                    onChange={(changeInsureeFamily) => this.setState({ changeInsureeFamily })}
                    check={() => this.checkCanAddInsuree(() => this.setState({ checkedCanAdd: true }))}
                    checked={this.state.checkedCanAdd}
                  />
                </div>
              ),
              tooltip: formatMessage(intl, "insuree", "familyAddExsistingInsuree.tooltip"),
            },
            {
              button: (
                <IconButton onClick={(e) => this.checkCanAddInsuree(this.addNewInsuree)}>
                  <AddIcon />
                </IconButton>
              ),
              tooltip: formatMessage(intl, "insuree", "familyAddNewInsuree.tooltip"),
            },
          ];
    if (!!checkingCanAddInsuree || !!errorCanAddInsuree) {
      actions.push({
        button: (
          <div>
            <ProgressOrError progress={checkingCanAddInsuree} error={errorCanAddInsuree} />
          </div>
        ),
        tooltip: formatMessage(intl, "insuree", "familyCheckCanAdd"),
      });
    }
    return (
      <Paper className={classes.paper}>
        <EnquiryDialog
          open={this.state.enquiryOpen}
          chfid={this.state.chfid}
          onClose={() => {
            this.setState({ enquiryOpen: false, chfid: null });
          }}
        />
        <ChangeInsureeFamilyDialog
          family={family}
          insuree={this.state.changeInsureeFamily}
          onConfirm={this.changeInsureeFamily}
          onCancel={(e) => this.setState({ changeInsureeFamily: null })}
        />
        <RemoveInsureeFromFamilyDialog
          family={family}
          insuree={this.state.removeInsuree}
          onConfirm={this.removeInsuree}
          onCancel={(e) => this.setState({ removeInsuree: null })}
        />
        <Grid container alignItems="center" direction="row" className={classes.paperHeader}>
          <Grid item xs={8}>
            <Typography className={classes.tableTitle}>
              <FormattedMessage module="insuree" id="Family.insurees" values={{ count: pageInfo.totalCount }} />
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Grid container justify="flex-end">
              {actions.map((a, idx) => {
                return (
                  <Grid item key={`form-action-${idx}`} className={classes.paperHeaderAction}>
                    {withTooltip(a.button, a.tooltip)}
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
        </Grid>
        <Table
          module="insuree"
          headers={this.headers}
          headerActions={this.headerActions}
          itemFormatters={this.formatters}
          items={(!!family && familyMembers) || []}
          fetching={fetchingFamilyMembers}
          error={errorFamilyMembers}
          onDoubleClick={this.onDoubleClick}
          withSelection={"single"}
          onChangeSelection={this.onChangeSelection}
          withPagination={true}
          rowsPerPageOptions={this.rowsPerPageOptions}
          defaultPageSize={this.defaultPageSize}
          page={this.currentPage()}
          pageSize={this.currentPageSize()}
          count={pageInfo.totalCount}
          onChangePage={this.onChangePage}
          onChangeRowsPerPage={this.onChangeRowsPerPage}
          rowLocked={this.rowLocked}
        />
      </Paper>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  alert: !!state.core ? state.core.alert : null,
  family: state.insuree.family,
  fetchingFamilyMembers: state.insuree.fetchingFamilyMembers,
  fetchedFamilyMembers: state.insuree.fetchedFamilyMembers,
  familyMembers: state.insuree.familyMembers,
  pageInfo: state.insuree.familyMembersPageInfo,
  errorFamilyMembers: state.insuree.errorFamilyMembers,
  checkingCanAddInsuree: state.insuree.checkingCanAddInsuree,
  checkedCanAddInsuree: state.insuree.checkedCanAddInsuree,
  canAddInsureeWarnings: state.insuree.canAddInsureeWarnings,
  errorCanAddInsuree: state.insuree.errorCanAddInsuree,
  submittingMutation: state.insuree.submittingMutation,
  mutation: state.insuree.mutation,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      fetch: fetchFamilyMembers,
      selectFamilyMember,
      deleteInsuree,
      removeInsuree,
      setFamilyHead,
      changeFamily,
      checkCanAddInsuree,
      coreAlert,
    },
    dispatch,
  );
};

export default withModulesManager(
  injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(FamilyInsureesOverview)))),
);
