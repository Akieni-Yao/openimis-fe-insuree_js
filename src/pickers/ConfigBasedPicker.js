import React, { Component } from "react";
import { SelectInput } from "@openimis/fe-core";
import { formatMessage } from "@openimis/fe-core";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
const styles = (theme) => ({
  label: { color: "white" },
});
class ConfigBasedPicker extends Component {
  render() {
    const {
      intl,
      value,
      onChange,
      module,
      label,
      configOptions,
      readOnly = false,
      required = false,
      withNull = false,
      nullLabel = null,
      withLabel = true,
    } = this.props;
    const options = [
      ...configOptions.map((option) => ({
        value: parseInt(option.value),
        label: option.label[intl.locale],
      })),
    ];
    if (withNull) {
      options.unshift({
        value: null,
        label: nullLabel || formatMessage(intl, "contract", "emptyLabel"),
      });
    }
    return (
      <SelectInput
        module={module}
        label={withLabel ? label : null}
        options={options}
        value={value}
        onChange={onChange}
        required={required}
        readOnly={readOnly}
        classes={this.props.classes}
      />
    );
  }
}

export default injectIntl(withTheme(withStyles(styles)(ConfigBasedPicker)));
