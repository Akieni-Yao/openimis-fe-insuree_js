import React, { Fragment } from "react";
import { injectIntl } from "react-intl";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Box, Typography } from "@material-ui/core";
import {
  formatMessage,
  withModulesManager,
  formatDateFromISO,
  Contributions,
  ControlledField,
} from "@openimis/fe-core";

const INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY = "insuree.InsureeSummaryAvatar";
const INSUREE_SUMMARY_CORE_CONTRIBUTION_KEY = "insuree.InsureeSummaryCore";
const INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY = "insuree.InsureeSummaryExt";
const INSUREE_SUMMARY_CONTRIBUTION_KEY = "insuree.InsureeSummary";

const useStyles = makeStyles(() => ({
  label: {
    textAlign: "right",
  },
}));

const InsureeSummary = (props) => {
  const { insuree, intl, modulesManager, className } = props;
  console.log("insuree", insuree);
  const classes = useStyles();
  const hasAvatarContribution = modulesManager.getContribs(INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY).length > 0;
  const hasExtContributions = modulesManager.getContribs(INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY).length > 0;
  return (
    <Grid container className={className}>
      {hasAvatarContribution && (
        <Box mr={3}>
          <Contributions readOnly photo={insuree.photo} contributionKey={INSUREE_SUMMARY_AVATAR_CONTRIBUTION_KEY} />
        </Box>
      )}
      <Box flexGrow={1}>
        <ControlledField
          module="insuree"
          id="InsureeSummary.chfId"
          field={
            <Typography className={classes.rawValue} variant="h4">
              {insuree.camuNumber ? insuree.camuNumber : insuree.chfId}
            </Typography>
          }
        />
        <Grid item container xs={12} spacing={5}>
          <Grid item>
            <div>
              <Box>
                <Typography className={classes.rawValue} variant="h6">
                  {insuree && (
                    <Fragment>
                      <ControlledField
                        module="insuree"
                        id="InsureeSummary.otherNames"
                        field={`${insuree.otherNames} `}
                      />
                      <ControlledField module="insuree" id="InsureeSummary.lastName" field={insuree.lastName} />
                    </Fragment>
                  )}
                </Typography>
              </Box>
              <Box>
                <Typography className={classes.rawValue}>
                  <Fragment>
                    <ControlledField
                      module="insuree"
                      id="InsureeSummary.dob"
                      field={formatDateFromISO(modulesManager, intl, insuree.dob)}
                    />
                    <ControlledField
                      module="insuree"
                      id="InsureeSummary.age"
                      field={` (${insuree.age} ${formatMessage(intl, "insuree", "ageUnit")})`}
                    />
                  </Fragment>
                </Typography>
              </Box>
              <Box>
                <ControlledField
                  module="insuree"
                  id="InsureeSummary.gender"
                  field={
                    <Grid item xs={12}>
                      <Typography className={classes.rawValue}>{insuree.gender?.gender}</Typography>
                    </Grid>
                  }
                />
              </Box>

              <Contributions contributionKey={INSUREE_SUMMARY_CORE_CONTRIBUTION_KEY} insuree={insuree} />
            </div>
          </Grid>
          {hasExtContributions && (
            <Grid item>
              <Contributions contributionKey={INSUREE_SUMMARY_EXT_CONTRIBUTION_KEY} insuree={insuree} />
            </Grid>
          )}
        </Grid>
      </Box>
      <Grid item xs={12}>
        <Contributions contributionKey={INSUREE_SUMMARY_CONTRIBUTION_KEY} insuree={insuree} />
      </Grid>
    </Grid>
  );
};

export default withModulesManager(injectIntl(InsureeSummary));
