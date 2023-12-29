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
import { taskGroupCreator } from "../actions";

const UsersPicker = (props) => {
    const {
        intl,
        withLabel = true,
        label,
        value,
        readOnly = false,
        required = false,
        taskGroupUser,
        insurees,
        setCenter,
        onChange,
        createdAtCode,
    } = props;
    console.log("value", value)
    const [searchString, setSearchString] = useState(null);
    // const [data, setData] = useState();
    const { isLoading, data, error } = useGraphqlQuery(
        `query GetFreeApprovers {
        getFreeApprovers {
            totalCount
            edgeCount
            edges {
                node {
                    id
                    username
                    iUser {
                        lastName
                        otherNames
                        email
                    }
                }
            }
        }
    }`,
        { str: searchString },
    );
    console.log("data", data)
    // useEffect(async () => {
    //   const response = await taskGroupCreator(createdAtCode?.createdBy);
    //   setData(response.data);
    // }, [createdAtCode?.createdBy]);
    let getFreeApprovers = !!data?.getFreeApprovers
        ? data?.getFreeApprovers.edges.map((v) => {
            const { iUser, id } = v.node;
            return { value: `${id}`, label: `${iUser?.otherNames} ${iUser.lastName}` };
        })
        : [];
    return (
        <SelectInput
            module="insuree"
            label={"User"}
            options={getFreeApprovers}
            value={!!value ? `${value}` : null}
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
    insurees: state.insuree.insurees,
});

const mapDispatchToProps = (dispatch) => {
    //   return bindActionCreators({ selectTaskGroupUser }, dispatch);
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(withModulesManager(UsersPicker)));
