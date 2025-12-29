import React, { useState, useEffect } from 'react';
import { PersonnelRecord, PersonnelStatus, WorkLog } from './types.ts';
import { calculateDuration, generateId } from './utils/timeHelper.ts';
import * as XLSX from 'xlsx';

// لیست پرسنل و دستگاه‌ها جهت جستجوی خودکار (Lookup Table)
const PERSONNEL_DATA = [
  { name: 'فرحناز ماهرو', code: '7', machine: '9004' },
  { name: 'پریسا محمدی', code: '14', machine: '1241' },
  { name: 'سمیرا دلفان', code: '18', machine: '1289' },
  { name: 'سکینه طالب میر', code: '19', machine: '1288' },
  { name: 'کبرا نعمتی', code: '47', machine: '1382' },
  { name: 'معصومه نعمتی', code: '58', machine: '1431' },
  { name: 'منصوره ترک', code: '64', machine: '1454' },
  { name: 'کلثوم افشار', code: '65', machine: '1456' },
  { name: 'سمیه شاکرمی', code: '94', machine: '1526' },
  { name: 'پروانه غلامی', code: '100', machine: '1539' },
  { name: 'فاطمه تیموری', code: '106', machine: '1548' },
  { name: 'صغری محمدخانی', code: '110', machine: '1361' },
  { name: 'مریم سرگزی', code: '111', machine: '1578' },
  { name: 'بهاره عبدلی', code: '117', machine: '1630' },
  { name: 'لیلا متدین', code: '118', machine: '1649' },
  { name: 'وجیهه خادمی', code: '122', machine: '1666' },
  { name: 'زهرا آزادبخت', code: '125', machine: '1665' },
  { name: 'گلزار کنعانی', code: '128', machine: '1671' },
  { name: 'مریم ابراهیم زاده', code: '130', machine: '1683' },
  { name: 'زینب آریافرد', code: '132', machine: '1687' },
  { name: 'آزاده بختیاری', code: '137', machine: '1694' },
  { name: 'منصوره تقوی', code: '138', machine: '1692' },
  { name: 'لیلا یقینی', code: '139', machine: '1709' },
  { name: 'افسانه بی نیاز', code: '142', machine: '1749' },
  { name: 'فاطمه حیات الغیب', code: '150', machine: '1898' },
  { name: 'مریم نجارلو', code: '151', machine: '1432' },
  { name: 'زهرا بستاک', code: '152', machine: '1962' },
  { name: 'هاجر ایاز', code: '164', machine: '2076' },
  { name: 'عاطفه صفری', code: '178', machine: '2170' },
  { name: 'راضیه مشهدی', code: '184', machine: '2197' },
  { name: 'فاطمه مرادی', code: '185', machine: '2231' },
  { name: 'مطهره زرین', code: '186', machine: '2263' },
  { name: 'منصوره حمیدی', code: '187', machine: '2264' },
  { name: 'محمد انوری', code: '192', machine: '2017' },
  { name: 'احسان محمدی', code: '193', machine: '2018' },
];

const PRODUCT_OPTIONS = [
  "نخ",
  "گایدوایر",
  "مش جراحی",
  "چسب آنژیوکت",
  "چسب pe",
  "چسب حصیری"
];

const parse24to12 = (time24: string) => {
  if (!time24) return { h: 8, m: 0, p: 'قبل از ظهر' };
  let [h, m] = time24.split(':').map(Number);
  const p = h >= 12 ? 'بعد از ظهر' : 'قبل از ظهر';
  h = h % 12 || 12;
  return { h, m, p };
};

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
        <select value={h} onChange={(e) => update(Number(e.target.value), m, p)} className="bg-transparent outline-none text-center font-bold px-1 cursor-pointer">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(num => <option key={num} value={num} className="bg-black text-white">{num}</option>)}
        </select>
        <span className="font-bold">:</span>
        <select value={m} onChange={(e) => update(h, Number(e.target.value), p)} className="bg-transparent outline-none text-center font-bold px-1 cursor-pointer">
          {Array.from({ length: 60 }, (_, i) => i).map(num => <option key={num} value={num} className="bg-black text-white">{String(num).padStart(2, '0')}</option>)}
        </select>
        <div className="flex bg-gray-100 rounded-md p-0.5 mr-2">
          <button type="button" onClick={() => update(h, m, 'قبل از ظهر')} className={`px-2 py-1 text-[10px] rounded ${p === 'قبل از ظهر' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-400'}`}>ق.ظ</button>
          <button type="button" onClick={() => update(h, m, 'بعد از ظهر')} className={`px-2 py-1 text-[10px] rounded ${p === 'بعد از ظهر' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-400'}`}>ب.ظ</button>
        </div>
      </div>
    </div>
  );
};

