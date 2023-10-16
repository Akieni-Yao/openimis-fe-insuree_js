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
  biometricPaper: {
    background: "#fff",
  },
  btnPrimary: theme.formTable.actions,
  approvedIcon: {
    "&.Mui-checked": {
      color: "#00913E", // Custom color for the approved checkbox when checked
    },
  },
  rejectIcon: {
    "&.Mui-checked": {
      color: "#FF0000", // Custom color for the rejected checkbox when checked
    },
  },
  commonBtn: {
    color: "grey",
  },
  noBtnClasses: {
    visibility: "hidden",
  },
  customWidth: {
    maxWidth: 500,
    color: "white",
  },
});

class InsureeDocuments extends PagedDataHandler {
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
    this.props.fetchInsureeDocuments(this.props?.edited?.chfId);
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
  rejectedCommentsTooltip = (rejectComment) => {
    console.log("tooltip", rejectComment);
    return (
      <PublishedComponent
        pubRef="insuree.RejectCommentPicker"
        withNull
        filterLabels={false}
        value={!!rejectComment.comments && rejectComment.comments}
        readOnly={true}
      />
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
    console.log("sgtaa", status);
    const checkStatus = status.documentStatus;
    let selectedClass = null;
    let rejectedTooltip = null;
    let docsStatus = null;

    switch (checkStatus) {
      case "APPROVED":
        selectedClass = this.props.classes.approvedBtn;
        // selectedClass = "00913E";
        docsStatus = "Approved";
        break;
      case "REJECTED": // I assume this is "REJECTED"
        selectedClass = this.props.classes.rejectBtn;
        rejectedTooltip = (
          <Tooltip
            placement="right-start"
            arrow
            classes={{ tooltip: this.props.classes.customWidth }}
            title={this.rejectedCommentsTooltip(status)}
          >
            <IconButton>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        );
        docsStatus = "Rejected";
        break;
      case "PENDING_FOR_REVIEW":
        selectedClass = this.props.classes.commonBtn;
        docsStatus = "NOT REVIEWED";
        break;
      default:
        selectedClass = this.props.classes.noBtnClasses;
        break;
    }

    return { selectedClass, rejectedTooltip, docsStatus };
  };

  formatters = [
    (i) => i.documentName || "",
    (i) => !!i.documentId && this.viewDocumentAction(i.documentId),

    (i) => {
      const { selectedClass, rejectedTooltip, docsStatus } = this.getCheckBoxClass(i);
      return (
        <>
          <Checkbox
            // icon={<span className={selectedClass} />}
            // checkedIcon={<span className={selectedClass} />}
            className={selectedClass}
            readOnly={true}
            disabled={true}
            checked={i.documentStatus == "APPROVED" || i.documentStatus == "REJECTED"} // Example checked condition
          />
          {docsStatus}
          {rejectedTooltip}
        </>
      );
    },
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
            {
              button: (
                <Button
                  onClick={(e) => this.checkCanAddInsuree(this.addNewInsuree)}
                  variant="contained"
                  color="primary"
                >
                  Collect Documents
                </Button>
              ),
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
              // items={[
              //   {
              //     "id": "34",
              //     "documentId": "ad303dbf-f6f2-4da3-9d47-cadc55c5e05c",
              //     "documentName": "Declaration of employment",
              //     "documentPath": "Declaration of employment.pdf",
              //     "documentStatus": "PENDING_FOR_REVIEW",
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
              //     "documentStatus": "REJECTED",
              //     "comments": 1,
              //     "tempCamu": "T1915102023003719",
              //     "isVerified": false,
              //   },
              // ]}
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
              <Grid item xs={12} className={classes.biometricPaper}>
                <Divider />
                <Grid container justify="center" alignItems="center" className={classes.biometricPaper}>
                  <Typography style={{ padding: "50px 0" }}>
                    <Box style={{ marginLeft: "2.2rem" }}>
                      <DisabledBiometric fontSize="large" />
                    </Box>
                    <Box> Biometric Details are not provided</Box>
                  </Typography>
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
  injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(InsureeDocuments)))),
);
