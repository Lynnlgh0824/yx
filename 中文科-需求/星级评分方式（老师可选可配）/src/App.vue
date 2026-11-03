<script setup>
import {ref,computed,onMounted,onUnmounted} from 'vue'
import SchoolSettings from './SchoolSettings.vue'
import {schools,schoolKey,readRules,levelFor} from './schoolRules'
import GradesOverview from './GradesOverview.vue'
import PrdPage from './PrdPage.vue'
import StudentWeb from './StudentWeb.vue'
import {defaultSummary,paras,details,notes} from './reportData'
import {weights,gradeLabels,getGradeScore,displayScore,readSavedScores,studentScoresKey,studentSummaryKey} from './grading'
import {makeStudents} from './classroom'
import {MenuFoldOutlined,TeamOutlined,LineChartOutlined,FileAddOutlined,ProfileOutlined,ReadOutlined,SettingOutlined,BellOutlined,QuestionCircleOutlined,GlobalOutlined,DownOutlined,ArrowLeftOutlined,LeftOutlined,RightOutlined,PictureOutlined,FileTextOutlined,EditOutlined,CheckCircleOutlined,InfoCircleOutlined,LogoutOutlined} from '@ant-design/icons-vue'
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
const school=ref(schools.includes(read('essay-active-school',''))?read('essay-active-school',''):schools[0])
const rules=ref(readRules(school.value)),settingsDirty=ref(false),settingsVersion=ref(0)
const scenario=ref('configured')
const firstSetup=ref({options:[],display:['percent'],teacherDisplay:'base',basis:'grade',
  gradeNames:Array(11).fill(''),labels:[''],minimums:[0]})
