document.addEventListener("DOMContentLoaded", () => {

// ===== 詳細モーダル処理 =====

const modal = document.getElementById("detailModal");
modal.classList.add("hidden");

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

// ===== アーティスト追加（登録タブ用） =====
const addArtistBtn = document.getElementById("addArtistBtn");

if (addArtistBtn) {
  addArtistBtn.addEventListener("click", () => {
    const input = document.getElementById("newArtistName");
    const name = input.value.trim();

    if (!name) {
      alert("アーティスト名を入力してください");
      return;
    }

    const tx = db.transaction("artists", "readwrite");
    const store = tx.objectStore("artists");

    store.add({ name });

    tx.oncomplete = () => {
      input.value = "";
      loadArtistsToSelect(); // 登録タブ更新
      alert("アーティストを追加しました");
    };

    tx.onerror = () => {
      alert("追加に失敗しました");
    };
  });
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

  const input = document.createElement("input");
  input.type = "text";
  input.value = artist.name;

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "保存";
  saveBtn.style.marginLeft = "6px";

  saveBtn.addEventListener("click", () => {
    const newName = input.value.trim();
    if (!newName) {
      alert("名前は空にできません");
      return;
    }

    const tx = db.transaction("artists", "readwrite");
    const store = tx.objectStore("artists");

    store.put({
      id: artist.id,
      name: newName
    });

tx.oncomplete = () => {

  // ===== ライブ履歴側の artistName も更新 =====
  const tx2 = db.transaction("lives", "readwrite");
  const liveStore = tx2.objectStore("lives");
  const index = liveStore.index("artistId");

  const req2 = index.getAll(artist.id);

  req2.onsuccess = () => {
    req2.result.forEach(live => {
      live.artistName = newName;
      liveStore.put(live);
    });
  };

  // =========================================

  loadArtistsToSelect(); // 登録タブにも反映
  renderHistory();       // 履歴の表示名も更新
  alert("更新しました");
};
});

  const delBtn = document.createElement("button");
  delBtn.textContent = "削除";
  delBtn.style.marginLeft = "6px";

  delBtn.addEventListener("click", () => {
    // 使用中チェック
    const txCheck = db.transaction("lives", "readonly");
    const liveStore = txCheck.objectStore("lives");
    const index = liveStore.index("artistId");

    const req = index.get(artist.id);

    req.onsuccess = () => {
      if (req.result) {
        alert("このアーティストはライブ履歴で使用中のため削除できません");
        return;
      }

      if (!confirm(`${artist.name} を削除しますか？`)) return;

      const txDel = db.transaction("artists", "readwrite");
      txDel.objectStore("artists").delete(artist.id);

      txDel.oncomplete = () => {
        renderArtistList();
        loadArtistsToSelect();
      };
    };
  });

  li.appendChild(input);
  li.appendChild(saveBtn);
  li.appendChild(delBtn);
  ul.appendChild(li);
});
});


// ===== 画面切り替え（URLハッシュ方式） =====
function showByHash() {

  // ★ 追加：初回起動時は必ず register にする
  if (!location.hash) {
    location.hash = "#register";
    return;
  }

  const hash = location.hash;

  ["register", "history", "artists"].forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;

    section.style.display =
      hash === "#" + id ? "block" : "none";
  });

  if (modal) {
    modal.classList.add("hidden");
  }
}


// 初期表示 & 切り替え監視
window.addEventListener("hashchange", showByHash);
showByHash();

});