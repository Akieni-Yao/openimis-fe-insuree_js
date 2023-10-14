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
import { PublishedComponent } from "@openimis/fe-core";


const RejectDialog = (props) => {
    const { classes, rejectUpdate, onClose, isOpen, edited } = props;
    const [comment, setComment] = useState({ statusComment: "", status: "REWORK", reviewer: null });
  
    const handleChange = (name, value) => {
      setComment((prevComment) => ({
        ...prevComment,
        [name]: value,
      }));
    };
  
    console.log("insureeevent", comment);
    const payload = { ...edited, ...comment };
  
    return (
      <div>
        <Dialog open={isOpen} onClose={() => onClose()} maxWidth="xs" fullWidth>
          <DialogTitle>Rework</DialogTitle>
  
          <DialogContent>
            <Grid item xs={12}>
              <PublishedComponent
                pubRef="insuree.ReviewerPicker"
                withNull={true}
                readOnly={false}
                required
                value={!edited ? null : edited.reviewer}
                onChange={(v) => handleChange('reviewer', v)}
                filterLabels={false}
              />
            </Grid>
            <Grid item xs={12} className={classes.item}>
              <TextInput
                // pubRef="insuree"
                module="insuree"
                label="rejectComment"
                required={false}
                placeholder="Please write your comments here"
                value={!!edited && !!edited?.statusComment ? edited?.statusComment : comment.statusComment}
                onChange={(e) => handleChange('statusComment', e)}
              />
            </Grid>
          </DialogContent>
  
          <DialogActions>
            <Button onClick={() => onClose()} variant="outlined" className={classes.primaryButton}>
              Cancel
            </Button>
            <Button onClick={() => rejectUpdate(payload)} variant="contained" className={classes.secondaryButton}>
              Send for rework
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  };

  export default RejectDialog;