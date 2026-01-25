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
  const memo = document.getElementById("memo").value.trim();

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
      memo: memo,
      createdAt: new Date().toISOString()
    });
  }

  tx.oncomplete = () => {
    document.getElementById("artist").value = "";
    document.getElementById("date").value = "";
    document.getElementById("venue").value = "";
    document.getElementById("memo").value = "";
    renderHistory();
  };

  tx.onerror = () => {
    alert("保存に失敗しました");
  };
}

// ===== 履歴表示（アーティスト別グループ） =====
function renderHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  const tx = db.transaction("lives", "readonly");
  const store = tx.objectStore("lives");

  const req = store.getAll();

  req.onsuccess = () => {
    const items = req.result;

    // ① 新しい順に並び替え
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // ② artistId ごとにグループ化
    const groups = {};

    items.forEach(item => {
      if (!groups[item.artistId]) {
        groups[item.artistId] = {
          artistName: item.artistName,
          lives: []
        };
      }
      groups[item.artistId].lives.push(item);
    });

    // ③ グループごとに描画
    Object.values(groups).forEach(group => {
      const wrapper = document.createElement("div");
      wrapper.className = "artist-group";

      const header = document.createElement("div");
      header.className = "artist-header";
      header.textContent = `${group.artistName} (${group.lives.length})`;

      const ul = document.createElement("ul");
      ul.style.display = "none"; // 最初は閉じる

      group.lives.forEach(item => {
        const li = document.createElement("li");
        li.className = "history-item";

        const dateDiv = document.createElement("div");
        dateDiv.className = "history-date";
        dateDiv.textContent = item.date;

        const venueDiv = document.createElement("div");
        venueDiv.className = "history-venue";
        venueDiv.textContent = item.venue;

        li.appendChild(dateDiv);
        li.appendChild(venueDiv);

        ul.appendChild(li);
      });

      // ④ 開閉処理
      header.addEventListener("click", () => {
        const isOpen = ul.style.display === "block";
        ul.style.display = isOpen ? "none" : "block";
      });

      wrapper.appendChild(header);
      wrapper.appendChild(ul);
      list.appendChild(wrapper);
    });
  };
}

// ===== タブ切り替え処理 =====

const showRegisterBtn = document.getElementById("showRegister");
const showHistoryBtn = document.getElementById("showHistory");

const registerSection = document.getElementById("register");
const historySection = document.getElementById("history");

// 初期状態：登録だけ表示
registerSection.style.display = "block";
historySection.style.display = "none";
showRegisterBtn.classList.add("active");

showRegisterBtn.addEventListener("click", () => {
  registerSection.style.display = "block";
  historySection.style.display = "none";

  showRegisterBtn.classList.add("active");
  showHistoryBtn.classList.remove("active");
});

showHistoryBtn.addEventListener("click", () => {
  registerSection.style.display = "none";
  historySection.style.display = "block";

  showHistoryBtn.classList.add("active");
  showRegisterBtn.classList.remove("active");
});
