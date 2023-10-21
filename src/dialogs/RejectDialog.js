import React, { useState, useEffect } from "react";
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
import { PublishedComponent, TextInput } from "@openimis/fe-core";
import { Close as CloseIcon } from "@material-ui/icons";

const useStyles = makeStyles(() => ({
  rejectBtn: {
    backgroundColor: "#FF0000",
    color: "#fff",
  },
  reworkBtn: {
    backgroundColor: "#FF841C",
    color: "#fff",
  },
  closeIcon: {
    position: "absolute",
    top: 0,
    right: 15,
  },
}));
const RejectDialog = (props) => {
  const { classes, approveorreject, onClose, isOpen, payload, statusCheck } = props;
  const [comment, setComment] = useState({ statusComment: "", status: "", reviewer: null });
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
          {statusCheck == "rework" ? "Rework" : "Reason for rejection"}
          <IconButton edge="end" className={newClasses.closeIcon} color="inherit" onClick={() => onClose()}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {statusCheck == "rework" && (
            <Grid item xs={12} className={classes.item}>
              <PublishedComponent
                pubRef="insuree.ReviewerPicker"
                label="Reviewer"
                withNull={true}
                readOnly={false}
                required
                value={!comment ? null : comment.reviewer}
                onChange={(v) => handleChange("reviewer", v)}
                filterLabels={false}
              />
            </Grid>
          )}
          <Grid item xs={12} className={classes.item}>
            <TextInput
              // pubRef="insuree"
              module="insuree"
              label="Insuree.rejectComment"
              required={false}
              placeholder="Please write your comments here"
              value={!!comment && !!comment?.statusComment ? comment?.statusComment : comment.statusComment}
              onChange={(e) => handleChange("statusComment", e)}
            />
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => onClose()} variant="outlined" className={classes.primaryButton}>
            Cancel
          </Button>
          <Button
            onClick={() => approveorreject(updatedPayload)}
            variant="contained"
            className={statusCheck == "rework" ? newClasses.reworkBtn : newClasses.rejectBtn}
          >
            {statusCheck == "rework" ? "Send for rework" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RejectDialog;
