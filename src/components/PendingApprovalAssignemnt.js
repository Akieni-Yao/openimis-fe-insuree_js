import React, { Fragment } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import _ from "lodash";
import { Checkbox, Paper, IconButton, Grid, Divider, Typography, Tooltip, Button, Box } from "@material-ui/core";
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import PersonAddDisabledIcon from '@material-ui/icons/PersonAddDisabled';
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
// import EnquiryDialog from "./EnquiryDialog";
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
  fetchPendingApprvalQueue,
  UnAssignUser,
  AssignUser
} from "../actions";
// import { DisabledBiometric, InvalidBiometric, ValidBiometric } from "../SvgIndex";
// import DocumentViewDialog from "../dialogs/DocumentViewDialogs";
import HelpIcon from "@material-ui/icons/Help";
import UnAssignUserDialog from "../dialogs/UnAssignUserDialog";

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

class PendingApprovalAssignemnt extends PagedDataHandler {
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
    readOnly: true,
    isAddUserClicked: false,
    selectedRowsForAssign: new Set(),
    toggleButtonClicked: false,
    unAssignUser: null,
    selectedDropdownValue: null
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

  componentDidMount() {
    this.setState({ orderBy: null }, (e) => this.onChangeRowsPerPage(this.defaultPageSize));
    // this.props.fetchPendingForApproval(this.props.modulesManager);
    this.props.fetchPendingApprvalQueue(this.props.modulesManager);

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
    // if (!!this.props.family && !!this.props.family.uuid) {
    //   prms.push(`familyUuid:"${this.props.family.uuid}"`);
    //   return prms;
    // }
    return null;
  };


  addUser = (e) => {
    this.setState({ readOnly: false, isAddUserClicked: true });
  }
  toggleAssign = (family) => {
    // console.log("family", family)
    const selectedRowsForAssign = new Set(this.state.selectedRowsForAssign);
    const toggleButtonClickedRow = this.state.toggleButtonClickedRow === family ? null : family;
    if (selectedRowsForAssign.has(family)) {
      selectedRowsForAssign.delete(family);
    } else {
      selectedRowsForAssign.add(family);
    }
    // this.setState({ selectedRowsForAssign });
    this.setState({ selectedRowsForAssign, toggleButtonClicked: true, readOnly: false, toggleButtonClickedRow });
  }
  onChangeSelection = (i) => {
    this.props.selectFamilyMember(i[0] || null);
  };
  deleteUser = (isConfirmed) => {
    if (!!isConfirmed) {
      this.setState({ deleteUser: null });
    } else {
      const user = this.state.unAssignUser;
      this.setState({ unAssignUser: null }, async () => {
        await this.props.UnAssignUser(
          user,
        );
        this.props.fetchPendingApprvalQueue(this.props.modulesManager);
        // this.fetch(['first: 10', 'orderBy: ["name"]']);
      });
    }
  };
  userAssign = (family) => {
    this.props.AssignUser(family, this.state.selectedDropdownValue)
    console.log("usersa", family)
  }
  handleDropdownChange = (selectedValue) => {
    console.log("selected", selectedValue);
    // Step 2: Update state with the selected value
    this.setState({ selectedDropdownValue: selectedValue });
  };

  headers = () => {
    var h = [
      "PedingApproval.tempCamuNo",
      "PedingApproval.lastName",
      "PedingApproval.firstName",
      "Assigned User",
      "",
      ""
    ];
    return h;
  };

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

