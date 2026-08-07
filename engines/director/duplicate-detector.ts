import type {Photo} from "./director-types";
export const removeDuplicates=(p:Photo[])=>p.filter(x=>!x.duplicateOf);
