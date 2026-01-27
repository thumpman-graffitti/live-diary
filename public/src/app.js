document.addEventListener("DOMContentLoaded", () => {

// ===== 詳細モーダル処理 =====

const modal = document.getElementById("detailModal");

let currentEditingId = null;

const closeBtn = document.getElementById("closeDetailBtn");
const saveDetailBtn = document.getElementById("saveDetailBtn");
const deleteDetailBtn = document.getElementById("deleteDetailBtn");

const viewArea = document.getElementById("viewArea");
const editArea = document.getElementById("editArea");
const editBtn = document.getElementById("editBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");




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
    store.createIndex("artistId", "artistId", { unique: false });
    store.createIndex("date", "date", { unique: false });
  }
};

request.onsuccess = (event) => {
  db = event.target.result;
  loadArtistsToSelect();
  renderHistory();
  
  // ★ 追加：起動時は必ずモーダルを閉じる
  modal.classList.add("hidden");
  
};

request.onerror = () => {
  alert("DBの初期化に失敗しました");
};

// ===== 登録処理 =====
document.getElementById("saveBtn").addEventListener("click", saveLive);

function saveLive() {
  const artistSelect = document.getElementById("artistSelect");
  const artistId = Number(artistSelect.value);
  const artistName = artistSelect.options[artistSelect.selectedIndex].text;

  const date = document.getElementById("date").value;
  const tourTitle = document.getElementById("tourTitle").value.trim();
  const venue = document.getElementById("venue").value.trim();
  const memo = document.getElementById("memo").value.trim();
  const setlistText = document.getElementById("setlist").value;

  if (!artistId || !date || !venue || !tourTitle) {
    alert("すべて入力してください");
    return;
  }

  const setlist = setlistText
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s !== "");

  const tx = db.transaction("lives", "readwrite");
  const liveStore = tx.objectStore("lives");

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

  tx.oncomplete = () => {
    document.getElementById("artistSelect").value = "";
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
        
        
        li.addEventListener("click", (e) => {
        e.stopPropagation();//★これが重要
        console.log("クリックされたライブ:",item);
        openDetailModal(item);
　　　　　});
        

const dateDiv = document.createElement("div");
dateDiv.className = "history-date";
dateDiv.textContent = item.date;

const tourDiv = document.createElement("div");          // ★追加
tourDiv.className = "history-tour";
tourDiv.textContent = item.tourTitle || "";

const venueDiv = document.createElement("div");
venueDiv.className = "history-venue";
venueDiv.textContent = item.venue;

li.appendChild(dateDiv);
li.appendChild(tourDiv);    // ★追加
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
const showArtistsBtn = document.getElementById("showArtists");

const registerSection = document.getElementById("register");
const historySection = document.getElementById("history");
const artistsSection = document.getElementById("artists");

function resetTabs() {
  // active を全部外す
  showRegisterBtn.classList.remove("active");
  showHistoryBtn.classList.remove("active");
  showArtistsBtn.classList.remove("active");

  // section を全部隠す
  registerSection.style.display = "none";
  historySection.style.display = "none";
  artistsSection.style.display = "none";
}

// 初期状態：登録だけ表示
resetTabs();
registerSection.style.display = "block";
showRegisterBtn.classList.add("active");

showRegisterBtn.addEventListener("click", () => {
  resetTabs();
  registerSection.style.display = "block";
  showRegisterBtn.classList.add("active");
  modal.classList.add("hidden");
});



showHistoryBtn.addEventListener("click", () => {
  resetTabs();
  historySection.style.display = "block";
  showHistoryBtn.classList.add("active");
  modal.classList.add("hidden");
});

showArtistsBtn.addEventListener("click", () => {
  resetTabs();
  artistsSection.style.display = "block";
  showArtistsBtn.classList.add("active");
  modal.classList.add("hidden");
});



function openDetailModal(item) {
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

  // メモ（参照用）
  document.getElementById("detailMemoView").textContent = item.memo || "";

  // 編集用にも値をセット（まだ表示しない）
  document.getElementById("detailMemo").value = item.memo || "";
  document.getElementById("detailSetlist").value = Array.isArray(item.setlist)
    ? item.setlist.join("\n")
    : "";

  // ★ 初期は参照モード
  viewArea.style.display = "block";
  editArea.style.display = "none";


  modal.classList.remove("hidden");
}


// 閉じる
closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  currentEditingId = null;
});

// 編集
editBtn.addEventListener("click", () => {
  viewArea.style.display = "none";
  editArea.style.display = "block";
});

// キャンセル
cancelEditBtn.addEventListener("click", () => {
  
  if (!confirm("編集内容を破棄しますか？")) return;
  
  editArea.style.display = "none";
  viewArea.style.display = "block";
});


// 保存
saveDetailBtn.addEventListener("click", () => {
  const newMemo = document.getElementById("detailMemo").value;
  const setlistText = document.getElementById("detailSetlist").value;

  const newSetlist = setlistText
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s !== "");

  const tx = db.transaction("lives", "readwrite");
  const store = tx.objectStore("lives");

  const getReq = store.get(currentEditingId);

  getReq.onsuccess = () => {
    const item = getReq.result;
    item.memo = newMemo;
    item.setlist = newSetlist;   // ★ここが追加
    store.put(item);
  };

tx.oncomplete = () => {
  editArea.style.display = "none";
  viewArea.style.display = "block";
  currentEditingId = null;
  modal.classList.add("hidden");
  renderHistory();
};

  tx.onerror = () => {
    alert("更新に失敗しました");
  };
});

// 削除
if (deleteDetailBtn) {
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
} else {
  console.log("deleteDetailBtn が見つかりません");
  
}

function loadArtistsToSelect() {
  const select = document.getElementById("artistSelect");
  if (!select) return;

  select.innerHTML = '<option value="">アーティストを選択</option>';

  const tx = db.transaction("artists", "readonly");
  const store = tx.objectStore("artists");
  const req = store.getAll();

  req.onsuccess = () => {
    const artists = req.result;

    artists.forEach(artist => {
      const option = document.createElement("option");
      option.value = artist.id;
      option.textContent = artist.name;
      select.appendChild(option);
    });
  };
}

function renderArtistList() {
  const ul = document.getElementById("artistList");
  ul.innerHTML = "";

  const tx = db.transaction("artists", "readonly");
  const store = tx.objectStore("artists");
  const req = store.getAll();

  req.onsuccess = () => {
    const artists = req.result;

    artists.forEach(artist => {
      const li = document.createElement("li");
      li.textContent = artist.name + " ";

      const delBtn = document.createElement("button");
      delBtn.textContent = "削除";
      delBtn.style.marginLeft = "10px";

      delBtn.addEventListener("click", () => {
        if (!confirm(`${artist.name} を削除しますか？`)) return;

        const tx2 = db.transaction("artists", "readwrite");
        const store2 = tx2.objectStore("artists");

        store2.delete(artist.id);

        tx2.oncomplete = () => {
          renderArtistList();
          loadArtistsToSelect(); // プルダウンも更新
        };
      });

      li.appendChild(delBtn);
      ul.appendChild(li);
    });
  };
}


});