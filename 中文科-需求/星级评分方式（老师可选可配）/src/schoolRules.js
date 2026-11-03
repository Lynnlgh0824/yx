import {getGradeScore,gradeLabels} from './grading'
export const levels = ['5**','5*','5']
const legacyLevels = ['5**','5*','5','4','3','2','1','0']
export function exampleGrades(options) {
  const ascending = Array.from({length:10}, (_, index) => {
    const rank = Math.round((9-index)*(options.length-1)/9)
    return options[rank]
  })
  return ['0', ...ascending]
}
const exampleMinimums = [67,34,0]
export const schoolKey = school => 'essay-school-display-v1-' + school
export const schools = ['海外學校','示例中學']
export function normalizeLevel(value) {
  const name=String(value ?? '').trim()
  return /^未[達达]到?等[級级]$/.test(name)?'0':name
}
export function readRules(school) {
  try {
    const saved = JSON.parse(localStorage.getItem(schoolKey(school)))
    if (saved) saved.teacherDisplay ??= saved.display==='level'?'withLevel':'base'
    if (saved && !Array.isArray(saved.display)) saved.display=[saved.display || 'percent']
    if (saved) {
      saved.gradeNames ??= saved.grades.map(value=>(saved.labels ? saved.labels[value] : value) || '')
      saved.labels ??= [...legacyLevels]
      saved.labels=saved.labels.map(normalizeLevel)
      saved.gradeNames=saved.gradeNames.map(normalizeLevel)
      if(saved.labels.join('|')===legacyLevels.join('|') && saved.minimums.slice(0,-1).every(n=>n==null) && saved.minimums.at(-1)===0) saved.minimums=[95,85,75,65,50,35,20,0]
      saved.options=[...new Set((saved.options ?? [...saved.labels,...saved.gradeNames]).map(normalizeLevel).filter(Boolean))]
      return saved
    }
  } catch {}
  return {options:[...levels],teacherDisplay:'base', display:['percent'], basis:'grade', labels:[...levels], gradeNames:exampleGrades(levels), minimums:[...exampleMinimums]}
}
export function labelError(labels) {
  if (!labels.length || labels.some(label=>!label.trim())) return '請填寫各級名稱。'
  return new Set(labels.map(label=>label.trim())).size===labels.length?'':'等級名稱不可重複。'
}
export function gradeOrderError(rule, grade) {
  const rank=rule.options.indexOf(rule.gradeNames[grade])
  if(rank<0)return ''
  for(const step of [1,-1]){
    for(let other=grade+step;other>=1 && other<=10;other+=step){
      const bound=rule.options.indexOf(rule.gradeNames[other])
      if(bound<0)continue
      if(step===1 ? rank<bound : rank>bound){
        const direction=step===1?'高於上方':'低於下方'
        return '「'+gradeLabels[grade]+'」的等級不可'+direction+'「'+gradeLabels[other]+'」（'+rule.gradeNames[other]+'）。'
      }
      break
    }
  }
  return ''
}
export function percentOrderError(rule,i){
  const rank=rule.options.indexOf(rule.labels[i])
  if(rank<0)return ''
  for(const step of [-1,1]){
    for(let j=i+step;j>=0&&j<rule.labels.length;j+=step){
      const other=rule.options.indexOf(rule.labels[j])
      if(other<0)continue
      if(step<0?rank<=other:rank>=other)return '第'+(i+1)+'個區間的等級須'+(step<0?'低於':'高於')+'第'+(j+1)+'個區間（'+rule.labels[j]+'）。'
      break
    }
  }
  return ''
}
export function ruleError(rule) {
  if(!rule.options.length)return '請先配置等級選項。'
  if (rule.basis==='grade') return rule.gradeNames.slice(1).every(name=>rule.options.includes(name))?'':'請為每個綜合品第選擇等級。'
  if(labelError(rule.labels)||rule.labels.some(l=>!rule.options.includes(l)))return '請為各分數區間選擇不同的已配置等級。'
  const order=rule.labels.map((_,i)=>percentOrderError(rule,i)).find(Boolean)
  if(order)return order
  const valid=rule.minimums.every((n,i,a)=>Number.isInteger(n)&&n>=0&&n<=100&&(i===0||n<a[i-1])) && rule.minimums.at(-1)===0
  return valid?'':'請填妥各級最低分，由高至低排列，末級由 0 分起。'
}
export function levelFor(rule,total) {
  if(rule.basis==='grade') return rule.gradeNames[getGradeScore(total)] || '—'
  if(ruleError(rule)) return '—'
  return rule.labels[rule.minimums.findIndex(n=>total>=n)]
}
