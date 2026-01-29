function showPage(pageId) {
    // 全ページの非表示
    document.querySelectorAll('.tab-content').forEach(p => p.classList.remove('active'));
    // 全タブの色を戻す
    document.querySelectorAll('.tab-bar button').forEach(b => b.classList.remove('active'));
    
    // 対象ページとタブをアクティブにする
    document.getElementById('page-' + pageId).classList.add('active');
    document.getElementById('tab-' + pageId).classList.add('active');
    
    // タイトルの更新
    const titles = {home: '🏠 ホーム', history: '📜 参戦履歴', stats: '📊 統計', settings: '⚙️ 管理'};
    document.getElementById('view-title').innerText = titles[pageId];
    
    if(pageId === 'history') renderHistory();
}
