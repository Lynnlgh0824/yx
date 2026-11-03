<script setup>
import {computed,ref,onMounted,onUnmounted} from 'vue'
import {ArrowLeftOutlined,CalendarOutlined,TeamOutlined,ReloadOutlined,DownloadOutlined,ThunderboltOutlined,LineChartOutlined,CompassOutlined,ProfileOutlined,SearchOutlined} from '@ant-design/icons-vue'
import {readSavedScores,formatScore} from './grading'
import ClassAnalysis from './ClassAnalysis.vue'
import {makeStudents,summarize,toCsv,scoreRows} from './classroom'
const emit=defineEmits(['detail','notify'])
const scores=ref(readSavedScores()),search=ref(''),published=ref(true)
const students=computed(()=>makeStudents(scores.value))
const stats=computed(()=>summarize(students.value))
const chartStep=computed(()=>Math.max(1,Math.ceil(Math.max(...stats.value.bands.map(b=>b.count))/4)))
const chartMax=computed(()=>chartStep.value*4)
const chartTicks=computed(()=>Array.from({length:5},(_,i)=>chartMax.value-i*chartStep.value))
function openStudent(student){emit('detail',student.id)}
const filtered=computed(()=>[...students.value].sort((a,b)=>(a.rank??Infinity)-(b.rank??Infinity)||a.id-b.id).filter(s=>s.name.includes(search.value.trim())))
function refresh(showMessage=true){scores.value=readSavedScores();if(showMessage)emit('notify','成績已刷新')}
function sync(event){if(event.key?.startsWith('essay-grade-scores-'))refresh(false)}
onMounted(()=>window.addEventListener('storage',sync))
onUnmounted(()=>window.removeEventListener('storage',sync))
function exportScores(){
  const csv=toCsv(scoreRows(students.value))
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download='1a-xuesheng-chengji.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
  emit('notify','已導出全班成績，包含品第及品第評分')
}
</script>
<template>
<main class="overview-page">
  <section class="page-header overview-header">
    <div class="heading"><button class="back" aria-label="返回作業批改" @click="emit('detail')"><ArrowLeftOutlined/></button><div><h1>懂得都懂 - 成績概覽</h1><div class="overview-meta"><CalendarOutlined/> 2026-09-28 <span>｜</span><TeamOutlined/> 1A ({{students.length}}人)</div></div></div>
    <div class="overview-actions"><div class="publish-control">成績公布 <a-switch v-model:checked="published" checked-children="已公布" un-checked-children="未公布" @change="emit('notify','成績公布狀態已更新')"/></div><a-button @click="refresh()"><ReloadOutlined/>刷新</a-button><a-button @click="exportScores()"><DownloadOutlined/>導出成績表</a-button></div>
  </section>
  <div class="overview-stats">
    <section class="stat"><h2>平均分</h2><strong class="blue">{{stats.average?.toFixed(1)??'—'}}</strong></section>
    <section class="stat"><h2>最高分</h2><div><strong class="green">{{stats.highest??'—'}}</strong><span>全班最高分</span></div></section>
    <section class="stat"><h2>及格率</h2><strong class="purple">{{stats.passRate.toFixed(1)}}%</strong></section>
    <section class="stat"><h2>完成率</h2><div><strong>{{stats.completion.toFixed(1)}}%</strong><span>({{stats.completed}}/{{students.length}}人)</span></div><div class="completion-track"><i :style="{width:stats.completion+'%'}"/></div></section>
  </div>
  <ClassAnalysis :students="students"/>
  <section class="overview-students"><div class="students-toolbar"><h2><ProfileOutlined/> 學生答題情況</h2><a-input v-model:value="search" placeholder="搜索學生..." aria-label="搜索學生" allow-clear><template #prefix><SearchOutlined/></template></a-input></div><div class="students-table-scroll"><table><thead><tr><th>排名</th><th>學生</th><th>得分</th><th class="grade-column">品第</th><th>用時</th><th>狀態</th><th>操作</th></tr></thead><tbody><tr v-for="student in filtered" :key="student.id"><td><span v-if="student.rank && student.rank<=3" :class="['rank-medal','rank-medal-'+student.rank]" :aria-label="'第 '+student.rank+' 名'" :title="'第 '+student.rank+' 名'"><b>{{student.rank}}</b></span><span v-else>{{student.rank??'—'}}</span></td><td><div class="student-name"><span class="student-avatar">{{student.avatar}}</span>{{student.name}}</div></td><td :class="{ 'table-score':student.complete }">{{student.score??'-'}}</td><td class="grade-column"><span v-if="student.complete" class="table-grade"><span>{{student.grade}}</span></span><span v-else>—</span></td><td>{{student.time}}</td><td><span :class="['status-pill',student.complete?'complete':'incomplete']">{{student.complete?'已完成':'未完成'}}</span></td><td><button class="detail-link" :disabled="!student.complete" @click="openStudent(student)">查看詳情</button></td></tr><tr v-if="!filtered.length"><td colspan="7" class="table-empty">未找到符合條件的學生</td></tr></tbody></table></div></section>
  <section class="overview-students class-statistics"><div class="students-toolbar"><h2><TeamOutlined/> 班級統計 · 品第分布</h2></div><p class="class-note">全班 {{students.length}} 人 · 已完成 {{stats.completed}} 人 · 未完成 {{stats.pending}} 人。占比按已完成人數計算。</p><div class="distribution-scroll"><div class="distribution-chart"><span class="axis-title">人數</span><div class="chart-plot"><div class="chart-grid" aria-hidden="true"><div v-for="tick in chartTicks" :key="tick" class="chart-gridline"><span>{{tick}}</span></div></div><ul class="grade-distribution" aria-label="班級品第分布"><li v-for="band in stats.bands" :key="band.point" class="grade-distribution-column" :aria-label="band.label+'：'+band.count+'人，占'+band.percent.toFixed(1)+'%'" :title="band.label+'：'+band.count+'人，占'+band.percent.toFixed(1)+'%'"><div class="band-column" :style="{height:(band.count/chartMax*100)+'%'}"><div class="band-value"><b>{{band.count}} 人</b><span>{{band.percent.toFixed(1)}}%</span></div></div><span class="band-label">{{band.label}}</span></li></ul></div><div class="axis-footer">品第</div></div></div></section>
