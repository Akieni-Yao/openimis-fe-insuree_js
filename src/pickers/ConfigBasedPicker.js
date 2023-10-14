import React, { Component } from "react";
import { SelectInput } from "@openimis/fe-core";
import { formatMessage } from "@openimis/fe-core";
import { injectIntl } from "react-intl";

class ConfigBasedPicker extends Component {
    render() {
        const { intl, value, onChange, module, label, configOptions, readOnly = false, required = false,
            withNull = false, nullLabel = null, withLabel = true } = this.props;
        const options = [
            ...configOptions.map(option => ({
                value: parseInt(option.value),
                label: option.label[intl.locale]
            }))
        ]
        if (withNull) {
            options.unshift({
                value: null,
                label: nullLabel || formatMessage(intl, "contract", "emptyLabel")
            })
        }
        return (
            <SelectInput
                module={module}
                label={withLabel ? label : null}
                options={options}
                value={value}
                onChange={onChange}
                required={required}
                readOnly={readOnly} />
        );
    }
}

export default injectIntl(ConfigBasedPicker);