function switchScenario(next){
  if(next===scenario.value)return
  if(settingsDirty.value && !window.confirm('放棄尚未保存的設定？'))return
  settingsDirty.value=false
  scenario.value=next
  rules.value=next==='configured'?readRules(school.value):firstSetup.value
  settingsVersion.value++
}
const settingsOpen=ref(true)
function saveRules(value){
 try{if(scenario.value==='configured')localStorage.setItem(schoolKey(school.value),JSON.stringify(value));else firstSetup.value=value;rules.value=value;settingsDirty.value=false;notify('本校設定已儲存');return true}catch{notify('未能儲存，請重試');return false}
}
function syncRules(e){if(scenario.value==='configured'&&e.key===schoolKey(school.value)&&!settingsDirty.value){rules.value=readRules(school.value);settingsVersion.value++}}
onMounted(()=>window.addEventListener('storage',syncRules))
onUnmounted(()=>window.removeEventListener('storage',syncRules))
const scale=ref(read('essay-display-scale','hundred'))
const initialStudents=makeStudents(readSavedScores())
const routeStudent=hash=>Number(new URLSearchParams(hash.split('?')[1]||'').get('student'))||1
const selectedId=ref(initialStudents.some(s=>s.id===routeStudent(location.hash))?routeStudent(location.hash):1)
const selectedName=ref(initialStudents.find(s=>s.id===selectedId.value).name)
const scores=ref([...initialStudents.find(s=>s.id===selectedId.value).dimensions])
const names=['內容','表達','結構','標點字體']
function defaultRoute(){
  if(!location.hash)history.replaceState(null,'',location.pathname+location.search+'#settings')
  return location.hash
}
defaultRoute()
const page=ref(location.hash.startsWith('#detail')?'detail':location.hash==='#settings'?'settings':'overview')
const workspaceTab=ref(location.hash==='#student'?'student':location.hash.startsWith('#prd')?'prd':'prototype')
let currentHash=location.hash
function applyRoute(hash){if(hash.startsWith('#detail')&&(routeStudent(hash)!==selectedId.value||page.value!=='detail'||workspaceTab.value!=='prototype'))loadStudent(routeStudent(hash));workspaceTab.value=hash==='#student'?'student':hash.startsWith('#prd')?'prd':'prototype';if(workspaceTab.value==='prototype')page.value=hash.startsWith('#detail')?'detail':hash==='#settings'?'settings':'overview';currentHash=hash}
function allowLeave(hash){
  if(settingsDirty.value&&hash!=='#settings'){if(!window.confirm('放棄尚未儲存的設定？'))return false;settingsDirty.value=false;settingsVersion.value++}
  const leavesDetail=workspaceTab.value==='prototype'&&page.value==='detail'&&(hash==='#settings'||hash==='#overview'||hash==='#student'||hash.startsWith('#prd')||(hash.startsWith('#detail')&&routeStudent(hash)!==selectedId.value))
  if(!leavesDetail||!dirty.value)return true
  if(!window.confirm('修改尚未保存，離開將放棄本次修改。確定離開？'))return false
  scores.value=[...savedScores.value];summary.value=savedSummary.value;editing.value=false
  return true
}
function syncPage(){const next=defaultRoute();if(!allowLeave(next)){history.replaceState(null,'',location.pathname+location.search+currentHash);return}applyRoute(next)}
function go(hash){if(hash===currentHash)return;if(!allowLeave(hash))return;history.pushState(null,'',location.pathname+location.search+hash);applyRoute(hash)}
function navigate(next){go(next==='overview'?'#overview':'#detail?student='+selectedId.value)}
function openStudent(id=selectedId.value){go('#detail?student='+id)}
function changeWorkspace(next){go(next==='student'?'#student':next==='prd'?'#prd':page.value==='settings'?'#settings':page.value==='overview'?'#overview':'#detail?student='+selectedId.value)}
const overviewUrl=import.meta.env.DEV?'http://MacBook-Pro-3.local:8770/':new URL('../../',location.href).href
function leaveOverview(event){event.preventDefault();if(allowLeave('#overview'))location.href=overviewUrl}
function beforeLeave(event){if(!dirty.value&&!settingsDirty.value)return;event.preventDefault();event.returnValue=''}
onMounted(()=>{window.addEventListener('hashchange',syncPage);window.addEventListener('beforeunload',beforeLeave)})
onUnmounted(()=>{window.removeEventListener('hashchange',syncPage);window.removeEventListener('beforeunload',beforeLeave);clearTimeout(timer)})
const total=computed(()=>Number(scores.value.reduce((sum,n,i)=>sum+n*weights[i],0).toFixed(4)))
const totalGrade=computed(()=>gradeLabels[getGradeScore(total.value)])
const mode=ref('text'),tab=ref('scores'),expanded=ref(-1),collapsed=ref(false),suspected=ref(true),toast=ref(''),focused=ref(false),editing=ref(false)
let timer
function notify(s){toast.value=s;clearTimeout(timer);timer=setTimeout(()=>toast.value='',2600)}
function changeScale(s){scale.value=s;try{localStorage.setItem('essay-display-scale',JSON.stringify(s))}catch{}}
function changeScore(e,i){
 const value=e.target.value,v=Number(value),factor=scale.value==='ten'?1:weights[i]
 if(value===null||value===''||!Number.isFinite(v)||v<0||v>10*factor){notify('請輸入此分項範圍內的有效分數');return}
 const rounded=displayScore(v)
 if(rounded===displayScore(scores.value[i]*factor))return
 scores.value[i]=rounded/factor
}
function save(){try{localStorage.setItem(studentScoresKey(selectedId.value),JSON.stringify(scores.value));localStorage.setItem(studentSummaryKey(selectedId.value),JSON.stringify(summary.value));savedScores.value=[...scores.value];savedSummary.value=summary.value;notify('修改已保存於此瀏覽器')}catch{notify('未能保存，請重試')}}

