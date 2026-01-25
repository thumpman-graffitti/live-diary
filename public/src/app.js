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
  const artistName = document.getElementById("artist").value.trim();
  const date = document.getElementById("date").value;
  const venue = document.getElementById("venue").value.trim();

  if (!artistName || !date || !venue) {
    alert("すべて入力してください");
    return;
  }

  const tx = db.transaction(["artists", "lives"], "readwrite");
  const artistStore = tx.objectStore("artists");
  const liveStore = tx.objectStore("lives");

  // まず artists から同名を探す
  const getAllReq = artistStore.getAll();

  getAllReq.onsuccess = () => {
    const artists = getAllReq.result;
    let artist = artists.find(a => a.name === artistName);

    if (!artist) {
      // なければ新規作成
      const addReq = artistStore.add({ name: artistName });
      addReq.onsuccess = (e) => {
        const artistId = e.target.result;
        addLive(artistId, artistName);
      };
    } else {
      addLive(artist.id, artist.name);
    }
  };

  function addLive(artistId, artistName) {
    liveStore.add({
      artistId,
      artistName,
      date,
      venue,
      memo: "",
      createdAt: new Date().toISOString()
    });
  }

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

  // createdAt の新しい順に表示したいので、全部取ってから並び替え
  const req = store.getAll();

  req.onsuccess = () => {
    const items = req.result;

    // 新しい順に並び替え
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    items.forEach(item => {
      const li = document.createElement("li");
      li.className = "history-item";

      const dateDiv = document.createElement("div");
      dateDiv.className = "history-date";
      dateDiv.textContent = item.date;

      const artistDiv = document.createElement("div");
      artistDiv.className = "history-artist";
      artistDiv.textContent = item.artistName;

      const venueDiv = document.createElement("div");
      venueDiv.className = "history-venue";
      venueDiv.textContent = item.venue;

      li.appendChild(dateDiv);
      li.appendChild(artistDiv);
      li.appendChild(venueDiv);

      list.appendChild(li);
    });
  };
}

document.getElementById("showRegister").onclick = () => {
  document.getElementById("register").style.display = "block";
  document.getElementById("history").style.display = "none";
};

document.getElementById("showHistory").onclick = () => {
  document.getElementById("register").style.display = "none";
  document.getElementById("history").style.display = "block";
};

