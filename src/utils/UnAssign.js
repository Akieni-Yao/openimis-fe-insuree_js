import _ from "lodash";


export function unAssignLabel(task) {
    // console.log(task,"task")
    return `${_.compact([`${task?.userId?.iUser?.otherNames} ${task?.userId?.iUser?.lastName}`]).join("")
        }`;
}
export function AssignLabel(task) {
    // console.log(task,"task")
    return `${_.compact([`${task?.userId?.iUser?.otherNames} ${task?.userId?.iUser?.lastName}`]).join("")
        }`;
}