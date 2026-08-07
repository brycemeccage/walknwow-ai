export const coverage=(selected:number,total:number)=>Math.round((selected/Math.max(total,1))*100);
