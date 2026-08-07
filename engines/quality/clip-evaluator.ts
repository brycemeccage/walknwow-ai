import {avg,clamp} from './score-utils';
import {detectIssues} from './issue-detector';
import {accepted,shouldRetry} from './retry-policy';
import type {ClipReport} from './quality-types';

export function evaluateClip(input:{
 clipId:string;
 camera:number;
 life:number;
 fidelity:number;
 sharpness:number;
 luxury:number;
 consistency:number;
 flags?:{floating?:boolean;changed?:boolean;dead?:boolean;blur?:boolean;}
}):ClipReport{
 const score={
  camera:clamp(input.camera),
  life:clamp(input.life),
  fidelity:clamp(input.fidelity),
  sharpness:clamp(input.sharpness),
  luxury:clamp(input.luxury),
  consistency:clamp(input.consistency),
  overall:0
 };
 score.overall=Number(avg(score.camera,score.life,score.fidelity,score.sharpness,score.luxury,score.consistency).toFixed(2));
 const reasons=detectIssues(input.flags??{});
 return{
  clipId:input.clipId,
  score,
  accept:accepted(score.overall),
  retry:shouldRetry(score.overall,reasons),
  reasons
 };
}
