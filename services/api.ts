
import { PersonnelRecord } from '../types.ts';

// آدرس بک‌اند شما (زمانی که سرور Node.js یا .NET را راه اندازی کردید)
// const API_BASE_URL = 'http://localhost:5000/api'; 

export const api = {
  // دریافت لیست رکوردها
  getAllRecords: async (): Promise<PersonnelRecord[]> => {
    // --- کدهای اتصال به SQL Server (سمت سرور) ---
    /*
    try {
      const response = await fetch(`${API_BASE_URL}/records`);
      if (!response.ok) throw new Error('خطا در دریافت اطلاعات');
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
    */
    // ------------------------------------------

    // شبیه‌سازی تاخیر شبکه و استفاده از LocalStorage فعلاً
    return new Promise((resolve) => {
      setTimeout(() => {
        const saved = localStorage.getItem('factory_logs');
        resolve(saved ? JSON.parse(saved) : []);
      }, 800); // 800 میلی ثانیه تاخیر مصنوعی
    });
  },

  // ذخیره یا آپدیت رکورد
  saveRecord: async (record: PersonnelRecord): Promise<void> => {
    // --- کدهای اتصال به SQL Server ---
    /*
    try {
      const response = await fetch(`${API_BASE_URL}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (!response.ok) throw new Error('خطا در ذخیره سازی');
    } catch (error) {
      console.error(error);
      throw error;
    }
    */
    // --------------------------------

    // شبیه‌سازی
    return new Promise((resolve) => {
      setTimeout(() => {
        const saved = localStorage.getItem('factory_logs');
        const records: PersonnelRecord[] = saved ? JSON.parse(saved) : [];
        const existingIndex = records.findIndex(r => r.id === record.id);
        
        if (existingIndex > -1) {
          records[existingIndex] = record;
        } else {
          records.push(record);
        }
        
        localStorage.setItem('factory_logs', JSON.stringify(records));
        resolve();
      }, 1000);
    });
  },

  // حذف رکورد
  deleteRecord: async (id: string): Promise<void> => {
    // --- کدهای اتصال به SQL Server ---
    /*
    try {
      const response = await fetch(`${API_BASE_URL}/records/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('خطا در حذف رکورد');
    } catch (error) {
      console.error(error);
      throw error;
    }
    */
    // --------------------------------

    // شبیه‌سازی
    return new Promise((resolve) => {
      setTimeout(() => {
        const saved = localStorage.getItem('factory_logs');
        if (saved) {
          const records: PersonnelRecord[] = JSON.parse(saved);
          const newRecords = records.filter(r => r.id !== id);
          localStorage.setItem('factory_logs', JSON.stringify(newRecords));
        }
        resolve();
      }, 600);
    });
  }
};
