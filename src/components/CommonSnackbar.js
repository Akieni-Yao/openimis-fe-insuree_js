import React, { useState, useCallback } from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useHistory } from 'react-router-dom'; // Import useHistory from React Router

const CommonSnackbar = ({ open, onClose, message, severity, linkTo }) => {
  const [isCopied, setIsCopied] = useState(false);
  const history = useHistory(); // Get the history object from React Router

  const handleCopyClick = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message)
        .then(() => {
          setIsCopied(true);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
        });
    }
  }, [message]);

  const handleLinkClick = useCallback(() => {
    history.push(linkTo); // Use history.push to navigate to the specified link
    onClose(); // Close the Snackbar after navigating
  }, [history, linkTo, onClose]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose(event, reason);
    setIsCopied(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
    >
      <Alert
        onClose={handleClose}
        severity={severity || 'success'}
        action={
          <>
            <IconButton
              size="small"
              color="inherit"
              onClick={handleCopyClick}
              style={{ marginRight: '12px' }}
            >
              <FileCopyIcon fontSize="large" />
            </IconButton>
            {isCopied ? 'Copied!' : 'Copy'}
            {linkTo && (
              <IconButton
                size="small"
                color="inherit"
                onClick={handleLinkClick}
                style={{ marginLeft: '12px' }}
              >
                Go to Link
              </IconButton>
            )}
          </>
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CommonSnackbar;
