export function detectIssues(flags:{floating?:boolean;changed?:boolean;dead?:boolean;blur?:boolean;}){
 const out:string[]=[];
 if(flags.floating) out.push('floating-camera');
 if(flags.changed) out.push('property-changed');
 if(flags.dead) out.push('dead-scene');
 if(flags.blur) out.push('opening-blur');
 return out;
}
