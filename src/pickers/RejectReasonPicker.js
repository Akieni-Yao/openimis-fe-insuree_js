import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { INSUREE_REJECT_REASON } from "../constants";

class RejectReasonPicker extends Component {
  render() {
    return (
      <ConstantBasedPicker
        module="insuree"
        label="InsureeRejectReason"
        constants={INSUREE_REJECT_REASON}
        {...this.props}
      />
    );
  }
}

export default RejectReasonPicker;
