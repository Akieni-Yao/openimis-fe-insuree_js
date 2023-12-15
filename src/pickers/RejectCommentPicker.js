import React, { Component } from "react";
import { withModulesManager } from "@openimis/fe-core";
import { injectIntl } from "react-intl";
import ConfigBasedPicker from "./ConfigBasedPicker";

class RejectCommentPicker extends Component {
  constructor(props) {
    super(props);
    this.rejectCommentOptions = props.modulesManager.getConf("insuree", "insureeFilter.rejectCommentOptions", [
      {
        "value": "1",
        "label": {
          "en": "Doc is rejected due to quality of the document is not that much good.",
          "fr": "Le document est rejeté parce qu'il n'est pas de bonne qualité.",
        },
      },
      {
        "value": "2",
        "label": {
          "en": "Document is rejected",
          "fr": "Document is rejected",
        },
        // }, {
        //     "value": "3",
        //     "label": {
        //         "en": "Document is Approved.",
        //         "fr": "Document is Approved."
        //     }
      },
    ]);
  }

  render() {
    return <ConfigBasedPicker configOptions={this.rejectCommentOptions} {...this.props} />;
  }
}

export default withModulesManager(injectIntl(RejectCommentPicker));
