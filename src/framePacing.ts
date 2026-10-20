/**
 * A safety net for GPUs that cannot fill a large, sharp canvas in time (an integrated GPU on a 1440p screen at 150 %, say). While the
 * book moves, it watches frame intervals; when a fifth or more miss the display's refresh although the frame's own work on the main thread
 * is short (so the GPU is the bottleneck, and fewer pixels help), the canvas resolution steps down by 15 %, never below 60 % of the
 * start or 1×. It never steps up again in the session. Fast machines never trigger it.
 */
export const PACING_WINDOW=45, STEP=.85;
export class ResolutionGovernor{
 /** The last window's numbers, for checks (data-pacing on the canvas). */
 last='';
 private intervals:number[]=[];private work:number[]=[];private refresh=Infinity;private dpr:number;private readonly floor:number;
 constructor(dpr:number){this.dpr=dpr;this.floor=Math.min(dpr,Math.max(1,dpr*.6));}
 /** One drawn frame in motion: its interval from the previous drawn frame and its main-thread drawing time (ms). Returns a new
  *  resolution when it should change, otherwise null. */
 sample(interval:number,work:number):number|null{
  if(!(interval>0)||interval>150)return null; // a hidden tab or a one-off stall says nothing about the GPU
  this.refresh=Math.min(this.refresh,Math.max(6,interval));
  this.intervals.push(interval);this.work.push(work);
  if(this.intervals.length<PACING_WINDOW)return null;
  const median=(values:number[])=>[...values].sort((a,b)=>a-b)[values.length>>1];
  const late=this.intervals.filter(i=>i>this.refresh*1.5).length>=this.intervals.length*.2,gpuBound=median(this.work)<this.refresh*.5;
  this.last=`late ${this.intervals.filter(i=>i>this.refresh*1.5).length}/${this.intervals.length} work ${median(this.work).toFixed(1)} refresh ${this.refresh.toFixed(1)} dpr ${this.dpr}`;
  this.intervals=[];this.work=[];
  if(!late||!gpuBound||this.dpr<=this.floor)return null;
  this.dpr=Math.max(this.floor,+(this.dpr*STEP).toFixed(3));return this.dpr;
 }
}
