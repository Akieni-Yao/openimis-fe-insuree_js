import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from "react-intl";
import { fetchInsureeOfficers } from "../actions";
import { formatMessage, AutoSuggestion, ProgressOrError, withModulesManager, decodeId } from "@openimis/fe-core";

const styles = (theme) => ({
  label: {
    // color: theme.palette.primary.main,
    color: theme.palette.text.primary,

  },
});

class InsureeOfficer extends Component {
  constructor(props) {
    super(props);
    this.selectThreshold = props.modulesManager.getConf("fe-insuree", "InsureeOfficer.selectThreshold", 10);
  }

  componentDidMount() {
    if (!this.props.fetchedInsureeOfficers) {
      // prevent loading multiple times the cache when component is
      // several times on tha page
      setTimeout(() => {
        !this.props.fetchingInsureeOfficers && this.props.fetchInsureeOfficers(this.props.modulesManager);
      }, Math.floor(Math.random() * 300));
    }
  }

  formatSuggestion = (a) => (!a ? "" : `${a.code} ${a.lastName} ${a.otherName || ""}`);

  onSuggestionSelected = (v) => this.props.onChange(v, this.formatSuggestion(v));

  render() {
    const {
      intl,
      value,
      reset,
      insureeOfficers,
      fetchingInsureeOfficers,
      fetchedInsureeOfficers,
      errorInsureeOfficers,
      withLabel = true,
      label,
      readOnly = false,
      required = false,
      withNull = false,
      nullLabel = null,
    } = this.props;
    let v = insureeOfficers ? insureeOfficers.filter((o) => parseInt(decodeId(o.id)) === value) : [];
    v = v.length ? v[0] : null;
    return (
      <Fragment>
        <ProgressOrError progress={fetchingInsureeOfficers} error={errorInsureeOfficers} />
        {fetchedInsureeOfficers && (
          <AutoSuggestion
            module="insuree"
            items={insureeOfficers}
            label={!!withLabel && (label || formatMessage(intl, "insuree", "InsureeOfficer.label"))}
            getSuggestions={this.insureeOfficers}
            getSuggestionValue={this.formatSuggestion}
            onSuggestionSelected={this.onSuggestionSelected}
            value={v}
            reset={reset}
            readOnly={readOnly}
            required={required}
            selectThreshold={this.selectThreshold}
            withNull={withNull}
            nullLabel={nullLabel || formatMessage(intl, "insuree", "insuree.InsureeOfficer.null")}
          />
        )}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => ({
  insureeOfficers: state.insuree.insureeOfficers,
  fetchingInsureeOfficers: state.insuree.fetchingInsureeOfficers,
  fetchedInsureeOfficers: state.insuree.fetchedInsureeOfficers,
  errorInsureeOfficers: state.insuree.errorInsureeOfficers,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchInsureeOfficers }, dispatch);
};

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(InsureeOfficer)))),
);
