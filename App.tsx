
import React, { useState, useEffect } from 'react';
import { PersonnelRecord, PersonnelStatus, WorkLog } from './types';
import { calculateDuration, generateId } from './utils/timeHelper';
import * as XLSX from 'https://esm.sh/xlsx';

// Helper to convert 24h to 12h Persian parts
const parse24to12 = (time24: string) => {
  if (!time24) return { h: 8, m: 0, p: 'قبل از ظهر' };
  let [h, m] = time24.split(':').map(Number);
  const p = h >= 12 ? 'بعد از ظهر' : 'قبل از ظهر';
  h = h % 12 || 12;
  return { h, m, p };
};

// Helper to convert 12h Persian parts back to 24h string
const format12to24 = (h: number, m: number, p: string) => {
  let h24 = h;
  if (p === 'بعد از ظهر' && h < 12) h24 += 12;
  if (p === 'قبل از ظهر' && h === 12) h24 = 0;
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

interface PersianTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

const PersianTimePicker: React.FC<PersianTimePickerProps> = ({ value, onChange, label }) => {
  const { h, m, p } = parse24to12(value);

  const update = (newH: number, newM: number, newP: string) => {
    onChange(format12to24(newH, newM, newP));
  };

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-bold text-gray-700">{label}</label>}
      <div className="flex items-center gap-1 bg-white border-2 border-gray-200 rounded-lg p-1 focus-within:border-blue-500 transition-all">
        <select 
          value={h} 
          onChange={(e) => update(Number(e.target.value), m, p)}
          className="bg-transparent outline-none text-center font-bold px-1 cursor-pointer"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
        <span className="font-bold">:</span>
        <select 
          value={m} 
          onChange={(e) => update(h, Number(e.target.value), p)}
          className="bg-transparent outline-none text-center font-bold px-1 cursor-pointer"
        >
          {Array.from({ length: 60 }, (_, i) => i).map(num => (
            <option key={num} value={num}>{String(num).padStart(2, '0')}</option>
          ))}
        </select>
        <div className="flex bg-gray-100 rounded-md p-0.5 mr-2">
          <button 
            type="button"
            onClick={() => update(h, m, 'قبل از ظهر')}
            className={`px-2 py-1 text-[10px] rounded ${p === 'قبل از ظهر' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-400'}`}
          >
            ق.ظ
          </button>
          <button 
            type="button"
            onClick={() => update(h, m, 'بعد از ظهر')}
            className={`px-2 py-1 text-[10px] rounded ${p === 'بعد از ظهر' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-400'}`}
          >
            ب.ظ
          </button>
        </div>
      </div>
    </div>
  );
};

const EmptyRecord = (): PersonnelRecord => ({
  id: generateId(),
  operatorCode: '',
  fullName: '',
  machineCode: '',
  status: PersonnelStatus.PRESENT,
  entryTime: '08:00',
  exitTime: '16:00',
  totalPresence: '08:00',
  workLogs: [
    { id: generateId(), productDescription: '', startTime: '08:00', endTime: '09:00' },
  ],
  createdAt: Date.now()
});

