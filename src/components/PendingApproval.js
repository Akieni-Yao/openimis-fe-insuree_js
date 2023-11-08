import React, { Fragment } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import _ from "lodash";
import { Checkbox, Paper, IconButton, Grid, Divider, Typography, Tooltip, Button, Box } from "@material-ui/core";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import {
  formatMessage,
  formatMessageWithValues,
  withModulesManager,
  formatDateFromISO,
  historyPush,
  withHistory,
  withTooltip,
  FormattedMessage,
  formatSorter,
  sort,
  coreAlert,
  Table,
  PagedDataHandler,
  PublishedComponent,
  ProgressOrError,
  clearCurrentPaginationPage,
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
  fetchInsureeDocuments,
  updateInsureeDocument,
  fetchPendingForApproval,
  fetchInsureeSummaries,
} from "../actions";
import { DisabledBiometric, InvalidBiometric, ValidBiometric } from "../SvgIndex";
import DocumentViewDialog from "../dialogs/DocumentViewDialogs";
import HelpIcon from "@material-ui/icons/Help";

const styles = (theme) => ({
  paper: theme.paper.paper,
  paperHeader: theme.paper.header,
  paperHeaderAction: theme.paper.action,
  tableTitle: theme.table.title,
  tableHeader: theme.table.header,
  biometricPaper: {
    background: "#fff",
  },
  btnPrimary: theme.formTable.actions,
  approvedIcon: {
    "&.Mui-checked": {
      color: "#00913E",
    },
  },
  rejectIcon: {
    "&.Mui-checked": {
      color: "#FF0000",
    },
  },
  commonBtn: {
    color: "grey",
  },
  noBtnClasses: {
    visibility: "hidden",
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

class PendingApproval extends PagedDataHandler {
  state = {
    documentViewOpen: false,
    chfid: null,
    confirmedAction: null,
    documentId: null,
    changeInsureeFamily: null,
    reset: 0,
    canAddAction: null,
    checkedCanAdd: false,
    dataFromAPI: null,
  };

  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-insuree",
      "familyInsureesOverview.rowsPerPageOptions",
      [5, 10, 20],
    );
    this.defaultPageSize = props.modulesManager.getConf("fe-insuree", "familyInsureesOverview.defaultPageSize", 5);
    this.locationLevels = this.props.modulesManager.getConf("fe-location", "location.Location.MaxLevels", 4);
  }
  onDoubleClick = (f, newTab = false) => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.familyOverview", [f.uuid], newTab);
  };
  componentDidMount() {
    this.setState({ orderBy: null }, (e) => this.onChangeRowsPerPage(this.defaultPageSize));
    this.props.fetchPendingForApproval(this.props.modulesManager);

    const moduleName = "insuree";
    const { module } = this.props;
    if (module !== moduleName) this.props.clearCurrentPaginationPage();
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.documentViewOpen !== this.state.documentViewOpen) {
      this.adjustButtonZIndex();
    }
  }

  componentWillUnmount = () => {
    const { location, history } = this.props;
    const {
      location: { pathname },
    } = history;
    const urlPath = location.pathname;
    if (!pathname.includes(urlPath)) this.props.clearCurrentPaginationPage();
  };

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
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.insuree", [i.uuid], newTab);
  };

  // onDoubleClick = (f, newTab = false) => {
  //   console.log("checkf", f);
  //   historyPush(
  //     this.props.modulesManager,
  //     this.props.history,
  //     "insuree.route.familyOverview",
  //     [f.headInsuree.uuid],
  //     newTab,
  //   );
  //   // historyPush(this.props.modulesManager, this.props.history, "insuree.route.family");
  // };

  onChangeSelection = (i) => {
    this.props.selectFamilyMember(i[0] || null);
  };

  headers = [
    "PedingApproval.tempCamuNo",
    "PedingApproval.firstName",
    "PedingApproval.lastName",
    "PedingApproval.gender",
    // "PedingApproval.city",
    ...Array.from(Array(this.locationLevels)).map((_, i) => `location.locationType.${i}`),
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
    this.sorter("PedingApproval.tempCamuNo"),
    this.sorter("PedingApproval.firstName"),
    this.sorter("PedingApproval.lastName"),
    this.sorter("PedingApproval.lastName"),
  ];

  onDocumentViewClose = () => {
    this.setState({ documentViewOpen: false });
  };
  rejectedCommentsTooltip = (rejectComment) => {
    return (
      <PublishedComponent
        pubRef="insuree.RejectCommentPicker"
        withNull
        filterLabels={false}
        value={!!rejectComment.comments && Number(rejectComment.comments)}
        readOnly={true}
      >
        <div style={{ color: "white" }}>{rejectComment.comments}</div>
      </PublishedComponent>
    );
  };
  viewDocumentAction = (uuid) => {
    return (
      <Tooltip title={formatMessage(this.props.intl, "insuree", "Insuree.viewDocuments")}>
        <IconButton onClick={(e) => this.setState({ documentId: uuid, documentViewOpen: true })}>
          <InsertDriveFileIcon className={this.props.classes.btnPrimary} />
        </IconButton>
      </Tooltip>
    );
  };
  getCheckBoxClass = (status) => {
    const checkStatus = status.documentStatus;
    let selectedClass = null;
    let rejectedTooltip = null;
    let docsStatus = null;
    switch (checkStatus) {
      case "APPROVED":
        selectedClass = this.props.classes.approvedIcon;
        // docsStatus = "Approved";
        docsStatus = formatMessage(this.props.intl, "insuree", "Insuree.approved");
        break;
      case "REJECTED":
        selectedClass = this.props.classes.rejectIcon;
        rejectedTooltip = (
          <Tooltip
            placement="right"
            arrow
            classes={{ tooltip: this.props.classes.tooltip, arrow: this.props.classes.customArrow }}
            title={this.rejectedCommentsTooltip(status)}
          >
            <IconButton>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        );
        // docsStatus = "Rejected";
        docsStatus = formatMessage(this.props.intl, "insuree", "Insuree.rejected");
        break;
      case "PENDING_FOR_REVIEW":
        selectedClass = this.props.classes.commonBtn;
        // docsStatus = "NOT REVIEWED";
        docsStatus = formatMessage(this.props.intl, "insuree", "Insuree.notReviewed");
        break;
      default:
        selectedClass = this.props.classes.noBtnClasses;
        break;
    }

    return { selectedClass, rejectedTooltip, docsStatus };
  };
  parentLocation = (location, level) => {
    if (!location) return "";
    let loc = location;
    for (var i = 1; i < this.locationLevels - level; i++) {
      if (!loc.parent) return "";
      loc = loc.parent;
    }
    return !!loc ? loc.name : "";
  };
  formatters = [
    (i) => i.headInsuree.chfId || "",
    (i) => i.headInsuree.otherNames,

    (i) => i.headInsuree.lastName,
    (i) => (
      <PublishedComponent
        pubRef="insuree.InsureeGenderPicker"
        withLabel={false}
        readOnly={true}
        value={!!i.headInsuree.gender ? i.headInsuree.gender.code : null}
      />
    ),
    (i) => () => {
      for (var i = 0; i < this.locationLevels; i++) {
        // need a fixed variable to refer to as parentLocation argument
        let j = i + 0;
        // formatters.push((i) => {
        //   console.log("familloc", i);
        this.parentLocation(i.currentVillage || (!!i.family && i.family.location), j);
      }
    },
    // })
  ];
  // formatters = [
  //   (i) => i.headInsuree.chfId || "",
  //   (i) => i.headInsuree.otherNames,

  //   (i) => i.headInsuree.lastName,
  //   (i) => (
  //     <PublishedComponent
  //       pubRef="insuree.InsureeGenderPicker"
  //       withLabel={false}
  //       readOnly={true}
  //       value={!!i.headInsuree.gender ? i.headInsuree.gender.code : null}
  //     />
  //   ),
  //   // (i)=>( for (var i = 0; i < this.locationLevels; i++) {
  //   //   // need a fixed variable to refer to as parentLocation argument
  //   //   let j = i + 0;
  //   //   // formatters.push((i) => {
  //   //   //   console.log("familloc", i);
  //   //    this.parentLocation(i.currentVillage || (!!i.family && i.family.location), j));
  //   // // })
  // ];
  // itemFormatters = () => {
  //   var formatters = [
  //     // (i) => i.headInsuree.chfId || "",
  //     // (i) => i.headInsuree.otherNames,

  //     // (i) => i.headInsuree.lastName,

  //     // (i) => (
  //     //   <PublishedComponent
  //     //     pubRef="insuree.InsureeGenderPicker"
  //     //     withLabel={false}
  //     //     readOnly={true}
  //     //     value={!!i.headInsuree.gender ? i.headInsuree.gender.code : null}
  //     //   />
  //     // ),
  //     (i) => i.chfId,
  //     (i) => i.lastName,
  //     (i) => i.otherNames,

  //     (i) => (
  //       <PublishedComponent
  //         pubRef="insuree.InsureeGenderPicker"
  //         withLabel={false}
  //         readOnly={true}
  //         value={!!i.gender ? i.gender.code : null}
  //       />
  //     ),
  //   ];
  //   for (var i = 0; i < this.locationLevels; i++) {
  //     // need a fixed variable to refer to as parentLocation argument
  //     let j = i + 0;
  //     formatters.push((i) => {
  //       console.log("familloc", i);
  //     }, this.parentLocation(i.currentVillage || (!!i.family && i.family.location), j));
  //   }
  //   return formatters.filter;
  // };

  addNewInsuree = () =>
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.insuree", [
      "_NEW_",
      this.props.family.uuid,
    ]);
  rowLocked = (i) => !!i.clientMutationId;
  render() {
    const {
      intl,
      classes,
      pageInfo,
      family,
      familyMembers,
      fetchingDocuments,
      errorDocuments,
      readOnly,
      checkingCanAddInsuree,
      errorCanAddInsuree,
      edited,
      documentDetails,
      PendingApproval,
      insurees,
      fetchingInsurees,
      errorInsurees,
    } = this.props;
    console.log("itemFormatters", this.itemFormatters);
    let actions =
      !!readOnly || !!checkingCanAddInsuree || !!errorCanAddInsuree
        ? []
        : [
            // {
            //   button: (
            //     <Button onClick={this.handleExternalNavigation} variant="contained" color="primary">
            //       Collect Documents
            //     </Button>
            //   ),
            // },
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
    // let bioActions =
    //   !!readOnly || !!checkingCanAddInsuree || !!errorCanAddInsuree
    //     ? []
    //     : [
    //         {
    //           button: (
    //             <Button onClick={this.handleExternalNavigation} variant="contained" color="primary">
    //               Collect Biometric
    //             </Button>
    //           ),
    //         },
    //       ];
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
      <Grid container>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Grid container alignItems="center" direction="row" className={classes.paperHeader}>
              <Grid item xs={8}>
                <Typography className={classes.tableTitle}>
                  <FormattedMessage module="insuree" id="Insuree.pendingApproval" />
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
            {/* {documentDetails?.length > 0 && !fetchingDocuments ? ( */}
            <Table
              module="insuree"
              headers={this.headers}
              headerActions={this.headerActions}
              itemFormatters={this.formatters}
              items={PendingApproval}
              fetching={fetchingInsurees}
              error={errorInsurees}
              onDoubleClick={this.onDoubleClick}
              withSelection={"single"}
              onChangeSelection={this.onChangeSelection}
              withPagination={false}
              rowsPerPageOptions={this.rowsPerPageOptions}
              defaultPageSize={this.defaultPageSize}
              page={this.currentPage()}
              pageSize={this.currentPageSize()}
              count={pageInfo.totalCount}
              onChangePage={this.onChangePage}
              onChangeRowsPerPage={this.onChangeRowsPerPage}
              rowLocked={this.rowLocked}
            />
            {/* ) : !fetchingDocuments && documentDetails?.length == 0 ? (
              <Grid
                style={{
                  dispaly: "flex",
                  height: "15rem",
                }}
              >
                <Typography
                  style={{
                    color: "red",
                    justifyContent: "center",
                    textAlign: "center",
                    alignItems: "center",
                    padding: "6rem 0",
                    fontSize: "1.8rem",
                  }}
                >
                  {formatMessage(this.props.intl, "insuree", "Insuree.noDocuments")}
                </Typography>
              </Grid>
            ) : null} */}
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  alert: !!state.core ? state.core.alert : null,
  family: state.insuree.family,
  fetchingDocuments: state.insuree.fetchingPendingApproval,
  fetchedDocuments: state.insuree.fetchedPendingApproval,
  familyMembers: state.insuree.familyMembers,
  pageInfo: state.insuree.familyMembersPageInfo,
  errorDocuments: state.insuree.errorPendingApproval,
  checkingCanAddInsuree: state.insuree.checkingCanAddInsuree,
  checkedCanAddInsuree: state.insuree.checkedCanAddInsuree,
  canAddInsureeWarnings: state.insuree.canAddInsureeWarnings,
  errorCanAddInsuree: state.insuree.errorCanAddInsuree,
  submittingMutation: state.insuree.submittingMutation,
  mutation: state.insuree.mutation,
  documentDetails: state.insuree.documentsData,
  family: state.insuree.family,
  PendingApproval: state.insuree.PendingApproval,
  insurees: state.insuree.insurees,
  insureesPageInfo: state.insuree.insureesPageInfo,
  fetchingInsurees: state.insuree.fetchingInsurees,
  fetchedInsurees: state.insuree.fetchedInsurees,
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
      fetchInsureeDocuments,
      updateInsureeDocument,
      fetchPendingForApproval,
      clearCurrentPaginationPage,
      fetchInsureeSummaries,
    },
    dispatch,
  );
};

export default withModulesManager(
  withHistory(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(PendingApproval))))),
);
