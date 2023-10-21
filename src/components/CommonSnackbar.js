import React, { useState, useCallback } from "react";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import IconButton from "@material-ui/core/IconButton";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import CloseIcon from "@material-ui/icons/Close";

const CommonSnackbar = ({ open, onClose, message, severity, copyText, backgroundColor }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(copyText) // Copy the copyText instead of message
        .then(() => {
          setIsCopied(true);
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    }
  }, [copyText]);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    onClose(event, reason);
    setIsCopied(false);
  };

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      style={{ marginRight: "50px", color: "white" }}
    >
      <Alert
        onClose={handleClose}
        severity={severity || "success"}
        style={{ backgroundColor: backgroundColor || "inherit", color: "white" }}
        action={
          <>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div>{copyText}</div>
              <IconButton size="small" onClick={handleCopyClick} style={{ marginLeft: "4px" }} color="inherit">
                <FileCopyIcon />
              </IconButton>
              {isCopied ? "Copied!" : "Copy"}
            </div>
            <IconButton size="small" onClick={handleClose} style={{ marginLeft: "4px" }} color="inherit">
              <CloseIcon />
            </IconButton>
          </>
        }
      >
        {message}
        {/* <div style={{ color: "white" }}>{copyText}</div> */}
      </Alert>
    </Snackbar>
  );
};

export default CommonSnackbar;
