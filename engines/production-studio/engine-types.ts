export type Stage='analyze'|'story'|'generate'|'quality'|'edit'|'brand'|'export';
export interface ProductionJob{jobId:string;listingUrl:string;createdAt:number;}
export interface StageResult{stage:Stage;success:boolean;message?:string;data?:unknown;}
export interface ProductionResult{success:boolean;stages:StageResult[];}