const App: React.FC = () => {
  const [records, setRecords] = useState<PersonnelRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRecord, setCurrentRecord] = useState<PersonnelRecord>(EmptyRecord());
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('factory_logs');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        setRecords(parsed);
        setCurrentRecord(parsed[0]);
      }
    }
  }, []);

  useEffect(() => {
    if (records.length > 0 && currentIndex < records.length) {
      setCurrentRecord(records[currentIndex]);
    }
  }, [currentIndex, records]);

  useEffect(() => {
    const duration = calculateDuration(currentRecord.entryTime, currentRecord.exitTime);
    if (duration !== currentRecord.totalPresence) {
      setCurrentRecord(prev => ({ ...prev, totalPresence: duration }));
    }
  }, [currentRecord.entryTime, currentRecord.exitTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentRecord(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleStatusChange = (status: PersonnelStatus) => {
    setCurrentRecord(prev => ({ ...prev, status }));
    setIsSaved(false);
  };

  const handleWorkLogChange = (id: string, field: keyof WorkLog, value: string) => {
    setCurrentRecord(prev => ({
      ...prev,
      workLogs: prev.workLogs.map(log => log.id === id ? { ...log, [field]: value } : log)
    }));
    setIsSaved(false);
  };

  const addRow = () => {
    setCurrentRecord(prev => ({
      ...prev,
      workLogs: [...prev.workLogs, { id: generateId(), productDescription: '', startTime: '', endTime: '' }]
    }));
  };

  const saveRecord = () => {
    const newRecords = [...records];
    const existingIndex = newRecords.findIndex(r => r.id === currentRecord.id);
    if (existingIndex > -1) newRecords[existingIndex] = currentRecord;
    else newRecords.push(currentRecord);
    setRecords(newRecords);
    localStorage.setItem('factory_logs', JSON.stringify(newRecords));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const deleteRecord = () => {
    const newRecords = records.filter(r => r.id !== currentRecord.id);
    setRecords(newRecords);
    localStorage.setItem('factory_logs', JSON.stringify(newRecords));
    if (newRecords.length > 0) {
      const nextIdx = Math.max(0, currentIndex - 1);
      setCurrentIndex(nextIdx);
      setCurrentRecord(newRecords[nextIdx]);
    } else {
      setCurrentRecord(EmptyRecord());
      setCurrentIndex(0);
    }
  };

  const goToNext = () => {
    if (currentIndex < records.length - 1) setCurrentIndex(prev => prev + 1);
    else {
      const fresh = EmptyRecord();
      setCurrentRecord(fresh);
      setCurrentIndex(records.length);
    }
  };

  const goToPrev = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };

  const exportToExcel = () => {
    if (records.length === 0 && !currentRecord.operatorCode) {
        alert('اطلاعاتی برای خروجی وجود ندارد.');
        return;
    }

    // Include the current (possibly unsaved) record in the export data if it has content
    const allData = [...records];
    const currentInRecords = allData.find(r => r.id === currentRecord.id);
    if (!currentInRecords && currentRecord.operatorCode) {
        allData.push(currentRecord);
    } else if (currentInRecords) {
        const idx = allData.indexOf(currentInRecords);
        allData[idx] = currentRecord;
    }

    const flatData = allData.flatMap(record => 
        record.workLogs.map(log => ({
            'کد اپراتور': record.operatorCode,
            'نام و نام خانوادگی': record.fullName,
            'کد دستگاه': record.machineCode,
            'وضعیت': record.status,
            'ساعت ورود': record.entryTime,
            'ساعت خروج': record.exitTime,
            'نام محصول': log.productDescription,
            'شروع کار': log.startTime,
            'پایان کار': log.endTime
        }))
    );

    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "گزارش کارکرد");
    
    // Fix for RTL in Excel
    if (!worksheet['!ref']) return;
    worksheet['!dir'] = 'rtl';

    XLSX.writeFile(workbook, `Factory_Report_${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.xlsx`);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex justify-center items-start">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-6 md:p-10 border-t-8 border-blue-600">
        <header className="mb-10 text-center border-b pb-6 relative">
          <div className="absolute left-0 top-0">
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="Vertical 12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2h-8a2 2 0 00-2 2v6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11h3m-3 4h3m-6-4h.01M9 15h.01M9 11h.01M12 15h.01" />
              </svg>
              خروجی اکسل
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">فرم گزارش روزانه کارکرد پرسنل</h1>
          <p className="text-gray-500">واحد کنترل تولید و برنامه‌ریزی</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-600">
             رکورد {currentIndex + 1} از {Math.max(records.length, currentIndex + 1)}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">کد اپراتور</label>
            <input name="operatorCode" value={currentRecord.operatorCode} onChange={handleInputChange} type="text" className="border-2 border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="مثلاً ۱۲۳" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">نام و نام خانوادگی</label>
            <input name="fullName" value={currentRecord.fullName} onChange={handleInputChange} type="text" className="border-2 border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="نام اپراتور" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">کد دستگاه</label>
            <input name="machineCode" value={currentRecord.machineCode} onChange={handleInputChange} type="text" className="border-2 border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="کد ماشین" />
          </div>
        </div>

        <div className="mb-8 p-4 bg-blue-50 rounded-xl flex flex-wrap items-center gap-6">
          <span className="font-bold text-blue-800">وضعیت حضور:</span>
          <div className="flex gap-4">
            {Object.values(PersonnelStatus).map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" checked={currentRecord.status === s} onChange={() => handleStatusChange(s)} className="w-5 h-5 text-blue-600 cursor-pointer" />
                <span className={`text-sm ${currentRecord.status === s ? 'font-bold text-blue-700' : 'text-gray-600'}`}>{s}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 items-end">
          <div className="md:col-span-1">
            <PersianTimePicker 
              label="ساعت حضور از:" 
              value={currentRecord.entryTime} 
              onChange={(val) => handleInputChange({ target: { name: 'entryTime', value: val } } as any)} 
            />
          </div>
          <div className="md:col-span-1">
            <PersianTimePicker 
              label="تا ساعت:" 
              value={currentRecord.exitTime} 
              onChange={(val) => handleInputChange({ target: { name: 'exitTime', value: val } } as any)} 
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-bold text-gray-700">میزان حضور (ساعت)</label>
            <div className="bg-gray-100 border-2 border-gray-200 rounded-lg py-2.5 text-center font-bold text-blue-700">
              {currentRecord.totalPresence}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="p-3 text-center w-16">ردیف</th>
                <th className="p-3 text-right">شرح محصول</th>
                <th className="p-3 text-center w-40">ساعت شروع</th>
                <th className="p-3 text-center w-40">ساعت پایان</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {currentRecord.workLogs.map((log, index) => (
                <tr key={log.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-center text-gray-500 font-medium">{index + 1}</td>
                  <td className="p-2">
                    <input value={log.productDescription} onChange={(e) => handleWorkLogChange(log.id, 'productDescription', e.target.value)} type="text" className="w-full p-2 outline-none bg-transparent" placeholder="نام محصول..." />
                  </td>
                  <td className="p-2">
                    <PersianTimePicker value={log.startTime} onChange={(val) => handleWorkLogChange(log.id, 'startTime', val)} />
                  </td>
                  <td className="p-2">
                    <PersianTimePicker value={log.endTime} onChange={(val) => handleWorkLogChange(log.id, 'endTime', val)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 transition-all"><span>+</span> افزودن ردیف جدید</button>
        </div>

        <div className="flex flex-wrap gap-4 justify-between items-center mt-12 border-t pt-8">
          <div className="flex gap-3 order-2 md:order-1">
            <button onClick={goToPrev} disabled={currentIndex === 0} className="px-6 py-2 rounded-xl border-2 border-gray-300 font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-all">نفر قبلی</button>
            <button onClick={goToNext} className="px-6 py-2 rounded-xl border-2 border-blue-600 font-bold text-blue-600 hover:bg-blue-50 transition-all">نفر بعدی / جدید</button>
          </div>
          <div className="flex gap-3 order-1 md:order-2 w-full md:w-auto">
             <button onClick={deleteRecord} className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all border border-red-200">حذف رکورد</button>
            <button onClick={saveRecord} className={`flex-1 md:flex-none px-12 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${isSaved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}>{isSaved ? '✓ ثبت شد' : 'ثبت رکورد'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
