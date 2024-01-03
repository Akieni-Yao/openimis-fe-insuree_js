import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { alpha } from "@material-ui/core/styles/colorManipulator";

const styles = (theme) => ({
    primaryHeading: {
        font: 'normal normal medium 20px/22px Roboto',
        color: '#333333'
    },
    subHeading: {
        fontWeight: 'bold'
    },
    primaryButton: {
        backgroundColor: "#FFFFFF 0% 0% no-repeat padding-box",
        border: '1px solid #999999',
        color: "#999999",
        borderRadius: '4px',
        // fontWeight: "bold",
        "&:hover": {
            backgroundColor: '#FF0000',
            border: '1px solid #FF0000',
            color: '#FFFFFF'
        },
    },//theme.dialog.primaryButton,
    secondaryButton: {
        backgroundColor: "#FFFFFF 0% 0% no-repeat padding-box",
        border: '1px solid #999999',
        color: "#999999",
        borderRadius: '4px',
        // fontWeight: "bold",
        "&:hover": {
            backgroundColor: '#FF0000',
            border: '1px solid #FF0000',
            color: '#FFFFFF'
        },
    }
});

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@material-ui/core";

import { FormattedMessage } from "@openimis/fe-core";
import { unAssignLabel } from "../utils/UnAssign";

class UnAssignUserDialog extends Component {
    render() {
        const { classes, task, onCancel, onConfirm, check } = this.props;
        return (
            <Dialog open={!!task} onClose={onCancel}>
                <div style={{ padding: "20px 40px" }}>
                    <DialogTitle>
                        {<FormattedMessage module="insuree" id="UnAssignUser.mutationLabel" />}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText className={classes.primaryHeading}>
                            <FormattedMessage
                                module="insuree"
                                id="UnAssignUser.message"
                                values={{ label: unAssignLabel(task) }}
                                style={{ fontWeight: 'bold' }}
                            />
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={(e) => onConfirm(false)} className={classes.primaryButton}>
                            <FormattedMessage module="insuree" id="user.unAssign" />
                        </Button>
                        <Button onClick={onCancel} className={classes.secondaryButton}>
                            <FormattedMessage module="core" id="cancel" />
                        </Button>
                    </DialogActions>
                </div>
            </Dialog>

        );
    }
}

export default injectIntl(withTheme(withStyles(styles)(UnAssignUserDialog)));
