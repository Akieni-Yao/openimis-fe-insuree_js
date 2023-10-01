import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import { formatMessage, withModulesManager, SelectInput } from "@openimis/fe-core";
import {fetchCountries } from "../actions";
import _debounce from "lodash/debounce";
import _ from "lodash";

class CountryPicker extends Component {
  componentDidMount() {
    if (!this.props.countries) {
      // prevent loading multiple times the cache when component is
      // several times on a page
      setTimeout(() => {
        !this.props.fetching && !this.props.fetched && this.props.fetchCountries(this.props.modulesManager);
      }, Math.floor(Math.random() * 300));
    }
  }

  nullDisplay = this.props.nullLabel || formatMessage(this.props.intl, "insuree", `Country.null`);

  formatSuggestion = (i) =>
    !!i ? `${formatMessage(this.props.intl, "insuree", `Country.${i}`)}` : this.nullDisplay;

  onSuggestionSelected = (v) => this.props.onChange(v, this.formatSuggestion(v));

  render() {
    const {
      intl,
      countries,
      withLabel = true,
      label = "CountryPicker.label",
      withPlaceholder = false,
      placeholder,
      value,
      reset,
      readOnly = false,
      required = false,
      withNull = false,
      nullLabel = null,
    } = this.props;
    let options = !!countries
      ? countries.map((v) => ({ value: v, label: this.formatSuggestion(v) }))
      : [];
    if (withNull) {
      options.unshift({ value: null, label: this.formatSuggestion(null) });
    }
    return (
      <SelectInput
        module="insuree"
        options={options}
        label={!!withLabel ? label : null}
        placehoder={
          !!withPlaceholder
            ? placeholder || formatMessage(intl, "insuree", "CountryPicker.placehoder")
            : null
        }
        onChange={this.onSuggestionSelected}
        value={value}
        reset={reset}
        readOnly={readOnly}
        required={required}
        selectThreshold={this.selectThreshold}
        withNull={withNull}
        nullLabel={this.nullDisplay}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  countries: state.insuree.countries,
  fetching: state.insuree.fetchingCountries,
  fetched: state.insuree.fetchedCountries,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchCountries }, dispatch);
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(withModulesManager(CountryPicker)));
