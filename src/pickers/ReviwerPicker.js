import React, { useState, useEffect } from "react";
import { connect, useDispatch } from "react-redux";

import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import { formatMessage, AutoSuggestion, withModulesManager, useDebounceCb, useGraphqlQuery, SelectInput } from "@openimis/fe-core";
// import { fetchProfessions,selectTaskGroupUser } from "../actions";
import { selectTaskGroupUser } from "../../actions";
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
 onChange
 } = props;
 const [searchString, setSearchString] = useState(null);
 const { isLoading, data, error } = useGraphqlQuery(
 `
 query TaskGroupByCenter {
 taskGroupByCenter(center: "${setCenter?.code}") {
 createdBy
 modifiedBy
 createdTime
 modifiedTime
 status
 id
 uuid
 name
 center
 locationId
 }
 }
 `,
 { str: searchString },
 );
 let taskGroup = !!data?.taskGroupByCenter ? data?.taskGroupByCenter.map((v) => ({ value: v.name, label: v.name })) : [];
 return (
 <SelectInput
 module="insuree"
 label={!!withLabel && (label || formatMessage(intl, "admin", "admin.taskGroup"))}
 options={taskGroup}
 value={!!value ? value : null}
 readOnly={readOnly}
 required={required}
 onChange={onChange}
 />
 );
}


const mapStateToProps = (state) => ({
 professions: state.insuree.professions,
 fetching: state.insuree.fetchingProfessions,
 fetched: state.medical.fetchedProfessions,
 taskGroupUser: state
});

const mapDispatchToProps = (dispatch) => {
 return bindActionCreators({ selectTaskGroupUser }, dispatch);
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(withModulesManager(ReviewerPicker)));
