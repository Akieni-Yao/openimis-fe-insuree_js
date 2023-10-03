import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Grid } from "@material-ui/core";
import { withModulesManager, TextInput, ProgressOrError } from "@openimis/fe-core";

import { fetchInsuree } from "../actions";
import _debounce from "lodash/debounce";

const INIT_STATE = {
  search: null,
  selected: null,
};

class InsureeChfIdPicker extends Component {
  state = INIT_STATE;

  constructor(props) {
    super(props);
    this.chfIdMaxLength = props.modulesManager.getConf("fe-insuree", "insureeForm.chfIdMaxLength", 12);
  }

  componentDidMount() {
    if (this.props.value) {
      this.setState((state, props) => ({
        search: !!props.value ? props.value.chfId : null,
        selected: props.value,
      }));
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.reset !== this.props.reset) {
      this.setState((state, props) => ({
        ...INIT_STATE,
        search: !!props.value ? props.value.chfId : null,
        selected: props.value,
      }));
    } else if (!_.isEqual(prevProps.insuree, this.props.insuree)) {
      this.props.onChange(this.props.insuree, this.formatInsuree(this.props.insuree));
    } else if (!_.isEqual(prevProps.value, this.props.value)) {
      this.setState((state, props) => ({
        search: !!props.value ? props.value.chfId : this.state.search,
        selected: props.value,
      }));
    }
  }

  fetch = (chfId) => {
    this.setState(
      {
        search: chfId,
        selected: null,
      },
      (e) => this.props.fetchInsuree(this.props.modulesManager, chfId),
    );
  };

  debouncedSearch = _debounce(this.fetch, this.props.modulesManager.getConf("fe-insuree", "debounceTime", 800));

  formatInsuree(insuree) {
    if (!insuree) return null;
    return `${insuree.otherNames} ${insuree.lastName}`;
  }

  render() {
    const { readOnly = false, required = false } = this.props;
    return (
      <Grid container>
        <Grid item xs={12}>
          <TextInput
            readOnly={readOnly}
            autoFocus={true}
            module="insuree"
            label="Insuree.chfId"
            value={this.state.search}
            onChange={(v) => this.debouncedSearch(v)}
            // inputProps={{
            //   "maxLength": this.chfIdMaxLength,
            // }}
            required={required}
          />
        </Grid>
        <Grid item xs={12}>
          <ProgressOrError progress={this.props.fetching} error={this.props.error} />
          {!this.props.fetching && (
            <TextInput
              readOnly={true}
              module="insuree"
              label="Insuree.names"
              value={this.formatInsuree(this.state.selected)}
            />
          )}
        </Grid>
      </Grid>
    );
  }
}

const mapStateToProps = (state, props) => ({
  fetching: state.insuree.fetchingInsuree,
  error: state.insuree.errorInsuree,
  insuree: state.insuree.insuree,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchInsuree }, dispatch);
};

export default withModulesManager(connect(mapStateToProps, mapDispatchToProps)(InsureeChfIdPicker));
