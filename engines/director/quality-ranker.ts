import type {Photo} from "./director-types";
export const rank=(p:Photo[])=>[...p].sort((a,b)=>(b.quality+b.story)-(a.quality+a.story));
