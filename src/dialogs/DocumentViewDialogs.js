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

const useStyles = makeStyles((theme) => ({
  dialog: {
    display: "flex",
    justifyContent: "flex-end",
    margin: 0,
    position: "absolute",
    width: "50%",
    height: "100%", // Set dialog height to 100% to cover the entire screen height
    top: 0, // Set top to 0 to align with the top of the screen
    right: 0, // Set right to 0 to align with the right of the screen
    borderRadius: 0, // Remove border-radius
    borderTopLeftRadius: 0, // Remove border-radius on the top left corner
    borderBottomLeftRadius: 0,
    overflow: "auto",
  },
  header: {
    backgroundColor: "green", // Customize the header background color
    color: "white", // Text color for the header
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

  const handleApprove = () => {
    approved({ documentId: documentImage, newStatus: "APPROVED", comments: null });
    onClose();
  };

  const handleReject = () => {
    setShowRejectComment(true); // Show the Reject Comment TextField
  };

  const submitReject = () => {
    onClose();
    rejectDoc({
      documentId: documentImage,
      newStatus: "REJECTED",
      comments: !!rejectComment ? rejectComment : null,
    });
    setShowRejectComment(false); // Show the Reject Comment TextField
  };

  // const loginCnss = () => {
  //   const loginUrl = "https://cnss.walkingtree.tech/cnss/oauth/token";

  //   const loginData = {
  //     username: "akshay.sup",
  //     password: "Aps2393@",
  //     grant_type: "password",
  //     scope: "read",
  //   };

  //   fetch(loginUrl, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(loginData),
  //   })
  //     .then((response) => {
  //       if (!response.ok) {
  //         throw new Error(`Login failed with status: ${response.status}`);
  //       }
  //       return response.json();
  //     })
  //     .then((data) => {
  //       const accessToken = data.access_token;
  //       console.log("accesstoken", accessToken);
  //       // Now that you have the access token, you can use it to call other APIs.
  //       documentViewAPI(accessToken);
  //     })
  //     .catch((error) => {
  //       console.error("Login error:", error);
  //     });
  // };

  const documentViewAPI = () => {
    // Define the URL and parameters
    const apiUrl = "https://cnss.walkingtree.tech/cnss/documents/get"; // Replace with your API URL
    const params = {
      param1: "value1",
      param2: "value2",
    };

    const accessToken = "qtlmFWDYGfTv7y7H6aWge2hPROA";
    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    fetch(`${apiUrl}?documentUuid=${documentImage}`, {
      method: "POST", // You can use 'POST', 'PUT', 'DELETE', etc. depending on your API
      headers: headers,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.blob(); // Retrieve the response as a blob
      })
      .then((blob) => {
        // Convert the blob to a URL
        const pdfUrl = URL.createObjectURL(blob);
        setBlobURL(pdfUrl);
      })
      .catch((error) => {
        // Handle any errors
        console.error("API request error:", error);
      });
  };

  useEffect(() => {
    console.log("hi");
    const buttonElements = document.querySelectorAll(' [class^="Form-fab-"]');
    console.log("buttonElements:", buttonElements);

    if (open) {
      // insureeDocumentsView({ documentUuid: documentImage });

      if (buttonElements.length > 0) {
        buttonElements.forEach((element) => {
          if (element.style) {
            element.style.zIndex = "1000";
          }
        });
      }
    } else {
      if (buttonElements.length > 0) {
        buttonElements.forEach((element) => {
          if (element.style) {
            element.style.zIndex = "2000"; // Set the default zIndex when documentImage is not available
          }
        });
      }
    }
    if (documentImage) {
      documentViewAPI();
    }
  }, [documentImage, open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth="xl"
      PaperProps={{
        className: classes.dialog,
      }}
    >
      <DialogTitle className={classes.header}>Custom Header</DialogTitle>
      <DialogContent>
        {/* <img
          src={blobURL} // Create a URL from the Blob
          alt="Document"
          width="100%"
        // /> */}
        <iframe title="PDF Viewer" src={blobURL} width="100%" height="600"></iframe>
        <DialogContentText>Please review the document and choose an action.</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleApprove} variant="contained" color="primary">
          Approve
        </Button>
        <Button onClick={handleReject} color="primary">
          Reject
        </Button>
      </DialogActions>
      {showRejectComment && (
        <Grid>
          <PublishedComponent
            pubRef="insuree.RejectCommentPicker"
            withNull
            label="Please Select the reason"
            filterLabels={false}
            value={rejectComment}
            onChange={(v) => setRejectComment(v)}
            // onChange={(v) => this.updateAttribute("createdAt", v)}
            readOnly={false}
          />
          <DialogActions>
            <Button onClick={() => setShowRejectComment(false)} variant="contained" color="primary">
              Cancel
            </Button>
            <Button onClick={submitReject} color="primary">
              Submit
            </Button>
          </DialogActions>
        </Grid>
      )}
    </Dialog>
  );
}

export default DocumentViewDialog;
