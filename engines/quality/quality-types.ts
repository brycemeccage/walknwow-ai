export type Metric='camera'|'life'|'fidelity'|'sharpness'|'luxury'|'consistency';
export type ClipScore={camera:number;life:number;fidelity:number;sharpness:number;luxury:number;consistency:number;overall:number;};
export type ClipReport={clipId:string;score:ClipScore;accept:boolean;reasons:string[];retry:boolean;};