  formatters = () => {
    var row = [
      (family) => family?.family?.headInsuree?.chfId || "",
      (family) => family?.family?.headInsuree?.otherNames,
      (family) => family?.family?.headInsuree?.lastName,
      // (family) =>
      //   family?.userId ? `${family?.userId?.iUser?.otherNames} ${family?.userId?.iUser?.lastName}` :
      //     // :
      //     <PublishedComponent
      //       pubRef="insuree.UserPicker"
      //       withLabel={false}
      //       readOnly={this.state.readOnly ? true : false}
      //       value={!!family?.userId?.iUser ? `${family?.userId?.iUser?.otherNames} ${family?.userId?.iUser?.lastName}` : null}
      //     />
      // ,
      // (family) => {
      //   const isUserSelected = this.state.selectedRowsForAssign.has(family);

      //   return family?.userId && (!isUserSelected || !this.state.toggleButtonClicked) ? 
      //     `${family?.userId?.iUser?.otherNames} ${family?.userId?.iUser?.lastName}` :
      //     <PublishedComponent
      //       pubRef="insuree.UserPicker"
      //       withLabel={false}
      //       readOnly={this.state.readOnly ? true : false}
      //       value={!!family?.userId?.iUser ? `${family?.userId?.iUser?.otherNames} ${family?.userId?.iUser?.lastName}` : null}
      //     />;
      // },
      (family) => {
        const isUserSelected = this.state.selectedRowsForAssign.has(family);

        return isUserSelected && this.state.toggleButtonClicked ? (
          <PublishedComponent
            pubRef="insuree.UserPicker"
            withLabel={false}
            readOnly={this.state.readOnly ? true : false}
            value={this.state.selectedDropdownValue} // Pass the selected value
            onChange={this.handleDropdownChange}
          // value={!!family?.userId?.iUser ? `${family?.userId?.iUser?.otherNames} ${family?.userId?.iUser?.lastName}` : null}
          />
        ) : (
          !!family?.userId ? `${family?.userId?.iUser?.otherNames} ${family?.userId?.iUser?.lastName}` : <div style={{ color: "orange" }}>Waiting in the queue</div>
        );
      },
      (family) => {
        const hasUserId = !!family?.userId; // Check if family has userId
        const isSelectedForAssign = this.state.selectedRowsForAssign.has(family);
        const buttonStyle = {
          backgroundColor: 'green',
          border: '1px solid grey',
          borderRadius: '5px',
          padding: '10px',
          cursor: 'pointer',
          color: "white" // Optional: Add pointer cursor for better UX
        };
        return (
          <Grid item>
            <Tooltip title={formatMessage(this.props.intl, "insuree", "insureeSummaries.openFamilyButton.tooltip")}>
              <IconButton
                size="small"
                onClick={() => (hasUserId ? this.toggleAssign(family) : null)}
              >
                {hasUserId ? (isSelectedForAssign ? <button style={buttonStyle} onClick={() => {
                  this.userAssign(family)
                  // Handle assign button click logic here
                  // You may want to use the selectedRowsForAssign state
                  // to perform the assignment.
                }}>
                  <FormattedMessage module="core" id="Assign" />
                </button> : <SwapHorizIcon />) : " "}
              </IconButton>
            </Tooltip>
          </Grid>
        );
      },
      // (family) => family?.userId && this.state.ischangeUser === family(
      //   <Grid item>
      //     <Tooltip title={formatMessage(this.props.intl, "insuree", "insureeSummaries.openFamilyButton.tooltip")}>
      //       <IconButton
      //         size="small"
      //         onClick={(family) =>
      //           this.unAssign(family)
      //         }
      //       >
      //         <SwapHorizIcon />
      //       </IconButton>
      //     </Tooltip>
      //   </Grid>
      // ),
      (family) => family?.userId ? <Grid item>
        <Tooltip title={formatMessage(this.props.intl, "insuree", "insureeSummaries.openFamilyButton.tooltip")}>
          <IconButton
            size="small"
            onClick={() => this.setState({ unAssignUser: family })}
          >
            <PersonAddDisabledIcon />
          </IconButton>
        </Tooltip>
      </Grid> : (
        <Grid item>
          <Tooltip title={formatMessage(this.props.intl, "insuree", "insureeSummaries.openFamilyButton.tooltip")}>
            {this.state.toggleButtonClickedRow === family ? (
              <Button
                size="small"
                color="primary"
                onClick={() => {
                  this.userAssign(family)
                  // Handle assign button click logic here
                  // You may want to use the selectedRowsForAssign state
                  // to perform the assignment.
                }}
              >
                Assign
              </Button>
            ) : (
              <IconButton
                size="small"
                onClick={() => this.toggleAssign(family)}
              >
                <PersonAddIcon />
              </IconButton>
            )}
          </Tooltip>
        </Grid>
        // <Grid item>
        //   <Tooltip title={formatMessage(this.props.intl, "insuree", "insureeSummaries.openFamilyButton.tooltip")}>
        //     <IconButton
        //       size="small"
        //       onClick={() => (this.toggleAssign(family))}
        //     // onClick={(e) =>
        //     //   this.addUser()
        //     // }
        //     >
        //       <PersonAddIcon />
        //     </IconButton>
        //   </Tooltip>
        // </Grid>
      )
      // (family) => (
      //   <PublishedComponent
      //     pubRef="insuree.UserPicker"
      //     withLabel={false}
      //     readOnly={false}
      //     value={!!family?.userId?.iUser ? `${family?.userId?.iUser?.otherNames} ${family?.userId?.iUser?.lastName}` : null}
      //   />
      // ),
    ];
    return row;
  };
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
      PendingApprovals,
      insurees,
      fetchingInsurees,
      errorInsurees,
    } = this.props;
    console.log("PendingApprovals", PendingApprovals)
    let actions =
      !!readOnly || !!checkingCanAddInsuree || !!errorCanAddInsuree
        ? []
        : [
        ];
    return (
      <>
        {this.state.unAssignUser && (
          <UnAssignUserDialog
            task={this.state.unAssignUser}
            onConfirm={this.deleteUser}
            onCancel={(e) => this.setState({ unAssignUser: null })}

          />
        )}
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

              <Table
                module="insuree"
                headers={this.headers()}
                headerActions={this.headerActions}
                itemFormatters={this.formatters()}
                items={PendingApprovals}
                fetching={fetchingInsurees}
                error={errorInsurees}
                // onDoubleClick={this.onDoubleClick}
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
            </Paper>
          </Grid>
        </Grid>
      </>
    );
  }
}

const mapStateToProps = (state) => (
  // console.log("list",state)
  // ,
  {
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
    PendingApprovals: state.insuree.PendingApprovals,
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
      fetchPendingApprvalQueue,
      UnAssignUser,
      AssignUser
    },
    dispatch,
  );
};

export default withModulesManager(
  withHistory(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(PendingApprovalAssignemnt))))),
);
