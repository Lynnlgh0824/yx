const state={metric:'task-score',period:'month',scope:'class',scenario:'within'};
const names=['梓軒','嘉欣','子朗','肖刚','曉晴','浩然','穎彤','芷晴','卓賢','樂彤'];
const scores=[1752,1642,1402,1216,1086,929,771,613,456,312];
const $=s=>document.querySelector(s);const $$=s=>document.querySelectorAll(s);
function value(i){const factor=({week:.24,month:1,term:3.6})[state.period]*(state.metric==='task-score'?1:.83);return Math.round((scores[i]??Math.max(20,300-(i-9)*12))*factor)+(state.scope==='grade'?200:0)}
function avatar(i){return `<div class="rank-avatar ${i===0?'orange':i===1?'blue':i===2?'coral':'purple'} avatar-${i%10+1}" aria-hidden="true"></div>`}
function render(){
const outside=state.scenario==='outside';
const mineIndex=outside?11:3;
const limit=state.scope==='class'?10:30;

$$('[data-scenario]').forEach(e=>{const active=e.dataset.scenario===state.scenario;e.setAttribute('aria-selected',active);e.tabIndex=active?0:-1});
$('#ranking-panel').setAttribute('aria-labelledby',`${state.scenario}-tab`);
$('.task-my-rank').hidden=false;
$('.task-my-rank').classList.toggle('outside-card',outside);
$('[data-my-rank-label]').hidden=outside;
$('[data-practice-my-rank]').hidden=outside;
$('[data-my-nickname]').hidden=!outside;
$('[data-practice-my-trend]').hidden=outside;

$('.practice-rank-page').classList.toggle('metric-practice-score',state.metric==='practice-score');
$$('[data-practice-metric]').forEach(e=>{const active=e.dataset.practiceMetric===state.metric;e.classList.toggle('active',active);e.setAttribute('aria-pressed',active)});
$$('[data-practice-period]').forEach(e=>{const active=e.dataset.practicePeriod===state.period;e.classList.toggle('active',active);e.setAttribute('aria-pressed',active)});
$('[data-practice-scope-label]').textContent=state.scope==='class'?'班級':'年級';
$$('[data-practice-scope-option]').forEach(e=>{const active=e.dataset.practiceScopeOption===state.scope;e.classList.toggle('active',active);e.setAttribute('aria-checked',active)});
$('[data-practice-podium]').innerHTML=[1,0,2].map(i=>`<article class="task-podium-card ${i===0?'first':i===2?'third':''}">${avatar(i)}<span class="podium-no">${i+1}</span><strong>${names[i]}</strong><b>${value(i)}</b></article>`).join('');
$('[data-practice-my-rank]').textContent=mineIndex+1;$('[data-practice-my-value]').textContent=value(mineIndex);
$('[data-practice-my-trend]').innerHTML=`<span class="rank-change up">↑ 1</span><b>距離上一名還差 ${value(mineIndex-1)-value(mineIndex)} 分！繼續加油！</b>`;
$('[data-practice-rank-list]').innerHTML=Array.from({length:limit-(outside?3:4)},(_,j)=>j+(outside?3:4)).map(i=>`<article class="task-rank-row"><b>${i+1}</b>${avatar(outside&&i===mineIndex?3:i)}<div><strong>${outside&&i===3?'俊朗':outside&&i===mineIndex?'肖刚':names[i]||['宇軒','詠晴','家朗','心怡','俊熙'][i%5]}</strong><small class="rank-change ${i%2?'down':'up'}"><span>${i%2?'↓':'↑'}</span>1</small></div><em>${value(i)}</em></article>`).join('');
$('[data-practice-rank-list]').scrollTop=0;
}
$$('[data-scenario]').forEach(e=>{e.onclick=()=>{state.scenario=e.dataset.scenario;close();render()};e.onkeydown=event=>{if(['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].includes(event.key)){event.preventDefault();const items=[...$$('[data-scenario]')];const next=event.key==='Home'?items[0]:event.key==='End'?items[1]:items.find(item=>item!==e);next.click();next.focus()}}});
$$('[data-practice-metric]').forEach(e=>e.onclick=()=>{state.metric=e.dataset.practiceMetric;render()});
$$('[data-practice-period]').forEach(e=>e.onclick=()=>{state.period=e.dataset.practicePeriod;render()});
const menu=$('[data-practice-scope-dropdown]'),toggle=$('[data-practice-scope-toggle]');
function close(){menu.classList.remove('open');toggle.setAttribute('aria-expanded','false')}
toggle.onclick=()=>{const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',open)};
$$('[data-practice-scope-option]').forEach(e=>e.onclick=()=>{state.scope=e.dataset.practiceScopeOption;close();render();toggle.focus()});
document.addEventListener('click',e=>{if(!menu.contains(e.target))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();toggle.focus()}});
$('#back').onclick=()=>{location.href='../../index.html'};render();
