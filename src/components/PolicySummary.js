import React from "react";
import { injectIntl } from "react-intl";
import { Grid, Typography, Divider, Paper, IconButton, Tooltip } from "@material-ui/core";
import {
  Table,
  PagedDataHandler,
  formatMessage,
  formatMessageWithValues,
  formatDateFromISO,
  withModulesManager,
  FormattedMessage,
  formatSorter,
  sort,
  historyPush,
  withHistory,
  decodeId,
  PublishedComponent,
} from "@openimis/fe-core";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { fetchPolicyHolderFamily, fetchPolicyHolderInsuree } from "../actions";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { RIGHT_POLICYHOLDER_UPDATE, RIGHT_POLICYHOLDER_DELETE, RIGHT_PORTALPOLICYHOLDER_SEARCH } from "../constants";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";

const styles = (theme) => ({
  paper: theme.paper.paper,
  paperHeader: theme.paper.header,
  paperHeaderAction: theme.paper.action,
  tableTitle: theme.table.title,
  approvedBtn: {
    backgroundColor: "#FFFFFF",
    borderColor: "#00913E",
    color: "#00913E",
    borderRadius: "2rem",
  },
  rejectBtn: {
    backgroundColor: "#FFFFFF",
    borderColor: "##FF0000",
    color: "##FF0000",
    borderRadius: "2rem",
  },
  commonBtn: {
    backgroundColor: "#FFFFFF",
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

class PolicySummary extends PagedDataHandler {
  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-insuree",
      "familyPolicyHolderSummary.rowsPerPageOptions",
      [5, 10, 20],
    );
    this.defaultPageSize = props.modulesManager.getConf("fe-insuree", "familyPolicyHolderSummary.defaultPageSize", 5);
    this.showBalance = props.modulesManager.getConf("fe-insuree", "familyPolicyHolderSummary.showBalance", false);
    this.state = {
      toDelete: null,
      deleted: [],
    };
  }

  policyHolderPageLink = (policyHolder) => {
    return `${this.props.modulesManager.getRef("policyHolder.route.policyHolder")}${
      "/" + decodeId(policyHolder.node.id)
    }`;
  };

  headers = () => {
    const { rights } = this.props;
    let result = [
      "policyHolder.displayName",
      "policyHolder.location",
      "policyHolder.legalForm",
      "policyHolder.activityCode",
      "policyHolder.dateValidFrom",
      "policyHolder.dateValidTo",
    ];
    if (rights.includes(RIGHT_POLICYHOLDER_UPDATE)) {
      result.push("policyHolder.edit");
    }
    if (rights.includes(RIGHT_POLICYHOLDER_DELETE)) {
      result.push("policyHolder.delete");
    }
    return result;
  };
  queryPrms = () => {
    let prms = [];
    // if (!!this.state.orderBy) {
    //   prms.push(`orderBy: "${this.state.orderBy}"`);
    // }
    if (!!this.props.family && !!this.props.family?.uuid) {
      prms.push(`familyUuid:"${this.props.family.uuid}"`);
      return prms;
    }
    return null;
  };
  componentDidMount() {
    // this.setState({ orderBy: null }, (e) => this.onChangeRowsPerPage(this.defaultPageSize));
    console.log("this.props", this.props);
    if (!!this.props.edited_id) {
      this.props.fetchPolicyHolderInsuree(this.props.modulesManager, this.props.edited_id);
    }
    if (!!this.props.family && !!this.props.family?.uuid) {
      this.props.fetchPolicyHolderFamily(this.props.modulesManager, this.props.family.uuid);
    }
  }
  isOnDoubleClickEnabled = (policyHolder) =>
    !this.state.deleted.includes(policyHolder.id) && !this.isDeletedFilterEnabled(policyHolder);
  onDoubleClick = (policyHolder, newTab = false) => {
    const { rights, modulesManager, history } = this.props;
    if (rights.includes(RIGHT_POLICYHOLDER_UPDATE) || rights.includes(RIGHT_PORTALPOLICYHOLDER_SEARCH)) {
      historyPush(modulesManager, history, "policyHolder.route.policyHolder", [decodeId(policyHolder.node.id)], newTab);
    }
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
    this.sorter("policyHolder.displayName"),
    this.sorter("policyHolder.location"),
    this.sorter("policyHolder.legalForm"),
    this.sorter("policyHolder.activityCode"),
    this.sorter("policyHolder.dateValidFrom"),
    this.sorter("policyHolder.dateValidTo"),
  ];

  itemFormatters = () => {
    const { intl, modulesManager, onDoubleClick, rights } = this.props;
    let result = [
      (policyHolder) =>
        !!policyHolder.node.code && policyHolder.node.tradeName
          ? `${policyHolder.node.code} ${policyHolder.node.tradeName}`
          : "",
      (policyHolder) =>
        !!policyHolder.node.locations
          ? `
          ${policyHolder.node.locations.parent.parent.parent.code} 
          ${policyHolder.node.locations.parent.parent.parent.name}
          ${policyHolder.node.locations.parent.parent.code} 
          ${policyHolder.node.locations.parent.parent.name} 
          ${policyHolder.node.locations.parent.code}
          ${policyHolder.node.locations.parent.name}
          ${policyHolder.node.locations.code}
          ${policyHolder.node.locations.name}`
          : "",
      (policyHolder) =>
        !!policyHolder.node.legalForm ? (
          <PublishedComponent
            pubRef="policyHolder.LegalFormPicker"
            module="policyHolder"
            label="legalForm"
            value={policyHolder.node.legalForm}
            withLabel={false}
            readOnly
          />
        ) : (
          ""
        ),
      (policyHolder) =>
        !!policyHolder.node.activityCode ? (
          <PublishedComponent
            pubRef="policyHolder.ActivityCodePicker"
            module="policyHolder"
            label="activityCode"
            value={policyHolder.node.activityCode}
            withLabel={false}
            readOnly
          />
        ) : (
          ""
        ),
      (policyHolder) =>
        !!policyHolder.node.dateValidFrom
          ? formatDateFromISO(modulesManager, intl, policyHolder.node.dateValidFrom)
          : "",
      (policyHolder) =>
        !!policyHolder.node.dateValidTo ? formatDateFromISO(modulesManager, intl, policyHolder.node.dateValidTo) : "",
    ];
    if (rights.includes(RIGHT_POLICYHOLDER_UPDATE) || rights.includes(RIGHT_PORTALPOLICYHOLDER_SEARCH)) {
      result.push(
        (policyHolder) =>
          !this.isDeletedFilterEnabled(policyHolder) && (
            <Tooltip title={formatMessage(intl, "policyHolder", "editButton.tooltip")}>
              <IconButton
                href={this.policyHolderPageLink(policyHolder)}
                onClick={(e) => e.stopPropagation() && !policyHolder.clientMutationId && onDoubleClick(policyHolder)}
                disabled={this.state.deleted.includes(policyHolder.node.id)}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          ),
      );
    }
    if (rights.includes(RIGHT_POLICYHOLDER_DELETE)) {
      result.push(
        (policyHolder) =>
          !this.isDeletedFilterEnabled(policyHolder) && (
            <Tooltip title={formatMessage(intl, "policyHolder", "deleteButton.tooltip")}>
              <IconButton
                onClick={() => this.onDelete(policyHolder)}
                disabled={this.state.deleted.includes(policyHolder.id)}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          ),
      );
    }
    return result;
  };
  onDelete = (policyHolder) => {
    const { intl, coreConfirm, deletePolicyHolder } = this.props;
    let confirm = () =>
      coreConfirm(
        formatMessageWithValues(intl, "policyHolder", "deletePolicyHolder.confirm.title", {
          code: policyHolder.code,
          tradeName: policyHolder.tradeName,
        }),
        formatMessage(intl, "policyHolder", "dialog.delete.message"),
      );
    let confirmedAction = () => {
      deletePolicyHolder(
        policyHolder,
        formatMessageWithValues(intl, "policyHolder", "DeletePolicyHolder.mutationLabel", {
          code: policyHolder.code,
          tradeName: policyHolder.tradeName,
        }).slice(ZERO, MAX_CLIENTMUTATIONLABEL_LENGTH),
      );
      this.setState({ toDelete: policyHolder.id });
    };
    this.setState({ confirmedAction }, confirm);
  };

  isDeletedFilterEnabled = (policyHolder) => policyHolder.isDeleted;
  onChangeSelection = (i) => {
    // this.props.selectFamilyMember(i[0] || null);
    !this.state.deleted.includes(policyHolder.id) && !this.isDeletedFilterEnabled(policyHolder);
  };
  rowLocked = (i) => !!i.clientMutationId;
  render() {
    const {
      classes,
      policyHolder,
      fetchingPolicyHolder,
      errorPolicyHolder,
      pageInfo,
      policyHolderInsuree,
      fetchingPolicyHolderInsuree,
      errorPolicyHolderInsuree,
    } = this.props;
    return (
      <Grid container alignItems="center" direction="row">
        <Paper className={classes.paper} style={{ width: "100%" }}>
          <Grid container alignItems="center" direction="row" className={classes.paperHeader}>
            <Grid item xs={12}>
              <Typography className={classes.tableTitle}>
                <FormattedMessage module="insuree" id="Family.policyHolder" values={{ count: 0 }} />
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>
          </Grid>
          <Table
            module="insuree"
            headers={this.headers()}
            headerActions={this.headerActions}
            itemFormatters={this.itemFormatters()}
            items={!!policyHolder ? policyHolder : !!policyHolderInsuree ? policyHolderInsuree : []}
            // fetching={
            //   !!fetchingPolicyHolder
            //     ? fetchingPolicyHolder
            //     : 
            //      fetchingPolicyHolderInsuree
                
            // }
            error={
              !!errorPolicyHolder ? errorPolicyHolder : !!errorPolicyHolderInsuree ? errorPolicyHolderInsuree : null
            }
            withSelection={"single"}
            // onChangeSelection={this.onChangeSelection}
            onDoubleClick={this.onDoubleClick}
            withPagination={false}
            rowsPerPageOptions={this.rowsPerPageOptions}
            defaultPageSize={this.defaultPageSize}
            page={this.state.page}
            pageSize={this.state.pageSize}
            // count={pageInfo.totalCount}
            onChangePage={this.onChangePage}
            onChangeRowsPerPage={this.onChangeRowsPerPage}
            rowLocked={this.rowLocked}
          />
        </Paper>
      </Grid>
    );
  }
}
const mapStateToProps = (state) => ({
  policyHolder: state.insuree.policyHolder,
  fetchingPolicyHolder: state.insuree.fetchingPolicyHolder,
  errorPolicyHolder: state.insuree.errorPolicyHolder,
  policyHolderInsuree: state.insuree.policyHolderInsuree,
  fetchingPolicyHolderInsuree: state.insuree.fetchingPolicyHolderInsuree,
  errorPolicyHolderInsuree: state.insuree.errorPolicyHolderInsuree,
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchPolicyHolderFamily, fetchPolicyHolderInsuree }, dispatch);
};
export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(PolicySummary)))),
  ),
);
