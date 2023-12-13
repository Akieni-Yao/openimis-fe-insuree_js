import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  TextField,
  Slide,
  makeStyles,
  Grid,
  IconButton,
} from "@material-ui/core";
import { PublishedComponent, TextInput, useTranslations, withModulesManager, combine } from "@openimis/fe-core";
import { Close as CloseIcon } from "@material-ui/icons";

const useStyles = makeStyles(() => ({
  rejectBtn: {
    backgroundColor: "#FF0000",
    color: "#fff",
    "&:hover": {
      backgroundColor: "#c13a3a",
    },
  },
  reworkBtn: {
    backgroundColor: "#FF841C",
    color: "#fff",
    "&:hover": {
      backgroundColor: "#d47320",
    },
  },
  closeIcon: {
    position: "absolute",
    top: 0,
    right: 15,
  },
}));
const RejectDialog = (props) => {
  const { classes, approveorreject, onClose, isOpen, payload, statusCheck, edited, modulesManager, intl } = props;
  const approverData = useSelector((store) => store);
  const { formatMessage } = useTranslations("insuree", modulesManager);
  const [comment, setComment] = useState({ statusComment: null, status: "", reviewer: null, reason: null });
  const newClasses = useStyles();
  const handleChange = (name, value) => {
    setComment((prevComment) => ({
      ...prevComment,
      [name]: value,
    }));
  };
  useEffect(() => {
    if (statusCheck === "rework") {
      setComment((prevComment) => ({ ...prevComment, status: "REWORK" }));
    } else {
      setComment((prevComment) => ({ ...prevComment, status: "REJECTED" }));
    }
  }, [statusCheck]);

  const updatedPayload = { ...payload, ...comment };
  return (
    <div>
      <Dialog open={isOpen} onClose={() => onClose()} maxWidth="xs" fullWidth>
        <DialogTitle style={{ fontWeight: 600 }}>
          {statusCheck == "rework" ? formatMessage("dialog.reworkTitle") : formatMessage("dialog.rejectTitle")}
          <IconButton edge="end" className={newClasses.closeIcon} color="inherit" onClick={() => onClose()}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {statusCheck == "rework" && (
            <Grid item xs={12} className={classes.item}>
              <PublishedComponent
                pubRef="insuree.ReviewerPicker"
                module="insuree"
                label="label.Reviewer"
                withNull={true}
                readOnly={false}
                required
                value={!comment ? null : comment.reviewer}
                onChange={(v) => handleChange("reviewer", v)}
                filterLabels={false}
                createdAtCode={edited}
              />
            </Grid>
          )}
          {/* <Grid item xs={12} className={classes.item}>
            <TextInput
              // pubRef="insuree"
              module="insuree"
              label="Insuree.rejectComment"
              required={false}
              placeholder="Please write your comments here"
              value={!!comment && !!comment?.statusComment ? comment?.statusComment : comment.statusComment}
              onChange={(e) => handleChange("statusComment", e)}
            />
          </Grid> */}
          <Grid item xs={12} className={classes.item}>
            <PublishedComponent
              pubRef="insuree.RejectReasonPicker"
              // value={!!comment && !!comment?.reason ? comment?.reason : ""}
              value={!!comment && !!comment?.statusComment ? comment?.statusComment : comment.statusComment}
              module="insuree"
              onChange={(v) => handleChange("statusComment", v)}
            />
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => onClose()} variant="outlined" className={classes.primaryButton}>
            {formatMessage("dialog.cancel")}
          </Button>
          <Button
            onClick={() => approveorreject(updatedPayload)}
            variant="contained"
            className={statusCheck == "rework" ? newClasses.reworkBtn : newClasses.rejectBtn}
          >
            {statusCheck == "rework" ? formatMessage("button.sendRework") : formatMessage("button.reject")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
const enhance = combine(withModulesManager);
export default enhance(RejectDialog);
