// =========================
// app.js
// =========================

document.addEventListener("DOMContentLoaded", () => {

  // ===== DOM 要素取得 =====
  const modal = document.getElementById("detailModal");
  const showRegisterBtn = document.getElementById("showRegister");
  const showHistoryBtn = document.getElementById("showHistory");
  const registerSection = document.getElementById("register");
  const historySection = document.getElementById("history");

  const saveBtn = document.getElementById("saveBtn");

  const closeBtn = document.getElementById("closeDetailBtn");
  const saveDetailBtn = document.getElementById("saveDetailBtn");
  const deleteDetailBtn = document.getElementById("deleteDetailBtn");
  const viewArea = document.getElementById("viewArea");
  const editArea = document.getElementById("editArea");
  const editBtn = document.getElementById("editBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  let currentEditingId = null;
  let db;

  // 初期状態
  registerSection.style.display = "block";
  historySection.style.display = "none";
  showRegisterBtn.classList.add("active");
  modal.classList.add("hidden");

  // =========================
  // タブ切替
  // =========================
  showRegisterBtn.addEventListener("click", () => {
    registerSection.style.display = "block";
    historySection.style.display = "none";
    showRegisterBtn.classList.add("active");
    showHistoryBtn.classList.remove("active");
    modal.classList.add("hidden");
  });

  showHistoryBtn.addEventListener("click", () => {
    registerSection.style.display = "none";
    historySection.style.display = "block";
    showHistoryBtn.classList.add("active");
    showRegisterBtn.classList.remove("active");
    modal.classList.add("hidden");
  });

  // =========================
  // DB 初期化
  // =========================
  const request = indexedDB.open("liveDiaryDB", 1);

  request.onupgradeneeded = (event) => {
    db = event.target.result;

    if (!db.objectStoreNames.contains("artists")) {
      db.createObjectStore("artists", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("lives")) {
      const store = db.createObjectStore("lives", { keyPath: "id", autoIncrement: true });
      store.createIndex("artistId", "artistId", { unique: false });
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

  // =========================
  // 登録処理
  // =========================
  saveBtn.addEventListener("click", saveLive);

  function saveLive() {
    const artistName = document.getElementById("artist").value.trim();
    const date = document.getElementById("date").value;
    const tourTitle = document.getElementById("tourTitle").value.trim();
    const venue = document.getElementById("venue").value.trim();
    const memo = document.getElementById("memo").value.trim();
    const setlistText = document.getElementById("setlist").value;

    if (!artistName || !date || !venue || !tourTitle) {
      alert("すべて入力してください");
      return;
    }

    const setlist = setlistText
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(s => s !== "");

    const tx = db.transaction(["artists", "lives"], "readwrite");
    const artistStore = tx.objectStore("artists");
    const liveStore = tx.objectStore("lives");

    artistStore.getAll().onsuccess = (e) => {
      const artists = e.target.result;
      let artist = artists.find(a => a.name === artistName);

      if (!artist) {
        artistStore.add({ name: artistName }).onsuccess = (e) => {
          addLive(e.target.result);
        };
      } else {
        addLive(artist.id);
      }

      function addLive(artistId) {
        liveStore.add({
          artistId,
          artistName,
          tourTitle,
          date,
          venue,
          memo,
          setlist,
          createdAt: new Date().toISOString()
        });
      }
    };

    tx.oncomplete = () => {
      document.getElementById("artist").value = "";
      document.getElementById("date").value = "";
      document.getElementById("tourTitle").value = "";
      document.getElementById("venue").value = "";
      document.getElementById("memo").value = "";
      document.getElementById("setlist").value = "";
      renderHistory();
    };

    tx.onerror = () => {
      alert("保存に失敗しました");
    };
  }

  // =========================
  // 履歴表示
  // =========================
  function renderHistory() {
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    const tx = db.transaction("lives", "readonly");
    const store = tx.objectStore("lives");

    store.getAll().onsuccess = (e) => {
      const items = e.target.result;

      // 新しい順に並び替え
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // artistIdごとにグループ化
      const groups = {};
      items.forEach(item => {
        if (!groups[item.artistId]) groups[item.artistId] = { artistName: item.artistName, lives: [] };
        groups[item.artistId].lives.push(item);
      });

      Object.values(groups).forEach(group => {
        const wrapper = document.createElement("div");
        wrapper.className = "artist-group";

        const header = document.createElement("div");
        header.className = "artist-header";
        header.textContent = `${group.artistName} (${group.lives.length})`;

        const ul = document.createElement("ul");
        ul.style.display = "none";

        group.lives.forEach(item => {
          const li = document.createElement("li");
          li.className = "history-item";

          li.addEventListener("click", (ev) => {
            ev.stopPropagation();
            openDetailModal(item);
          });

          const dateDiv = document.createElement("div");
          dateDiv.className = "history-date";
          dateDiv.textContent = item.date;

          const tourDiv = document.createElement("div");
          tourDiv.className = "history-tour";
          tourDiv.textContent = item.tourTitle || "";

          const venueDiv = document.createElement("div");
          venueDiv.className = "history-venue";
          venueDiv.textContent = item.venue;

          li.appendChild(dateDiv);
          li.appendChild(tourDiv);
          li.appendChild(venueDiv);
          ul.appendChild(li);
        });

        header.addEventListener("click", () => {
          ul.style.display = ul.style.display === "block" ? "none" : "block";
        });

        wrapper.appendChild(header);
        wrapper.appendChild(ul);
        list.appendChild(wrapper);
      });
    };
  }


// =========================
// 詳細モーダル処理
// =========================

function openDetailModal(item) {
  // 登録タブ表示中なら開かない
  if (registerSection.style.display === "block") return;

  currentEditingId = item.id;

  // 参照表示
  document.getElementById("detailDate").textContent = item.date;
  document.getElementById("detailArtist").textContent = item.artistName;
  document.getElementById("detailVenue").textContent = item.venue;
  document.getElementById("detailTour").textContent = item.tourTitle || "";

  const setlistView = document.getElementById("detailSetlistView");
  const songCountDiv = document.getElementById("detailSongCount");

  if (Array.isArray(item.setlist)) {
    const songs = item.setlist;
    songCountDiv.textContent = songs.length + " 曲";
    setlistView.innerHTML = "";
    songs.forEach((song, index) => {
      const div = document.createElement("div");
      div.textContent = `${index + 1}. ${song}`;
      setlistView.appendChild(div);
    });
  } else {
    songCountDiv.textContent = "0 曲";
    setlistView.textContent = "（未登録）";
  }

  document.getElementById("detailMemoView").textContent = item.memo || "";
  document.getElementById("detailMemo").value = item.memo || "";
  document.getElementById("detailSetlist").value = Array.isArray(item.setlist) ? item.setlist.join("\n") : "";

  viewArea.style.display = "block";
  editArea.style.display = "none";
  modal.classList.remove("hidden");
}

// --- 閉じる ---
closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  currentEditingId = null;
});

// --- 編集 ---
editBtn.addEventListener("click", () => {
  viewArea.style.display = "none";
  editArea.style.display = "block";
});

// --- キャンセル ---
cancelEditBtn.addEventListener("click", () => {
  if (!confirm("編集内容を破棄しますか？")) return;
  editArea.style.display = "none";
  viewArea.style.display = "block";
});

// --- 保存 ---
saveDetailBtn.addEventListener("click", () => {
  if (!currentEditingId) return;

  const newMemo = document.getElementById("detailMemo").value;
  const setlistText = document.getElementById("detailSetlist").value;
  const newSetlist = setlistText.split(/\r?\n/).map(s => s.trim()).filter(s => s !== "");

  const tx = db.transaction("lives", "readwrite");
  const store = tx.objectStore("lives");

  store.get(currentEditingId).onsuccess = (e) => {
    const item = e.target.result;
    item.memo = newMemo;
    item.setlist = newSetlist;
    store.put(item);
  };

  tx.oncomplete = () => {
    editArea.style.display = "none";
    viewArea.style.display = "block";
    modal.classList.add("hidden");
    currentEditingId = null;
    renderHistory();
  };

  tx.onerror = () => {
    alert("更新に失敗しました");
  };
});

// --- 削除 ---
deleteDetailBtn.addEventListener("click", () => {
  if (!currentEditingId) return;
  if (!confirm("このライブを削除しますか？")) return;

  const tx = db.transaction("lives", "readwrite");
  const store = tx.objectStore("lives");
  store.delete(currentEditingId);

  tx.oncomplete = () => {
    modal.classList.add("hidden");
    currentEditingId = null;
    renderHistory();
  };

  tx.onerror = () => {
    alert("削除に失敗しました");
  };
});