</main>
</template>

<style scoped>
.class-note{color:#7b8799;font-size:12px;line-height:1.7;margin:8px 18px 16px}.class-statistics{margin-top:16px}
.distribution-scroll{overflow-x:auto;padding:0 20px 18px}
.distribution-chart{min-width:780px;padding-left:32px}
.axis-title,.axis-footer{font-size:12px;color:#7b8799}.axis-title{display:block;margin-bottom:48px}.axis-footer{text-align:right;margin-top:60px}
.chart-plot{position:relative;height:220px}
.chart-grid{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none}
.chart-gridline{position:relative;border-top:1px dashed #e4eaf3;width:100%}.chart-gridline:last-child{border-top:1px solid #ccd6e4}.chart-gridline>span{position:absolute;right:calc(100% + 12px);top:-8px;color:#8995a6;font-size:11px}
.grade-distribution{position:relative;list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:12px;height:100%}
.grade-distribution-column{position:relative;display:flex;align-items:flex-end;justify-content:center;height:100%;font-size:12px}
.band-column{position:relative;width:36px;max-width:70%;background:#3973ff;border-radius:5px 5px 0 0}
.band-value{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:3px;white-space:nowrap;font-variant-numeric:tabular-nums}.band-value b{font-weight:600;color:#34445c}.band-value>span{color:#8a97aa;font-size:11px}
.band-label{position:absolute;top:calc(100% + 14px);left:50%;transform:translateX(-50%);width:100%;text-align:center;color:#526176;line-height:18px;overflow-wrap:anywhere}
.rank-medal{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:5px;color:#fff}.rank-medal b{font-size:12px;font-weight:700}.rank-medal-1{background:#ffcb08}.rank-medal-2{background:#a7b1c0}.rank-medal-3{background:#c58e62}
</style>