const summary=ref(read(studentSummaryKey(selectedId.value),defaultSummary))
const savedScores=ref([...scores.value]),savedSummary=ref(summary.value)
const dirty=computed(()=>scores.value.some((score,i)=>score!==savedScores.value[i])||summary.value!==savedSummary.value)
function loadStudent(id){
 const student=makeStudents(readSavedScores()).find(s=>s.id===id)
 if(!student)return
 selectedId.value=student.id;selectedName.value=student.name
 scores.value=[...student.dimensions];savedScores.value=[...student.dimensions]
 summary.value=read(studentSummaryKey(student.id),defaultSummary);savedSummary.value=summary.value
 editing.value=false;tab.value='scores';expanded.value=-1;focused.value=false
}



const menus=[[TeamOutlined,'學生管理'],[LineChartOutlined,'學情分析'],[FileAddOutlined,'發布任務'],[ProfileOutlined,'任務管理'],[ReadOutlined,'閱讀'],[SettingOutlined,'設置'],[BellOutlined,'通知'],[QuestionCircleOutlined,'幫助中心']]
</script>
<template>
<div :class="['prototype-workspace',{collapsed}]">
<nav class="workspace-tabs" role="tablist" aria-label="工作區"><span class="requirement-identity workspace-title"><span class="requirement-label">需求名稱</span><span class="requirement-name">星級評分方式（老師可選可配）</span></span><button id="prototype-tab" role="tab" :aria-selected="workspaceTab==='prototype'" aria-controls="prototype-panel" @click="changeWorkspace('prototype')">後台</button><button id="student-tab" role="tab" :aria-selected="workspaceTab==='student'" aria-controls="student-panel" @click="changeWorkspace('student')">網頁-學生端</button><button id="prd-tab" role="tab" :aria-selected="workspaceTab==='prd'" aria-controls="prd-panel" @click="changeWorkspace('prd')">PRD</button><a class="workspace-overview" :href="overviewUrl" @click="leaveOverview">歷史需求彙總頁</a></nav>
<StudentWeb :rules="rules" v-if="workspaceTab==='student'"/>
<PrdPage v-if="workspaceTab==='prd'" @navigate="navigate"/>
<div v-show="workspaceTab==='prototype'" id="prototype-panel" role="tabpanel" aria-labelledby="prototype-tab">
<header class="topbar"><div class="brand"><button class="icon" aria-label="收合選單" @click="collapsed=!collapsed"><MenuFoldOutlined/></button><span class="logo">報</span><span>{{school}}</span><nav v-if="page==='settings'" class="scenario-tabs" aria-label="等級配置場景" role="tablist"><button v-for="item in [['configured','已配置'],['first','未配置']]" :key="item[0]" role="tab" :aria-selected="scenario===item[0]" @click="switchScenario(item[0])">{{item[1]}}</button></nav></div><div class="top-actions"><span><ReadOutlined/> 中文科 <DownOutlined/></span><span><GlobalOutlined/> 繁體中文 <DownOutlined/></span><BellOutlined/><span>幫助中心 <DownOutlined/></span><span class="avatar">A</span><span>admin</span><LogoutOutlined/></div></header>
<aside class="sidebar"><template v-for="([icon,name],i) in menus" :key="name"><div :class="['nav-item',{active:i===3&&page!=='settings'}]" :role="[3,5].includes(i)?'button':undefined" :tabindex="[3,5].includes(i)?0:undefined" @click="i===5?settingsOpen=!settingsOpen:i===3&&navigate('overview')" @keydown.enter="$event.currentTarget.click()"><component :is="icon"/><span>{{name}}</span><small v-if="name==='任務管理' && !collapsed" class="requirement-badge school-menu-badge">需求</small><DownOutlined v-if="[0,5,7].includes(i)" class="nav-down"/></div><div v-if="i===5&&settingsOpen&&!collapsed" class="school-menu"><span>學年學期</span><button :class="{chosen:page==='settings'}" @click="go('#settings')">作文評分展示<small class="requirement-badge school-menu-badge">需求</small></button><span>升級數據導入</span><span>個人頁</span></div></template></aside>
<SchoolSettings v-if="page==='settings'&&workspaceTab==='prototype'" :key="school+settingsVersion" :rules="rules" @save="saveRules" @dirty="settingsDirty=$event"/>
<GradesOverview v-if="page==='overview'" @detail="openStudent" @notify="notify"/>
<main v-show="page==='detail'">
<section class="page-header"><div class="heading"><button class="back" title="返回成績概覽" aria-label="返回成績概覽" @click="navigate('overview')"><ArrowLeftOutlined/></button><div><h1>作業批改</h1><div class="subtitle"><span>命題作文</span>懂得卻懂</div></div></div><div class="header-actions"><span class="student">{{selectedName}}</span><span v-if="dirty" class="unsaved">未保存</span><a-button disabled><LeftOutlined/> 上一位</a-button><a-button disabled>下一位 <RightOutlined/></a-button><a-button type="primary" class="primary" @click="save">確認修改</a-button></div></section>
<div class="report-layout">
<section class="original"><div class="original-toolbar"><div class="view-switch"><button :class="{selected:mode==='image'}" @click="mode='image'"><PictureOutlined/> 圖片</button><button :class="{selected:mode==='text'}" @click="mode='text'"><FileTextOutlined/> 文字</button></div><div class="word-count">總字數 <b>1718</b> 字 <span>｜</span> 疑似錯別字 <strong>{{suspected?'10':'—'}}</strong> 字</div></div>
<div class="paper-scroll"><template v-if="mode==='text'"><div class="first-page"><small>第 1 頁</small><p>此頁暫無可辨識的文字。</p></div><small class="page-number">第 2 頁</small><article v-for="(p,i) in paras" :key="i" class="paper-grid" @click="focused=true;tab='notes'"><span v-for="(c,j) in p.padEnd(Math.ceil(p.length/20)*20,'　')" :key="j" :class="{marked:i===0&&j>=120&&j<158,focus:focused&&i===0&&j>=120&&j<158}">{{c}}</span></article></template><div v-else class="image-view"><img :src="'./original-page.png'" alt="作文原文圖片節選"><p>第 2 頁 · 原文圖片節選</p></div></div>
<footer class="legend"><span><InfoCircleOutlined/> 選取原文文字可添加批註</span><div><i class="good"/>佳句賞析 <i class="improve"/>優化建議 <i class="custom"/>自定義批註 <a-switch v-model:checked="suspected" size="small" aria-label="顯示疑似錯別字"/> 疑似錯別字</div></footer></section>
<section class="marking"><div class="tabs"><button :class="{active:tab==='scores'}" @click="tab='scores'">評分與評語</button><button :class="{active:tab==='notes'}" @click="tab='notes'">批改信息</button><div class="scale-switch-wrap"><span class="requirement-badge scale-requirement">需求</span><a-segmented class="scale-switch" :value="scale" :options="[{value:'hundred',label:'整體評分'},{value:'ten',label:'品第評分'}]" @change="changeScale" aria-label="呈分方式"/></div></div><div class="marking-scroll">
<template v-if="tab==='scores'">
<div class="summary"><div class="summary-text"><h2>總評</h2><div class="total-grade" role="status" tabindex="0" title="綜合分按內容、表達、結構、標點字體的 4:3:2:1 權重計算；品第得分＝百分制原始總分 ÷ 10 後四捨五入，再對應評第。"><strong data-testid="total-grade"><span class="total-grade-score">{{displayScore(total)}}<span class="total-grade-unit">/100</span></span><span class="total-grade-name">{{totalGrade}}<template v-if="rules.teacherDisplay==='withLevel'">（{{levelFor(rules,total)}}）</template></span></strong></div><textarea v-if="editing" v-model="summary" aria-label="總評內容"/><p v-else>{{summary}} <button class="edit" aria-label="編輯總評" @click="editing=true"><EditOutlined/></button></p><button v-if="editing" class="done" @click="editing=false">完成編輯</button></div></div>
<div class="dimensions"><div v-for="(name,i) in names" :key="name" class="dimension"><div class="dimension-line"><button class="dimension-label" @click="expanded=expanded===i?-1:i">{{name}}</button><div class="score-input"><a-input-number :controls="true" :aria-label="name+'評分'" :value="displayScore(scores[i]*(scale==='ten'?1:weights[i]))" :min="0" :max="scale==='ten'?10:weights[i]*10" :step="1" :precision="0" @change="v=>changeScore({target:{value:v}},i)"/><span>{{scale==='ten'?'/10':'/'+weights[i]*10}}</span></div><span v-if="scale==='ten'" class="dimension-grade">（{{gradeLabels[Math.round(scores[i])] ?? '暫無對應品第'}}）</span><div class="progress"><span :style="{width:scores[i]*10+'%'}"/></div><button class="expand" :aria-label="'展開'+name+'評語'" :aria-expanded="expanded===i" @click="expanded=expanded===i?-1:i"><DownOutlined :class="{rotated:expanded===i}"/></button></div><p v-if="expanded===i" class="dimension-description">{{details[i]}}</p></div></div>
<div class="feedback good-card"><h2>整體優點</h2><ul><li>以比賽失利和賽後對話作核心事件，能具體呈現被理解的感受。</li><li>一心理解升學、收入及就業資料的行動，使人物支持不止停留於口頭安慰。</li><li>人物對話能揭示「我」的內心矛盾，也能推動父母態度轉變的後續發展。</li><li>全文情感基調一致，知己之情真摯，敘事脈絡完整。</li></ul></div>
<div class="feedback improve-card"><h2>整體改善建議</h2><ul><li>結尾呼應首段的划槳意象，深化「懂得」的主題。</li><li>精簡重複的議論，讓人物的行動與對話承載情感。</li><li>補充場景轉換的過渡，使文章銜接更自然。</li></ul></div>
</template><template v-else><p class="notes-count">共 2 條批註 · 原文與評語雙向聯動</p><article v-for="([kind,text],i) in notes" :key="i" :class="['note',{green:i===1,focused:focused&&i===0}]" @click="focused=true;mode='text'"><h2>0{{i+1}}　{{kind}}</h2><p>{{text}}</p></article></template>
</div></section></div>
</main></div><div v-if="toast" class="toast" role="status"><CheckCircleOutlined/> {{toast}}</div>
</div>
</template>

