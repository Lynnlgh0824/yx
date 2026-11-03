<script setup>
import {ref,computed,watch} from 'vue'
import {Modal} from 'ant-design-vue'
import {normalizeLevel,labelError,gradeOrderError,percentOrderError,ruleError,levelFor} from './schoolRules'
import {getGrade,gradeLabels} from './grading'
const maxOptions=10
const defaultOptionCount=5
const props=defineProps(['rules'])
const emit=defineEmits(['save','dirty'])
const draft=ref(structuredClone(JSON.parse(JSON.stringify(props.rules))))
const error=ref(''),sample=ref(90)
const drawerOpen=ref(false), items=ref([]), optionError=ref('')
const activeTab=ref('display')
const duplicateNames=computed(()=>{
  const names=items.value.map(item=>normalizeLevel(item.name))
  return new Set(names.filter((name,i)=>name && names.indexOf(name)!==i))
})
function openOptions(){
  activeTab.value='config'
  const names=draft.value.options
  items.value=names.length
    ? names.map(name=>({original:name,name}))
    : Array.from({length:defaultOptionCount},()=>({original:null,name:''}))
  optionError.value=''
  drawerOpen.value=true
}
function applyOptions(){
  const names=items.value.map(item=>normalizeLevel(item.name))
  optionError.value=names.length>maxOptions?'最多可設定 10 個等級選項。':labelError(names)
  if(optionError.value)return
  const renamed=new Map(items.value.map((item,i)=>[item.original,names[i]]))
  const remap=n=>renamed.get(n)||''
  for(const [index,name] of draft.value.gradeNames.entries()){
    if(index && name && !remap(name)) removedGrades.value[index]=name
  }
  for(const [index,name] of draft.value.labels.entries()){
    if(name && !remap(name)) removedRanges.value[index]=name
  }
  const next={...draft.value,options:names,gradeNames:draft.value.gradeNames.map(remap),labels:draft.value.labels.map(remap)}
  const reordered=items.value.filter(x=>x.original!=null).some((x,i,all)=>i && draft.value.options.indexOf(x.original)<draft.value.options.indexOf(all[i-1].original))
  pendingOrder.value ||= reordered
  draft.value=next
  if(pendingOrder.value){
    const issues=orderIssues(next)
    error.value=issues.join(' ') || '等級順序已調整，請保存頁面設定。'
  }
  drawerOpen.value=false
}
const removedGrades=ref({}), removedRanges=ref([])
const rows=Object.keys(gradeLabels).map(Number).filter(n=>n>0).reverse()
const rulesHeading=ref(null)
const incompleteRules=computed(()=>Boolean(ruleError(draft.value)) ||
  (draft.value.basis==='grade' && rows.some(grade=>gradeOrderError(draft.value,grade))))
