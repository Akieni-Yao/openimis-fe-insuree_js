import React, { useState, useEffect } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Avatar, Grid, IconButton } from "@material-ui/core";
import { toISODate, useModulesManager, useTranslations, PublishedComponent } from "@openimis/fe-core";
import _ from "lodash";
import moment from "moment";

const styles = (theme) => ({
  bigAvatar: theme.bigAvatar,
  hiddenInput: {
    display: "none",
  },
  item: {
    ...theme.paper.item,
    paddingInline: 0,
  },
});

const InsureeAvatar = (props) => {
  const { photo, classes, className, withMeta = false, readOnly, onChange } = props;
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("insuree", modulesManager);
  const [pngImage, setPngImage] = useState(null);

  useEffect(() => {
    if (photo) {
      const isPng = photo.toLowerCase().endsWith(".png");
      const originalURL = isPng ? photo.replace(/\.png$/, "") : photo;

      // Fetch the image
      fetch(originalURL)
        .then((response) => response.blob())
        .then((blob) => {
          
          const pngBlob = new Blob([blob], { type: "image/png" });

          
          const pngImageUrl = URL.createObjectURL(pngBlob);
          setPngImage(pngImageUrl);
        })
        .catch((error) => {
          console.error("Error downloading image: ", error);
        });
    }
  }, [photo]);

  const getUrl = (photo) => {
    if (photo) {
      return `${photo}`;
      // return `data:image/png;base64,${photo}`;
    }
    if (photo?.filename) {
      return `/photos/${photo.folder}/${photo.filename}`;
    }
    return null;
  };
  const onFileSelect = (event) => {
    if (!!event.target.files) {
      const file = event.target.files[0];
      var reader = new FileReader();
      reader.onloadend = (loaded) => {
        onChange({
          ...photo,
          folder: null,
          filename: null,
          photo: btoa(loaded.target.result),
          date: toISODate(moment().toDate()),
        });
      };
      reader.readAsBinaryString(file);
    }
  };

  const isRequired = Boolean(photo?.thumbnail || photo?.photo);
  return (
    <Grid container className={className} direction="row" wrap="nowrap" spacing={1}>
      <div>
        <IconButton variant="contained" component="label" size="small" edge="start">
          <Avatar src={pngImage} className={classes.bigAvatar} />
          {/* <Avatar src={getUrl(photo)} className={classes.bigAvatar} /> */}
          <input type="file" className={classes.hiddenInput} onChange={onFileSelect} accept="image/*" />
        </IconButton>
      </div>
      {withMeta && (
        <Grid container direction="column" item>
          {/* <Grid item className={classes.item}>
            <PublishedComponent
              pubRef="core.DatePicker"
              value={photo?.date}
              module="insuree"
              label="Insuree.photoDate"
              readOnly={readOnly}
              required={isRequired}
              onChange={(date) => onChange({ ...photo, date })}
            />
          </Grid> */}
          <Grid item className={classes.item}>
            <PublishedComponent
              pubRef="insuree.InsureeOfficerPicker"
              value={photo?.officerId}
              module="insuree"
              label={formatMessage("Insuree.photoOfficer")}
              readOnly={readOnly}
              required={isRequired}
              onChange={(v) => onChange({ ...photo, officerId: v?.id })}
            />
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};

export default withTheme(withStyles(styles)(InsureeAvatar));
