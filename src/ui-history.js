function loadHistory() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  const tx = db.transaction("lives", "readonly");
  const store = tx.objectStore("lives");

  store.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;

    if (cursor) {
      const li = document.createElement("li");
      const v = cursor.value;

      li.textContent = `${v.date} / ${v.artist} / ${v.title} @ ${v.venue}`;

      list.appendChild(li);
      cursor.continue();
    }
  };
}