watch(incompleteRules, incomplete=>{
  if(!incomplete)return
  if(draft.value.display.includes('level'))draft.value.display=draft.value.display.filter(value=>value!=='level')
  if(draft.value.teacherDisplay==='withLevel')draft.value.teacherDisplay='base'
})
function focusRules(){
  activeTab.value='config'
  openOptions()
}
const editedGrade=ref(null)
const orderMessage=computed(()=>draft.value.basis==='grade'&&editedGrade.value?gradeOrderError(draft.value,editedGrade.value):'')
const preview=computed(()=>sample.value===''?'—':levelFor(draft.value,sample.value))
function change(){error.value='';emit('dirty',JSON.stringify(draft.value)!==JSON.stringify(props.rules))}
watch(draft,change,{deep:true,flush:'sync'})
function validMinimum(value){
  return Number.isInteger(value) && value>=0 && value<=100
}
function rangeText(index){
  const minimums=draft.value.minimums
  const lower=minimums[index]
  const upper=index===0?101:minimums[index-1]
  if(!validMinimum(lower) || (index>0 && !validMinimum(upper)) || upper<=lower)return '—'
  return index===0 ? lower+' ≤ 總分 ≤ 100' : lower+' ≤ 總分 < '+upper
}
const pendingOrder=ref(false)
function orderIssues(r){
  if(r.basis==='grade'){
    const grade=rows.find(g=>gradeOrderError(r,g))
    return grade?[gradeOrderError(r,grade)]:[]
  }
  const issue=r.labels.map((_,i)=>percentOrderError(r,i)).find(Boolean)
  return issue?[issue]:[]
}
const unused=computed(()=>draft.value.options.filter(l=>!draft.value.labels.includes(l)))
function move(i,step){
  const [item]=items.value.splice(i,1)
  items.value.splice(i+step,0,item)
  optionError.value=''
}
function addLevel(){
  const r=draft.value
  if(!unused.value.length || r.labels.length>=maxOptions)return
  if(r.labels.length===1 && !r.labels[0]){r.labels[0]=unused.value[0];return}
  if(ruleError(r)){error.value=ruleError(r);return}
  for(const name of unused.value){
    const rank=r.options.indexOf(name)
    let i=r.labels.findIndex(l=>r.options.indexOf(l)>rank)
    if(i<0)i=r.labels.length
    const j=Math.min(i,r.labels.length-1)
    const upper=j===0?101:r.minimums[j-1], lower=r.minimums[j]
    if(upper-lower<2)continue
    const midpoint=Math.floor((upper+lower)/2)
    removedRanges.value.splice(i,0,null)
    r.labels.splice(i,0,name)
    r.minimums.splice(j,0,midpoint)
    return
  }
  error.value='對應區間沒有可拆分的整數分數，請先調整最低分。'
}
function removeLevel(index){
  removedRanges.value.splice(index,1)
  draft.value.labels.splice(index,1)
  draft.value.minimums.splice(index,1)
  draft.value.minimums[draft.value.minimums.length-1]=0
  change()
}
function showDisplayRequired(){
  Modal.warning({title:'請至少選擇一項學生成績展示方式。',okText:'知道了'})
}
function guardLevel(event){
  if(incompleteRules.value){
    event.preventDefault()
    Modal.confirm({title:'請先完成等級配置，再選擇顯示等級',content:'請先完成「等級選項」及換算規則配置。',okText:'去配置',cancelText:'取消',onOk:openOptions})
    return true
  }
}
function guardLastDisplay(event, value){
  if(value==='level' && guardLevel(event))return
  if(draft.value.display.length===1 && draft.value.display.includes(value)){
    event.preventDefault()
    showDisplayRequired()
  }
}
function save(){
  if(!draft.value.display.length){showDisplayRequired();return}
  draft.value.gradeNames=draft.value.gradeNames.map(name=>name.trim())
  draft.value.labels=draft.value.labels.map(l=>l.trim())
  const missing=draft.value.basis==='grade'
    ? rows.some(i=>removedGrades.value[i] && !draft.value.gradeNames[i])
    : draft.value.labels.some((name,i)=>removedRanges.value[i] && !name)
  if(missing){error.value='請先完成標示行的等級設定，再保存。';return}
  const incomplete=draft.value.basis==='grade'
    ? rows.some(i=>!draft.value.gradeNames[i] || !draft.value.options.includes(draft.value.gradeNames[i]))
    : draft.value.labels.some(name=>!name || !draft.value.options.includes(name))
  if(incomplete){error.value=draft.value.basis==='grade'?'請先為每個綜合品第選擇等級，再保存。':'請先為每個分數區間選擇等級，再保存。';return}
  if(draft.value.basis==='grade'){
    const conflict=rows.find(grade=>gradeOrderError(draft.value,grade))
    if(conflict){
      if(!orderMessage.value)editedGrade.value=conflict
      error.value=orderMessage.value
      return
    }
  }
  error.value=((draft.value.display.includes('level')||draft.value.teacherDisplay==='withLevel')?ruleError(draft.value):'')
  if(pendingOrder.value)error.value=orderIssues(draft.value).join(' ') || error.value
  else if(draft.value.basis==='percent')error.value=draft.value.labels.map((_,i)=>percentOrderError(draft.value,i)).find(Boolean)||error.value
  if(!error.value)pendingOrder.value=false
  if(!error.value)emit('save',JSON.parse(JSON.stringify(draft.value)))
}
</script>
<template><main class="school-settings">
<div class="crumb">設置 / 作文評分展示</div><div class="page-title"><h1>作文評分展示</h1></div>
<nav class="page-tabs" role="tablist" aria-label="作文評分設定">
  <button role="tab" :aria-selected="activeTab==='display'" :class="{active:activeTab==='display'}" @click="activeTab='display'">評分展示</button>
  <button role="tab" :aria-selected="activeTab==='config'" :class="{active:activeTab==='config'}" @click="activeTab='config'">等級配置 <span v-if="incompleteRules" class="tab-badge">未完成</span></button>
