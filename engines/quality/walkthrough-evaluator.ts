import type {ClipReport} from './quality-types';
export function bestClip(reports:ClipReport[]){
 return [...reports].sort((a,b)=>b.score.overall-a.score.overall)[0];
}
export function walkthroughScore(reports:ClipReport[]){
 if(!reports.length) return 0;
 return Number((reports.reduce((t,r)=>t+r.score.overall,0)/reports.length).toFixed(2));
}
