import React, { useState, useEffect } from "react";
import { connect, useDispatch } from "react-redux";

import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import {
  formatMessage,
  AutoSuggestion,
  withModulesManager,
  useDebounceCb,
  useGraphqlQuery,
  SelectInput,
} from "@openimis/fe-core";
// import { fetchProfessions,selectTaskGroupUser } from "../actions";
// import { selectTaskGroupUser } from "../../actions";
import _debounce from "lodash/debounce";
import _ from "lodash";

const ReviewerPicker = (props) => {
  const {
    intl,
    withLabel = true,
    label,
    value,
    readOnly = false,
    required = false,
    taskGroupUser,
    setCenter,
    onChange,
  } = props;
  const [searchString, setSearchString] = useState(null);
  const { isLoading, data, error } = useGraphqlQuery(
    `
    {
    taskGroup(center:"CG10-19")
    {
    totalCount 
    pageInfo { hasNextPage, hasPreviousPage, startCursor, endCursor}
    edges
    {
    node
    {
    name,
    center,
    
    location{id, uuid, code, name, type, parent{id,uuid,code,name,type,parent{id,uuid,code,name,type,parent{id,uuid,code,name,type}}}},
    uuid,
    }
    }
    }
    }
    `,
    { str: searchString },
  );
  let taskGroup = !!data?.taskGroup
    ? data?.taskGroup.edges.map((v) => {
        const { name, uuid } = v.node;
        return { value: uuid, label: name };
      })
    : [];
  return (
    <SelectInput
      module="insuree"
      label={!!withLabel && (label || formatMessage(intl, "admin", "admin.taskGroup"))}
      options={taskGroup}
      value={!!value ? value : null}
      readOnly={readOnly}
      // required={required}
      onChange={onChange}
    />
  );
};

const mapStateToProps = (state) => ({
  professions: state.insuree.professions,
  fetching: state.insuree.fetchingProfessions,
  fetched: state.medical.fetchedProfessions,
  taskGroupUser: state,
});

const mapDispatchToProps = (dispatch) => {
  //   return bindActionCreators({ selectTaskGroupUser }, dispatch);
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(withModulesManager(ReviewerPicker)));
