import _ from "lodash";


export function unAssignLabel(task) {
    console.log(task?.userId?.iUser?.otherNames,"task")
    return `${_.compact([`${task?.userId?.iUser?.otherNames} ${task?.userId?.iUser?.lastName}`]).join("")
        }`;
}