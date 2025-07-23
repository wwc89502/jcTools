import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';

interface PageParams {
  keyword?: string;
  current?: number;
  size?: number;
}
class CurdDBService {
  private dbPromise: Promise<IDBPDatabase<any>>
  private storeName: string;

  constructor(storeName: string, dbName?: string) {
    this.storeName = storeName
    dbName = dbName || `${storeName}-db`;
    this.dbPromise = openDB(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }

  async init(list) {
    const db = await this.dbPromise;
    const data = await db.getAll(this.storeName);
    // const data = []
    if (data.length === 0) {
      for (const item of list) {
        await db.add(this.storeName, item);
      }
    }
    return true;
  }

  async add(data) {
    const db = await this.dbPromise;
    await db.add(this.storeName, { ...data });
    return data.id;
  }

  async detail(id) {
    const db = await this.dbPromise;
    return await db.get(this.storeName, id);
  }

  async update(data) {
    const db = await this.dbPromise;
    await db.put(this.storeName, { ...data });
    return true;
  }

  async del(id) {
    const db = await this.dbPromise;
    await db.delete(this.storeName, id);
    return true;
  }

  async getList() {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);

    return await store.getAll();
  }

  async getPage(params: PageParams = {}) {
    params.size = params.size || 10
    params.current = params.current || 1
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const allList = await store.getAll();

    // 模糊查询
    const filteredList = allList.filter(item =>
      item.name.toLowerCase().includes(params.keyword?.toLowerCase())
    );

    const total = filteredList.length;
    const pageCount = Math.ceil(total / params.size);

    // 分页
    const paginatedList = filteredList.slice(
      (params.current - 1) * params.size,
      params.current * params.size
    );

    return {
      total,
      list: paginatedList,
      pageCount,
      current: params.current,
      size: params.size,
    };
  }
}

export default CurdDBService
