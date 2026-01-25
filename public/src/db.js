let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("liveDiaryDB", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("artists")) {
        db.createObjectStore("artists", {
          keyPath: "id",
          autoIncrement: true
        });
      }

      if (!db.objectStoreNames.contains("lives")) {
        db.createObjectStore("lives", {
          keyPath: "id",
          autoIncrement: true
        });
      }

      if (!db.objectStoreNames.contains("setlists")) {
        db.createObjectStore("setlists", {
          keyPath: "id",
          autoIncrement: true
        });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = () => {
      reject("DB open failed");
    };
  });
}
