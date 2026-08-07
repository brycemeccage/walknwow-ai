import {evaluateClip} from './clip-evaluator';
import {bestClip,walkthroughScore} from './walkthrough-evaluator';
import {compareToBest,inconsistent} from './consistency-engine';

export function runQualityDirector(inputs:any[]){
 const reports=inputs.map(evaluateClip);
 const best=bestClip(reports);
 const final=reports.map(r=>{
   const delta=compareToBest(best.score,r.score);
   return {...r,retry:r.retry||inconsistent(delta),delta};
 });
 return{
   bestClipId:best.clipId,
   walkthroughScore:walkthroughScore(final),
   reports:final
 };
}
