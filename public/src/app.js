alert("app.js が読み込まれました");

// ===== DB 初期化 =====

let db;

const request = indexedDB.open("liveDiaryDB", 1);

request.onupgradeneeded = (event) => {
  db = event.target.result;

  // アーティストストア
  if (!db.objectStoreNames.contains("artists")) {
    db.createObjectStore("artists", {
      keyPath: "id",
      autoIncrement: true
    });
  }

  // ライブストア
  if (!db.objectStoreNames.contains("lives")) {
    const store = db.createObjectStore("lives", {
      keyPath: "id",
      autoIncrement: true
    });
    store.createIndex("artist", "artist", { unique: false });
    store.createIndex("date", "date", { unique: false });
  }
};

request.onsuccess = (event) => {
  db = event.target.result;
  renderHistory();
};

request.onerror = () => {
  alert("DBの初期化に失敗しました");
};

// ===== 登録処理 =====

document.getElementById("saveBtn").addEventListener("click", saveLive);

function saveLive() {
  const artist = document.getElementById("artist").value.trim();
  const date = document.getElementById("date").value;
  const venue = document.getElementById("venue").value.trim();

  if (!artist || !date || !venue) {
    alert("すべて入力してください");
    return;
  }

  const tx = db.transaction(["artists", "lives"], "readwrite");

  const artistStore = tx.objectStore("artists");
  const liveStore = tx.objectStore("lives");

  // まずアーティストを保存（重複は気にしない簡易版）
  artistStore.add({ name: artist });

  // ライブを保存
  liveStore.add({
    artist,
    date,
    venue,
    createdAt: new Date().toISOString()
  });

  tx.oncomplete = () => {
    document.getElementById("artist").value = "";
    document.getElementById("date").value = "";
    document.getElementById("venue").value = "";
    renderHistory();
  };

  tx.onerror = () => {
    alert("保存に失敗しました");
  };
}

// ===== 履歴表示 =====

function renderHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  const tx = db.transaction("lives", "readonly");
  const store = tx.objectStore("lives");

  const request = store.openCursor();

  request.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const li = document.createElement("li");
      const item = cursor.value;

      li.textContent = `${item.date} / ${item.artist} / ${item.venue}`;

      list.appendChild(li);
      cursor.continue();
    }
  };
}
