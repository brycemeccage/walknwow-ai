export const avg=(...v:number[])=>v.reduce((a,b)=>a+b,0)/Math.max(v.length,1);
export const clamp=(v:number)=>Math.max(0,Math.min(10,v));