</nav>
<div v-if="activeTab==='display'" class="tab-panel">
<div v-if="incompleteRules" class="setup-banner" role="status"><div><strong>等級展示尚未配置</strong><span>完成等級選項和換算規則後，才可以選擇「等級」作為展示內容。</span></div><button @click="focusRules">去配置</button></div>
<section class="student-display"><div><h2>學生成績展示（可多選）</h2><div class="options"><label v-for="([v,label]) in [['percent','百分制分數'],['grade','品第'],['level','等級']]" :key="v"><input v-model="draft.display" @click="guardLastDisplay($event,v)" type="checkbox" :value="v" :aria-disabled="v==='level' && incompleteRules"> {{label}}</label></div></div><div class="report-example"><strong>學生報告示例</strong><div aria-live="polite"><span v-if="!draft.display.length">請勾選展示項目</span><span v-if="draft.display.includes('percent')">總分　{{sample}}/100　</span><span v-if="draft.display.includes('grade')">{{getGrade(sample)}}　</span><span v-if="draft.display.includes('level')">等級　{{incompleteRules?'—':preview}}</span></div></div></section>
<section class="teacher-display"><h2>教師端展示</h2>
<div class="teacher-options">
<fieldset><legend>固定顯示</legend><div class="options"><label><input type="checkbox" checked disabled> 百分制分數</label><label><input type="checkbox" checked disabled> 品第</label></div></fieldset>
<fieldset><legend>可選顯示</legend><div class="options"><label><input v-model="draft.teacherDisplay" @click="guardLevel" type="checkbox" true-value="withLevel" false-value="base" :aria-disabled="incompleteRules"> 等級</label></div></fieldset>
</div><div class="display-note">教師端固定展示百分制分數與品第；完成等級配置後，可額外開放「等級」顯示。</div></section>
</div>
<section v-if="activeTab==='config'" class="conversion-card"><div class="rule-heading"><div><h2 ref="rulesHeading" tabindex="-1">等級配置</h2><p>先設定等級名稱，再配置每個品第或分數區間對應的等級。</p></div><button class="example" @click="openOptions">等級選項</button></div>
<a-drawer v-model:open="drawerOpen" title="等級選項" placement="right" width="min(420px, 100vw)">
  <p>由高至低排列，越靠上代表等級越高。同一等級可對應多個品第。完成對應後，請在頁面底部保存。</p>
  <div v-for="(item,i) in items" :key="i" class="option-line">
    <div class="option-field"><a-input v-model:value="item.name" placeholder="請輸入等級名稱" :aria-label="'選項 '+(i+1)" :status="duplicateNames.has(normalizeLevel(item.name))?'error':undefined" :aria-invalid="duplicateNames.has(normalizeLevel(item.name))" @input="optionError=''"/>
      <small v-if="duplicateNames.has(normalizeLevel(item.name))" class="order-error">此等級名稱已重複，請修改。</small></div>
    <button class="move" :aria-label="'上移選項 '+(i+1)" :disabled="i===0" @click="move(i,-1)">↑</button><button class="move" :aria-label="'下移選項 '+(i+1)" :disabled="i===items.length-1" @click="move(i,1)">↓</button><a-button type="link" @click="items.splice(i,1)">移除</a-button>
  </div>
  <div class="add-control"><a-button :disabled="items.length>=maxOptions" @click="items.splice(Math.max(0,items.length-1),0,{original:null,name:''})">新增選項</a-button> <small aria-live="polite">{{items.length}} / {{maxOptions}} 項<span v-if="items.length>=maxOptions"> · 最多可設定 10 個選項</span></small></div>
  <p v-if="optionError" class="order-error" role="alert">{{optionError}}</p>
  <template #footer><div class="actions"><a-button @click="drawerOpen=false">取消</a-button><a-button type="primary" class="apply-options" :disabled="duplicateNames.size>0" aria-label="保存" @click="applyOptions">保存</a-button></div></template>
