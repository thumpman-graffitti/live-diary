function initRegisterUI() {
  const saveBtn = document.getElementById("saveBtn");

  saveBtn.addEventListener("click", async () => {
    const artist = document.getElementById("artist").value.trim();
    const title  = document.getElementById("title").value.trim();
    const venue  = document.getElementById("venue").value.trim();
    const date   = document.getElementById("date").value;

    if (!artist || !title || !venue || !date) {
      alert("すべて入力してください");
      return;
    }

    const tx = db.transaction("lives", "readwrite");
    const store = tx.objectStore("lives");

    store.add({
      artist,
      title,
      venue,
      date,
      createdAt: Date.now()
    });

    tx.oncomplete = () => {
      clearRegisterForm();
      loadHistory();
    };
  });
}

function clearRegisterForm() {
  document.getElementById("artist").value = "";
  document.getElementById("title").value = "";
  document.getElementById("venue").value = "";
  document.getElementById("date").value = "";
}