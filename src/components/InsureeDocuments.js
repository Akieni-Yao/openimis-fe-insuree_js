import React, { Fragment } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import _ from "lodash";
import { Checkbox, Paper, IconButton, Grid, Divider, Typography, Tooltip, Button, Box } from "@material-ui/core";
import {
  Search as SearchIcon,
  Add as AddIcon,
  PersonAdd as AddExistingIcon,
  PersonPin as SetHeadIcon,
  Delete as DeleteIcon,
  Clear as RemoveIcon,
} from "@material-ui/icons";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
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
  fetchInsureeDocuments,
  updateInsureeDocument,
} from "../actions";
import { DisabledBiometric } from "../SvgIndex";
import DocumentViewDialog from "../dialogs/DocumentViewDialogs";
import HelpIcon from "@material-ui/icons/Help";

const styles = (theme) => ({
  paper: theme.paper.paper,
  paperHeader: theme.paper.header,
  paperHeaderAction: theme.paper.action,
  tableTitle: theme.table.title,
  tableHeader: theme.table.header,
  btnPrimary: theme.formTable.actions,
});

class FamilyInsureesOverview extends PagedDataHandler {
  state = {
    documentViewOpen: false,
    chfid: null,
    confirmedAction: null,
    documentId: null,
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
    this.props.fetchInsureeDocuments(this.props.edited.chfId);
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

  approved = (docData) => {
    this.props.updateInsureeDocument(docData);
  };
  rejectDoc = (docData) => {
    this.props.updateInsureeDocument(docData);
  };
  onChangeSelection = (i) => {
    this.props.selectFamilyMember(i[0] || null);
  };

  headers = ["Insuree.documentsName", "Insuree.viewDocuments", "Insuree.status"];

  sorter = (attr, asc = true) => [
    () =>
      this.setState(
        (state, props) => ({ orderBy: sort(state.orderBy, attr, asc) }),
        (e) => this.query(),
      ),
    () => formatSorter(this.state.orderBy, attr, asc),
  ];

  headerActions = [this.sorter("documentsName"), this.sorter("viewDocuments"), this.sorter("status")];

  onDocumentViewClose = () => {
    this.setState({ documentViewOpen: false });
  };
  viewDocumentAction = (uuid) => {
    console.log("uuid", uuid);
    return (
      <Tooltip title={formatMessage(this.props.intl, "insuree", "Insuree.viewDocuments")}>
        <IconButton onClick={(e) => this.setState({ documentId: uuid, documentViewOpen: true })}>
          <InsertDriveFileIcon className={this.props.classes.btnPrimary} />
        </IconButton>
      </Tooltip>
    );
  };
  //   getCheckBoxClass = (status) => {
  //     let selectedClass = null;
  //     let rejectedTooltip = null;
  //     switch (status) {
  //       case "APPROVED":
  //         selectedClass = this.props.classes.approvedBtn;
  //       case "REJECT":
  //         selectedClass = this.props.classes.rejectBtn;
  //         rejectedTooltip = () => {
  //           return (
  //             <Tooltip title={formatMessage(this.props.intl, "insuree", "insureeSummaries.openFamilyButton.tooltip")}>
  //             <IconButton>
  //               <HelpIcon />
  //             </IconButton>
  //             </Tooltip>
  //           );
  //         };
  //       case "PENDING_FOR_REVIEW":
  //         selectedClass = this.props.classes.commonBtn;
  //       default:
  //         selectedClass = this.props.classes.noBtnClasses;
  //     }
  //   };

  formatters = [
    (i) => i.documentName || "",
    (i) => !!i.documentId && this.viewDocumentAction(i.documentId),

    (i) => <Checkbox color="primary" readOnly={true} disabled={true} checked={i.documentStatus} />,
  ];

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
    } = this.props;
    let actions =
      !!readOnly || !!checkingCanAddInsuree || !!errorCanAddInsuree
        ? []
        : [
            // {
            //   button: (
            //     <div>
            //       <PublishedComponent //div needed for the tooltip style!!
            //         pubRef="insuree.InsureePicker"
            //         IconRender={AddExistingIcon}
            //         forcedFilter={["head: false"]}
            //         onChange={(changeInsureeFamily) => this.setState({ changeInsureeFamily })}
            //         check={() => this.checkCanAddInsuree(() => this.setState({ checkedCanAdd: true }))}
            //         checked={this.state.checkedCanAdd}
            //       />
            //     </div>
            //   ),
            //   tooltip: formatMessage(intl, "insuree", "familyAddExsistingInsuree.tooltip"),
            // },
            {
              button: (
                <Button
                  onClick={(e) => this.checkCanAddInsuree(this.addNewInsuree)}
                  variant="filled"
                  className={classes.btnPrimary}
                >
                  Collect Documents
                </Button>
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
    console.log("editedval", documentDetails);
    return (
      <Grid container>
        <Grid item xs={7}>
          <Paper className={classes.paper}>
            <Grid container alignItems="center" direction="row" className={classes.paperHeader}>
              <Grid item xs={8}>
                <Typography className={classes.tableTitle}>
                  <FormattedMessage module="insuree" id="Insuree.documentTitle" />
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
              items={documentDetails}
              fetching={fetchingDocuments}
              error={errorDocuments}
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
          </Paper>
        </Grid>
        <Grid item xs={5}>
          <Paper className={classes.paper}>
            <Grid container alignItems="center" direction="row" className={classes.paperHeader}>
              <Grid item xs={8}>
                <Typography className={classes.tableTitle}>
                  <FormattedMessage module="insuree" id="Insuree.BiometricHeading" />
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
              <Grid item xs={12} className={classes.tableHeader}>
                <Divider />
                <Grid container justify="center" alignItems="center">
                  <Typography style={{ padding: "50px 0" }}>
                    <DisabledBiometric />
                  </Typography>
                  <Box display="block"> Biometric Details are not provided</Box>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <DocumentViewDialog
          open={this.state.documentViewOpen}
          onClose={this.onDocumentViewClose}
          documentImage={this.state.documentId}
          approved={this.approved}
          rejectDoc={this.rejectDoc}
        />
      </Grid>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  alert: !!state.core ? state.core.alert : null,
  family: state.insuree.family,
  fetchingDocuments: state.insuree.fetchingDocuments,
  fetchedDocuments: state.insuree.fetchedDocuments,
  familyMembers: state.insuree.familyMembers,
  pageInfo: state.insuree.familyMembersPageInfo,
  errorDocuments: state.insuree.errorDocument,
  checkingCanAddInsuree: state.insuree.checkingCanAddInsuree,
  checkedCanAddInsuree: state.insuree.checkedCanAddInsuree,
  canAddInsureeWarnings: state.insuree.canAddInsureeWarnings,
  errorCanAddInsuree: state.insuree.errorCanAddInsuree,
  submittingMutation: state.insuree.submittingMutation,
  mutation: state.insuree.mutation,
  documentDetails: state.insuree.documentsData,
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
    },
    dispatch,
  );
};

export default withModulesManager(
  injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(FamilyInsureesOverview)))),
);
