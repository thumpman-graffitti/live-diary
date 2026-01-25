const saveBtn = document.getElementById("saveBtn");
const historyList = document.getElementById("historyList");

saveBtn.addEventListener("click", () => {
  const artist = document.getElementById("artist").value;
  const date = document.getElementById("date").value;
  const venue = document.getElementById("venue").value;

  if (!artist || !date || !venue) {
    alert("すべて入力してください");
    return;
  }

  const li = document.createElement("li");
  li.textContent = `${date} / ${artist} / ${venue}`;
  historyList.appendChild(li);

  // 入力クリア
  document.getElementById("artist").value = "";
  document.getElementById("date").value = "";
  document.getElementById("venue").value = "";
});