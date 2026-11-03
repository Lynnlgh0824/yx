export const weights = [4, 3, 2, 1]
export const gradeLabels = {10:'上上',9:'上中',8:'上下',7:'中上',6:'中中（上）',5:'中中（下）',4:'中下',3:'下上',2:'下中',1:'下下',0:'極差劣／空白'}
export const getTotal = scores => scores.reduce((sum, score, index) => sum + score * weights[index], 0)
export const getGradeScore = total => Math.round(total / 10)
export const getGrade = total => gradeLabels[getGradeScore(total)]
export const displayScore = score => score === null || score === undefined || score === '' ? '—' : Math.round(Number(Number(score).toFixed(4)))
export const formatScore = score => Number(score.toFixed(4))
export function readSavedScores() {
  try {
    const scores = JSON.parse(localStorage.getItem('essay-grade-scores-example52'))
    if (Array.isArray(scores) && scores.length === 4 && scores.every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 10)) return scores
  } catch {}
  return [5, 6, 5, 4]
}
export function readStudentScores(id,fallback){
 if(id===1)return readSavedScores()
 try{const value=JSON.parse(localStorage.getItem(`essay-grade-scores-student-${id}`));if(Array.isArray(value)&&value.length===4&&value.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=10))return value}catch{}
 return [...fallback]
}
export const studentScoresKey=id=>id===1?'essay-grade-scores-example52':`essay-grade-scores-student-${id}`
export const studentSummaryKey=id=>id===1?'essay-grade-summary':`essay-grade-summary-student-${id}`
