<script setup>
</script>

<template>
  <main class="prd-page" id="prd-panel" role="tabpanel" aria-labelledby="prd-tab">
    <header class="prd-heading">
      <div class="prd-eyebrow">中文科 · 教師後台</div>
      <h1>作文評分展示</h1>
      <p>PRD · V2.0 · 更新日期 2026-11-03</p>
      <div class="prd-intro">管理學生端、教師端的評分展示項目，以及等級配置與換算規則。</div>
    </header>

    <section class="prd-section prd-scope">
      <h2>功能點概覽</h2>
      <div class="prd-feature-grid">
        <article class="prd-feature-card">
          <h3>設置</h3>
          <p class="prd-path">設置 → 作文評分展示</p>
          <ul>
            <li>配置學生端、教師端的展示內容。</li>
            <li>等級未配置時，點擊「等級」進入配置。</li>
            <li>等級選項最多 10 項，支援新增、排序、修改、刪除。</li>
          </ul>
        </article>
        <article class="prd-feature-card">
          <h3>後台／老師端</h3>
          <p class="prd-path">任務管理 → 成績概覽 → 學生答題情況 → 查看詳情 → 作文報告</p>
          <ul>
            <li>查看班級成績、排名、品第分布及維度分析。</li>
            <li>支援評分展示設定、評語修改與保存。</li>
          </ul>
        </article>
        <article class="prd-feature-card">
          <h3>網頁-學生端</h3>
          <p class="prd-path">作文報告</p>
          <ul>
            <li>只讀展示已保存的評分與報告內容。</li>
            <li>後台保存後同步更新。</li>
          </ul>
        </article>
      </div>
    </section>

    <section class="prd-section">
      <h2>功能需求與驗收</h2>
      <div class="prd-table-wrap">
        <table class="prd-requirements">
          <thead>
            <tr>
              <th>編號／功能</th>
              <th>需求說明</th>
              <th>狀態</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SR-01<br>展示項目</td>
              <td><ul><li>學生端可選擇百分制分數、品第、等級。</li><li>教師端固定展示百分制分數與品第，可選擇是否展示等級。</li><li>至少保留一項學生端展示內容。</li></ul></td>
              <td>待驗收</td>
            </tr>
            <tr>
              <td>SR-02<br>配置入口</td>
              <td><ul><li>未完成等級配置時，點擊「等級」不直接勾選。</li><li>彈窗提示「請先完成等級配置，再選擇顯示等級」。</li><li>點擊「去配置」進入等級配置頁並開啟「等級選項」。</li></ul></td>
              <td>待驗收</td>
            </tr>
            <tr>
              <td>SR-03<br>等級選項</td>
              <td><ul><li>使用抽屜新增及編輯等級名稱；首次開啟預設 5 個空輸入項。</li><li>最多設定 10 個選項，支援上移、下移、刪除。</li><li>名稱不可重複；名稱為空或重複時不可保存。</li></ul></td>
              <td>待驗收</td>
            </tr>
            <tr>
              <td>SR-04<br>換算配置</td>
              <td><ul><li>可選擇按綜合品第或按百分制總分配置。</li><li>目前選用的換算方式，所有對應項目均需完成選擇。</li><li>順序不符合等級規則時，在對應行提示並阻止保存。</li></ul></td>
              <td>待驗收</td>
            </tr>
            <tr>
              <td>SR-05<br>保存校驗</td>
              <td><ul><li>配置不完整時不可保存，頁面底部顯示具體提示。</li><li>配置完成後點擊「保存」，才更新展示設定。</li><li>保存失敗時保留當前編輯內容。</li></ul></td>
              <td>待驗收</td>
            </tr>
            <tr>
              <td>SR-06<br>展示聯動</td>
              <td><ul><li>學生端與教師端依各自設定展示內容。</li><li>後台保存後，學生端只讀報告同步使用已保存設定。</li><li>未保存修改不影響已保存的報告內容。</li></ul></td>
              <td>待驗收</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="prd-section">
      <h2>驗收重點</h2>
      <ol class="prd-rules">
        <li>從評分展示頁點擊「等級」時，按配置狀態進入提示或配置流程。</li>
        <li>等級選項新增、修改、排序、刪除後，對應換算項可以正確重新選擇。</li>
        <li>換算方式切換後，只校驗當前選中的配置方式。</li>
        <li>配置未完成時不能保存；保存完成後，師生端展示內容與設定一致。</li>
      </ol>
    </section>
  </main>
</template>
