import {PASS_SCORE,CONDITIONAL_PASS} from './thresholds';
export function shouldRetry(score:number,issues:string[]){
 if(issues.length) return true;
 return score<CONDITIONAL_PASS;
}
export function accepted(score:number){return score>=PASS_SCORE;}
