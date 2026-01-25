window.addEventListener("DOMContentLoaded", async () => {
  try {
    await openDB();
    initRegisterUI();
    loadHistory();
  } catch (e) {
    alert("DBの初期化に失敗しました");
    console.error(e);
  }
});