<style>
.requirement-identity.requirement-identity{position:relative;display:inline-flex;flex-direction:column;align-items:flex-start;justify-content:center;flex-shrink:0;gap:0;margin:0;padding:0 0 0 11px;border:0;border-radius:0;background:transparent;box-shadow:none;color:#334155;font:700 12px/18px -apple-system,BlinkMacSystemFont,"PingFang TC",sans-serif;white-space:nowrap;cursor:default;text-decoration:none}.requirement-identity::before{content:"";position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:28px;border-radius:2px;background:#5478e8}.requirement-identity>.requirement-label{font:400 10px/14px -apple-system,BlinkMacSystemFont,"PingFang TC",sans-serif;letter-spacing:1px;color:#8793a5;cursor:default}.requirement-identity>.requirement-name{font:inherit;color:#334155;cursor:default}
</style>

<style>.sidebar{overflow-y:auto}.school-menu>*{display:block;width:100%;padding:8px 4px 8px 34px;text-align:left;color:white;font:inherit;font-size:13px}.school-menu button{border:0;background:transparent;cursor:pointer}.school-menu button:hover,.school-menu .chosen{background:#104e85}.total-grade-name{white-space:normal;text-align:center}</style>

<style>.prototype-workspace .sidebar .school-menu-badge{display:inline-flex;margin-left:4px}.school-menu button{white-space:nowrap}.sidebar .nav-item:has(.school-menu-badge){gap:5px}</style>
<style>
@media(max-width:900px){
  .prototype-workspace:not(.collapsed):has(.school-menu) .sidebar{width:156px}
  .prototype-workspace:not(.collapsed):has(.school-menu) #prototype-panel main{margin-left:156px}
  .prototype-workspace:has(.school-menu) .nav-item>span:not(.anticon){display:inline}
}
</style>
