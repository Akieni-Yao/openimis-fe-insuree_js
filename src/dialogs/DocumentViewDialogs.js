import React, { useState, useEffect, useRef } from "react";
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
  Divider,
  Typography,
  Backdrop,
  Paper,
} from "@material-ui/core";
import { PublishedComponent, FormattedMessage } from "@openimis/fe-core";
import CloseIcon from "@material-ui/icons/Close";
import Draggable from "react-draggable";
import { useDispatch, useSelector } from "react-redux";

const useStyles = makeStyles((theme) => ({
  dialog: {
    display: "flex",
    justifyContent: "flex-end",
    margin: 0,
    position: "absolute",
    width: "50%",
    height: "100vh",
    maxHeight: "100vh",
    top: 0,
    right: 75,
    bottom: 0,
    borderRadius: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    overflow: "auto",
    cursor: "move",
  },
  header: {
    backgroundColor: "#00913E",
    color: "white",
    height: "4rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rejectBtn: {
    backgroundColor: "#FF0000",
    color: "#fff",
  },
  closeButton: {
    position: "absolute",
    top: 0,
    right: 5,
  },
  backdrop: {
    pointerEvents: "none",
  },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="left" ref={ref} {...props} />;
});

function DocumentViewDialog({ open, onClose, documentImage, approved, rejectDoc }) {
  // const [payload,setPayload]=useState({documentId: null,
  //   newStatus: null,
  //   comments: null})
  const [rejectComment, setRejectComment] = useState("");
  const [showRejectComment, setShowRejectComment] = useState(false);
  const [blobURL, setBlobURL] = useState(null);
  const classes = useStyles();
  const approverDetails = useSelector((store) => store.insuree.approverData);
  let userId = localStorage.getItem("userId");
  const handleApprove = () => {
    approved({ documentId: documentImage, newStatus: "APPROVED", comments: null });
    onClose();
  };

  const handleReject = () => {
    setShowRejectComment(true);
  };

  const submitReject = () => {
    onClose();
    rejectDoc({
      documentId: documentImage,
      newStatus: "REJECTED",
      comments: !!rejectComment ? rejectComment : null,
    });
    setShowRejectComment(false);
  };

  const loginCnss = () => {
    const loginUrl = `${process.env.REACT_APP_GED_URL}/oauth/token`;
    const username = process.env.REACT_APP_USERNAME;
    const password = process.env.REACT_APP_PASSWORD;
    const base64CredentialsLog = process.env.REACT_APP_BASE64_CREDENTIALS;
    const loginData = new URLSearchParams();
    loginData.append("username", username);
    // loginData.append("username", "ankit.kumar");
    loginData.append("password", password);
    // loginData.append("password", "Ankit@11");
    loginData.append("grant_type", "password");
    loginData.append("scope", "read");

    // const base64Credentials = btoa(base64CredentialsLog);
    const base64Credentials = btoa("kiyas:Y@123$%^23*");

    fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${base64Credentials}`,
      },
      body: loginData.toString(),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Login failed with status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const accessToken = data.access_token;
        documentViewAPI(accessToken);
      })
      .catch((error) => {
        console.error("Login error:", error);
      });
  };
  const documentViewAPI = (token) => {
    const apiUrl = `${process.env.REACT_APP_GED_URL}/documents/get`;

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    fetch(`${apiUrl}?documentUuid=${documentImage}`, {
      method: "POST",
      headers: headers,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.blob();
      })
      .then((blob) => {
        const pdfUrl = URL.createObjectURL(blob);
        setBlobURL(pdfUrl);
      })
      .catch((error) => {
        console.error("API request error:", error);
      });
  };
  useEffect(() => {
    if (documentImage) {
      loginCnss();
      // documentViewAPI();
    }
  }, [documentImage, open]);

  return (
    open && (
      <Draggable handle="#draggable-dialog-title">
        <Dialog
          open={open}
          // onClose={onClose}
          TransitionComponent={Transition}
          fullWidth
          maxWidth="md"
          // maxHeight="50vh"
          id="draggable-dialog-title"
          PaperProps={{
            className: classes.dialog,
          }}
          // BackdropComponent={Backdrop}
          // BackdropProps={{
          //   invisible: true,
          //   classes: { root: classes.backdrop },
          // }}
          disableScrollLock={true}
          hideBackdrop
          disabledEnforceFocus
          disableAutoFocus
          disableBackdropClick
          aria-labelledby="draggable-dialog-title"
        >
          <DialogTitle className={classes.header}>
            Documents
            <IconButton color="inherit" onClick={onClose} edge="end" className={classes.closeButton}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <iframe title="PDF Viewer" src={blobURL} width="100%" height="100%"></iframe>
          </DialogContent>
          <Divider />
          {/* {!showRejectComment && approverDetails == userId ? ( */}
          {!showRejectComment ? (
            <DialogActions style={{ margin: "20px 20px" }}>
              <Button onClick={handleApprove} variant="contained" color="primary">
                {/* Verify */}
                <FormattedMessage module="insuree" id="Insuree.verify" />
              </Button>
              <Button onClick={handleReject} variant="contained" className={classes.rejectBtn}>
                {/* Reject */}
                <FormattedMessage module="insuree" id="Insuree.reject" />
              </Button>
            </DialogActions>
          ) : null}
          {showRejectComment && (
            <Grid style={{ margin: "10px 40px" }}>
              <PublishedComponent
                pubRef="insuree.RejectCommentPicker"
                withNull
                label="Please Select the reason"
                filterLabels={false}
                value={rejectComment}
                onChange={(v) => setRejectComment(v)}
                readOnly={false}
              />
              <DialogActions>
                <Button onClick={() => setShowRejectComment(false)} variant="outlined" color="primary">
                  Cancel
                </Button>
                <Button onClick={submitReject} variant="contained" color="primary">
                  Submit
                </Button>
              </DialogActions>
            </Grid>
          )}
        </Dialog>
      </Draggable>
    )
  );
}

export default DocumentViewDialog;