const EmptyRecord = (): PersonnelRecord => ({
  id: generateId(),
  date: new Intl.DateTimeFormat('fa-IR').format(new Date()),
  operatorCode: '',
  fullName: '',
  machineCode: '',
  status: PersonnelStatus.PRESENT,
  entryTime: '08:00',
  exitTime: '16:00',
  totalPresence: '08:00',
  workLogs: [{ id: generateId(), productDescription: '', startTime: '08:00', endTime: '09:00' }],
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
    
    setCurrentRecord(prev => {
      const updated = { ...prev, [name]: value };
      
      // منطق جستجو: اگر کد اپراتور تغییر کرد، اطلاعات را از جدول مرجع پیدا کن
      if (name === 'operatorCode') {
        const found = PERSONNEL_DATA.find(p => p.code === value.trim());
        if (found) {
          updated.fullName = found.name;
          updated.machineCode = found.machine;
        }
      }
      return updated;
    });
    
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
      workLogs: [...prev.workLogs, { id: generateId(), productDescription: '', startTime: '08:00', endTime: '09:00' }]
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
    if (currentIndex < records.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      const fresh = EmptyRecord();
      setCurrentRecord(fresh);
      setCurrentIndex(records.length);
    }
  };

  const goToPrev = () => { 
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const exportToExcel = () => {
    const allData = [...records];
    const currentInRecords = allData.find(r => r.id === currentRecord.id);
    if (!currentInRecords && currentRecord.operatorCode) {
        allData.push(currentRecord);
    } else if (currentInRecords) {
        const idx = allData.indexOf(currentInRecords);
        allData[idx] = currentRecord;
    }

    if (allData.length === 0) {
        alert('اطلاعاتی برای خروجی وجود ندارد.');
        return;
    }

    const flatData = allData.flatMap(record => 
        record.workLogs.map(log => ({
            'تاریخ': record.date || '',
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
    worksheet['!dir'] = 'rtl';
    XLSX.writeFile(workbook, `Factory_Report_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex justify-center items-start">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-6 md:p-10 border-t-8 border-blue-600">
        <header className="mb-10 text-center border-b pb-6 relative">
          <div className="md:absolute left-0 top-0 mb-4 md:mb-0">
            <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow transition-all active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">تاریخ</label>
            <input 
              name="date" 
              value={currentRecord.date || ''} 
              onChange={handleInputChange} 
              type="text" 
              className="border-2 border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-gray-900" 
              placeholder="1403/01/01" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">کد اپراتور (کد تولید)</label>
            <input 
              name="operatorCode" 
              value={currentRecord.operatorCode} 
              onChange={handleInputChange} 
              type="text" 
              className="border-2 border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-gray-900" 
              placeholder="مثلاً ۷ یا ۱۴" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">نام و نام خانوادگی</label>
            <input 
              name="fullName" 
              value={currentRecord.fullName} 
              onChange={handleInputChange} 
              type="text" 
              className="border-2 border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-gray-900" 
              placeholder="تکمیل خودکار" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">کد دستگاه</label>
            <input 
              name="machineCode" 
              value={currentRecord.machineCode} 
              onChange={handleInputChange} 
              type="text" 
              className="border-2 border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-gray-900" 
              placeholder="تکمیل خودکار" 
            />
          </div>
        </div>

        <div className="mb-8 p-4 bg-blue-50 rounded-xl flex flex-wrap items-center gap-6">
          <span className="font-bold text-blue-800">وضعیت حضور:</span>
          <div className="flex gap-4">
            {Object.values(PersonnelStatus).map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer group">
                <input type="radio" name="status" checked={currentRecord.status === s} onChange={() => handleStatusChange(s)} className="w-5 h-5 text-blue-600 cursor-pointer" />
                <span className={`text-sm transition-colors ${currentRecord.status === s ? 'font-bold text-blue-700' : 'text-gray-600 group-hover:text-gray-800'}`}>{s}</span>
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
            <label className="text-sm font-bold text-gray-700">میزان حضور کل</label>
            <div className="bg-white border-2 border-gray-200 rounded-lg py-2.5 text-center font-bold text-gray-900 text-lg">
              {currentRecord.totalPresence}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mb-8 bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="p-3 text-center w-16">ردیف</th>
                <th className="p-3 text-right">شرح محصول</th>
                <th className="p-3 text-center w-40">ساعت شروع</th>
                <th className="p-3 text-center w-40">ساعت پایان</th>
              </tr>
            </thead>
            <tbody>
              {currentRecord.workLogs.map((log, index) => (
                <tr key={log.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-center text-gray-500 font-medium">{index + 1}</td>
                  <td className="p-2">
                    <select
                      value={log.productDescription}
                      onChange={(e) => handleWorkLogChange(log.id, 'productDescription', e.target.value)}
                      className="w-full p-2 outline-none bg-transparent cursor-pointer text-gray-900"
                    >
                      <option value="" disabled className="text-gray-400">انتخاب کنید...</option>
                      {PRODUCT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} className="bg-white text-gray-900">
                          {opt}
                        </option>
                      ))}
                    </select>
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
          <button onClick={addRow} className="w-full py-3 bg-gray-50 text-blue-600 hover:bg-blue-50 text-sm font-bold flex justify-center items-center gap-2 transition-all border-t">
            <span className="text-lg">+</span> افزودن ردیف کارکرد جدید
          </button>
        </div>

        <div className="flex flex-wrap gap-4 justify-between items-center mt-12 border-t pt-8">
          <div className="flex gap-3 order-2 md:order-1 w-full md:w-auto">
            <button onClick={goToPrev} disabled={currentIndex === 0} className="flex-1 md:flex-none px-6 py-2 rounded-xl border-2 border-gray-300 font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all">نفر قبلی</button>
            <button onClick={goToNext} className="flex-1 md:flex-none px-6 py-2 rounded-xl border-2 border-blue-600 font-bold text-blue-600 hover:bg-blue-50 transition-all">نفر بعدی / جدید</button>
          </div>
          <div className="flex gap-3 order-1 md:order-2 w-full md:w-auto">
             <button onClick={deleteRecord} className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all border border-red-200">حذف رکورد</button>
            <button onClick={saveRecord} className={`flex-1 md:flex-none px-12 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${isSaved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isSaved ? '✓ ثبت شد' : 'ثبت و ذخیره نهایی'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;