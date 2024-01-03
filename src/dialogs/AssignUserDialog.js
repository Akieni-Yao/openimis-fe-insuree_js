import React, { useState } from "react";
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

import { FormattedMessage, useGraphqlQuery } from "@openimis/fe-core";
import { AssignLabel } from "../utils/UnAssign";

const AssignUserDialog = (props) => {
    const [searchString, setSearchString] = useState(null);
    // const [data, setData] = useState();
    const { isLoading, data, error } = useGraphqlQuery(
        `query GetFreeApprovers {
        getFreeApprovers {
            totalCount
            edgeCount
            edges {
                node {
                    id
                    username
                    iUser {
                        lastName
                        otherNames
                        email
                    }
                }
            }
        }
    }`,
        { str: searchString },
    );

    const findUserById = (userId) => {
        const user = data?.getFreeApprovers?.edges.find(item => item.node.id === userId);

        if (user) {
            const { lastName, otherNames } = user.node.iUser;
            return `${otherNames} ${lastName}`;
        }

        // return 'User not found';
    };

    const AssignLabelDynamic = () => {
        const label = findUserById(props.name);
        return { label };
    };
    return (
        <Dialog open={!!props.task} onClose={props.onCancel}>
            <div style={{ padding: "20px 40px" }}>
                <DialogTitle>
                    {<FormattedMessage module="insuree" id="AssignUser.mutationLabel" />}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText className={props.classes.primaryHeading}>
                        {/* <div style={{display:"flex"}}> */}
                        <FormattedMessage
                            module="insuree"
                            id="AssignUser.message"
                            // values={{ label:AssignLabelDynamic().label }}
                            values={{ label: `Temp CAMU No. ${props.task?.family?.headInsuree?.chfId} to ${AssignLabelDynamic().label}` }}
                            style={{ fontWeight: 'bold' }}
                        />
                        {/* <p>{AssignLabelDynamic().label}</p> */}
                        {/* </div> */}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={(e) => props.onConfirm(false)} className={props.classes.primaryButton}>
                        <FormattedMessage module="insuree" id="user.Assign" />
                    </Button>
                    <Button onClick={props.onCancel} className={props.classes.secondaryButton}>
                        <FormattedMessage module="core" id="cancel" />
                    </Button>
                </DialogActions>
            </div>
        </Dialog>

    );
}
// class AssignUserDialog extends Component {
//     render() {
//         const { classes, task, onCancel, onConfirm, check } = this.props;
//         return (
//             <Dialog open={!!task} onClose={onCancel}>
//                 <div style={{ padding: "20px 40px" }}>
//                     <DialogTitle>
//                         {<FormattedMessage module="insuree" id="UnAssignUser.mutationLabel" />}
//                     </DialogTitle>
//                     <DialogContent>
//                         <DialogContentText className={classes.primaryHeading}>
//                             <FormattedMessage
//                                 module="insuree"
//                                 id="UnAssignUser.message"
//                                 values={{ label: AssignLabel(task) }}
//                                 style={{ fontWeight: 'bold' }}
//                             />
//                         </DialogContentText>
//                     </DialogContent>
//                     <DialogActions>
//                         <Button onClick={(e) => onConfirm(false)} className={classes.primaryButton}>
//                             <FormattedMessage module="insuree" id="user.unAssign" />
//                         </Button>
//                         <Button onClick={onCancel} className={classes.secondaryButton}>
//                             <FormattedMessage module="core" id="cancel" />
//                         </Button>
//                     </DialogActions>
//                 </div>
//             </Dialog>

//         );
//     }
// }

export default injectIntl(withTheme(withStyles(styles)(AssignUserDialog)));
