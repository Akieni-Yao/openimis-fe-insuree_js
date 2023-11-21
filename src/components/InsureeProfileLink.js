import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Link, Grid } from "@material-ui/core";
import { FormattedMessage } from "@openimis/fe-core";

const styles = (theme) => ({
  lnk: {
    textAlign: "center",
  },
});

class InsureeProfileLink extends Component {
  render() {
    const { classes, insuree } = this.props;
    return (
      <Grid item xs={12} className={classes.lnk}>
        <Link href={`${process.env.PUBLIC_URL || ""}/insuree/profile?nshid=${insuree.chfId}`}>
          {/* <FormattedMessage module="insuree" id="link.profile" /> */}
        </Link>
      </Grid>
    );
  }
}

const mapStateToProps = (state) => ({
  insuree: state.insuree.insuree,
});

export default injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(InsureeProfileLink))));
