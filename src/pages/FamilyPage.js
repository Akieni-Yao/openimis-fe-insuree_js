import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { formatMessageWithValues, withModulesManager, withHistory, historyPush } from "@openimis/fe-core";
import FamilyForm from "../components/FamilyForm";
import { createFamily, updateFamily, clearInsuree } from "../actions";
import { RIGHT_FAMILY, RIGHT_FAMILY_ADD, RIGHT_FAMILY_EDIT } from "../constants";
import { familyLabel } from "../utils/utils";

const styles = (theme) => ({
  page: theme.page,
});

class FamilyPage extends Component {
//   constructor(props) {
//     super(props);
//     this.state = { temporary_number: "" };
// }
  add = () => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.family");
  };
  
  save = async (family) => {
    if (!family.uuid) {
      const createFamilyResult = await this.props.createFamily(
        this.props.modulesManager,
        family,
        formatMessageWithValues(this.props.intl, "insuree", "CreateFamily.mutationLabel", {
          label: familyLabel(family),
        }),
        'families {family{id uuid headInsuree { id }}}'
      );
      if (createFamilyResult
          && createFamilyResult.status === 2
          && createFamilyResult.families[0]?.family?.headInsuree?.id
      ) {
        // this.setState({ temporary_number: createFamilyResult.families[0]?.family?.headInsuree?.id });
        console.log("Family created with head insuree id", createFamilyResult.families[0]?.family?.headInsuree?.id);
      }
    } else {
      this.props.updateFamily(
        this.props.modulesManager,
        family,
        formatMessageWithValues(this.props.intl, "insuree", "UpdateFamily.mutationLabel", {
          label: familyLabel(family),
        }),
      );
    }
  };

  componentWillUnmount = () => {
    this.props.clearInsuree();
  };

  render() {
    const { classes, modulesManager, history, rights, family_uuid, overview } = this.props;
    if (!rights.includes(RIGHT_FAMILY)) return null;

    return (
      <div className={classes.page}>
        <FamilyForm
          overview={overview}
          family_uuid={family_uuid}
          back={(e) => historyPush(modulesManager, history, "insuree.route.families")}
          add={rights.includes(RIGHT_FAMILY_ADD) ? this.add : null}
          save={rights.includes(RIGHT_FAMILY_EDIT) ? this.save : null}
          readOnly={!rights.includes(RIGHT_FAMILY_EDIT) || !rights.includes(RIGHT_FAMILY_ADD)}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  family_uuid: props.match.params.family_uuid,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ createFamily, updateFamily, clearInsuree }, dispatch);
};

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(FamilyPage)))),
  ),
);
