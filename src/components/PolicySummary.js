import React, { Fragment } from "react";
import { injectIntl } from "react-intl";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Box, Typography, Divider, Paper, IconButton, Tooltip } from "@material-ui/core";
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
  withTooltip,
  historyPush,
  withHistory,
  coreConfirm,
  journalize,
  Contributions,
  decodeId,
  PublishedComponent,
} from "@openimis/fe-core";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { fetchPolicyHolderFamily } from "../actions";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { RIGHT_POLICYHOLDER_UPDATE, RIGHT_POLICYHOLDER_DELETE, RIGHT_PORTALPOLICYHOLDER_SEARCH } from "../constants";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";

const INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY = "insuree.InsureeSummaryAvatar";
const INSUREE_SUMMARY_CORE_CONTRIBUTION_KEY = "insuree.InsureeSummaryCore";
const INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY = "insuree.InsureeSummaryExt";
const INSUREE_SUMMARY_CONTRIBUTION_KEY = "insuree.InsureeSummary";

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

  // hasAvatarContribution = modulesManager.getContribs(INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY).length > 0;
  // hasExtContributions = modulesManager.getContribs(INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY).length > 0;
  policyHolderPageLink = (policyHolder) => {
    return `${this.props.modulesManager.getRef("policyHolder.route.policyHolder")}${"/" + decodeId(policyHolder.id)}`;
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
    if (!!this.props.family && !!this.props.family?.uuid) {
      this.props.fetchPolicyHolderFamily(this.props.modulesManager, this.props.family.uuid);
    }
  }
  isOnDoubleClickEnabled = (policyHolder) =>
    !this.state.deleted.includes(policyHolder.id) && !this.isDeletedFilterEnabled(policyHolder);
  onDoubleClick = (policyHolder, newTab = false) => {
    const { rights, modulesManager, history } = this.props;
    if (rights.includes(RIGHT_POLICYHOLDER_UPDATE) || rights.includes(RIGHT_PORTALPOLICYHOLDER_SEARCH)) {
      historyPush(modulesManager, history, "policyHolder.route.policyHolder", [decodeId(policyHolder.id)], newTab);
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
        !!policyHolder.code && policyHolder.tradeName ? `${policyHolder.code} ${policyHolder.tradeName}` : "",
      (policyHolder) =>
        !!policyHolder.locations
          ? `
          ${policyHolder.locations.parent.parent.parent.code} 
          ${policyHolder.locations.parent.parent.parent.name}
          ${policyHolder.locations.parent.parent.code} 
          ${policyHolder.locations.parent.parent.name} 
          ${policyHolder.locations.parent.code}
          ${policyHolder.locations.parent.name}
          ${policyHolder.locations.code}
          ${policyHolder.locations.name}`
          : "",
      (policyHolder) =>
        !!policyHolder.legalForm ? (
          <PublishedComponent
            pubRef="policyHolder.LegalFormPicker"
            module="policyHolder"
            label="legalForm"
            value={policyHolder.legalForm}
            withLabel={false}
            readOnly
          />
        ) : (
          ""
        ),
      (policyHolder) =>
        !!policyHolder.activityCode ? (
          <PublishedComponent
            pubRef="policyHolder.ActivityCodePicker"
            module="policyHolder"
            label="activityCode"
            value={policyHolder.activityCode}
            withLabel={false}
            readOnly
          />
        ) : (
          ""
        ),
      (policyHolder) =>
        !!policyHolder.dateValidFrom ? formatDateFromISO(modulesManager, intl, policyHolder.dateValidFrom) : "",
      (policyHolder) =>
        !!policyHolder.dateValidTo ? formatDateFromISO(modulesManager, intl, policyHolder.dateValidTo) : "",
    ];
    if (rights.includes(RIGHT_POLICYHOLDER_UPDATE) || rights.includes(RIGHT_PORTALPOLICYHOLDER_SEARCH)) {
      result.push(
        (policyHolder) =>
          !this.isDeletedFilterEnabled(policyHolder) && (
            <Tooltip title={formatMessage(intl, "policyHolder", "editButton.tooltip")}>
              <IconButton
                href={this.policyHolderPageLink(policyHolder)}
                onClick={(e) => e.stopPropagation() && !policyHolder.clientMutationId && onDoubleClick(policyHolder)}
                disabled={this.state.deleted.includes(policyHolder.id)}
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
    const { classes, policyHolder, fetchingPolicyHolder, errorPolicyHolder, pageInfo } = this.props;
    console.log("policyholder", policyHolder);
    return (
      <Grid container>
        {/* {hasAvatarContribution && (
          <Box mr={3}>
            <Contributions readOnly photo={insuree.photo} contributionKey={INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY} />
          </Box>
        )} */}
        <Paper className={classes.paper} style={{ width: "100%" }}>
          <Grid container alignItems="center" direction="row" className={classes.paperHeader}>
            <Grid item xs={8}>
              <Typography className={classes.tableTitle}>
                <FormattedMessage module="insuree" id="Family.policyHolder" values={{ count: 0 }} />
              </Typography>
            </Grid>
            {/* <Grid item xs={4}>
            <Grid container justify="flex-end">
              {actions.map((a, idx) => {
                return (
                  <Grid item key={`form-action-${idx}`} className={classes.paperHeaderAction}>
                    {withTooltip(a.button, a.tooltip)}
                  </Grid>
                );
              })}
            </Grid>
          </Grid> */}
            <Grid item xs={12}>
              <Divider />
            </Grid>
          </Grid>
          <Table
            module="insuree"
            headers={this.headers()}
            headerActions={this.headerActions}
            itemFormatters={this.itemFormatters()}
            items={!!policyHolder ? policyHolder : []}
            fetching={fetchingPolicyHolder}
            error={errorPolicyHolder}
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
          {/* <Grid item xs={12}>
          <Contributions contributionKey={INSUREE_SUMMARY_CONTRIBUTION_KEY} insuree={insuree} />
        </Grid> */}
        </Paper>
      </Grid>
    );
  }
}
const mapStateToProps = (state) => ({
  policyHolder: state.insuree.policyHolder,
  fetchingPolicyHolder: state.insuree.fetchingPolicyHolder,
  errorPolicyHolder: state.insuree.errorPolicyHolder,
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchPolicyHolderFamily }, dispatch);
};
export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(PolicySummary)))),
  ),
);