</a-drawer>
<div v-if="incompleteRules" class="rule-setup-guide" role="note"><strong>配置步驟</strong><ol><li>點擊「等級選項」，新增並保存等級名稱。</li><li>在下方選擇換算方式，為每一項選擇對應等級。</li><li>完成全部配置後，點擊頁面底部「保存」，再勾選「等級」顯示。</li></ol></div><div class="options"><label><input v-model="draft.basis" name="conversion-basis" type="radio" value="grade"> 按綜合品第</label><label><input v-model="draft.basis" name="conversion-basis" type="radio" value="percent"> 按百分制總分</label></div>
<table v-if="draft.basis==='grade'"><thead><tr><th>綜合品第</th><th>學生顯示等級</th></tr></thead>
<tbody><tr v-for="grade in rows" :key="grade"><td>{{gradeLabels[grade]}}</td><td><a-select class="grade-picker" popup-class-name="school-grade-menu" :value="draft.gradeNames[grade] || undefined" placeholder="選擇等級" allow-clear :virtual="false" :list-height="320" :options="draft.options.map(value=>({value,label:value}))" :disabled="!draft.options.length" :aria-label="gradeLabels[grade]+'的學生顯示等級'" :status="(removedGrades[grade] && !draft.gradeNames[grade]) || (grade===editedGrade && orderMessage)?'error':undefined" @change="value=>{draft.gradeNames[grade]=value || '';editedGrade=grade;if(value)delete removedGrades[grade]}"/><div v-if="removedGrades[grade] && !draft.gradeNames[grade]" class="order-error" role="alert">原等級「{{removedGrades[grade]}}」已移除，請為「{{gradeLabels[grade]}}」重新選擇等級。</div><div v-if="grade===editedGrade && orderMessage" role="alert" class="order-error">{{orderMessage}}</div></td></tr></tbody></table>

<table v-if="draft.basis==='percent'" class="score-ranges"><thead><tr><th>學生顯示等級</th><th>最低分（含）</th><th>適用分數範圍</th><th>操作</th></tr></thead>
<tbody><tr v-for="(label,i) in draft.labels" :key="i"><td><select :aria-invalid="!!percentOrderError(draft,i)" v-model="draft.labels[i]" @change="removedRanges[i]=null" :disabled="!draft.options.length" :aria-label="'第'+(i+1)+'級名稱'"><option value="">選擇等級</option><option v-for="n in draft.options" :key="n">{{n}}</option></select><div v-if="removedRanges[i] && !label" class="order-error">原等級「{{removedRanges[i]}}」已移除，請重選等級或移除此區間。</div><div v-if="percentOrderError(draft,i)" class="order-error">{{percentOrderError(draft,i)}}</div></td><td><input type="number" min="0" max="100" v-model.number="draft.minimums[i]" :disabled="i===draft.labels.length-1" :aria-label="label+'最低分'"></td><td>{{rangeText(i)}}</td><td><button class="row-action" :disabled="draft.labels.length===1" :aria-label="'移除第'+(i+1)+'級'" @click="removeLevel(i)">移除</button></td></tr></tbody></table>
<div v-if="draft.basis==='percent'" class="add-control"><a-button :disabled="!unused.length || draft.labels.length>=maxOptions" @click="addLevel">新增分數區間</a-button><small aria-live="polite">{{draft.labels.length}} / {{maxOptions}} 項<span v-if="draft.labels.length>=maxOptions"> · 最多可設定 10 個分數區間</span></small><template v-if="!unused.length && draft.labels.length<maxOptions"><small>所有等級均已使用</small><button class="row-action" @click="openOptions">新增等級選項</button></template></div>

