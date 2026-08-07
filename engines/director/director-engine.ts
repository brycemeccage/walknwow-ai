import {removeDuplicates} from "./duplicate-detector";
import {rank} from "./quality-ranker";
import type {Photo,DirectorResult} from "./director-types";
export function runDirector(photos:Photo[]):DirectorResult{
 const ranked=rank(removeDuplicates(photos));
 const selected=ranked.slice(0,20).map(p=>p.photoNumber);
 return {selected,hero:selected.slice(0,2)};
}
