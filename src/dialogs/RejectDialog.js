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
} from "@material-ui/core";
import { PublishedComponent, TextInput } from "@openimis/fe-core";

const RejectDialog = (props) => {
  const { classes, approveorreject, onClose, isOpen, payload, statusCheck } = props;
  const [comment, setComment] = useState({ statusComment: "", status: "", reviewer: null });

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

  console.log("insureeevent", comment);
  const updatedPayload = { ...payload, ...comment };

  return (
    <div>
      <Dialog open={isOpen} onClose={() => onClose()} maxWidth="xs" fullWidth>
        <DialogTitle>{statusCheck == "rework" ? "Rework" : "Reject"}</DialogTitle>

        <DialogContent>
          {statusCheck == "rework" && (
            <Grid item xs={12} className={classes.item}>
              <PublishedComponent
                pubRef="insuree.ReviewerPicker"
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
            className={classes.secondaryButton}
          >
            {statusCheck == "rework" ? "Send for rework" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RejectDialog;