<footer><span role="alert">{{error}}</span><button @click="save">保存</button></footer></section></main></template>
<style scoped>
.school-settings{height:calc(100vh - 118px);overflow:auto;padding:24px 32px;background:#f5f7fb;color:#253650}.crumb,small{color:#58697d}h1{margin:8px 0 20px}section,footer{background:white;border:1px solid #dde4ed;border-radius:10px;padding:18px 24px;margin:0 0 12px}h2{font-size:17px;margin:0 0 16px}.options{display:flex;gap:24px;flex-wrap:wrap}input,select,button{font:inherit}select,input[type=text],input[type=number]{padding:5px 9px;border:1px solid #abb8cb;border-radius:5px;background:white;color:inherit}input[type=number]{width:88px}.example{margin:16px 12px 4px 0;color:#205ab7;background:white;border:1px solid #bdcde4;border-radius:5px;padding:6px 12px}table{width:100%;border-collapse:collapse;margin:12px 0 18px}th,td{text-align:left;border-bottom:1px solid #e5eaf0;padding:6px 12px;}th{background:#f3f6fb}footer{position:sticky;bottom:0;display:flex;justify-content:flex-end;align-items:center;gap:16px;color:#ad2929}footer button{background:#245bcb;color:white;border:0;border-radius:6px;padding:9px 20px}button{cursor:pointer}
.conversion-card{padding-bottom:0}.conversion-card footer{margin:16px -24px 0;padding:14px 24px;border:0;border-top:1px solid #e5eaf0;border-radius:0 0 9px 9px;z-index:1}
.grade-picker{width:128px;max-width:100%}.row-action{color:#245bcb;background:white;border:0;padding:6px 8px}.row-action:disabled{color:#8793a1}input[type=text]{width:100%;max-width:240px}
.student-display{display:grid;grid-template-columns:minmax(max-content,1fr) minmax(190px,1fr);align-items:center;gap:18px}.report-example{border:1px solid #cad8ea;background:#f6f9fd;border-radius:8px;padding:12px 16px}.report-example strong{display:block;margin-bottom:6px;color:#354c68}.report-example span{display:inline-block}@media(max-width:760px){.student-display{grid-template-columns:1fr}}
.rule-heading,.option-line,.actions{display:flex;align-items:center;justify-content:space-between;gap:12px}.rule-heading{margin-bottom:14px}.rule-heading h2,.rule-heading button{margin:0}.move{background:white;border:1px solid #cad8ea;border-radius:4px;padding:4px 7px}.move:disabled{opacity:.4}.option-line{gap:6px;margin-bottom:8px}.actions{justify-content:flex-end}.option-field{flex:1;min-width:0}.apply-options:not(:disabled){background:#245bcb}
.teacher-options{display:flex;align-items:stretch;gap:24px}.teacher-options fieldset{margin:0;padding:0;border:0;min-width:0}.teacher-options fieldset+fieldset{padding-left:24px;border-left:1px solid #dbe3ed}.teacher-options legend{float:left;width:100%;padding:0;margin:0 0 6px;font-size:12px;font-weight:600;color:#58697d}.teacher-options .options{clear:both}.teacher-options .options label,.student-display .options label{display:inline-flex;align-items:center;gap:6px;min-height:28px}.teacher-options input,.student-display input{margin:0;accent-color:#245bcb}.teacher-options fieldset:first-child label{color:#52627a}
.order-error{margin-top:4px;color:#a92325;font-size:13px}select[aria-invalid=true]{border-color:#bd2529}.score-ranges{margin-bottom:8px}.add-control{display:flex;align-items:center;gap:8px}.add-control small{color:#58697d}.rule-shortcut{display:block;margin-top:6px;padding:0;border:0;background:transparent;color:#245bcb;text-decoration:underline}.rule-heading h2{scroll-margin-top:16px}</style>

<style>.school-grade-menu .ant-select-item-option{display:flex;align-items:center;height:32px;padding:0 10px;font-size:14px;line-height:20px;font-variant-numeric:tabular-nums}.school-grade-menu .ant-select-item-option-content{text-align:left}.rule-shortcut{display:block;margin-top:6px;padding:0;border:0;background:transparent;color:#245bcb;text-decoration:underline}.rule-heading h2{scroll-margin-top:16px}</style>

<style>
.ant-drawer .ant-drawer-body {
  padding: 18px 24px 24px;
}
.ant-drawer .ant-drawer-body > p:first-child {
  margin: 0 0 18px;
  color: #536276;
  line-height: 1.6;
}
.ant-drawer .option-line {
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
}
.ant-drawer .option-field {
  min-height: 32px;
}
.ant-drawer .option-field .ant-input {
  height: 32px;
}
.ant-drawer .move,
.ant-drawer .option-line .ant-btn-link {
  min-width: 28px;
  height: 32px;
  padding: 0 7px;
  line-height: 30px;
}
.ant-drawer .option-line .ant-btn-link {
  min-width: 34px;
  padding: 0 2px;
}
.ant-drawer .add-control {
  margin-top: 4px;
  gap: 10px;
}
.ant-drawer .order-error {
  line-height: 1.45;
}
.ant-drawer .ant-drawer-footer {
  padding: 14px 24px;
}
.ant-drawer .actions {
  gap: 10px;
}
</style>

<style>
.conversion-card > p {
  margin: 0 0 14px;
  padding: 8px 12px;
  border: 1px solid #f1dfb6;
  border-radius: 6px;
  background: #fffaf0;
  color: #765b28;
  line-height: 1.6;
}
.conversion-card > .options {
  gap: 24px;
  min-height: 28px;
  align-items: center;
}
.conversion-card .rule-setup-guide {
  margin: 0 0 14px;
  padding: 8px 12px 9px;
  border: 1px solid #c7d8f5;
  border-radius: 6px;
  background: #f4f8ff;
  color: #2c4d7c;
  line-height: 1.55;
}
.rule-setup-guide strong {
  display: block;
  margin-bottom: 3px;
}
.rule-setup-guide ol {
  margin: 0;
  padding-left: 20px;
}
.rule-setup-guide li + li {
  margin-top: 2px;
}
.conversion-card footer {
  position: relative;
  bottom: auto;
  min-height: 56px;
  background: #fff;
  box-shadow: none;
}
</style>

<style>
.page-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.page-title h1 {
  margin-bottom: 4px;
}
.page-title p,
.rule-heading p {
  margin: 0;
  color: #58697d;
  font-size: 13px;
  line-height: 1.5;
}
.page-status,
.tab-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #edf5ff;
  color: #245bcb;
  font-size: 12px;
  line-height: 24px;
  padding: 0 10px;
  white-space: nowrap;
}
.page-status.pending,
.tab-badge {
  background: #edf5ff;
  color: #245bcb;
}
.page-tabs {
  display: flex;
  gap: 24px;
  padding: 0 8px;
  border-bottom: 1px solid #dbe3ed;
  margin-bottom: 12px;
}
.page-tabs button {
  position: relative;
  border: 0;
  background: transparent;
  color: #58697d;
  padding: 10px 4px 12px;
}
.page-tabs button::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: transparent;
}
.page-tabs button.active {
  color: #245bcb;
  font-weight: 600;
}
.page-tabs button.active::after {
  background: #245bcb;
}
.page-tabs .tab-badge {
  margin-left: 4px;
  line-height: 20px;
  padding: 0 7px;
}
.tab-panel {
  min-width: 0;
}
.setup-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  padding: 12px 16px;
  border: 1px solid #c7d8f5;
  border-radius: 8px;
  background: #f4f8ff;
  color: #2c4d7c;
}
.setup-banner strong,
.setup-banner span {
  display: block;
}
.setup-banner strong {
  margin-bottom: 2px;
  color: #214a8a;
}
.setup-banner span {
  font-size: 13px;
  line-height: 1.5;
}
.setup-banner button {
  flex: 0 0 auto;
  border: 1px solid #245bcb;
  border-radius: 6px;
  padding: 7px 14px;
  background: #245bcb;
  color: #fff;
}
.display-note {
  margin-top: -4px;
  color: #58697d;
  font-size: 13px;
  line-height: 1.5;
}
.rule-heading {
  align-items: flex-start;
}
.rule-heading .example {
  flex: 0 0 auto;
}
@media(max-width:760px){
  .page-title,
  .setup-banner {
    align-items: flex-start;
    flex-direction: column;
  }
  .page-tabs {
    gap: 16px;
  }
}
</style>
