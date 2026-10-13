<script setup>
import {ref,computed,onMounted,onUnmounted} from 'vue'
import GradesOverview from './GradesOverview.vue'
import PrdPage from './PrdPage.vue'
import {weights,gradeLabels} from './grading'
import {MenuFoldOutlined,TeamOutlined,LineChartOutlined,FileAddOutlined,ProfileOutlined,ReadOutlined,SettingOutlined,BellOutlined,QuestionCircleOutlined,GlobalOutlined,DownOutlined,ArrowLeftOutlined,LeftOutlined,RightOutlined,PictureOutlined,FileTextOutlined,EditOutlined,CheckCircleOutlined,InfoCircleOutlined,LogoutOutlined} from '@ant-design/icons-vue'
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
const scale=ref(read('essay-display-scale','hundred'))
const scores=ref(read('essay-grade-scores-example52',[5,6,5,4]))
const names=['內容','表達','結構','標點字體']
const page=ref(location.hash==='#overview'?'overview':'detail')
const workspaceTab=ref(location.hash==='#prd'?'prd':'prototype')
function syncPage(){workspaceTab.value=location.hash.startsWith('#prd')?'prd':'prototype';if(workspaceTab.value==='prototype')page.value=location.hash==='#overview'?'overview':'detail'}
function navigate(next){workspaceTab.value='prototype';location.hash=next==='overview'?'overview':'detail';page.value=next}
function changeWorkspace(next){workspaceTab.value=next;location.hash=next==='prd'?'prd':page.value}
onMounted(()=>window.addEventListener('hashchange',syncPage))
onUnmounted(()=>window.removeEventListener('hashchange',syncPage))
const total=computed(()=>scores.value.reduce((sum,n,i)=>sum+n*weights[i],0))
const totalGrade=computed(()=>gradeLabels[Math.round(total.value/10)])
const mode=ref('text'),tab=ref('scores'),expanded=ref(-1),dirty=ref(false),collapsed=ref(false),suspected=ref(true),toast=ref(''),focused=ref(false),editing=ref(false)
let timer
function notify(s){toast.value=s;clearTimeout(timer);timer=setTimeout(()=>toast.value='',2600)}
function changeScale(s){scale.value=s;try{localStorage.setItem('essay-display-scale',JSON.stringify(s))}catch{}}
function changeScore(e,i){const v=Number(e.target.value),base=scale.value==='ten'?v:v/weights[i];if(e.target.value===null||e.target.value===''||!Number.isFinite(base)||base<0||base>10){e.target.value=scale.value==='ten'?scores.value[i]:scores.value[i]*weights[i];notify('請輸入此分項範圍內的有效分數');return}scores.value[i]=base;dirty.value=true}
function save(){try{localStorage.setItem('essay-grade-scores-example52',JSON.stringify(scores.value));localStorage.setItem('essay-grade-summary',JSON.stringify(summary.value));dirty.value=false;notify('修改已保存於此瀏覽器')}catch{notify('未能保存，請重試')}}
const summary=ref(read('essay-grade-summary','文章以追求運動員夢想受阻為背景，刻畫一心從觀察情緒、理解跑步意義到蒐集升學及就業資料的支持，具體呈現知己「無須多言而能理解」的可貴。敘事完整，情感真摯，人物行動亦有說服力。不過，全文主要集中於「一心懂我」，對題目中「都懂」所包含的共同理解、默契形成及其更廣泛意義回應不足；後段抒情和比喻較密，部分意思重複。若能更明確地回應題旨，並收束議論，文章會更凝練深刻。'))
const paras=[
'　　在 人 生 這 條 奔 流 不 息 的 長 河 中 ， 我 們 會 遇 到 無 數 的 人 。 有 些 擦 身 而 過 ， 只 留 下 模 糊 的 背 影 ； 有 些 短 暫 陪 伴 ， 中 途 分 道 揚 鑣 ； 而 有 些 願 意 為 你 停 留 ， 成 為 你 生 命 中 永 不 熄 滅 的 光 。 我 曾 天 真 地 以 為 那 些 在 岸 邊 為 我 鼓 掌 的 人 最 值 得 珍 惜 ， 卻 在 逆 流 而 上 時 才 發 現 ， 掌 聲 會 散 去 。 只 有 那 個 願 意 跳 入 水 中 ， 與 你 並 肩 划 槳 的 人 ， 才 是 你 窮 盡 一 生 想 要 追 尋 的 知 己 。 而 一 心 ， 就 是 那 個 人 。'.replaceAll(' ',''),
'　　從小，我的夢想是成為全職運動員。我熱愛跑道上風在耳邊呼嘯的感覺，享受肌肉收縮帶來的力量感，嚮往衝過終點的滿足。「你成績那麼好，為何非要走這條窄路？」朋友們笑我浪費天賦。「運動員能當一輩子嗎？受傷了怎麼辦？」家人的擔憂像一堵牆，讓我無從解釋。唯有一心沒有急著反駁，只是陪我坐在操場旁，安靜地聽我訴說。',
'　　那天訓練結束，夕陽把跑道染成溫暖的金色。一心遞來一瓶水，問我：「跑步的時候，你在想甚麼？」我望著遠方，終於能把一直藏在心底的話說出來。她沒有打斷，只是點頭。那一刻，我知道，理解並不需要華麗的語言。',
'　　後來，她帶來一疊整理好的資料，上面寫著不同學校的運動員支援計劃，還有升學和就業的選擇。她說：「我知道你想繼續跑，所以我們一起找路。」紙頁上的筆跡很細，卻承載著沉甸甸的關心。原來真正的知己，會走進你的世界，陪你看清前方的路。'
]
const details=['取材具體，主題明確；一心的支持透過行動呈現，可再深化「懂得」與「珍惜」之間的聯繫。','語句通順，善用比喻及細節描寫表達情感。部分議論可精簡，讓語言更凝練。','敘事脈絡清晰，前後有所呼應；可加強回憶與現實之間的過渡。','標點使用恰當，文字清晰，段落劃分整齊。']
const notes=[['優化建議','首段的河流與划槳比喻形象鮮明，可在結尾再次呼應，突出「知己同行」的主題。'],['佳句賞析','「唯有一心沒有急著反駁」透過人物反應的對比，寫出一心對「我」的理解。']]
const menus=[[TeamOutlined,'學生管理'],[LineChartOutlined,'學情分析'],[FileAddOutlined,'發布任務'],[ProfileOutlined,'任務管理'],[ReadOutlined,'閱讀'],[SettingOutlined,'設置'],[BellOutlined,'通知'],[QuestionCircleOutlined,'幫助中心']]
</script>
<template>
<div :class="['prototype-workspace',{collapsed}]">
<nav class="workspace-tabs" role="tablist" aria-label="工作區"><span class="workspace-title">作文品第切換</span><button id="prototype-tab" role="tab" :aria-selected="workspaceTab==='prototype'" aria-controls="prototype-panel" @click="changeWorkspace('prototype')">后台原型</button><button id="prd-tab" role="tab" :aria-selected="workspaceTab==='prd'" aria-controls="prd-panel" @click="changeWorkspace('prd')">PRD</button></nav>
<PrdPage v-if="workspaceTab==='prd'" @navigate="navigate"/>
<div v-show="workspaceTab==='prototype'" id="prototype-panel" role="tabpanel" aria-labelledby="prototype-tab">
<header class="topbar"><div class="brand"><button class="icon" aria-label="收合選單" @click="collapsed=!collapsed"><MenuFoldOutlined/></button><span class="logo">報</span><span>報表測試</span></div><div class="top-actions"><span><ReadOutlined/> 中文科 <DownOutlined/></span><span><GlobalOutlined/> 繁體中文 <DownOutlined/></span><BellOutlined/><span>幫助中心 <DownOutlined/></span><span class="avatar">A</span><span>admin</span><LogoutOutlined/></div></header>
<aside class="sidebar"><div v-for="([icon,name],i) in menus" :key="name" :class="['nav-item',{active:i===3}]" :role="i===3?'button':undefined" :tabindex="i===3?0:undefined" @click="i===3 && navigate('overview')" @keydown.enter="i===3 && navigate('overview')"><component :is="icon"/><span>{{name}}</span><DownOutlined v-if="i===0||i===7" class="nav-down"/></div></aside>
<GradesOverview v-if="page==='overview'" @detail="navigate('detail')" @notify="notify"/>
<main v-show="page==='detail'">
<section class="page-header"><div class="heading"><button class="back" title="返回成績概覽" aria-label="返回成績概覽" @click="navigate('overview')"><ArrowLeftOutlined/></button><div><h1>作業批改</h1><div class="subtitle"><span>命題作文</span>懂得卻懂</div></div></div><div class="header-actions"><span class="student">小鹿1</span><span v-if="dirty" class="unsaved">未保存</span><a-button disabled><LeftOutlined/> 上一位</a-button><a-button disabled>下一位 <RightOutlined/></a-button><a-button type="primary" class="primary" @click="save">確認修改</a-button></div></section>
<div class="report-layout">
<section class="original"><div class="original-toolbar"><div class="view-switch"><button :class="{selected:mode==='image'}" @click="mode='image'"><PictureOutlined/> 圖片</button><button :class="{selected:mode==='text'}" @click="mode='text'"><FileTextOutlined/> 文字</button></div><div class="word-count">總字數 <b>1718</b> 字 <span>｜</span> 疑似錯別字 <strong>{{suspected?'10':'—'}}</strong> 字</div></div>
<div class="paper-scroll"><template v-if="mode==='text'"><div class="first-page"><small>第 1 頁</small><p>此頁暫無可辨識的文字。</p></div><small class="page-number">第 2 頁</small><article v-for="(p,i) in paras" :key="i" class="paper-grid" @click="focused=true;tab='notes'"><span v-for="(c,j) in p.padEnd(Math.ceil(p.length/20)*20,'　')" :key="j" :class="{marked:i===0&&j>=120&&j<158,focus:focused&&i===0&&j>=120&&j<158}">{{c}}</span></article></template><div v-else class="image-view"><img src="/original-page.png" alt="作文原文圖片節選"><p>第 2 頁 · 原文圖片節選</p></div></div>
<footer class="legend"><span><InfoCircleOutlined/> 選取原文文字可添加批註</span><div><i class="good"/>佳句賞析 <i class="improve"/>優化建議 <i class="custom"/>自定義批註 <a-switch v-model:checked="suspected" size="small" aria-label="顯示疑似錯別字"/> 疑似錯別字</div></footer></section>
<section class="marking"><div class="tabs"><button :class="{active:tab==='scores'}" @click="tab='scores'">評分與評語</button><button :class="{active:tab==='notes'}" @click="tab='notes'">批改信息</button><a-segmented class="scale-switch" :value="scale" :options="[{value:'hundred',label:'整體評分'},{value:'ten',label:'品第評分'}]" @change="changeScale" aria-label="呈分方式"/></div><div class="marking-scroll">
<template v-if="tab==='scores'">
<div class="summary"><div class="summary-text"><h2>總評</h2><div v-if="scale==='ten'" class="total-grade" role="status" tabindex="0" title="綜合分按內容、表達、結構、標點字體的 4:3:2:1 權重計算；品第按綜合分四捨五入至整數後對應。"><small>綜合評分</small><strong data-testid="total-grade"><span class="total-grade-score">{{Number((total/10).toFixed(4))}}<span class="total-grade-unit"> /10</span></span><span class="total-grade-name">{{totalGrade}}</span></strong></div><div v-else class="score-badge"><small>最終評分</small><div><b data-testid="total">{{total}}</b><span>/100</span></div></div><textarea v-if="editing" v-model="summary" @input="dirty=true" aria-label="總評內容"/><p v-else>{{summary}} <button class="edit" aria-label="編輯總評" @click="editing=true"><EditOutlined/></button></p><button v-if="editing" class="done" @click="editing=false">完成編輯</button></div></div>
<div class="dimensions"><div v-for="(name,i) in names" :key="name" class="dimension"><div class="dimension-line"><button class="dimension-label" @click="expanded=expanded===i?-1:i">{{name}}</button><div class="score-input"><a-input-number :controls="true" :aria-label="name+'評分'" :value="scale==='ten'?scores[i]:scores[i]*weights[i]" :min="0" :max="scale==='ten'?10:weights[i]*10" :step="scale==='ten'?1:weights[i]" @change="v=>changeScore({target:{value:v}},i)"/><span>{{scale==='ten'?'/10':'/'+weights[i]*10}}</span></div><span v-if="scale==='ten'" class="dimension-grade">（{{gradeLabels[scores[i]] ?? '暫無對應品第'}}）</span><div class="progress"><span :style="{width:scores[i]*10+'%'}"/></div><button class="expand" :aria-label="'展開'+name+'評語'" :aria-expanded="expanded===i" @click="expanded=expanded===i?-1:i"><DownOutlined :class="{rotated:expanded===i}"/></button></div><p v-if="expanded===i" class="dimension-description">{{details[i]}}</p></div></div>
<div class="feedback good-card"><h2>整體優點</h2><ul><li>以比賽失利和賽後對話作核心事件，能具體呈現被理解的感受。</li><li>一心理解升學、收入及就業資料的行動，使人物支持不止停留於口頭安慰。</li><li>人物對話能揭示「我」的內心矛盾，也能推動父母態度轉變的後續發展。</li><li>全文情感基調一致，知己之情真摯，敘事脈絡完整。</li></ul></div>
<div class="feedback improve-card"><h2>整體改善建議</h2><ul><li>結尾呼應首段的划槳意象，深化「懂得」的主題。</li><li>精簡重複的議論，讓人物的行動與對話承載情感。</li><li>補充場景轉換的過渡，使文章銜接更自然。</li></ul></div>
</template><template v-else><p class="notes-count">共 2 條批註 · 原文與評語雙向聯動</p><article v-for="([kind,text],i) in notes" :key="i" :class="['note',{green:i===1,focused:focused&&i===0}]" @click="focused=true;mode='text'"><h2>0{{i+1}}　{{kind}}</h2><p>{{text}}</p></article></template>
</div></section></div>
</main></div><div v-if="toast" class="toast" role="status"><CheckCircleOutlined/> {{toast}}</div>
</div>
</template>
