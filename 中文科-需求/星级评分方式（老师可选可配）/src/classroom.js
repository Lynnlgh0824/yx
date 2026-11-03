import {getTotal,getGradeScore,getGrade,formatScore,gradeLabels,weights,readStudentScores} from './grading.js'
const demos=[['陳曉晴',96],['林子軒',88],['黃梓欣',82],['李俊熙',74],['張雅琳',65],['周芷晴',58],['何家朗',43],['鄭樂彤',34],['吳皓然',22],['梁欣怡',12],['許嘉樂',0],['王柏謙',91],['劉凱琳',86],['趙子瑜',83],['黃卓言',79],['陳思齊',76],['林穎怡',72],['李浩賢',69],['張樂瑤',66],['周皓軒',63],['何雅晴',61],['鄭宇軒',57],['吳詠欣',52],['梁睿哲',48],['許心怡',39],['郭俊朗',28],['馮嘉怡',18],['小小卢',67],['葉思穎',81]]
function mockDimensions(total,index){
 const points=weights.map(w=>total*w/10)
 const shift=Math.min(2+(index%3),points[1],40-points[0])
 points[0]+=shift;points[1]-=shift
 const other=Math.min(1+(index%2),points[2],10-points[3])
 points[2]-=other;points[3]+=other
 return points.map((p,i)=>p/weights[i])
}
export function dimensionSummary(students){
 const completed=students.filter(s=>s.complete)
 return ['內容','表達','結構','標點字體'].map((name,i)=>{
 const values=completed.map(s=>s.dimensions[i]*10)
 return {name,average:values.length?values.reduce((a,b)=>a+b,0)/values.length:0,counts:[values.filter(v=>v<60).length,values.filter(v=>v>=60&&v<80).length,values.filter(v=>v>=80).length]}
 })
}
export function makeStudents(scores){
 const rows=[{id:1,name:'小鹿1',score:formatScore(getTotal(scores)),time:'10分54秒'},...demos.map(([name,score],i)=>({id:i+2,name,score,time:score===null?'—':`${12+i}分20秒`}))]
 for(const row of rows){if(row.id!==1&&row.score!==null){row.dimensions=readStudentScores(row.id,mockDimensions(row.score,row.id));row.score=formatScore(getTotal(row.dimensions))}}
 const ranked=rows.filter(s=>s.score!==null).sort((a,b)=>b.score-a.score)
 return rows.map(s=>({...s,dimensions:s.score===null?null:s.id===1?[...scores]:s.dimensions,avatar:'👩🏻‍🎓',complete:s.score!==null,rank:s.score===null?null:ranked.findIndex(r=>r.score===s.score)+1,gradeScore:s.score===null?null:getGradeScore(s.score),grade:s.score===null?null:getGrade(s.score)}))
}
export function summarize(students){
 const completed=students.filter(s=>s.complete),n=completed.length
 return {completed:n,pending:students.length-n,average:n?formatScore(completed.reduce((sum,s)=>sum+s.score,0)/n):null,highest:n?Math.max(...completed.map(s=>s.score)):null,passRate:n?completed.filter(s=>s.score>=60).length/n*100:0,completion:students.length?n/students.length*100:0,bands:Array.from({length:11},(_,i)=>{const point=10-i,count=completed.filter(s=>getGradeScore(s.score)===point).length;return {point,label:gradeLabels[point],count,percent:n?count/n*100:0,range:String(point)}})}
}
export function toCsv(rows){return '\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n')}
export function scoreRows(students){return [['排名','學生','得分（百分制）','品第評分（十分制）','品第','用時','狀態'],...[...students].sort((a,b)=>(a.rank??Infinity)-(b.rank??Infinity)||a.id-b.id).map(s=>[s.rank,s.name,s.score,s.gradeScore,s.grade,s.time,s.complete?'已完成':'未完成'])]}
export function statisticsRows(students){const stats=summarize(students);return [['班級','品第','品第評分（十分制整數）','人數','佔已完成人數比例'],...stats.bands.map(b=>['1A',b.label,b.range,b.count,`${b.percent.toFixed(1)}%`]),['1A','未完成','',stats.pending,'不計入品第統計'],['1A','全班人數','',students.length,'']]}
