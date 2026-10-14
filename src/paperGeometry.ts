import { BufferGeometry, Float32BufferAttribute } from 'three';
export const PAGE_WIDTH=3.55, PAGE_HEIGHT=4.75;
export function paperPoint(u:number,v:number,progress:number,direction:1|-1=1):[number,number,number]{
 const p=Math.max(0,Math.min(1,progress));const angle=(direction===1?p:1-p)*Math.PI;
 const curl=Math.sin(p*Math.PI)*.95*direction;
 const distance=u*PAGE_WIDTH;
 const x=Math.abs(curl)<.00001?distance*Math.cos(angle):PAGE_WIDTH/curl*(Math.sin(angle)-Math.sin(angle-curl*u));
 const y=Math.abs(curl)<.00001?distance*Math.sin(angle):PAGE_WIDTH/curl*(Math.cos(angle-curl*u)-Math.cos(angle));
 const gutter=.055*Math.exp(-u*12);
 const corner=Math.sin(p*Math.PI)*Math.pow(u,2)*Math.sin(v*Math.PI)*.12;
 return [x,.13+y+gutter+corner,(v-.5)*PAGE_HEIGHT];
}
export function createPaperGeometry(columns=48,rows=12){
 const geometry=new BufferGeometry();const positions:number[]=[],uv:number[]=[],indices:number[]=[];
 for(let r=0;r<=rows;r++)for(let c=0;c<=columns;c++){positions.push(...paperPoint(c/columns,r/rows,0));uv.push(c/columns,1-r/rows);}
 for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){const a=r*(columns+1)+c,b=a+1,d=a+columns+2,e=a+columns+1;indices.push(a,e,b,b,e,d);}
 geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
export function updatePaperGeometry(geometry:BufferGeometry,progress:number,direction:1|-1=1,columns=48,rows=12){
 const positions=geometry.getAttribute('position');for(let r=0;r<=rows;r++)for(let c=0;c<=columns;c++){const point=paperPoint(c/columns,r/rows,progress,direction);positions.setXYZ(r*(columns+1)+c,...point);}positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
}
