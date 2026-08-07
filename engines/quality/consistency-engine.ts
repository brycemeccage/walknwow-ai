import type {ClipScore} from './quality-types';
export function compareToBest(best:ClipScore,current:ClipScore){
 return {
  camera:best.camera-current.camera,
  life:best.life-current.life,
  fidelity:best.fidelity-current.fidelity,
  luxury:best.luxury-current.luxury,
  overall:best.overall-current.overall
 };
}
export function inconsistent(delta:{overall:number}){return delta.overall>1.0;}
