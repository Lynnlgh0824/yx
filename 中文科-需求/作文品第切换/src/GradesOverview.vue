<script setup>
import {computed,ref,onMounted,onUnmounted} from 'vue'
import {ArrowLeftOutlined,CalendarOutlined,TeamOutlined,ReloadOutlined,DownloadOutlined,ThunderboltOutlined,LineChartOutlined,CompassOutlined,ProfileOutlined,SearchOutlined} from '@ant-design/icons-vue'
import {readSavedScores,getTotal,getGrade,formatScore} from './grading'
const emit=defineEmits(['detail','notify'])
const scores=ref(readSavedScores()),search=ref(''),published=ref(true)
const total=computed(()=>getTotal(scores.value))
const gradeScore=computed(()=>formatScore(total.value/10))
const grade=computed(()=>getGrade(total.value))
const students=computed(()=>[
  {id:1,name:'小鹿1',avatar:'👩🏻‍🎓',rank:1,score:formatScore(total.value),gradeScore:gradeScore.value,grade:grade.value,time:'10分54秒',complete:true},
  {id:2,name:'小小卢',avatar:'👩🏻',rank:null,score:null,gradeScore:null,grade:null,time:'--',complete:false}
])
const filtered=computed(()=>students.value.filter(s=>s.name.includes(search.value.trim())))
function refresh(showMessage=true){scores.value=readSavedScores();if(showMessage)emit('notify','成績已刷新')}
function sync(event){if(event.key==='essay-grade-scores-example52')refresh(false)}
onMounted(()=>window.addEventListener('storage',sync))
onUnmounted(()=>window.removeEventListener('storage',sync))
function exportScores(){
  const rows=[['排名','學生','得分（百分制）','品第分與品第','用時','狀態'],...students.value.map(s=>[s.rank??'-',s.name,s.score??'-',s.complete?`${s.gradeScore}（${s.grade}）`:'-',s.time,s.complete?'已完成':'未完成'])]
  const csv='\uFEFF'+rows.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\r\n')
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download='懂得都懂-成績表.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
</script>
<template>
<main class="overview-page">
  <section class="page-header overview-header">
    <div class="heading"><button class="back" aria-label="返回作業批改" @click="emit('detail')"><ArrowLeftOutlined/></button><div><h1>懂得都懂 - 成績概覽</h1><div class="overview-meta"><CalendarOutlined/> 2026-09-28 <span>｜</span><TeamOutlined/> 1A (2人)</div></div></div>
    <div class="overview-actions"><div class="publish-control">成績公布 <a-switch v-model:checked="published" checked-children="已公布" un-checked-children="未公布" @change="emit('notify','已切換本機演示狀態')"/></div><a-button @click="refresh()"><ReloadOutlined/>刷新</a-button><a-button @click="exportScores"><DownloadOutlined/>導出成績表</a-button></div>
  </section>
  <div class="overview-stats">
    <section class="stat"><h2>平均分</h2><strong class="blue">{{total.toFixed(1)}}</strong></section>
    <section class="stat"><h2>最高分</h2><div><strong class="green">{{formatScore(total)}}</strong><span>小鹿1</span></div></section>
    <section class="stat"><h2>及格率</h2><strong class="purple">{{total>=60?'100%':'0%'}}</strong></section>
    <section class="stat"><h2>完成率</h2><div><strong>50%</strong><span>(1/2人)</span></div><div class="completion-track"><i/></div></section>
  </div>
  <button class="overview-ai" @click="emit('notify','AI 智能總結暫無內容')"><ThunderboltOutlined/> AI 智能總結</button>
  <section class="overview-analysis"><div class="analysis-tab"><LineChartOutlined/> 薄弱點分析</div><div class="analysis-body"><div class="analysis-chart"><h2><LineChartOutlined/> 評分維度分析</h2><div class="chart-placeholder"/></div><div class="analysis-details"><div class="analysis-title"><h2><CompassOutlined/> 維度得分詳情</h2><div class="analysis-legend"><span><i class="red"/>需關注 (&lt;60%)</span><span><i class="orange"/>一般 (60-79%)</span><span><i class="green-dot"/>優異 (≥80%)</span></div></div></div></div></section>
  <section class="overview-students"><div class="students-toolbar"><h2><ProfileOutlined/> 學生答題情況</h2><a-input v-model:value="search" placeholder="搜索學生..." aria-label="搜索學生" allow-clear><template #prefix><SearchOutlined/></template></a-input></div><div class="students-table-scroll"><table><thead><tr><th>排名</th><th>學生</th><th>得分</th><th class="grade-column">品第分與品第</th><th>用時</th><th>狀態</th><th>操作</th></tr></thead><tbody><tr v-for="student in filtered" :key="student.id"><td><span :class="{'rank-first':student.rank===1}">{{student.rank??'-'}}</span></td><td><div class="student-name"><span class="student-avatar">{{student.avatar}}</span>{{student.name}}</div></td><td :class="{ 'table-score':student.complete }">{{student.score??'-'}}</td><td class="grade-column"><span v-if="student.complete" class="table-grade"><b>{{student.gradeScore}}</b><span>（{{student.grade}}）</span></span><span v-else>—</span></td><td>{{student.time}}</td><td><span :class="['status-pill',student.complete?'complete':'incomplete']">{{student.complete?'已完成':'未完成'}}</span></td><td><button class="detail-link" :disabled="!student.complete" @click="emit('detail')">查看詳情</button></td></tr><tr v-if="!filtered.length"><td colspan="7" class="table-empty">未找到符合條件的學生</td></tr></tbody></table></div></section>
</main>
</template>
