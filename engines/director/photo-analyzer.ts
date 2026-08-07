import type {Photo} from "./director-types";
export function analyzePhotos(p:Photo[]){return p.map(x=>({...x,score:x.quality*0.6+x.story*0.4}));}
