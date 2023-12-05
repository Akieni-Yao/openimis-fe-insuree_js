import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { formatMessageWithValues, withModulesManager, withHistory, historyPush,formatMessage } from "@openimis/fe-core";
import InsureeForm from "../components/InsureeForm";
import { createInsuree, updateInsuree, updateExternalDocuments, updateFamily } from "../actions";
import { RIGHT_INSUREE, RIGHT_INSUREE_ADD, RIGHT_INSUREE_EDIT } from "../constants";
import CommonSnackbar from "../components/CommonSnackbar";
import { familyLabel } from "../utils/utils";

const styles = (theme) => ({
  page: theme.page,
});

class InsureePage extends Component {
  state = {
    isOpenSnackbar: false,
    camuNumberRes: null,
    statusInsuree: null,
    snackbarMsg: null,
    checkRejectedDocument: false,
  };
  add = () => {
    historyPush(this.props.modulesManager, this.props.history, "insuree.route.insuree");
  };
  handleCloseSnackbar = () => this.setState({ isOpenSnackbar: false });
  save = async (insuree) => {
    if (!insuree.uuid) {
      const response = await this.props.createInsuree(
        this.props.modulesManager,
        insuree,
        formatMessageWithValues(this.props.intl, "insuree", "CreateInsuree.mutationLabel", {
          label: !!insuree.chfId ? insuree.chfId : "",
        }),
      );
      if (!response.error) {
        this.setState({ isOpenSnackbar: true });
        this.setState({ snackbarMsg: formatMessage(this.props.intl, "insuree", "CreateInsuree.snackbar") });
        // this.setState({ snackbarMsg: `Insuree Created with Temporary CAMU number` });
        this.setState({ camuNumberRes: response?.insurees[0].insuree.chfId });
        setTimeout(() => {
          this.props.history.goBack();
        }, 2000)
      }
    } else {
      const response = await this.props.updateInsuree(
        this.props.modulesManager,
        insuree,
        formatMessageWithValues(this.props.intl, "insuree", "UpdateInsuree.mutationLabel", {
          label: !!insuree.chfId ? insuree.chfId : "",
        }),
      );
      const {
        uuid,
        chfId,
        lastName,
        otherNames,
        gender,
        dob,
        head,
        jsonExt,
        phone,
        cardIssued,
        status,
        checkHead,
        family_uuid,
        marital,
        passport,
        typeOfId,
        email,
        education,
        profession
      } = insuree;
      let payload = {};
      if (!checkHead) {
        payload.headInsuree = {
          uuid: uuid,
          chfId: chfId,
          lastName: lastName,
          otherNames: otherNames,
          dob: dob,
          head: head,
          jsonExt: jsonExt, // Assuming jsonExt is an object
          phone: phone,
          cardIssued: cardIssued,
          // status: status,
          gender: gender,
          marital: marital,
          passport: passport,
          typeOfId: typeOfId,
          email:email,
          education:education,
          profession:profession
        };
        payload.location = jsonExt.insureelocations;
        payload.address = jsonExt.insureeaddress;
        payload.uuid = family_uuid;
        payload.jsonExt = { enrolmentType: jsonExt.insureeEnrolmentType };
      }
      if (!checkHead){
      const updateFamilyResult = await this.props.updateFamily(
        this.props.modulesManager,
        payload,
        formatMessageWithValues(this.props.intl, "insuree", "UpdateFamily.mutationLabel", {
          label: familyLabel(payload),
        }),
      );}
      this.setState({ statusInsuree: insuree.status });
      const getStatusClass = (statusInsuree, camuStatus) => {
        switch (statusInsuree) {
          case "APPROVED":
            return formatMessageWithValues(
              this.props.intl,
              "insuree",
              "Insuree.snackbarMsg",
              {
                statusInsuree: formatMessage(this.props.intl, "insuree", "buttonStatus.approved"),
                camuStatus: camuStatus == "APPROVED" ? "CAMU Number" : "Temporary CAMU Number"
              }
            )
          case "REJECTED":
            return formatMessageWithValues(
              this.props.intl,
              "insuree",
              "Insuree.snackbarMsg",
              {
                statusInsuree: formatMessage(this.props.intl, "insuree", "buttonStatus.Rejected"),
                camuStatus: camuStatus == "APPROVED" ? "CAMU Number" : "Temporary CAMU Number"
              }
            )
          case "REWORK":
            return formatMessageWithValues(
              this.props.intl,
              "insuree",
              "Insuree.snackbarMsg",
              {
                statusInsuree: formatMessage(this.props.intl, "insuree", "buttonStatus.rework"),
                camuStatus: camuStatus == "APPROVED" ? "CAMU Number" : "Temporary CAMU Number"
              }
            )
          default:
            return formatMessageWithValues(
              this.props.intl,
              "insuree",
              "Insuree.snackbarMsg",
              {
                statusInsuree: 'Updated',
                camuStatus: camuStatus == "APPROVED" ? "CAMU Number" : "Temporary CAMU Number"
              }
            )
        }
      }
      if (!response.error ) {
        this.setState({ isOpenSnackbar: true });
        this.setState({
          // snackbarMsg: `Insuree ${!!this.state.statusInsuree ? this.state.statusInsuree : "Updated"} with ${insuree.status == "APPROVED" ? "CAMU Number" : "Temporary CAMU Number"
          //   } `,
          snackbarMsg: `${getStatusClass(this.state.statusInsuree, insuree.status)}`,
            // snackbarMsg:  formatMessageWithValues(this.props.intl, "insuree", "UpdateInsuree.snackbar", {
            //   status: familyLabel(this.props.family),
            //   idLabel: insureeLabel(insuree),
            // })
          // camuNumberRes: response?.insurees[0].insuree.camuNumber
          //   ? response?.insurees[0].insuree.camuNumber
          //   : response?.insurees[0].insuree.chfId,
        });
        const allApprovedOrRejected =
          insuree.documentData &&
          insuree.documentData.every(
            (document) => document.documentStatus === "APPROVED" || document.documentStatus === "REJECTED",
          );
        const hasReject =
          allApprovedOrRejected && insuree.documentData.some((document) => document.documentStatus === "REJECTED");

        if (!!hasReject) {
          // if (insuree.status !== "APPROVED" && (insuree.status == "REWORK" || insuree.status == "REJECTED")) {
          this.props.updateExternalDocuments(this.props.modulesManager, insuree?.documentData, insuree?.chfId);
        }
        this.setState({
          camuNumberRes: response?.insurees[0].insuree.camuNumber
            ? response?.insurees[0].insuree.camuNumber
            : response?.insurees[0].insuree.chfId,
        });
        setTimeout(() => {
          this.props.history.goBack();
        }, 2000)
      }
    }
  };
  // handleCheckRejected = (hasReeject) => {
  //   // Update the name in the component's state
  //   this.setState({ checkRejectedDocument: hasReeject });
  // };
  render() {
    const { classes, modulesManager, history, rights, insuree_uuid, family_uuid } = this.props;
    if (!rights.includes(RIGHT_INSUREE)) return null;
    return (
      <div className={classes.page}>
        <InsureeForm
          insuree_uuid={insuree_uuid !== "_NEW_" ? insuree_uuid : null}
          family_uuid={family_uuid}
          back={(e) => historyPush(modulesManager, history, "insuree.route.insurees")}
          add={rights.includes(RIGHT_INSUREE_ADD) ? this.add : null}
          save={rights.includes(RIGHT_INSUREE_EDIT) ? this.save : null}
          readOnly={!rights.includes(RIGHT_INSUREE_EDIT) || !rights.includes(RIGHT_INSUREE_ADD)}
        />
        <CommonSnackbar
          open={this.state.isOpenSnackbar}
          onClose={this.handleCloseSnackbar}
          message={this.state.snackbarMsg}
          severity="success"
          copyText={this.state.camuNumberRes && this.state.camuNumberRes}
          backgroundColor="#00913E"
        />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  insuree_uuid: props.match.params.insuree_uuid,
  family_uuid: props.match.params.family_uuid,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ createInsuree, updateInsuree, updateExternalDocuments, updateFamily }, dispatch);
};

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(InsureePage)))),
  ),
);
