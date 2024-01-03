import React, { Fragment, Component } from "react";
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
  Searcher
} from "@openimis/fe-core";
// import EnquiryDialog from "./EnquiryDialog";
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
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
import AssignUserDialog from "../dialogs/AssignUserDialog";

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

class PendingApprovalAssignemnt extends Component {
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
    userAssign: null,
    selectedDropdownValue: null,
    toggleButtonClickedRow: null,
    sucess: false,
    sucessMessage: null,
    Unassignsucess: false,
    UnassignsucessMessage: null
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
    // this.setState({ orderBy: null }, (e) => this.onChangeRowsPerPage(this.defaultPageSize));
    // this.props.fetchPendingForApproval(this.props.modulesManager);
    // this.props.fetchPendingApprvalQueue(this.props.modulesManager);

    const moduleName = "insuree";
    const { module } = this.props;
    // if (module !== moduleName) this.props.clearCurrentPaginationPage();
  }
  fetch = (prms) => {
    this.props.fetchPendingApprvalQueue(this.props.modulesManager, prms);
  };
  filtersToQueryParams = (state) => {
    let prms = Object.keys(state.filters)
      .filter((f) => !!state.filters[f]["filter"])
      .map((f) => state.filters[f]["filter"]);
    if (!state.beforeCursor && !state.afterCursor) {
      prms.push(`first: ${state.pageSize}`);
    }
    if (!!state.afterCursor) {
      prms.push(`after: "${state.afterCursor}"`);
      prms.push(`first: ${state.pageSize}`);
    }
    if (!!state.beforeCursor) {
      prms.push(`before: "${state.beforeCursor}"`);
      prms.push(`last: ${state.pageSize}`);
    }
    if (!!state.orderBy) {
      prms.push(`orderBy: ["${state.orderBy}"]`);
    }
    return prms;
  };

  addUser = (e) => {
    this.setState({ readOnly: false, isAddUserClicked: true });
  }
  // toggleAssign = (family) => {
  //   // console.log("family", family)
  //   const selectedRowsForAssign = new Set(this.state.selectedRowsForAssign);
  //   const toggleButtonClickedRow = this.state.toggleButtonClickedRow === family ? null : family;
  //   if (selectedRowsForAssign.has(family)) {
  //     selectedRowsForAssign.delete(family);
  //   } else {
  //     selectedRowsForAssign.add(family);
  //   }
  //   // this.setState({ selectedRowsForAssign });
  //   this.setState({ selectedRowsForAssign, toggleButtonClicked: true, readOnly: false, toggleButtonClickedRow });
  // }
  toggleAssign = (family) => {
    const selectedRowsForAssign = new Set(this.state.selectedRowsForAssign);
    const toggleButtonClickedRow = this.state.toggleButtonClickedRow === family ? null : family;

    // Clear the selection of the previously selected row
    if (selectedRowsForAssign.size > 0) {
      selectedRowsForAssign.clear();
    }

    if (!selectedRowsForAssign.has(family)) {
      selectedRowsForAssign.add(family);
    }

    this.setState({ selectedRowsForAssign, toggleButtonClicked: true, readOnly: false, toggleButtonClickedRow });
  }

  // onChangeSelection = (i) => {
  //   this.props.selectFamilyMember(i[0] || null);
  // };
  deleteUser = (isConfirmed) => {
    if (!!isConfirmed) {
      this.setState({ deleteUser: null });
    } else {
      const user = this.state.unAssignUser;
      this.setState({ unAssignUser: null }, async () => {
      const response= await this.props.UnAssignUser(
          user,
        );
        // this.props.fetchPendingApprvalQueue(this.props.modulesManager);
        this.fetch(['first: 5']);
        // console.log("response",response);
        if (response?.payload?.data?.UnassignUsertoProfile?.message) {
          this.setState({ UnassignsucessMessage: response?.payload?.data?.UnassignUsertoProfile?.message })
          this.setState({ Unassignsucess: true })
        }
      });
    }
  };
  userAssign = (family) => {
    // console.log("family",family)
    if (!!family) {
      this.setState({ userAssign: null });
    } else {
      const user = this.state.userAssign;
      this.setState({ AssignUser: null }, async () => {
        const response = await this.props.AssignUser(
          user, this.state.selectedDropdownValue
        );
        // console.log("response", response?.payload?.data?.AssignUsertoProfile?.message);
        // this.props.fetchPendingApprvalQueue(this.props.modulesManager);
        this.setState({ userAssign: null });
        this.setState({ selectedDropdownValue: null });
        this.fetch(['first: 5']);
        if (response?.payload?.data?.AssignUsertoProfile?.message) {
          this.setState({ sucessMessage: response?.payload?.data?.AssignUsertoProfile?.message })
          this.setState({ sucess: true })
        }
        // if(response)
      });
    }
    // console.log("this.state.selectedDropdownValue",this.state.selectedDropdownValue)
    // this.props.AssignUser(family, this.state.selectedDropdownValue)
    // console.log("usersa", family)
  }
  handleDropdownChange = (selectedValue) => {
    this.setState({ selectedDropdownValue: selectedValue });
  };
  onHandlerClose=()=>
  {
    this.setState({sucess:false});
    this.setState({Unassignsucess:false});
  }
  headers = (filter) => {
    var h = [
      "PedingApproval.tempCamuNo",
      "PedingApproval.lastName",
      "PedingApproval.firstName",
      "Assign.User",
      " ",
      " "
    ];
    // return h;
    return h.filter(Boolean);
  };

  // sorter = (attr, asc = true) => [
  //   () =>
  //     this.setState(
  //       (state, props) => ({ orderBy: sort(state.orderBy, attr, asc) }),
  //       (e) => this.query(),
  //     ),
  //   () => formatSorter(this.state.orderBy, attr, asc),
  // ];

  // headerActions = [
  //   this.sorter("PedingApproval.tempCamuNo"),
  //   this.sorter("PedingApproval.firstName"),
  //   this.sorter("PedingApproval.lastName"),
  //   this.sorter("PedingApproval.lastName"),
  // ];

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
          // backgroundColor: 'green',
          backgroundColor: !!this.state.selectedDropdownValue ? 'green' : 'gray',
          border: '1px solid grey',
          borderRadius: '5px',
          padding: '10px',
          cursor: 'pointer',
          color: "white" // Optional: Add pointer cursor for better UX
        };
        return (
          <Grid item>
            <Tooltip title={formatMessage(this.props.intl, "insuree", "reassign.tooltip")}>
              <IconButton
                size="small"
                onClick={() => (hasUserId ? this.toggleAssign(family) : null)}
              >
                {hasUserId ? (isSelectedForAssign ? <button style={buttonStyle} disabled={!this.state.selectedDropdownValue} onClick={() => {
                  this.setState({ userAssign: family })
                }}>
                  <FormattedMessage module="core" id="Re-assign" />
                </button> : <SwapHorizIcon />) : " "}
              </IconButton>
            </Tooltip>
          </Grid>
        );
      },
      (family) => family?.userId ? <Grid item>
        <Tooltip title={formatMessage(this.props.intl, "insuree", "Unassign.tooltip")}>
          <IconButton
            size="small"
            onClick={() => this.setState({ unAssignUser: family })}
          >
            <PersonAddDisabledIcon />
          </IconButton>
        </Tooltip>
      </Grid> : (
        <Grid item>
          <Tooltip title={formatMessage(this.props.intl, "insuree", "assign.tooltip")}>

            {this.state.toggleButtonClickedRow === family ? (
              <button
                size="small"
                color="primary"
                style={
                  {
                    "backgroundColor": !!this.state.selectedDropdownValue ? 'green' : "grey",
                    "border": '1px solid grey',
                    "borderRadius": '5px',
                    "padding": '10px',
                    "cursor": 'pointer',
                    "color": "white"
                  }
                  // Optional: Add pointer cursor for better UX
                }
                disabled={!this.state.selectedDropdownValue}
                onClick={() => {
                  this.setState({ userAssign: family })
                }}
              >
                Assign
              </button>
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
      )
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
      fetchedInsurees,
      errorInsurees,
      filterPaneContributionsKey,
      cacheFiltersKey,
      PendingApprovalInfo
    } = this.props;
    // console.log("pageInfo", PendingApprovalInfo)
    let actions =
      !!readOnly || !!checkingCanAddInsuree || !!errorCanAddInsuree
        ? []
        : [
        ];
    let count = PendingApprovalInfo?.totalCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return (
      <>
        {this.state.unAssignUser && (
          <UnAssignUserDialog
            task={this.state.unAssignUser}
            onConfirm={this.deleteUser}
            onCancel={(e) => this.setState({ unAssignUser: null })}

          />
        )}
        {this.state.userAssign && (
          <AssignUserDialog
            task={this.state.userAssign}
            onConfirm={this.userAssign}
            name={this.state.selectedDropdownValue}
            onCancel={(e) => this.setState({ userAssign: null })}

          />
        )}
        {this.state.sucess &&
          <Snackbar open={this.state.sucess} anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }} onClose={this.onHandlerClose}>

            < Alert variant="filled" severity="success" >
              {this.state.sucessMessage}
            </Alert >
          </Snackbar>
        }
          {this.state.Unassignsucess &&
          <Snackbar open={this.state.Unassignsucess} anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }} onClose={this.onHandlerClose}>

            < Alert variant="filled" severity="success" >
              {this.state.UnassignsucessMessage}
            </Alert >
          </Snackbar>
        }
        <Grid container>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              {/* <Grid container alignItems="center" direction="row" className={classes.paperHeader}>
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
              </Grid> */}

              <Searcher
                module="insuree"
                cacheFiltersKey={cacheFiltersKey}
                filterPaneContributionsKey={filterPaneContributionsKey}
                headers={this.headers}
                itemsPageInfo={PendingApprovalInfo}
                itemFormatters={this.formatters}
                items={PendingApprovals}
                fetchingItems={fetchingInsurees}
                fetchedItems={fetchedInsurees}
                errorItems={errorInsurees}
                // onChangeSelection={this.onChangeSelection}
                rowsPerPageOptions={this.rowsPerPageOptions}
                defaultPageSize={this.defaultPageSize}
                fetch={this.fetch}
                rowLocked={this.rowLocked}
                withSelection={"single"}
                rowIdentifier={this.rowIdentifier}
                filtersToQueryParams={this.filtersToQueryParams}
                tableTitle={formatMessageWithValues(intl, "insuree", "insureePendingApproval", { count })}
              />
            </Paper>
          </Grid>
        </Grid>
      </>
    );
  }
}

const mapStateToProps = (state) => (
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
    PendingApprovalInfo: state.insuree.PendingApprovalInfo,
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
