// ==========================================
// 📦 1. นำเข้าเครื่องมือและไลบรารีต่างๆ (Imports)
// ==========================================
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, addDoc, updateDoc, 
  deleteDoc, doc, increment, setDoc, runTransaction
} from "firebase/firestore";
import { 
  LayoutDashboard, Package, ShoppingCart, Plus, Edit2, Trash2, 
  Save, X, TrendingUp, CalendarDays, DollarSign, Boxes, Users, 
  LogOut, Lock, User, Download, History, BarChart3, ShieldCheck, 
  Search, ArrowUpDown, ChevronDown, Scan, Minus, CheckCircle2, AlertCircle,
  Barcode, Store, UserCircle, FileText, Camera, Aperture, Image as ImageIcon
} from 'lucide-react';
// 🚀 ไลบรารีสำหรับสแกน Barcode แบบสด
import { Scanner } from '@yudiel/react-qr-scanner'; 
// 🚀 ไลบรารี AI สำหรับอ่านตัวอักษรจากรูปภาพ (OCR)
import Tesseract from 'tesseract.js';

// ==========================================
// 🎨 โลโก้ The Resilient Clinic 
// ==========================================
const ResilientLogo = ({ className = "" }) => (
  <div className={`bg-gradient-to-br from-[#0A142A] to-[#112044] flex items-center justify-center overflow-hidden shadow-lg ${className}`}>
    <svg viewBox="0 0 320 100" className="h-full w-auto py-2 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(15, 12) scale(0.75)">
        <path d="M50 15 C 30 40 35 75 50 85 C 65 75 70 40 50 15 Z" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinejoin="round"/>
        <circle cx="50" cy="55" r="7.5" fill="#FFFFFF"/>
        <path d="M 45 83 C 20 80 10 50 18 30 C 20 50 30 55 35 45" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M 55 83 C 80 80 90 50 82 30 C 80 50 70 55 65 45" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M 38 85 C 10 85 -5 65 2 45 C 5 60 18 65 25 58" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M 62 85 C 90 85 105 65 98 45 C 95 60 82 65 75 58" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
      </g>
      <text x="105" y="38" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="500" fill="#FFFFFF" letterSpacing="1.5">THE</text>
      <text x="103" y="64" fontFamily="system-ui, -apple-system, sans-serif" fontSize="26" fontWeight="800" fill="#CEA85E" letterSpacing="1.5">RESILIENT</text>
      <text x="105" y="84" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="500" fill="#FFFFFF" letterSpacing="2.5">CLINIC</text>
    </svg>
  </div>
);

// ==========================================
// 🔥 2. ตั้งค่าการเชื่อมต่อฐานข้อมูล (Firebase Setup)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCgC0ikl147mwcC1-J36Qg27SPUNSz8Afw",
  authDomain: "the-royal-queen.firebaseapp.com",
  projectId: "the-royal-queen",
  storageBucket: "the-royal-queen.firebasestorage.app",
  messagingSenderId: "1070880208582",
  appId: "1:1070880208582:web:9530fdad63bab3454149c7"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

const defaultPermissions = {
  dashboard: false, dashboardExport: false,
  products: false, productsEdit: false, productsExport: false,
  stock: false, stockEdit: false, stockExport: false,
  history: false, historyEdit: false
};

const STORE_OPTIONS = ['Shopee(Re)', 'Shopee(Long)', 'Lazada(Re)', 'Lazada(Long)', 'LINE'];

// ==========================================
// 🚀 3. คอมโพเนนต์หลักของระบบ (Main App Component)
// ==========================================
export default function App() {
  const isExecutiveView = new URLSearchParams(window.location.search).get('view') === 'dashboard';

  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [activeTab, setActiveTab] = useState(isExecutiveView ? 'dashboard' : 'sales');    
  
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  const productMap = useMemo(() => {
    return products.reduce((map, product) => {
      map[product.id] = product;
      return map;
    }, {});
  }, [products]);

  useEffect(() => {
    const connectionTimeout = setTimeout(() => {
      if (!isUsersLoaded || isLoading) setLoadError("การเชื่อมต่อใช้เวลานานผิดปกติ กรุณาตรวจสอบอินเทอร์เน็ตหรือรีเฟรชหน้าจอใหม่");
    }, 10000);

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) {
        setDoc(doc(db, "users", "default_admin"), { username: 'admin', password: '123456', role: 'admin', permissions: defaultPermissions });
        setDoc(doc(db, "users", "default_user"), { username: 'user', password: '123456', role: 'staff', permissions: defaultPermissions });
      } else {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setIsUsersLoaded(true); setLoadError('');
      }
    }, (error) => { console.error("Users Error:", error); setLoadError("ไม่สามารถดึงข้อมูลบัญชีผู้ใช้ได้"); setIsUsersLoaded(true); });

    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeSales = onSnapshot(collection(db, "sales"), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false); setLoadError('');
    });

    return () => { clearTimeout(connectionTimeout); unsubscribeUsers(); unsubscribeProducts(); unsubscribeSales(); };
  }, [isUsersLoaded, isLoading]);

  useEffect(() => {
    if (loggedInUser) {
      const updatedUser = users.find(u => u.id === loggedInUser.id);
      if (updatedUser) {
        setLoggedInUser(updatedUser);
        if (activeTab !== 'sales' && updatedUser.role !== 'admin' && !updatedUser.permissions?.[activeTab]) setActiveTab('sales');
      } else { setLoggedInUser(null); }
    }
  }, [users, activeTab, loggedInUser]);

  // --- 🛠️ ฟังก์ชันช่วยเหลือ (Helpers) ---
  const canAccess = (tabName) => {
    if (isExecutiveView) return tabName === 'dashboard' || tabName === 'stock';
    if (!loggedInUser) return false;
    if (loggedInUser.role === 'admin' || tabName === 'sales') return true; 
    return !!loggedInUser.permissions?.[tabName]; 
  };
  const canEditTab = (tabName) => {
    if (!loggedInUser) return false;
    if (loggedInUser.role === 'admin') return true;
    return !!loggedInUser.permissions?.[tabName + 'Edit'];
  };
  const canExportTab = (tabName) => {
    if (!loggedInUser) return false;
    if (loggedInUser.role === 'admin') return true;
    return !!loggedInUser.permissions?.[tabName + 'Export'];
  };

  const formatMoney = (amount) => {
    const validAmount = isNaN(amount) || amount === null ? 0 : amount;
    return new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(validAmount);
  };
  const getProduct = (id) => productMap[id];
  const getLocalISODate = (dateString) => {
    try {
      const d = dateString ? new Date(dateString) : new Date();
      if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().split('T')[0];
    } catch (e) { return new Date().toISOString().split('T')[0]; }
  };
  const downloadMobileSafeCSV = (csvString, filename) => {
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    if (window.navigator && window.navigator.msSaveOrOpenBlob) { window.navigator.msSaveOrOpenBlob(blob, filename); return; }
    const url = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.setAttribute('download', filename);
    document.body.appendChild(link); link.click(); setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 1000);
  };

  // 🚀 จัดกลุ่มออเดอร์ตามเวลาที่ทำรายการ (Transaction Grouping)
  const groupSalesByTransaction = (salesArray) => {
    const grouped = {};
    salesArray.forEach(sale => {
      const key = sale.date; 
      if (!grouped[key]) {
        grouped[key] = {
          id: key, date: sale.date, orderId: sale.orderId, store: sale.store, soldBy: sale.soldBy,
          items: [], totalOrderValue: 0, totalItems: 0
        };
      }
      grouped[key].items.push(sale);
      grouped[key].totalOrderValue += Number(sale.total) || 0;
      grouped[key].totalItems += Number(sale.quantity) || 0;
    });
    return Object.values(grouped).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // ==========================================
  // 🖥️ 4. ส่วนแสดงผลหน้าจอต่างๆ (Views / Pages)
  // ==========================================

  const LoginView = () => {
    const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
    const handleLogin = (e) => {
      e.preventDefault();
      const foundUser = users.find(u => u.username === username && u.password === password);
      if (foundUser) { setLoggedInUser(foundUser); setActiveTab(foundUser.role === 'admin' || foundUser.permissions?.dashboard ? 'dashboard' : 'sales'); setError(''); } 
      else { setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); }
    };
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 p-8 md:p-10 space-y-8">
          <div className="text-center space-y-4">
            <ResilientLogo className="mx-auto h-24 md:h-32 rounded-3xl shadow-xl w-full max-w-[320px]" />
            <p className="text-sm md:text-base text-slate-500 font-semibold tracking-wide">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && <div className="bg-red-50/80 text-red-600 p-3.5 rounded-2xl text-sm text-center font-bold border border-red-100 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">{error}</div>}
            <div className="space-y-5">
              <div><label className="block text-sm font-bold text-slate-700 mb-2 ml-1">ชื่อผู้ใช้งาน</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={20} className="text-slate-400" /></div><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm md:text-base outline-none bg-slate-50/50 hover:bg-white font-medium" placeholder="admin หรือ user" required /></div></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2 ml-1">รหัสผ่าน</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={20} className="text-slate-400" /></div><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm md:text-base outline-none bg-slate-50/50 hover:bg-white font-medium" placeholder="••••••" required /></div></div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-2xl text-base font-bold transition-all shadow-[0_8px_30px_rgb(37,99,235,0.2)] transform hover:-translate-y-1 active:translate-y-0">เข้าสู่ระบบ</button>
          </form>
        </div>
      </div>
    );
  };

  const DashboardView = () => {
    const [timeframe, setTimeframe] = useState('daily'); 
    const currentDateStr = getLocalISODate();
    const [filterDate, setFilterDate] = useState(currentDateStr); 
    const [filterMonth, setFilterMonth] = useState(currentDateStr.substring(0, 7)); 
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
    const [filterProductId, setFilterProductId] = useState('all');
    const [filterStore, setFilterStore] = useState('all'); 
    const currentYearNum = new Date().getFullYear(); const yearOptions = Array.from({length: 8}, (_, i) => currentYearNum - 5 + i);

    const filteredSales = useMemo(() => {
      return sales.filter(s => {
        const saleDateLocal = getLocalISODate(s.date); const saleMonthLocal = saleDateLocal.substring(0, 7); const saleYearLocal = saleDateLocal.substring(0, 4);
        let isTimeMatch = false;
        if (timeframe === 'daily') isTimeMatch = (saleDateLocal === filterDate); else if (timeframe === 'monthly') isTimeMatch = (saleMonthLocal === filterMonth); else if (timeframe === 'yearly') isTimeMatch = (saleYearLocal === filterYear); else if (timeframe === 'all') isTimeMatch = true;
        const isProductMatch = filterProductId === 'all' || s.productId === filterProductId;
        const isStoreMatch = filterStore === 'all' || s.store === filterStore;
        return isTimeMatch && isProductMatch && isStoreMatch;
      });
    }, [sales, timeframe, filterDate, filterMonth, filterYear, filterProductId, filterStore]);

    const dashboardStats = useMemo(() => {
      let tQty = 0; let tRev = 0; let tCost = 0; let tProfit = 0;
      const salesCount = {};
      const uniqueOrders = new Set(); 

      filteredSales.forEach(s => {
        const p = getProduct(s.productId); if (!p) return; 
        const qty = Number(s.quantity) || 0; 
        tQty += qty; 
        tRev += Number(s.total) || 0;
        
        const itemCost = s.unitCost !== undefined ? Number(s.unitCost) : Number(p.cost);
        const cost = itemCost * qty; 
        tCost += cost; 
        tProfit += ((Number(s.total) || 0) - cost);

        salesCount[s.productId] = (salesCount[s.productId] || 0) + qty;
        uniqueOrders.add(s.date); 
      });

      const topList = Object.entries(salesCount)
        .map(([id, qty]) => ({ ...getProduct(id), qty }))
        .filter(p => p && p.name)
        .sort((a, b) => b.qty - a.qty);

      return { totalQty: tQty, totalRevenue: tRev, totalCost: tCost, totalProfit: tProfit, totalOrders: uniqueOrders.size, topProducts: topList };
    }, [filteredSales, productMap]);

    const exportDashboardToExcel = () => {
      if (filteredSales.length === 0) { alert("ไม่มีข้อมูลในเงื่อนไขที่เลือก"); return; }
      let timeLabel = timeframe === 'daily' ? `ประจำวันที่ ${filterDate}` : timeframe === 'monthly' ? `ประจำเดือน ${filterMonth}` : timeframe === 'yearly' ? `ประจำปี ${filterYear}` : `ภาพรวมทั้งหมด (สะสม)`;
      const productLabel = filterProductId === 'all' ? 'ทุกสินค้า' : (getProduct(filterProductId)?.name || 'ไม่ทราบชื่อ');
      const storeLabel = filterStore === 'all' ? 'ทุกร้านค้า' : filterStore;
      const csvRows = [];
      csvRows.push(['รายงานสรุปยอดขาย - The Resilient Clinic']);
      csvRows.push(['ช่วงเวลา:', timeLabel]);
      csvRows.push(['ร้านค้า:', storeLabel]);
      csvRows.push(['สินค้าที่เลือก:', productLabel]);
      csvRows.push(['วันที่สั่งพิมพ์:', new Date().toLocaleString('th-TH')]);
      csvRows.push([]); 
      csvRows.push(['วันที่-เวลา', 'รหัสออเดอร์', 'ร้านค้า', 'ชื่อสินค้า', 'ราคาคลินิก (ต้นทุน)', 'ราคาขาย', 'จำนวน', 'ต้นทุนรวม', 'ยอดขาย', 'กำไรสุทธิ', 'ผู้ทำรายการ']);

      filteredSales.forEach(s => {
        const p = getProduct(s.productId);
        const itemCost = s.unitCost !== undefined ? Number(s.unitCost) : (p ? Number(p.cost) : 0);
        const qty = Number(s.quantity) || 0;
        const total = Number(s.total) || 0;
        const actualPricePerUnit = s.unitPrice !== undefined ? Number(s.unitPrice) : (qty > 0 ? (total / qty) : 0);
        const rowCost = itemCost * qty;
        const rowProfit = total - rowCost;
        let safeDate = '-'; try { const d = new Date(s.date); if(!isNaN(d.getTime())) safeDate = d.toLocaleString('th-TH'); } catch(e) {}
        csvRows.push([`"${safeDate}"`, `"${s.orderId || '-'}"`, `"${s.store || '-'}"`, `"${p ? p.name : 'สินค้าถูกลบไปแล้ว'}"`, itemCost, actualPricePerUnit.toFixed(2), qty, rowCost, total, rowProfit, `"${s.soldBy || '-'}"`]);
      });
      csvRows.push([]);
      csvRows.push(['สรุปยอดรวมทั้งหมด', '', '', '', '', '', dashboardStats.totalQty, dashboardStats.totalCost, dashboardStats.totalRevenue, dashboardStats.totalProfit, '']);
      downloadMobileSafeCSV(csvRows.map(row => row.join(',')).join('\n'), `รายงานยอดขาย_${timeLabel}.csv`);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 bg-white p-5 md:p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/60">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 md:p-3 rounded-2xl shadow-lg shadow-blue-500/20 text-white"><BarChart3 size={24} className="md:w-6 md:h-6" /></div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">สรุปยอดขาย</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border border-slate-200 shadow-inner">
               <span className="text-xs text-slate-500 font-bold">ร้านค้า</span>
               <select value={filterStore} onChange={e => setFilterStore(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none w-20 md:w-auto font-black text-blue-700"><option value="all">ทุกร้านค้า</option>{STORE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border border-slate-200 shadow-inner">
               <span className="text-xs text-slate-500 font-bold">สินค้า</span>
               <select value={filterProductId} onChange={e => setFilterProductId(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none w-20 md:w-auto font-black text-blue-700"><option value="all">ดูทั้งหมด</option>{products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}</select>
            </div>
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border border-slate-200 shadow-inner">
               <span className="text-xs text-slate-500 font-bold">ดูแบบ</span>
               <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none font-black text-blue-700"><option value="daily">รายวัน</option><option value="monthly">รายเดือน</option><option value="yearly">รายปี</option><option value="all">ยอดรวมสะสม</option></select>
            </div>
            {timeframe !== 'all' && (
              <div className="flex items-center space-x-2 bg-blue-50/80 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border border-blue-100 shadow-inner">
                {timeframe === 'daily' && <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none text-blue-700 font-black" />}
                {timeframe === 'monthly' && <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none text-blue-700 font-black" />}
                {timeframe === 'yearly' && <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none text-blue-700 font-black">{yearOptions.map(y => <option key={y} value={y}>ปี {y}</option>)}</select>}
              </div>
            )}
            {canExportTab('dashboard') && (<button onClick={exportDashboardToExcel} className="flex flex-1 lg:flex-none justify-center items-center space-x-1.5 md:space-x-2 bg-emerald-600 text-white px-4 py-2.5 md:px-5 md:py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 text-xs md:text-sm font-bold active:scale-95"><Download size={16} className="md:w-4 md:h-4" /><span>ส่งออก Excel</span></button>)}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 group-hover:w-2 transition-all"></div>
            <h3 className="font-bold text-slate-500 text-sm flex items-center mb-2"><TrendingUp size={16} className="mr-2 text-blue-500"/> ยอดขายรวม</h3>
            <p className="text-2xl md:text-3xl font-black text-slate-800 mt-2">฿{formatMoney(dashboardStats.totalRevenue)}</p>
            <p className="text-xs text-slate-400 mt-2 font-medium">{dashboardStats.totalOrders} ออเดอร์ ({dashboardStats.totalQty} ชิ้น)</p>
          </div>
          <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400 group-hover:w-2 transition-all"></div>
            <h3 className="font-bold text-slate-500 text-sm flex items-center mb-2"><Package size={16} className="mr-2 text-orange-500"/> ต้นทุนสินค้ารวม</h3>
            <p className="text-2xl md:text-3xl font-black text-slate-800 mt-2">฿{formatMoney(dashboardStats.totalCost)}</p>
            <p className="text-xs text-slate-400 mt-2 font-medium">คำนวณจากราคาคลินิก</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-100/50 p-5 md:p-6 rounded-3xl shadow-sm border border-emerald-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 group-hover:w-2 transition-all"></div>
            <h3 className="font-bold text-emerald-800 text-sm flex items-center mb-2"><ShoppingCart size={16} className="mr-2"/> จำนวนออเดอร์</h3>
            <p className="text-2xl md:text-3xl font-black text-emerald-700 mt-2">{dashboardStats.totalOrders} <span className="text-lg md:text-xl font-bold">ออเดอร์</span></p>
            <p className="text-xs text-emerald-600/80 mt-2 font-bold">รวมทั้งหมด {dashboardStats.totalQty} ชิ้น</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 md:px-6 md:py-5 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
            <CalendarDays size={20} className="text-slate-400"/>
            <h3 className="text-base md:text-xl font-black text-slate-800">สินค้าขายดี</h3>
          </div>
          <div className="p-5 md:p-6">
            <div className="space-y-4 md:space-y-5">
              {dashboardStats.topProducts.map((p, index) => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0 group">
                  <div className="flex items-center space-x-3 md:space-x-4">
                    <span className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-100 text-slate-500 font-black text-xs md:text-sm group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">{index + 1}</span>
                    <span className="font-bold text-slate-700 text-sm md:text-base group-hover:text-slate-900 transition-colors">{p.name}</span>
                  </div>
                  <div className="flex items-center space-x-4 md:space-x-5 ml-9 sm:ml-0">
                    <span className="text-xs md:text-sm text-slate-500 whitespace-nowrap font-medium">ขายแล้ว <strong className="text-blue-600 text-sm md:text-base">{p.qty}</strong> ชิ้น</span>
                    <div className="w-32 md:w-40 h-2 md:h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(p.qty / (dashboardStats.topProducts[0]?.qty || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
              {dashboardStats.topProducts.length === 0 && <p className="text-slate-500 text-sm text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-medium">ไม่มีข้อมูลการขายในเงื่อนไขที่คุณเลือก</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🛒 [View 7] บันทึกรายการขาย (POS) 🚀 ENTERPRISE ATOMIC (CART SYSTEM)
  const SalesView = () => {
    const [selectedStore, setSelectedStore] = useState(STORE_OPTIONS[0]);
    const [orderId, setOrderId] = useState(''); 

    // 🚀 State สำหรับโหมดสแกนเนอร์และ OCR
    const [scanMode, setScanMode] = useState(null); 
    const [smartText, setSmartText] = useState('');
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);
    const [ocrStatus, setOcrStatus] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null); 
    
    const [cart, setCart] = useState([]); 
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [customGrandTotal, setCustomGrandTotal] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false); };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
      setCustomGrandTotal('');
    }, [cart]);

    // 🚀 ฟังก์ชันปิดกล้อง
    const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };

    // ปิดกล้องเมื่อเปลี่ยนโหมดหรือปิดโมดอล
    useEffect(() => {
      if (scanMode !== 'ocr_camera') stopCamera();
      return () => stopCamera();
    }, [scanMode]);

    // 🚀 เปิดกล้องสำหรับ OCR (Notebook/Mobile)
    const startOcrCamera = async () => {
      setScanMode('ocr_camera');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) { videoRef.current.srcObject = stream; }
      } catch (err) {
        alert("ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบการอนุญาตสิทธิ์ (Permission)");
        setScanMode(null);
      }
    };

    // 🚀 ฟังก์ชันถ่ายภาพและส่งให้ Tesseract (AI) ประมวลผล
    const captureAndRead = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg');
      processOcrImage(imageData);
    };

    // 🚀 ฟังก์ชันเลือกรูปภาพผ่าน File Input แล้วส่งให้ Tesseract
    const handleImageForOcr = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => { const imageData = event.target.result; processOcrImage(imageData); };
      reader.readAsDataURL(file);
    };

    // 🚀 แกนหลักการทำงาน OCR
    const processOcrImage = async (imageData) => {
      setIsOcrProcessing(true); setOcrStatus('กำลังโหลดโมเดล AI...'); stopCamera(); 
      try {
        const result = await Tesseract.recognize(imageData, 'tha+eng', { logger: m => { if (m.status === 'recognizing text') { setOcrStatus(`กำลังวิเคราะห์รูปภาพ... ${Math.round(m.progress * 100)}%`); } } });
        const extractedText = result.data.text; handleSmartExtract(extractedText);
      } catch (err) { alert('เกิดข้อผิดพลาดในการอ่านข้อความจาก AI'); setScanMode(null); }
      setIsOcrProcessing(false);
    };

    const filteredProductsForSelect = useMemo(() => {
      if (!productSearchTerm) return products;
      return products.filter(p => String(p?.name || '').toLowerCase().includes(String(productSearchTerm || '').toLowerCase()));
    }, [products, productSearchTerm]);

    // 🚀 ฟังก์ชันดึงข้อมูลจากข้อความอัจฉริยะ (Smart Extract) 
    const handleSmartExtract = (text) => {
      setSmartText(text); let foundOrder = false;
      const orderMatch = text.match(/(?:คำสั่งซื้อ|คำสังซื้อ|คําสั่งซื่อ|Order No\.?|Order ID|Order)[:\s]*([A-Z0-9_-]+)/i) || text.match(/(260[A-Z0-9]+)/i); 
      if (orderMatch && orderMatch[1]) { setOrderId(orderMatch[1].trim()); foundOrder = true; }
      if (foundOrder) { setTimeout(() => { setScanMode(null); setSmartText(''); }, 800); } 
      else { setScanMode('text'); }
    };

    const addToCart = (product) => {
      const stockAmount = Number(product.stock) || 0;
      if (stockAmount <= 0) return;
      if (stockAmount <= 5) alert(`⚠️ เตือน: สินค้า "${product.name}" ใกล้หมด!\nคงเหลือเพียง ${stockAmount} ชิ้น`);
      const existingItem = cart.find(item => item.productId === product.id);
      if (existingItem) setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      else setCart([...cart, { productId: product.id, name: product.name, price: Number(product.price) || 0, quantity: 1, stock: product.stock }]);
      setIsDropdownOpen(false); setProductSearchTerm('');
    };

    const updateCartItem = (productId, field, value) => {
      setCart(cart.map(item => item.productId === productId ? { ...item, [field]: value } : item));
    };
    
    const removeFromCart = (productId) => setCart(cart.filter(item => item.productId !== productId));

    const posTotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const finalTotal = customGrandTotal !== '' ? Number(customGrandTotal) : posTotal;

    const recentSalesFlat = sales.filter(s => getLocalISODate(s.date) === getLocalISODate());
    const allGroupedRecentSales = groupSalesByTransaction(recentSalesFlat);
    const totalTodayOrders = allGroupedRecentSales.length; 
    const groupedRecentSales = allGroupedRecentSales.slice(0, 5); 

    const handleCheckoutPreflight = (e) => {
      e.preventDefault();
      if (cart.length === 0) { setIsError(true); setMessage('กรุณาเพิ่มสินค้าลงตะกร้าอย่างน้อย 1 รายการ'); return; }
      if (!selectedStore) { setIsError(true); setMessage('กรุณาเลือกร้านค้า'); return; }
      if (!orderId || orderId.trim() === '') { setIsError(true); setMessage('กรุณาระบุ รหัสออเดอร์ / คำสั่งซื้อ'); return; } 
      for (const item of cart) { if (Number(item.quantity) < 1) { setIsError(true); setMessage(`จำนวนของ ${item.name} ต้องมากกว่า 0`); return; } }
      setShowConfirmModal(true);
    };

    const executeCheckout = async () => {
      setIsProcessing(true);
      try {
        const checkoutTime = new Date().toISOString();

        await runTransaction(db, async (transaction) => {
          const productDocs = {};
          for (const item of cart) {
            const productRef = doc(db, "products", item.productId);
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) throw new Error(`ไม่พบข้อมูลสินค้า: ${item.name}`);
            productDocs[item.productId] = { ref: productRef, data: productDoc.data() };
          }

          for (const item of cart) {
            const currentStock = Number(productDocs[item.productId].data.stock) || 0;
            if (currentStock < item.quantity) throw new Error(`สต๊อกสินค้า "${item.name}" ไม่เพียงพอ`);
          }

          const todayStr = getLocalISODate();
          const summaryRef = doc(db, "daily_summary", todayStr);
          let totalOrderRevenue = 0; let totalOrderProfit = 0; 
          
          const ratio = posTotal > 0 ? (finalTotal / posTotal) : 1;
          let remainingTotal = finalTotal;

          for (let i = 0; i < cart.length; i++) {
             const item = cart[i]; const pData = productDocs[item.productId].data; const pRef = productDocs[item.productId].ref;
             const itemCost = Number(pData.cost) || 0;
             const isLastItem = i === cart.length - 1;
             const baseItemTotal = Number(item.price) * Number(item.quantity);
             let rowTotal = 0;
             if (isLastItem) { rowTotal = remainingTotal; } 
             else { rowTotal = Math.round((baseItemTotal * ratio) * 100) / 100; remainingTotal -= rowTotal; }
             const unitPrice = Number(item.quantity) > 0 ? (rowTotal / Number(item.quantity)) : 0;
             
             transaction.update(pRef, { stock: Number(pData.stock) - Number(item.quantity), updatedAt: new Date().toISOString() });

             const salesRef = doc(collection(db, "sales"));
             transaction.set(salesRef, {
               orderId: orderId || '-', customerName: '-', store: selectedStore, productId: item.productId, quantity: Number(item.quantity), total: rowTotal, unitPrice: unitPrice, unitCost: itemCost, date: checkoutTime, soldBy: loggedInUser?.username || 'unknown'
             });

             totalOrderRevenue += rowTotal; totalOrderProfit += (rowTotal - (itemCost * Number(item.quantity)));
          }

          transaction.set(summaryRef, { totalRevenue: increment(totalOrderRevenue), totalProfit: increment(totalOrderProfit), totalOrders: increment(1), date: todayStr }, { merge: true });
          transaction.set(doc(collection(db, "audit_logs")), { action: "CREATE_ORDER", user: loggedInUser?.username || 'unknown', details: `สร้างออเดอร์ ${orderId||'ไม่มี ID'} ยอด ${totalOrderRevenue} (รวม ${cart.length} รายการย่อย)`, timestamp: new Date().toISOString() });
        });
        
        setCart([]); setOrderId(''); setCustomGrandTotal(''); setShowConfirmModal(false);
        setIsError(false); setMessage('บันทึกออเดอร์สำเร็จ!'); setTimeout(() => setMessage(''), 3000);
      } catch (err) { setShowConfirmModal(false); setMessage(err.message); setIsError(true); }
      setIsProcessing(false);
    };

    return (
      <>
        {/* 🚀 แก้ไขข้อ 3: ย้าย Modal ออกมานอก div "animate-in" เพื่อปลดล็อก Stacking Context ให้มันทะลุครอบคลุมเต็มหน้าจอได้ */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 w-full h-full">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-100">
               <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 md:p-6 text-center text-white shrink-0 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <h3 className="text-xl md:text-2xl font-black relative z-10 tracking-wide">ยืนยันการทำรายการขาย</h3>
               </div>
               <div className="p-5 md:p-6 space-y-5 overflow-y-auto flex-1 w-full bg-slate-50/50">
                  <div className="grid grid-cols-2 gap-4 text-sm bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                     <div><span className="text-slate-500 font-bold block mb-1.5 text-xs uppercase tracking-wider">ร้านค้า</span><span className={`inline-block px-3.5 py-1.5 rounded-xl font-black text-xs md:text-sm shadow-sm border ${selectedStore.includes('Shopee') ? 'bg-orange-50 text-orange-600 border-orange-100' : (selectedStore === 'LINE' ? 'bg-[#E5F9E5] text-[#00C300] border-[#CCF2CC]' : 'bg-blue-50 text-blue-600 border-blue-100')}`}>{selectedStore}</span></div>
                     <div><span className="text-slate-500 font-bold block mb-1.5 text-xs uppercase tracking-wider">รหัสออเดอร์</span><span className="font-black text-slate-800 text-sm md:text-base bg-slate-100 px-3 py-1.5 rounded-xl block border border-slate-200 break-words">{orderId || '-'}</span></div>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-700 mb-3 text-base md:text-lg flex items-center"><Package size={18} className="mr-2"/>รายการสินค้า ({cart.length})</h4>
                    <div className="space-y-2.5 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-1.5">
                       {cart.map((item, idx) => (
                          <div key={idx} className="flex flex-row justify-between items-center text-sm p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                             <div className="flex-1 pr-4">
                                <span className="font-bold text-slate-800 break-words text-sm md:text-base">{item.name}</span> 
                                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-black ml-2 text-xs border border-blue-100">x{item.quantity}</span>
                             </div>
                             <div className="font-black text-slate-800 shrink-0 text-sm md:text-base bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">฿{formatMoney(item.price * item.quantity)}</div>
                          </div>
                       ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-end pt-5 border-t border-slate-200 mt-2 px-2">
                     <span className="font-black text-slate-500 mb-1 text-base md:text-lg uppercase tracking-wider">ราคารวมสุทธิ</span>
                     <div className="text-right">
                       {customGrandTotal !== '' && Number(customGrandTotal) !== posTotal && (
                         <div className="text-xs text-slate-400 line-through mb-1 font-bold">ปกติ ฿{formatMoney(posTotal)}</div>
                       )}
                       <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 text-3xl md:text-4xl drop-shadow-sm">฿{formatMoney(finalTotal)}</span>
                     </div>
                  </div>
               </div>
               <div className="p-5 md:p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                  <button type="button" onClick={() => setShowConfirmModal(false)} className="w-full sm:flex-1 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition shadow-sm text-sm md:text-base">ยกเลิกแก้ไข</button>
                  <button type="button" onClick={executeCheckout} disabled={isProcessing} className="w-full sm:flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-black text-white hover:from-emerald-600 hover:to-teal-700 transition shadow-lg shadow-emerald-500/25 flex items-center justify-center text-sm md:text-base transform hover:-translate-y-0.5 active:translate-y-0">
                    {isProcessing ? 'กำลังบันทึก...' : <><CheckCircle2 size={20} className="mr-2"/> ยืนยันการขาย</>}
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* 🚀 Modal สแกน Barcode และ Smart Extract */}
        {scanMode && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 w-full h-full">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] w-full max-w-lg space-y-6 shadow-2xl flex flex-col max-h-[90vh] border border-slate-100">
               <div className="flex bg-slate-100/80 p-1.5 rounded-2xl shrink-0 gap-1.5 border border-slate-200/60 shadow-inner">
                  <button onClick={() => setScanMode('camera')} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl flex justify-center items-center transition-all ${scanMode === 'camera' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}><Barcode size={16} className="mr-1.5"/> สแกนโค้ด</button>
                  <button onClick={() => startOcrCamera()} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl flex justify-center items-center transition-all ${scanMode === 'ocr_camera' ? 'bg-white text-teal-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}><Camera size={16} className="mr-1.5"/> ดึงด้วย AI</button>
                  <button onClick={() => setScanMode('text')} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl flex justify-center items-center transition-all ${scanMode === 'text' ? 'bg-white text-purple-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}><FileText size={16} className="mr-1.5"/> วางข้อความ</button>
               </div>

               {/* โหมด 1: สแกนบาร์โค้ดปกติ */}
               {scanMode === 'camera' && (
                 <>
                   <div className="text-center">
                      <h3 className="font-black text-2xl text-slate-800">สแกน Barcode</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">นำกล้องไปส่องที่บาร์โค้ดใบปะหน้า</p>
                   </div>
                   <div className="rounded-2xl overflow-hidden border-4 border-slate-100 shadow-inner bg-black aspect-square w-full relative shrink-0">
                      <Scanner onResult={(text) => { setOrderId(text); setScanMode(null); }} onError={(error) => console.log(error?.message)} />
                   </div>
                 </>
               )}

               {/* โหมด 2: ถ่ายรูป หรือ อัปโหลดรูป ให้ AI อ่านข้อมูล */}
               {scanMode === 'ocr_camera' && (
                 <div className="flex flex-col items-center space-y-5 w-full">
                    <div className="text-center">
                      <h3 className="font-black text-2xl text-teal-700">ดึงข้อมูลด้วย AI</h3>
                      <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">ถ่ายภาพสด หรือเลือกรูปจากคลังภาพได้เลย</p>
                    </div>
                    
                    <div className="w-full relative rounded-2xl overflow-hidden bg-slate-900 aspect-video border-4 border-teal-100 shadow-inner">
                       <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90"></video>
                       <canvas ref={canvasRef} className="hidden"></canvas>
                       {isOcrProcessing && (
                          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center z-10">
                             <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-teal-500/50"></div>
                             <p className="font-bold text-sm tracking-wide">{ocrStatus}</p>
                          </div>
                       )}
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full">
                       <button type="button" onClick={captureAndRead} disabled={isOcrProcessing} className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-teal-500/25 flex items-center justify-center transition disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0">
                          <Aperture size={20} className="mr-2" /> ถ่ายภาพจากกล้อง
                       </button>
                       <button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()} disabled={isOcrProcessing} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center transition disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0">
                          <ImageIcon size={20} className="mr-2" /> เลือกรูปจากคลัง
                       </button>
                       <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageForOcr} />
                    </div>
                 </div>
               )}

               {/* โหมด 3: ดึงข้อความจากการวาง (Smart Text / Live Text) */}
               {scanMode === 'text' && (
                 <div className="flex-1 flex flex-col min-h-[250px]">
                    <div className="text-center mb-4">
                      <h3 className="font-black text-2xl text-purple-700">ดึงข้อมูลอัตโนมัติ</h3>
                      <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">คัดลอกข้อความจากรูปภาพ (Live Text / Google Lens) มาวางด้านล่าง</p>
                    </div>
                    <textarea value={smartText} onChange={(e) => handleSmartExtract(e.target.value)} className="w-full flex-1 p-5 border-2 border-purple-100 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none resize-none text-sm text-slate-700 bg-purple-50/50 font-medium placeholder:text-purple-300" placeholder="วางข้อความทั้งหมดที่นี่..." autoFocus></textarea>
                 </div>
               )}

               <button type="button" onClick={() => { setScanMode(null); setSmartText(''); }} className="w-full py-4 bg-slate-50 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 hover:border-slate-300 transition shrink-0 shadow-sm">ปิดหน้าต่าง</button>
            </div>
          </div>
        )}

        <div className="relative space-y-6 md:space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300 w-full">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight drop-shadow-sm">บันทึกการขาย (POS)</h2>
          </div>

          <form onSubmit={handleCheckoutPreflight} className="space-y-6 md:space-y-8 w-full">
            {message && <div className={`p-4 rounded-2xl text-sm font-bold flex items-center justify-center shadow-sm animate-in fade-in slide-in-from-top-2 ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>{message}</div>}
            
            <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 w-full max-w-5xl mx-auto">
               <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group flex-1 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50/50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-125 duration-500"></div>
                  <div className="relative z-10 h-full flex flex-col justify-center">
                     <div className="flex items-center space-x-3.5 mb-5 md:mb-6">
                        <div className="bg-gradient-to-br from-orange-400 to-red-500 p-3 rounded-2xl text-white shadow-lg shadow-orange-500/30">
                           <Store size={24} />
                        </div>
                        <label className="text-xl md:text-2xl font-black text-slate-800 tracking-wide">เลือกร้านค้า</label>
                     </div>
                     {/* 🚀 แก้ไขข้อ 1: ใช้ flex-wrap และ break-words เพื่อให้ปุ่มตัดข้อความได้อย่างสวยงาม ไม่ตกขอบ */}
                     <div className="flex flex-wrap gap-2.5 md:gap-3 w-full">
                        {STORE_OPTIONS.map(s => {
                           const isShopee = s.includes('Shopee');
                           const isLazada = s.includes('Lazada');
                           const isLine = s === 'LINE';
                           const isActive = selectedStore === s;
                           
                           let colorClass = "bg-slate-50 text-slate-500 hover:bg-slate-100 border-transparent hover:border-slate-200";
                           if (isActive) {
                              if (isShopee) colorClass = "bg-gradient-to-br from-[#EE4D2D] to-[#d63d1e] text-white shadow-lg shadow-[#EE4D2D]/30 border-transparent ring-2 ring-[#EE4D2D]/50 ring-offset-2";
                              else if (isLazada) colorClass = "bg-gradient-to-br from-[#0F146D] to-[#0a0d4a] text-white shadow-lg shadow-blue-900/30 border-transparent ring-2 ring-[#0F146D]/50 ring-offset-2";
                              else if (isLine) colorClass = "bg-gradient-to-br from-[#00C300] to-[#00a800] text-white shadow-lg shadow-[#00C300]/30 border-transparent ring-2 ring-[#00C300]/50 ring-offset-2";
                              else colorClass = "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg border-transparent ring-2 ring-blue-500/50 ring-offset-2";
                           } else {
                              if (isShopee) colorClass = "bg-[#FFF0ED] text-[#EE4D2D] hover:bg-[#FFE4DF] border-[#FFE4DF]";
                              else if (isLazada) colorClass = "bg-[#F2F3FF] text-[#0F146D] hover:bg-[#E6E8FF] border-[#E6E8FF]";
                              else if (isLine) colorClass = "bg-[#E5F9E5] text-[#00C300] hover:bg-[#CCF2CC] border-[#CCF2CC]";
                           }

                           return (
                             <button type="button" key={s} onClick={() => setSelectedStore(s)} className={`px-2 py-3.5 md:py-4 rounded-2xl border-2 text-[12px] md:text-sm font-black transition-all duration-300 transform active:scale-95 ${colorClass} flex-1 min-w-[75px] sm:min-w-[90px] flex items-center justify-center text-center whitespace-normal break-words leading-tight shadow-sm hover:shadow-md h-full min-h-[60px]`}>
                                {s}
                             </button>
                           )
                        })}
                     </div>
                  </div>
               </div>

               <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group flex-1 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-125 duration-500"></div>
                  <div className="relative z-10 h-full flex flex-col justify-center">
                     <div className="flex items-center space-x-3.5 mb-5 md:mb-6">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-500/30">
                           <Barcode size={24} />
                        </div>
                        <label className="text-xl md:text-2xl font-black text-slate-800 tracking-wide">รหัสออเดอร์ <span className="text-red-500 ml-1 opacity-80">*</span></label>
                     </div>
                     <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full mt-auto">
                        <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} className="w-full p-4 border-2 border-slate-100 focus:border-blue-500 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none text-base md:text-lg font-black text-slate-800 transition-all placeholder:text-slate-400 placeholder:font-bold shadow-inner" placeholder="ระบุรหัสออเดอร์..." />
                        <button type="button" onClick={() => setScanMode('camera')} className="px-6 py-4 sm:py-0 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-800/20 transition-all flex items-center justify-center shrink-0 transform active:scale-95 hover:-translate-y-1" title="สแกน หรือ ดึงข้อมูล">
                           <Scan size={24} className="mr-2 sm:mr-0" /> <span className="sm:hidden font-bold">สแกนโค้ด</span>
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex items-center justify-center py-2">
               <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent w-full max-w-2xl"></div>
            </div>

            {/* 🚀 แก้ไขข้อ 2: ปรับ z-[90] ให้กล่องค้นหาลอยทับทุกส่วนด้านล่างเสมอ */}
            <div className="relative z-[90] bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]" ref={dropdownRef}>
              <div className="flex items-center justify-center space-x-3.5 mb-6 md:mb-8">
                 <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/30">
                    <Package size={26} />
                 </div>
                 <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 tracking-tight">เลือกสินค้าลงตะกร้า</h3>
              </div>
              
              <div onClick={() => !isProcessing && setIsDropdownOpen(!isDropdownOpen)} className={`w-full p-4 md:p-5 border-2 rounded-2xl text-sm md:text-base cursor-pointer flex justify-between items-center transition-all shadow-sm relative group ${isDropdownOpen ? 'border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/10' : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-white hover:shadow-md'} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center space-x-3">
                   <Search size={22} className={`transition-colors ${isDropdownOpen ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                   <span className={`${isDropdownOpen ? 'text-emerald-700 font-black' : 'text-slate-500 font-bold group-hover:text-slate-700'} tracking-wide`}>คลิกเพื่อค้นหาและเลือกสินค้า...</span>
                </div>
                <ChevronDown size={24} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-emerald-500' : 'text-slate-400 group-hover:text-emerald-400'}`} />
              </div>

              {isDropdownOpen && (
                <div className="absolute w-full mt-4 bg-white border border-slate-200 rounded-[2rem] shadow-[0_20px_60px_rgb(0,0,0,0.15)] max-h-[400px] flex flex-col top-full left-0 z-[100] origin-top animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input type="text" className="w-full pl-14 pr-5 py-4 bg-white border-2 border-slate-200 rounded-2xl text-base font-black focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-sm placeholder:text-slate-400 placeholder:font-bold" placeholder="พิมพ์ชื่อสินค้าที่ต้องการ..." value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} autoFocus />
                    </div>
                  </div>
                  <ul className="overflow-y-auto flex-1 p-3 md:p-4 space-y-2.5 scrollbar-hide bg-white">
                    {filteredProductsForSelect.map(p => {
                      const stockAmount = Number(p.stock) || 0;
                      const isOutOfStock = stockAmount <= 0;
                      const isLowStock = stockAmount <= 5 && !isOutOfStock;

                      return (
                        <li key={p.id} onClick={() => { if (!isOutOfStock) addToCart(p); }} className={`px-5 py-4 rounded-2xl text-sm flex flex-col sm:flex-row sm:justify-between sm:items-center cursor-pointer transition-all ${isOutOfStock ? "opacity-50 cursor-not-allowed bg-slate-50 border border-slate-100" : "bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 hover:shadow-md transform hover:-translate-y-0.5"}`}>
                          <div className="flex items-center space-x-3 mb-3 sm:mb-0 pr-2">
                             {isLowStock && <AlertCircle size={18} className="text-red-500 shrink-0" />}
                             <span className="font-black text-base md:text-lg text-slate-800 tracking-tight">{p.name}</span>
                          </div>
                          
                          <span className={`text-[11px] md:text-sm font-black px-4 py-2 rounded-xl shrink-0 border shadow-sm ${isOutOfStock ? 'bg-slate-100 text-slate-500 border-slate-200' : isLowStock ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {isOutOfStock ? 'สินค้าหมด' : `เหลือ ${stockAmount} ชิ้น (฿${formatMoney(p.price)})`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {cart.length > 0 && (
               <div className="border border-blue-100 bg-blue-50/40 rounded-[2.5rem] overflow-hidden w-full shadow-[0_8px_30px_rgb(0,0,0,0.03)] mt-6 animate-in slide-in-from-bottom-4">
                  <div className="bg-gradient-to-r from-blue-100/80 to-indigo-100/80 px-6 py-5 border-b border-blue-100 font-black text-blue-900 text-lg flex items-center shadow-inner">
                    <ShoppingCart size={22} className="mr-3 text-blue-600"/> รายการในตะกร้า ({cart.length})
                  </div>
                  <div className="p-4 md:p-5 w-full space-y-3 md:space-y-4">
                     {cart.map((item, index) => (
                        <div key={index} className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-5 md:p-6 gap-5 bg-white rounded-2xl shadow-sm border border-slate-100 w-full transition-all hover:shadow-md hover:border-blue-100 group">
                           <div className="flex-1 font-black text-slate-800 break-words w-full lg:w-auto text-lg md:text-xl leading-tight tracking-tight group-hover:text-blue-900 transition-colors">{item.name}</div>
                           
                           <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end w-full lg:w-auto gap-4 md:gap-6 shrink-0">
                              <div className="flex items-center space-x-2.5">
                                 <span className="text-xs text-slate-500 font-bold lg:hidden uppercase tracking-wider">ราคา/ชิ้น</span>
                                 <input type="number" value={item.price} onChange={e => updateCartItem(item.productId, 'price', e.target.value)} className="w-24 md:w-32 p-3 text-center border-2 border-slate-100 rounded-xl text-sm md:text-base font-black focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50 hover:bg-white transition-all shadow-inner text-blue-700" placeholder="ราคา"/>
                              </div>

                              <div className="flex items-center bg-slate-50 border-2 border-slate-100 rounded-xl p-1.5 shrink-0 shadow-sm">
                                 <button type="button" onClick={() => updateCartItem(item.productId, 'quantity', Math.max(1, Number(item.quantity) - 1))} className="p-2.5 bg-white rounded-lg shadow-sm border border-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95"><Minus size={18}/></button>
                                 <input type="number" value={item.quantity} onChange={e => updateCartItem(item.productId, 'quantity', Math.max(1, parseInt(e.target.value) || 1))} className="w-14 md:w-16 text-center bg-transparent font-black outline-none text-lg md:text-xl text-slate-800"/>
                                 <button type="button" onClick={() => updateCartItem(item.productId, 'quantity', Number(item.quantity) + 1)} className="p-2.5 bg-white rounded-lg shadow-sm border border-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95"><Plus size={18}/></button>
                              </div>
                              
                              <div className="flex items-center justify-end gap-5 min-w-[140px] shrink-0">
                                 <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 text-right text-xl md:text-2xl drop-shadow-sm">฿{formatMoney(Number(item.price) * Number(item.quantity))}</span>
                                 <button type="button" onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:bg-red-50 hover:text-red-600 p-3.5 rounded-xl transition-all border border-transparent hover:border-red-100 active:scale-95" title="ลบรายการนี้"><Trash2 size={22}/></button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            <div className="pt-4 w-full mt-8">
              <div className="bg-gradient-to-br from-[#f0f4ff] to-[#e6edfc] p-6 md:p-10 rounded-[2.5rem] border border-blue-100 flex flex-col lg:flex-row justify-between items-center gap-8 shadow-[0_8px_30px_rgb(55,97,233,0.08)] w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/40 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-200/40 rounded-full blur-3xl -ml-10 -mb-10"></div>
                
                <div className="text-center lg:text-left w-full lg:w-auto flex flex-col items-center lg:items-start relative z-10">
                  <p className="text-sm md:text-base font-black text-blue-500 mb-3 tracking-widest uppercase">ราคารวมสุทธิ {cart.length > 0 ? `(${cart.length} รายการ)` : ''}</p>
                  <div className="flex items-center relative w-full lg:w-auto justify-center lg:justify-start">
                    <span className="text-4xl md:text-5xl font-black text-blue-700 absolute left-6 select-none opacity-80">฿</span>
                    <input 
                      type="number" 
                      value={customGrandTotal} 
                      placeholder={posTotal}    
                      onChange={(e) => setCustomGrandTotal(e.target.value)}
                      className="w-full lg:w-80 pl-16 md:pl-20 pr-5 py-5 md:py-6 text-4xl md:text-5xl font-black text-blue-800 bg-white/90 backdrop-blur-sm border-2 border-blue-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 text-left disabled:bg-transparent disabled:border-transparent placeholder:text-blue-300 transition-all shadow-lg"
                      disabled={cart.length === 0}
                    />
                  </div>
                  {customGrandTotal !== '' && Number(customGrandTotal) !== posTotal && (
                    <p className="text-sm text-orange-600 mt-4 font-bold bg-orange-100/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-orange-200 inline-flex items-center shadow-sm animate-in fade-in zoom-in">
                      <AlertCircle size={18} className="mr-2" /> แก้ไขจากราคาปกติ ฿{formatMoney(posTotal)}
                    </p>
                  )}
                </div>

                <button type="submit" disabled={cart.length === 0 || isProcessing} className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 md:px-14 py-5 md:py-6 rounded-[1.5rem] text-xl md:text-2xl font-black transition-all disabled:opacity-50 shadow-[0_10px_40px_rgba(37,99,235,0.3)] transform hover:-translate-y-1 active:translate-y-0 whitespace-nowrap relative z-10 overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                  <span className="relative flex items-center justify-center">
                     {isProcessing ? 'กำลังบันทึก...' : <><ShoppingCart size={28} className="mr-3"/> บันทึกการขาย</>}
                  </span>
                </button>
              </div>
            </div>
          </form>

          {/* 🚀 UI ส่วนแสดงรายการที่เพิ่งขายไปวันนี้แบบตีกรอบแยกกล่องออเดอร์ */}
          <div className="pt-8 w-full pb-10">
            <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-6 px-2 flex items-center tracking-tight"><History size={24} className="mr-3 text-blue-500"/>รายการที่เพิ่งขายไปวันนี้</h3>
            <div className="w-full overflow-x-auto p-2">
              <table className="w-full text-left border-separate min-w-[700px]" style={{ borderSpacing: '0 16px' }}>
                <thead>
                  <tr className="text-slate-400 text-xs md:text-sm uppercase tracking-wider">
                    <th className="px-4 pb-2 font-bold whitespace-nowrap">ลำดับ / เวลา</th>
                    <th className="px-4 pb-2 font-bold">ออเดอร์</th>
                    <th className="px-4 pb-2 font-bold">ร้านค้า</th>
                    <th className="px-4 pb-2 font-bold">สินค้า</th>
                    <th className="px-4 pb-2 font-bold text-center">จำนวน</th>
                    <th className="px-4 pb-2 font-bold text-right">ยอดรวม</th>
                  </tr>
                </thead>
                {groupedRecentSales.length === 0 ? (
                  <tbody><tr><td colSpan="6" className="p-12 text-center text-slate-400 text-base font-bold bg-white rounded-[2rem] shadow-sm border border-slate-100">ยังไม่มีการคีย์ยอดขายในวันนี้</td></tr></tbody>
                ) : (
                  groupedRecentSales.map((group, groupIndex) => {
                    let timeString = '-'; 
                    try { const d = new Date(group.date); if(!isNaN(d.getTime())) timeString = d.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) + ' น.'; } catch(e) {}
                    
                    return (
                      <tbody key={group.id} className="shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-0.5 rounded-[1.5rem] bg-white relative">
                        {group.items.map((sale, itemIdx) => {
                          const isFirstRow = itemIdx === 0;
                          return (
                            <tr key={sale.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                              <td className={`p-4 md:p-5 text-slate-500 font-bold whitespace-nowrap border-l border-slate-100 ${isFirstRow ? 'border-t rounded-tl-[1.5rem] bg-slate-50/50' : 'border-t border-slate-50'}`}>
                                 {isFirstRow ? (
                                    <div className="flex flex-col space-y-2">
                                       <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] md:text-xs font-black px-3 py-1.5 rounded-lg shadow-sm text-center">ออเดอร์ที่ {totalTodayOrders - groupIndex}</span>
                                       <span className="text-slate-500 font-bold text-xs md:text-sm flex items-center justify-center"><CalendarDays size={14} className="mr-1.5"/> {timeString}</span>
                                    </div>
                                 ) : ''}
                              </td>
                              <td className={`p-4 md:p-5 font-black text-slate-700 ${isFirstRow ? 'border-t border-slate-100 bg-slate-50/50' : 'border-t border-slate-50'}`}>{isFirstRow ? (sale.orderId || '-') : ''}</td>
                              <td className={`p-4 md:p-5 whitespace-nowrap ${isFirstRow ? 'border-t border-slate-100 bg-slate-50/50' : 'border-t border-slate-50'}`}><span className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-black border shadow-sm ${String(sale.store || '').includes('Shopee') ? 'bg-orange-50 text-orange-600 border-orange-100' : (String(sale.store || '') === 'LINE' ? 'bg-[#E5F9E5] text-[#00C300] border-[#CCF2CC]' : 'bg-blue-50 text-blue-600 border-blue-100')}`}>{sale.store || '-'}</span></td>
                              <td className={`p-4 md:p-5 font-bold text-slate-800 text-sm md:text-base ${isFirstRow ? 'border-t border-slate-100 bg-slate-50/50' : 'border-t border-slate-50'}`}>{getProduct(sale.productId)?.name || 'สินค้าถูกลบ'}</td>
                              <td className={`p-4 md:p-5 text-center font-black text-slate-700 text-base ${isFirstRow ? 'border-t border-slate-100 bg-slate-50/50' : 'border-t border-slate-50'}`}>{sale.quantity}</td>
                              <td className={`p-4 md:p-5 text-right text-slate-700 font-black whitespace-nowrap text-base border-r border-slate-100 ${isFirstRow ? 'border-t rounded-tr-[1.5rem] bg-slate-50/50' : 'border-t border-slate-50'}`}>฿{formatMoney(sale.total)}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
                          <td colSpan="4" className="p-4 md:p-5 text-right text-indigo-800 font-black text-xs md:text-sm border-l border-b border-indigo-100 rounded-bl-[1.5rem] uppercase tracking-wider">ราคารวมสุทธิออเดอร์นี้</td>
                          <td className="p-4 md:p-5 text-center text-indigo-900 font-black text-lg border-b border-indigo-100 bg-indigo-100/30">{group.totalItems}</td>
                          <td className="p-4 md:p-5 text-right text-blue-700 font-black whitespace-nowrap text-xl md:text-2xl border-r border-b border-indigo-100 rounded-br-[1.5rem] drop-shadow-sm bg-blue-100/30">฿{formatMoney(group.totalOrderValue)}</td>
                        </tr>
                      </tbody>
                    );
                  })
                )}
              </table>
            </div>
          </div>
        </div>
      </>
    );
  };

  const SalesHistoryView = () => {
    // ... [ส่วนฟังก์ชันภายใน SalesHistoryView คงเดิม] ...
    const [filterDate, setFilterDate] = useState(getLocalISODate());
    const [isEditing, setIsEditing] = useState(null);
    const [editForm, setEditForm] = useState({ productId: '', quantity: 1, date: '', store: '', customPrice: '', orderId: ''});
    
    // 🚀 State สำหรับการแก้ไขกลุ่มออเดอร์ทั้งหมด
    const [isEditingGroup, setIsEditingGroup] = useState(null);
    const [groupEditTotal, setGroupEditTotal] = useState('');
    
    const [isProcessing, setIsProcessing] = useState(false);

    const formatForInput = (isoString) => {
      try { const d = new Date(isoString); if (isNaN(d.getTime())) return ''; d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); } catch (e) { return ''; }
    };

    // 🚀 กรองข้อมูลและจัดกลุ่มตามออเดอร์สำหรับหน้าประวัติ
    const filteredSalesFlat = sales.filter(s => getLocalISODate(s.date) === filterDate);
    const groupedHistorySales = groupSalesByTransaction(filteredSalesFlat);

    // ลบรายการย่อย (Item)
    const handleDelete = async (sale) => {
      if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบออเดอร์ย่อยนี้?\n\n*สต๊อกสินค้าจะถูกคืนกลับอัตโนมัติ*')) return;
      setIsProcessing(true);
      try {
        await runTransaction(db, async (transaction) => {
          const productRef = doc(db, "products", sale.productId);
          const pDoc = await transaction.get(productRef);
          if (pDoc.exists()) transaction.update(productRef, { stock: (Number(pDoc.data().stock) || 0) + Number(sale.quantity) });
          transaction.delete(doc(db, "sales", sale.id));
        });
      } catch (error) { alert("เกิดข้อผิดพลาด: " + error.message); }
      setIsProcessing(false);
    };

    // 🚀 ลบออเดอร์ทั้งหมดในกลุ่ม (Group) [แก้ปัญหา Transaction Read/Write]
    const handleDeleteGroup = async (group) => {
      if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบออเดอร์นี้ทั้งหมด?\n\n*สต๊อกสินค้าทั้งหมดในออเดอร์จะถูกคืนกลับอัตโนมัติ*')) return;
      setIsProcessing(true);
      try {
        await runTransaction(db, async (transaction) => {
          const returnQuantities = {};
          group.items.forEach(sale => { returnQuantities[sale.productId] = (returnQuantities[sale.productId] || 0) + Number(sale.quantity); });
          const productReadDocs = {};
          for (const productId of Object.keys(returnQuantities)) {
            const pRef = doc(db, "products", productId); const pDoc = await transaction.get(pRef);
            if (pDoc.exists()) { productReadDocs[productId] = { ref: pRef, currentStock: Number(pDoc.data().stock) || 0 }; }
          }
          for (const [productId, qtyToReturn] of Object.entries(returnQuantities)) {
            if (productReadDocs[productId]) { const pData = productReadDocs[productId]; transaction.update(pData.ref, { stock: pData.currentStock + qtyToReturn }); }
          }
          for (const sale of group.items) { transaction.delete(doc(db, "sales", sale.id)); }
        });
      } catch (error) { alert("เกิดข้อผิดพลาด: " + error.message); }
      setIsProcessing(false);
    };

    // บันทึกการแก้ไขรายการย่อย (Item)
    const handleSaveEdit = async (sale) => {
      setIsProcessing(true);
      try {
        const oldQty = Number(sale.quantity) || 0; const newQty = Math.max(1, Number(editForm.quantity) || 1);
        const oldProductId = sale.productId; const newProductId = editForm.productId;
        const newPData = getProduct(newProductId); if (!newPData) throw new Error("ไม่พบข้อมูลสินค้า");

        await runTransaction(db, async (transaction) => {
          const oldPRef = doc(db, "products", oldProductId); const newPRef = doc(db, "products", newProductId);
          if (oldProductId !== newProductId) {
            const oldP = await transaction.get(oldPRef); if(oldP.exists()) transaction.update(oldPRef, { stock: (Number(oldP.data().stock)||0) + oldQty });
            const newP = await transaction.get(newPRef); if(newP.exists()) transaction.update(newPRef, { stock: (Number(newP.data().stock)||0) - newQty });
          } else if (oldQty !== newQty) {
            const diff = newQty - oldQty;
            const p = await transaction.get(oldPRef); if(p.exists()) transaction.update(oldPRef, { stock: (Number(p.data().stock)||0) - diff });
          }
          let newDateIso = sale.date; try { const pd = new Date(editForm.date); if (!isNaN(pd.getTime())) newDateIso = pd.toISOString(); } catch (e) {}
          
          transaction.update(doc(db, "sales", sale.id), {
            productId: newProductId, quantity: newQty, total: Number(editForm.customPrice) * newQty, unitPrice: Number(editForm.customPrice), unitCost: newPData.cost, date: newDateIso, store: editForm.store, orderId: editForm.orderId
          });
        });
        setIsEditing(null);
      } catch (error) { alert("เกิดข้อผิดพลาด: " + error.message); }
      setIsProcessing(false);
    };

    // 🚀 บันทึกการแก้ไขราคารวมทั้งหมดของออเดอร์ (Group)
    const handleSaveGroupEdit = async (group) => {
      setIsProcessing(true);
      try {
        const newFinalTotal = Number(groupEditTotal); const oldTotal = group.totalOrderValue;
        if (newFinalTotal === oldTotal) { setIsEditingGroup(null); setIsProcessing(false); return; }
        const ratio = oldTotal > 0 ? (newFinalTotal / oldTotal) : 1; let remainingTotal = newFinalTotal;
        await runTransaction(db, async (transaction) => {
          for (let i = 0; i < group.items.length; i++) {
            const sale = group.items[i]; const isLastItem = i === group.items.length - 1; const baseItemTotal = Number(sale.total);
            let rowTotal = 0; if (isLastItem) { rowTotal = remainingTotal; } else { rowTotal = Math.round((baseItemTotal * ratio) * 100) / 100; remainingTotal -= rowTotal; }
            const unitPrice = Number(sale.quantity) > 0 ? (rowTotal / Number(sale.quantity)) : 0;
            transaction.update(doc(db, "sales", sale.id), { total: rowTotal, unitPrice: unitPrice });
          }
        });
        setIsEditingGroup(null);
      } catch (error) { alert("เกิดข้อผิดพลาด: " + error.message); }
      setIsProcessing(false);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 bg-white p-5 md:p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/60 mb-6 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-indigo-600 group-hover:w-3 transition-all"></div>
          <div className="flex items-center space-x-4 pl-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-3.5 rounded-2xl text-blue-600 shadow-inner">
              <History size={28} />
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">ประวัติการขาย</h2>
              <p className="text-xs md:text-sm text-slate-500 font-bold mt-1 tracking-wide">สามารถแก้ไขข้อมูล หรือลบออเดอร์ย่อยที่คีย์ผิดได้</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-slate-50 px-4 py-3 md:px-5 md:py-3.5 rounded-2xl border border-slate-200 shadow-inner w-full md:w-auto justify-between md:justify-start">
             <span className="text-xs md:text-sm text-slate-500 font-black uppercase tracking-wider">ดูของวันที่</span>
             <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border-none focus:ring-0 text-sm md:text-base bg-transparent cursor-pointer outline-none text-blue-600 font-black" />
          </div>
        </div>
        
        <div className="w-full overflow-x-auto pb-4 pt-2">
          <table className="w-full text-left border-separate min-w-[800px]" style={{ borderSpacing: '0 16px' }}>
            <thead>
              <tr className="text-slate-400 text-xs md:text-sm uppercase tracking-wider">
                <th className="px-4 pb-3 font-bold whitespace-nowrap">ลำดับ / เวลา</th>
                <th className="px-4 pb-3 font-bold">ออเดอร์ ID</th>
                <th className="px-4 pb-3 font-bold whitespace-nowrap">ร้านค้า</th>
                <th className="px-4 pb-3 font-bold">สินค้า</th>
                <th className="px-4 pb-3 font-bold text-center">จำนวน</th>
                <th className="px-4 pb-3 font-bold text-right">ยอดรวม</th>
                <th className="px-4 pb-3 font-bold text-center">ผู้ทำรายการ</th>
                {canEditTab('history') && <th className="px-4 pb-3 font-bold text-right">จัดการ</th>}
              </tr>
            </thead>
            
            {groupedHistorySales.length === 0 ? (
              <tbody><tr><td colSpan="8" className="text-center p-8 md:p-12 text-slate-400 text-base font-bold bg-white rounded-[2rem] shadow-sm border border-slate-100">ไม่มีรายการขายในวันที่เลือก</td></tr></tbody>
            ) : (
              groupedHistorySales.map((group, groupIndex) => {
                let timeString = '-'; 
                try { const d = new Date(group.date); if(!isNaN(d.getTime())) timeString = d.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}); } catch(e) {}
                
                return (
                  <tbody key={group.id} className="shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-0.5 rounded-[1.5rem] bg-white relative">
                    {group.items.map((sale, itemIdx) => {
                      const isCurrentRowEditing = isEditing === sale.id;
                      const isFirstRow = itemIdx === 0;
                      
                      return (
                        <tr key={sale.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                          <td className={`p-4 text-slate-500 whitespace-nowrap border-l border-slate-100 ${isFirstRow ? 'border-t rounded-tl-[1.5rem] bg-slate-50/50' : 'border-t border-slate-50'}`}>
                            {isCurrentRowEditing ? (
                               <input type="datetime-local" className="w-full p-2 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-xs font-bold" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})}/> 
                            ) : (
                               isFirstRow ? (
                                  <div className="flex flex-col space-y-2">
                                     <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] md:text-xs font-black px-3 py-1.5 rounded-lg shadow-sm text-center">ออเดอร์ที่ {groupedHistorySales.length - groupIndex}</span>
                                     <span className="text-slate-500 font-bold text-xs md:text-sm flex items-center justify-center"><CalendarDays size={14} className="mr-1.5"/> {timeString}</span>
                                  </div>
                               ) : ''
                            )}
                          </td>
                          <td className={`p-4 text-slate-700 font-black ${isFirstRow ? 'border-t border-slate-100 bg-slate-50/50' : 'border-t border-slate-50'}`}>{isCurrentRowEditing ? <input type="text" className="w-24 p-2 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs font-bold" value={editForm.orderId} onChange={e => setEditForm({...editForm, orderId: e.target.value})}/> : (isFirstRow ? (sale.orderId || '-') : '')}</td>
                          <td className={`p-4 whitespace-nowrap ${isFirstRow ? 'border-t border-slate-100 bg-slate-50/50' : 'border-t border-slate-50'}`}>{isCurrentRowEditing ? <select value={editForm.store} onChange={e => setEditForm({...editForm, store: e.target.value})} className="w-full p-2 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-xs font-bold">{STORE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select> : <span className={`px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-black shadow-sm border ${String(sale.store || '').includes('Shopee') ? 'bg-orange-50 text-orange-600 border-orange-100' : (String(sale.store || '') === 'LINE' ? 'bg-[#E5F9E5] text-[#00C300] border-[#CCF2CC]' : 'bg-blue-50 text-blue-600 border-blue-100')}`}>{sale.store || '-'}</span>}</td>
                          <td className={`p-4 min-w-[150px] ${isFirstRow ? 'border-t border-slate-100 bg-slate-50/50' : 'border-t border-slate-50'}`}>{isCurrentRowEditing ? <select value={editForm.productId} onChange={e => setEditForm({...editForm, productId: e.target.value, customPrice: getProduct(e.target.value)?.price||0})} className="w-full p-2 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-xs font-bold">{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select> : <span className="font-bold text-slate-800 text-sm md:text-base">{getProduct(sale.productId)?.name || 'ลบแล้ว'}</span>}</td>
                          <td className={`p-4 text-center ${isFirstRow ? 'border-t border-slate-100 bg-slate-50/50' : 'border-t border-slate-50'}`}>{isCurrentRowEditing ? <input type="number" className="w-16 mx-auto p-2 border-2 border-blue-200 rounded-xl text-center focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs font-bold" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: Math.max(1, parseInt(e.target.value)||1)})} /> : <span className="font-black text-slate-700 text-base">{sale.quantity}</span>}</td>
                          <td className={`p-4 text-right text-slate-800 font-black whitespace-nowrap ${isFirstRow ? 'border-t border-slate-100 bg-slate-50/50' : 'border-t border-slate-50'}`}>{isCurrentRowEditing ? <div className="flex flex-col items-end"><input type="number" className="w-24 p-2 border-2 border-blue-200 rounded-xl text-right text-xs mb-1.5 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-bold" value={editForm.customPrice} onChange={e => setEditForm({...editForm, customPrice: e.target.value})} placeholder="ราคา/ชิ้น"/><span className="text-blue-600">฿{formatMoney((Number(editForm.customPrice) || 0) * (Number(editForm.quantity) || 0))}</span></div> : `฿${formatMoney(sale.total)}`}</td>
                          <td className={`p-4 text-center text-slate-500 ${!canEditTab('history') ? 'border-r border-slate-100' : ''} ${isFirstRow ? (!canEditTab('history') ? 'border-t rounded-tr-[1.5rem] bg-slate-50/50' : 'border-t border-slate-100 bg-slate-50/50') : 'border-t border-slate-50'}`}><span className="bg-slate-100 border border-slate-200 font-bold px-3 py-1.5 rounded-xl text-[10px] md:text-xs">{sale.soldBy || '-'}</span></td>
                          {canEditTab('history') && (
                            <td className={`p-4 text-right whitespace-nowrap border-r border-slate-100 ${isFirstRow ? 'border-t rounded-tr-[1.5rem] bg-slate-50/50' : 'border-t border-slate-50'}`}>
                              {isCurrentRowEditing ? (
                                <div className="flex justify-end space-x-2">
                                  <button onClick={() => handleSaveEdit(sale)} disabled={isProcessing} className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-2 rounded-xl transition shadow-sm active:scale-95"><Save size={18}/></button>
                                  <button onClick={() => setIsEditing(null)} disabled={isProcessing} className="text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 p-2 rounded-xl transition shadow-sm active:scale-95"><X size={18}/></button>
                                </div>
                              ) : (
                                <div className="flex justify-end space-x-2">
                                  <button onClick={() => { setIsEditing(sale.id); setIsEditingGroup(null); setEditForm({productId: sale.productId, quantity: sale.quantity, date: formatForInput(sale.date), store: sale.store || STORE_OPTIONS[0], customPrice: sale.unitPrice || (sale.total/sale.quantity), orderId: sale.orderId || ''}); }} className="text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 p-2 rounded-xl transition shadow-sm active:scale-95" title="แก้ไขรายการนี้"><Edit2 size={18}/></button>
                                  <button onClick={() => handleDelete(sale)} className="text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 p-2 rounded-xl transition shadow-sm active:scale-95" title="ลบรายการนี้"><Trash2 size={18}/></button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    <tr className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
                      <td colSpan="4" className="p-4 text-right text-indigo-800 font-black text-xs md:text-sm border-l border-b border-indigo-100 rounded-bl-[1.5rem] uppercase tracking-wider">ราคารวมสุทธิออเดอร์นี้</td>
                      <td className="p-4 text-center text-indigo-900 font-black text-lg border-b border-indigo-100 bg-indigo-100/30">{group.totalItems}</td>
                      <td className="p-4 text-right text-blue-700 font-black whitespace-nowrap text-xl md:text-2xl border-b border-indigo-100 bg-blue-100/30">
                        {isEditingGroup === group.id ? (
                           <input type="number" className="w-28 p-2 border-2 border-blue-400 rounded-xl text-right focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-blue-800 bg-white shadow-inner" value={groupEditTotal} onChange={e => setGroupEditTotal(e.target.value)} />
                        ) : (
                           `฿${formatMoney(group.totalOrderValue)}`
                        )}
                      </td>
                      <td colSpan={canEditTab('history') ? 2 : 1} className="border-r border-b border-indigo-100 rounded-br-[1.5rem] text-right p-4">
                        {canEditTab('history') && (
                           isEditingGroup === group.id ? (
                              <div className="flex justify-end space-x-2">
                                 <button onClick={() => handleSaveGroupEdit(group)} disabled={isProcessing} className="text-emerald-600 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 p-2.5 rounded-xl transition shadow-sm active:scale-95" title="บันทึกยอดรวมใหม่"><Save size={18} /></button>
                                 <button onClick={() => setIsEditingGroup(null)} disabled={isProcessing} className="text-slate-500 bg-slate-200 hover:bg-slate-300 border border-slate-300 p-2.5 rounded-xl transition shadow-sm active:scale-95" title="ยกเลิก"><X size={18} /></button>
                              </div>
                           ) : (
                              <div className="flex justify-end space-x-2">
                                 <button onClick={() => { setIsEditingGroup(group.id); setGroupEditTotal(group.totalOrderValue); setIsEditing(null); }} className="text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 shadow-sm p-2.5 rounded-xl transition active:scale-95" title="แก้ไขราคารวมทั้งออเดอร์"><Edit2 size={18} /></button>
                                 <button onClick={() => handleDeleteGroup(group)} className="text-red-500 bg-white hover:bg-red-50 border border-red-200 shadow-sm p-2.5 rounded-xl transition active:scale-95" title="ลบทั้งออเดอร์ (คืนสต๊อกทั้งหมด)"><Trash2 size={18} /></button>
                              </div>
                           )
                        )}
                      </td>
                    </tr>
                  </tbody>
                );
              })
            )}
          </table>
        </div>
      </div>
    );
  };

  const ProductsView = () => {
    // ... [โค้ดส่วน ProductsView เหมือนเดิม] ...
    const [isEditing, setIsEditing] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', cost: '', price: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name_asc');

    const filteredAndSortedProducts = useMemo(() => {
      let result = [...products];
      if (searchTerm) result = result.filter(p => String(p.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
      result.sort((a, b) => {
        if (sortBy === 'name_asc') return String(a.name || '').localeCompare(String(b.name || ''), 'th');
        if (sortBy === 'name_desc') return String(b.name || '').localeCompare(String(a.name || ''), 'th');
        if (sortBy === 'price_desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
        if (sortBy === 'price_asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
        if (sortBy === 'stock_desc') return (Number(b.stock) || 0) - (Number(a.stock) || 0);
        return 0;
      });
      return result;
    }, [products, searchTerm, sortBy]);

    const exportProductsReport = () => {
      if (products.length === 0) return;
      const csvRows = [];
      csvRows.push(['รายงานสรุปสต๊อกสินค้า - The Resilient Clinic']);
      csvRows.push(['วันที่สั่งพิมพ์:', new Date().toLocaleString('th-TH')]);
      csvRows.push([]);
      csvRows.push(['ลำดับ', 'ชื่อสินค้า', 'ราคาคลินิก (ต้นทุน)', 'ราคาขาย', 'กำไรต่อชิ้น', 'สต๊อกคงเหลือ', 'มูลค่าต้นทุนรวม', 'มูลค่าขายรวม', 'กำไรคาดหวัง']);
      
      let sumStock = 0; let sumCostValue = 0; let sumSaleValue = 0; let sumExpectedProfit = 0;
      filteredAndSortedProducts.forEach((p, index) => {
        const stock = Number(p.stock) || 0; const costVal = stock * (Number(p.cost) || 0); const saleVal = stock * (Number(p.price) || 0); const profitVal = saleVal - costVal;
        sumStock += stock; sumCostValue += costVal; sumSaleValue += saleVal; sumExpectedProfit += profitVal;
        csvRows.push([index + 1, `"${p.name || ''}"`, p.cost || 0, p.price || 0, (Number(p.price) || 0) - (Number(p.cost) || 0), stock, costVal, saleVal, profitVal]);
      });
      csvRows.push([]); csvRows.push(['สรุปมูลค่าสต๊อกทั้งหมด', '', '', '', '', sumStock, sumCostValue, sumSaleValue, sumExpectedProfit]);
      downloadMobileSafeCSV(csvRows.map(row => row.join(',')).join('\n'), `สรุปข้อมูลสินค้าและมูลค่าสต๊อก_${getLocalISODate()}.csv`);
    };

    const handleSave = async (id) => {
      setIsProcessing(true);
      try {
        await updateDoc(doc(db, "products", id), { name: editForm.name, cost: Number(editForm.cost) || 0, price: Number(editForm.price) || 0 });
        await addDoc(collection(db, "audit_logs"), { action: "EDIT_PRODUCT", user: loggedInUser?.username || 'unknown', details: `แก้ไขข้อมูลสินค้า ${editForm.name}`, timestamp: new Date().toISOString() });
        setIsEditing(null);
      } catch (error) { alert("Error: " + error.message); }
      setIsProcessing(false);
    };

    const handleAdd = async () => {
      if (!editForm.name) return;
      setIsProcessing(true);
      try {
        await addDoc(collection(db, "products"), { name: editForm.name, cost: Number(editForm.cost) || 0, price: Number(editForm.price) || 0, stock: 0 });
        await addDoc(collection(db, "audit_logs"), { action: "ADD_PRODUCT", user: loggedInUser?.username || 'unknown', details: `เพิ่มสินค้าใหม่ ${editForm.name}`, timestamp: new Date().toISOString() });
        setIsAdding(false); setEditForm({ name: '', cost: '', price: '' });
      } catch (error) { alert("Error: " + error.message); }
      setIsProcessing(false);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col bg-white p-5 md:p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/60 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">การจัดการสินค้า</h2>
            <div className="flex space-x-3 w-full sm:w-auto">
              {canExportTab('products') && (<button onClick={exportProductsReport} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition shadow-sm text-sm font-bold active:scale-95"><Download size={18} /><span>ส่งออก Excel</span></button>)}
              {!isAdding && canEditTab('products') && (<button onClick={() => { setIsAdding(true); setEditForm({name:'', cost:'', price:''}); setIsEditing(null); setSearchTerm(''); }} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl transition shadow-lg shadow-blue-500/30 text-sm font-black active:scale-95"><Plus size={18} /><span>เพิ่มสินค้าใหม่</span></button>)}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-slate-100">
            <div className="relative flex-1 sm:max-w-sm"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="ค้นหาสินค้า..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm md:text-base font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:font-medium" /></div>
            <div className="flex items-center space-x-2 w-full sm:w-auto"><div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-inner"><ArrowUpDown size={18} className="text-slate-500" /></div><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto border-2 border-slate-200 rounded-xl text-sm md:text-base font-bold py-2.5 px-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white transition-all"><option value="name_asc">ชื่อ (ก - ฮ)</option><option value="name_desc">ชื่อ (ฮ - ก)</option><option value="price_desc">ราคาขาย (มากไปน้อย)</option><option value="price_asc">ราคาขาย (น้อยไปมาก)</option></select></div>
          </div>
        </div>
        
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100 text-xs md:text-sm uppercase tracking-wider"><th className="p-4 md:p-5 font-bold text-center w-20">ลำดับ</th><th className="p-4 md:p-5 font-bold">ชื่อสินค้า</th><th className="p-4 md:p-5 font-bold">ราคาคลินิก</th><th className="p-4 md:p-5 font-bold">ราคาขาย</th>{canEditTab('products') && <th className="p-4 md:p-5 font-bold text-right">จัดการ</th>}</tr>
            </thead>
            <tbody className="text-sm md:text-base">
              {isAdding && (
                <tr className="border-b border-blue-100 bg-blue-50/60 shadow-inner">
                  <td className="p-4 md:p-5 text-center text-blue-500 font-black">*</td>
                  <td className="p-3 md:p-4"><input className="w-full p-2.5 border-2 border-blue-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white" placeholder="ชื่อสินค้า..." value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                  <td className="p-3 md:p-4"><input type="number" className="w-full p-2.5 border-2 border-blue-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white" placeholder="ราคาคลินิก..." value={editForm.cost} onChange={e => setEditForm({...editForm, cost: e.target.value})} /></td>
                  <td className="p-3 md:p-4"><input type="number" className="w-full p-2.5 border-2 border-blue-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white" placeholder="ราคาขาย..." value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /></td>
                  <td className="p-3 md:p-4 text-right space-x-2 whitespace-nowrap"><button onClick={handleAdd} className="text-emerald-600 bg-emerald-100 p-2.5 rounded-xl hover:bg-emerald-200 border border-emerald-200 transition active:scale-95 shadow-sm"><Save size={18} /></button><button onClick={() => setIsAdding(false)} className="text-red-500 bg-red-50 p-2.5 rounded-xl hover:bg-red-100 border border-red-200 transition active:scale-95 shadow-sm"><X size={18} /></button></td>
                </tr>
              )}
              {filteredAndSortedProducts.map((product, index) => (
                <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="p-4 md:p-5 text-center font-black text-slate-400">{index + 1}</td>
                  <td className="p-4 md:p-5">{isEditing === product.id ? <input className="w-full p-2 border-2 border-blue-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /> : <span className="font-bold text-slate-800">{product.name}</span>}</td>
                  <td className="p-4 md:p-5">{isEditing === product.id ? <input type="number" className="w-full p-2 border-2 border-blue-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={editForm.cost} onChange={e => setEditForm({...editForm, cost: e.target.value})} /> : <span className="text-orange-600 font-bold bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">฿{formatMoney(product.cost)}</span>}</td>
                  <td className="p-4 md:p-5">{isEditing === product.id ? <input type="number" className="w-full p-2 border-2 border-blue-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /> : <span className="text-blue-600 font-black bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 drop-shadow-sm">฿{formatMoney(product.price)}</span>}</td>
                  {canEditTab('products') && (
                    <td className="p-4 md:p-5 text-right space-x-2 whitespace-nowrap">
                      {isEditing === product.id ? (<><button onClick={() => handleSave(product.id)} className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-2 rounded-xl transition shadow-sm active:scale-95"><Save size={18} /></button><button onClick={() => setIsEditing(null)} className="text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 p-2 rounded-xl transition shadow-sm active:scale-95"><X size={18} /></button></>) : (<><button onClick={() => { setIsEditing(product.id); setEditForm({name: product.name, cost: product.cost, price: product.price}); }} className="text-blue-600 hover:bg-blue-50 border border-blue-100 p-2 rounded-xl transition shadow-sm active:scale-95"><Edit2 size={18} /></button><button onClick={async () => { if(confirm('ลบสินค้านี้?')) { await deleteDoc(doc(db, "products", product.id)); await addDoc(collection(db, "audit_logs"), { action: "DELETE_PRODUCT", user: loggedInUser?.username || 'unknown', details: `ลบสินค้า ${product.name}`, timestamp: new Date().toISOString() }); } }} className="text-red-500 hover:bg-red-50 border border-red-100 p-2 rounded-xl transition shadow-sm active:scale-95"><Trash2 size={18} /></button></>)}
                    </td>
                  )}
                </tr>
              ))}
              {filteredAndSortedProducts.length === 0 && !isAdding && (<tr><td colSpan="5" className="text-center p-12 text-slate-400 font-bold text-sm bg-slate-50/50">ไม่พบข้อมูลสินค้าที่ค้นหา</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const StockView = () => {
    // ... [โค้ดส่วน StockView เหมือนเดิม] ...
    const [editingStockId, setEditingStockId] = useState(null);
    const [newStock, setNewStock] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name_asc');

    const filteredAndSortedProducts = useMemo(() => {
      let result = [...products];
      if (searchTerm) result = result.filter(p => String(p.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
      result.sort((a, b) => {
        if (sortBy === 'name_asc') return String(a.name || '').localeCompare(String(b.name || ''), 'th');
        if (sortBy === 'name_desc') return String(b.name || '').localeCompare(String(a.name || ''), 'th');
        if (sortBy === 'stock_desc') return (Number(b.stock) || 0) - (Number(a.stock) || 0);
        if (sortBy === 'stock_asc') return (Number(a.stock) || 0) - (Number(b.stock) || 0);
        return 0;
      });
      return result;
    }, [products, searchTerm, sortBy]);

    const handleSaveStock = async (id) => {
      setIsProcessing(true);
      try {
        const productRef = doc(db, "products", id); const auditRef = doc(collection(db, "audit_logs")); const newStockValue = Number(newStock) || 0;
        await runTransaction(db, async (transaction) => {
           const pDoc = await transaction.get(productRef); const oldStock = pDoc.exists() ? (Number(pDoc.data().stock)||0) : 0; const pName = pDoc.exists() ? pDoc.data().name : 'ไม่ทราบชื่อ';
           transaction.update(productRef, { stock: newStockValue });
           transaction.set(auditRef, { action: "UPDATE_STOCK", user: loggedInUser?.username || 'unknown', details: `ปรับสต๊อก ${pName} จาก ${oldStock} เป็น ${newStockValue}`, timestamp: new Date().toISOString() });
        });
        setEditingStockId(null);
      } catch (error) { alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message); }
      setIsProcessing(false);
    };

    const exportStockReport = () => {
      if (filteredAndSortedProducts.length === 0) { alert("ไม่มีข้อมูล"); return; }
      const csvRows = [];
      csvRows.push(['รายงานจำนวนสต๊อกสินค้าคงเหลือ - The Resilient Clinic']);
      csvRows.push(['วันที่สั่งพิมพ์:', new Date().toLocaleString('th-TH')]);
      csvRows.push([]);
      csvRows.push(['ลำดับ', 'ชื่อสินค้า', 'สต๊อกคงเหลือ']);
      filteredAndSortedProducts.forEach((p, index) => { csvRows.push([index + 1, `"${p.name || ''}"`, Number(p.stock) || 0]); });
      downloadMobileSafeCSV(csvRows.map(row => row.join(',')).join('\n'), `รายงานจำนวนสต๊อกคงเหลือ_${getLocalISODate()}.csv`);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col bg-white p-5 md:p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/60 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">สต๊อกสินค้า</h2>
            {canExportTab('stock') && (<button onClick={exportStockReport} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition shadow-sm text-sm font-bold active:scale-95"><Download size={18} /><span>ส่งออกสต๊อก (Excel)</span></button>)}
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-slate-100">
            <div className="relative flex-1 sm:max-w-sm"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="ค้นหาสินค้า..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm md:text-base font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:font-medium" /></div>
            <div className="flex items-center space-x-2 w-full sm:w-auto"><div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-inner"><ArrowUpDown size={18} className="text-slate-500" /></div><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto border-2 border-slate-200 rounded-xl text-sm md:text-base font-bold py-2.5 px-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white transition-all"><option value="name_asc">ชื่อ (ก - ฮ)</option><option value="name_desc">ชื่อ (ฮ - ก)</option><option value="stock_asc">จำนวนสต๊อก (น้อยไปมาก)</option><option value="stock_desc">จำนวนสต๊อก (มากไปน้อย)</option></select></div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100 text-xs md:text-sm uppercase tracking-wider"><th className="py-4 px-2 sm:px-4 md:p-5 font-bold text-center w-12 sm:w-20">ลำดับ</th><th className="py-4 px-2 sm:px-4 md:p-5 font-bold">ชื่อสินค้า</th><th className="py-4 px-2 sm:px-4 md:p-5 font-bold text-center whitespace-nowrap">คงเหลือ</th>{!isExecutiveView && canEditTab('stock') && <th className="py-4 px-2 sm:px-4 md:p-5 font-bold text-right whitespace-nowrap">อัปเดต</th>}</tr>
              </thead>
              <tbody className="text-sm md:text-base">
                {filteredAndSortedProducts.map((product, index) => {
                  const stockAmount = Number(product.stock) || 0;
                  return (
                  <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-2 sm:px-4 md:p-5 text-center font-black text-slate-400">{index + 1}</td>
                    <td className="py-4 px-2 sm:px-4 md:p-5 font-bold text-slate-800 break-words">{product.name}</td>
                    <td className="py-4 px-2 sm:px-4 md:p-5 text-center whitespace-nowrap">{editingStockId === product.id ? (<input type="number" className="w-full max-w-[100px] p-2 border-2 border-blue-200 rounded-xl text-center text-sm font-black focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-inner" value={newStock} onChange={e => setNewStock(e.target.value)} disabled={isProcessing} /> ) : (<span className={`px-4 py-2 rounded-xl text-xs md:text-sm font-black tracking-wide border shadow-sm ${stockAmount <= 5 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{stockAmount} ชิ้น</span>)}</td>
                    {!isExecutiveView && canEditTab('stock') && (<td className="py-4 px-2 sm:px-4 md:p-5 text-right space-x-2 whitespace-nowrap">{editingStockId === product.id ? (<><button onClick={() => handleSaveStock(product.id)} disabled={isProcessing} className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-2 rounded-xl transition shadow-sm active:scale-95"><Save size={18} /></button><button onClick={() => setEditingStockId(null)} disabled={isProcessing} className="text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 p-2 rounded-xl transition shadow-sm active:scale-95"><X size={18} /></button></>) : (<button onClick={() => { setEditingStockId(product.id); setNewStock(stockAmount); }} className="text-blue-600 hover:bg-blue-50 border border-blue-100 p-2 rounded-xl transition shadow-sm active:scale-95"><Edit2 size={18} /></button>)}</td>)}
                  </tr>
                )})}
                {filteredAndSortedProducts.length === 0 && (<tr><td colSpan={isExecutiveView || !canEditTab('stock') ? 3 : 4} className="text-center p-12 text-slate-400 font-bold text-sm bg-slate-50/50">ไม่พบข้อมูลสินค้าที่ค้นหา</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const UsersManagementView = () => {
    // ... [โค้ดส่วน UsersManagementView เหมือนเดิม] ...
    const [isEditing, setIsEditing] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', password: '', role: 'staff', permissions: defaultPermissions });
    const [isAdding, setIsAdding] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePermissionChange = (perm) => {
      setEditForm(prev => {
        const newPerms = { ...prev.permissions, [perm]: !prev.permissions[perm] };
        if (perm === 'dashboard' && !newPerms.dashboard) newPerms.dashboardExport = false;
        if (perm === 'products' && !newPerms.products) { newPerms.productsEdit = false; newPerms.productsExport = false; }
        if (perm === 'stock' && !newPerms.stock) { newPerms.stockEdit = false; newPerms.stockExport = false; }
        if (perm === 'history' && !newPerms.history) newPerms.historyEdit = false;
        return { ...prev, permissions: newPerms };
      });
    };

    const handleSave = async (id) => {
      setIsProcessing(true);
      try {
        await updateDoc(doc(db, "users", id), { password: editForm.password, role: editForm.role, permissions: editForm.permissions || defaultPermissions });
        setIsEditing(null);
      } catch (error) { alert("Error: " + error.message); }
      setIsProcessing(false);
    };

    const handleAdd = async () => {
      if (!editForm.username || !editForm.password) { alert('กรุณากรอกข้อมูลให้ครบ'); return; }
      if (users.find(u => u.username === editForm.username)) { alert('ชื่อนี้มีอยู่แล้ว'); return; }
      setIsProcessing(true);
      try {
        await addDoc(collection(db, "users"), { username: editForm.username, password: editForm.password, role: editForm.role, permissions: editForm.permissions || defaultPermissions });
        setIsAdding(false); setEditForm({ username: '', password: '', role: 'staff', permissions: defaultPermissions });
      } catch(error) { alert("Error: " + error.message); }
      setIsProcessing(false);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100">
          <div><h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">การจัดการผู้ใช้</h2><p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">ตั้งค่ารหัสผ่าน และกำหนดสิทธิ์การเข้าถึงเมนูต่างๆ ของพนักงาน</p></div>
          {!isAdding && <button onClick={() => { setIsAdding(true); setEditForm({username:'', password:'', role:'staff', permissions: defaultPermissions}); setIsEditing(null); }} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl flex items-center space-x-2 text-sm font-black w-full sm:w-auto justify-center shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all"><Plus size={18} /><span>เพิ่มผู้ใช้</span></button>}
        </div>
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100 text-xs md:text-sm uppercase tracking-wider"><th className="p-4 md:p-5 font-bold">Username</th><th className="p-4 md:p-5 font-bold">รหัสผ่าน</th><th className="p-4 md:p-5 font-bold">ระดับสิทธิ์</th><th className="p-4 md:p-5 font-bold">ตั้งค่าความสามารถ (Permissions)</th><th className="p-4 md:p-5 font-bold text-right">จัดการ</th></tr>
            </thead>
            <tbody className="text-sm md:text-base">
              {isAdding && (
                <tr className="bg-blue-50/60 align-top shadow-inner border-b border-blue-100">
                  <td className="p-4"><input className="p-2.5 border-2 border-blue-200 rounded-xl w-full text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="ชื่อ..." value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} disabled={isProcessing} /></td>
                  <td className="p-4"><input className="p-2.5 border-2 border-blue-200 rounded-xl w-full text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="รหัสผ่าน..." value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} disabled={isProcessing} /></td>
                  <td className="p-4"><select className="p-2.5 border-2 border-blue-200 rounded-xl w-full text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} disabled={isProcessing}><option value="staff">พนักงาน (Staff)</option><option value="admin">ผู้ดูแล (Admin)</option></select></td>
                  <td className="p-4">
                    {editForm.role === 'admin' ? (<span className="text-purple-700 font-black bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg shadow-sm">เข้าถึงได้ทุกเมนู (Admin)</span>) : (
                      <div className="flex flex-col space-y-3">
                        <span className="text-slate-600 font-bold flex items-center text-xs"><ShieldCheck size={16} className="mr-1.5 text-blue-500"/>เลือกเมนูที่อนุญาต:</span>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm"><label className="flex items-center space-x-2 font-bold mb-1.5 text-sm cursor-pointer"><input type="checkbox" checked={editForm.permissions.dashboard || false} onChange={()=>handlePermissionChange('dashboard')} className="rounded text-blue-600 w-4 h-4"/> <span className="text-slate-800">Dashboard</span></label><div className="ml-6"><label className="flex items-center space-x-2 text-xs text-slate-500 font-medium cursor-pointer"><input type="checkbox" checked={editForm.permissions.dashboardExport || false} onChange={()=>handlePermissionChange('dashboardExport')} disabled={!editForm.permissions.dashboard} className="rounded text-emerald-500 w-3.5 h-3.5"/> <span>ส่งออก Excel ได้</span></label></div></div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm"><label className="flex items-center space-x-2 font-bold mb-1.5 text-sm cursor-pointer"><input type="checkbox" checked={editForm.permissions.products || false} onChange={()=>handlePermissionChange('products')} className="rounded text-blue-600 w-4 h-4"/> <span className="text-slate-800">การจัดการสินค้า</span></label><div className="ml-6 flex flex-wrap gap-3"><label className="flex items-center space-x-2 text-xs text-slate-500 font-medium cursor-pointer"><input type="checkbox" checked={editForm.permissions.productsEdit || false} onChange={()=>handlePermissionChange('productsEdit')} disabled={!editForm.permissions.products} className="rounded text-orange-500 w-3.5 h-3.5"/> <span>เพิ่ม/ลบ/แก้ไข ได้</span></label><label className="flex items-center space-x-2 text-xs text-slate-500 font-medium cursor-pointer"><input type="checkbox" checked={editForm.permissions.productsExport || false} onChange={()=>handlePermissionChange('productsExport')} disabled={!editForm.permissions.products} className="rounded text-emerald-500 w-3.5 h-3.5"/> <span>ส่งออก Excel ได้</span></label></div></div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm"><label className="flex items-center space-x-2 font-bold mb-1.5 text-sm cursor-pointer"><input type="checkbox" checked={editForm.permissions.stock || false} onChange={()=>handlePermissionChange('stock')} className="rounded text-blue-600 w-4 h-4"/> <span className="text-slate-800">สต๊อกสินค้า</span></label><div className="ml-6 flex flex-wrap gap-3"><label className="flex items-center space-x-2 text-xs text-slate-500 font-medium cursor-pointer"><input type="checkbox" checked={editForm.permissions.stockEdit || false} onChange={()=>handlePermissionChange('stockEdit')} disabled={!editForm.permissions.stock} className="rounded text-orange-500 w-3.5 h-3.5"/> <span>อัปเดตตัวเลขได้</span></label><label className="flex items-center space-x-2 text-xs text-slate-500 font-medium cursor-pointer"><input type="checkbox" checked={editForm.permissions.stockExport || false} onChange={()=>handlePermissionChange('stockExport')} disabled={!editForm.permissions.stock} className="rounded text-emerald-500 w-3.5 h-3.5"/> <span>ส่งออก Excel ได้</span></label></div></div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm"><label className="flex items-center space-x-2 font-bold mb-1.5 text-sm cursor-pointer"><input type="checkbox" checked={editForm.permissions.history || false} onChange={()=>handlePermissionChange('history')} className="rounded text-blue-600 w-4 h-4"/> <span className="text-slate-800">ประวัติการขาย</span></label><div className="ml-6"><label className="flex items-center space-x-2 text-xs text-slate-500 font-medium cursor-pointer"><input type="checkbox" checked={editForm.permissions.historyEdit || false} onChange={()=>handlePermissionChange('historyEdit')} disabled={!editForm.permissions.history} className="rounded text-orange-500 w-3.5 h-3.5"/> <span>แก้ไข/ลบออเดอร์ ได้</span></label></div></div>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap space-x-2"><button onClick={handleAdd} disabled={isProcessing} className="text-emerald-600 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 p-2.5 rounded-xl transition shadow-sm active:scale-95"><Save size={20} /></button><button onClick={() => setIsAdding(false)} disabled={isProcessing} className="text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 p-2.5 rounded-xl transition shadow-sm active:scale-95"><X size={20} /></button></td>
                </tr>
              )}
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 align-top transition-colors">
                  <td className="p-4 md:p-5 font-black text-slate-800 pt-6">{u.username}</td>
                  <td className="p-4 md:p-5 pt-5">{isEditing === u.id ? (<input className="p-2 border-2 border-blue-200 rounded-xl w-full text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} disabled={isProcessing} />) : (<span className="text-slate-400 tracking-widest text-lg">••••••</span>)}</td>
                  <td className="p-4 md:p-5 pt-5">{isEditing === u.id ? (<select className="p-2 border-2 border-blue-200 rounded-xl w-full text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} disabled={isProcessing}><option value="staff">พนักงาน (Staff)</option><option value="admin">ผู้ดูแล (Admin)</option></select>) : (<span className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider border shadow-sm ${u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{u.role.toUpperCase()}</span>)}</td>
                  <td className="p-4 md:p-5">
                    {isEditing === u.id ? (editForm.role === 'admin' ? (<span className="text-purple-700 font-black bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg text-xs mt-2 inline-block shadow-sm">เข้าถึงได้ทุกเมนู (Admin)</span>) : (
                        <div className="flex flex-col space-y-3 mt-1">
                          <span className="text-slate-600 font-bold flex items-center text-xs"><ShieldCheck size={16} className="mr-1.5 text-blue-500"/>เลือกเมนูที่อนุญาต:</span>
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm"><label className="flex items-center space-x-2 font-bold mb-1.5 text-sm cursor-pointer"><input type="checkbox" checked={editForm.permissions.dashboard || false} onChange={()=>handlePermissionChange('dashboard')} className="rounded text-blue-600 w-4 h-4"/> <span className="text-slate-800">Dashboard</span></label><div className="ml-6"><label className="flex items-center space-x-2 text-xs text-slate-500 font-medium cursor-pointer"><input type="checkbox" checked={editForm.permissions.dashboardExport || false} onChange={()=>handlePermissionChange('dashboardExport')} disabled={!editForm.permissions.dashboard} className="rounded text-emerald-500 w-3.5 h-3.5"/> <span>ส่งออก Excel ได้</span></label></div></div>
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm"><label className="flex items-center space-x-2 font-bold mb-1.5 text-sm cursor-pointer"><input type="checkbox" checked={editForm.permissions.products || false} onChange={()=>handlePermissionChange('products')} className="rounded text-blue-600 w-4 h-4"/> <span className="text-slate-800">การจัดการสินค้า</span></label><div className="ml-6 flex flex-wrap gap-3"><label className="flex items-center space-x-2 text-xs text-slate-500 font-medium cursor-pointer"><input type="checkbox" checked={editForm.permissions.productsEdit || false} onChange={()=>handlePermissionChange('productsEdit')} disabled={!editForm.permissions.products} className="rounded text-orange-500 w-3.5 h-3.5"/> <span>เพิ่ม/ลบ/แก้ไข ได้</span></label><label className="flex items-center space-x-2 text-xs text-slate-500 font-medium cursor-pointer"><input type="checkbox" checked={editForm.permissions.productsExport || false} onChange={()=>handlePermissionChange('productsExport')} disabled={!editForm.permissions.products} className="rounded text-emerald-500 w-3.5 h-3.5"/> <span>ส่งออก Excel ได้</span></label></div></div>
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm"><label className="flex items-center space-x-2 font-bold mb-1.5 text-sm cursor-pointer"><input type="checkbox" checked={editForm.permissions.stock || false} onChange={()=>handlePermissionChange('stock')} className="rounded text-blue-600 w-4 h-4"/> <span className="text-slate-800">สต๊อกสินค้า</span></label><div className="ml-6 flex flex-wrap gap-3"><label className="flex items-center space-x-2 text-xs text-slate-500 font-medium cursor-pointer"><input type="checkbox" checked={editForm.permissions.stockEdit || false} onChange={()=>handlePermissionChange('stockEdit')} disabled={!editForm.permissions.stock} className="rounded text-orange-500 w-3.5 h-3.5"/> <span>อัปเดตตัวเลขได้</span></label><label className="flex items-center space-x-2 text-xs text-slate-500 font-medium cursor-pointer"><input type="checkbox" checked={editForm.permissions.stockExport || false} onChange={()=>handlePermissionChange('stockExport')} disabled={!editForm.permissions.stock} className="rounded text-emerald-500 w-3.5 h-3.5"/> <span>ส่งออก Excel ได้</span></label></div></div>
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm"><label className="flex items-center space-x-2 font-bold mb-1.5 text-sm cursor-pointer"><input type="checkbox" checked={editForm.permissions.history || false} onChange={()=>handlePermissionChange('history')} className="rounded text-blue-600 w-4 h-4"/> <span className="text-slate-800">ประวัติการขาย</span></label><div className="ml-6"><label className="flex items-center space-x-2 text-xs text-slate-500 font-medium cursor-pointer"><input type="checkbox" checked={editForm.permissions.historyEdit || false} onChange={()=>handlePermissionChange('historyEdit')} disabled={!editForm.permissions.history} className="rounded text-orange-500 w-3.5 h-3.5"/> <span>แก้ไข/ลบออเดอร์ ได้</span></label></div></div>
                        </div>
                      )
                    ) : (u.role === 'admin' ? (<span className="text-purple-700 font-black bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs mt-1.5 inline-block shadow-sm">เข้าถึงได้ทุกเมนู (Admin)</span>) : (
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-[10px] md:text-xs px-2.5 py-1 rounded-lg shadow-sm">ขาย (POS)</span>
                          {u.permissions?.dashboard && <span className="bg-slate-50 text-slate-600 border border-slate-200 font-bold text-[10px] md:text-xs px-2.5 py-1 rounded-lg">Dashboard</span>}
                          {u.permissions?.products && <span className="bg-slate-50 text-slate-600 border border-slate-200 font-bold text-[10px] md:text-xs px-2.5 py-1 rounded-lg">การจัดการสินค้า</span>}
                          {u.permissions?.stock && <span className="bg-slate-50 text-slate-600 border border-slate-200 font-bold text-[10px] md:text-xs px-2.5 py-1 rounded-lg">สต๊อกสินค้า</span>}
                          {u.permissions?.history && <span className="bg-slate-50 text-slate-600 border border-slate-200 font-bold text-[10px] md:text-xs px-2.5 py-1 rounded-lg">ประวัติการขาย</span>}
                        </div>
                      )
                    )}
                  </td>
                  <td className="p-4 md:p-5 text-right space-x-2 whitespace-nowrap pt-5">
                    {isEditing === u.id ? (<><button onClick={() => handleSave(u.id)} disabled={isProcessing} className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-2.5 rounded-xl transition shadow-sm active:scale-95"><Save size={20} /></button><button onClick={() => setIsEditing(null)} disabled={isProcessing} className="text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 p-2.5 rounded-xl transition shadow-sm active:scale-95"><X size={20} /></button></>) : (<><button onClick={() => { setIsEditing(u.id); setEditForm({username: u.username, password: u.password, role: u.role, permissions: u.permissions || defaultPermissions}); }} className="text-blue-600 bg-white hover:bg-blue-50 border border-blue-100 p-2.5 rounded-xl transition shadow-sm active:scale-95"><Edit2 size={20} /></button><button onClick={async () => { if(confirm('ลบผู้ใช้นี้ออกจากระบบ?')) await deleteDoc(doc(db, "users", u.id)); }} className={`text-red-500 bg-white hover:bg-red-50 border border-red-100 p-2.5 rounded-xl transition shadow-sm active:scale-95 ${u.id === loggedInUser.id ? 'opacity-0 pointer-events-none' : ''}`}><Trash2 size={20} /></button></>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ==========================================
  // 🎨 5. โครงสร้างหน้าจอหลัก (Main Layout Render)
  // ==========================================
  if (!isUsersLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col space-y-5 font-sans px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-100 rounded-full blur-3xl -ml-20 -mb-20"></div>
        <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-500/30 z-10"></div>
        <p className="text-slate-600 text-sm md:text-base font-bold tracking-wide z-10">กำลังเตรียมระบบ The Resilient Clinic...</p>
        {loadError && (<div className="mt-4 p-4 bg-red-50/80 backdrop-blur-sm text-red-600 rounded-2xl max-w-sm border border-red-200 shadow-sm text-sm z-10"><p className="font-black mb-1">พบปัญหาการเชื่อมต่อ</p><p className="font-medium">{loadError}</p></div>)}
      </div>
    );
  }

  // หน้าต่างสำหรับผู้บริหาร (Executive view)
  if (isExecutiveView) {
    return (
      <div className="min-h-screen bg-slate-50/50 font-sans flex flex-col">
        <style>{`input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`}</style>
        <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 z-10 sticky top-0">
          <div className="p-4 md:p-6 flex flex-col items-center justify-center space-y-4 max-w-5xl mx-auto w-full">
            <div className="flex items-center space-x-3"><ResilientLogo className="h-14 md:h-16 rounded-2xl shadow-sm px-4 w-[200px] md:w-[250px]" /></div>
            <div className="flex space-x-2 w-full max-w-sm bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200 shadow-inner">
               <button onClick={() => setActiveTab('dashboard')} className={`flex-1 flex items-center justify-center space-x-2 px-3 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}><LayoutDashboard size={18} /><span>Dashboard</span></button>
               <button onClick={() => setActiveTab('stock')} className={`flex-1 flex items-center justify-center space-x-2 px-3 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'stock' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}><Boxes size={18} /><span>สต๊อกสินค้า</span></button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 md:p-8 pb-24">
          <div className="max-w-5xl mx-auto space-y-6 relative">
            <div className="flex items-center mb-2"><div className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full text-xs md:text-sm font-black flex items-center shadow-sm tracking-wide"><span className="text-amber-500 mr-2 text-lg leading-none">👑</span> Executive View</div></div>
            {activeTab === 'dashboard' && <DashboardView />}{activeTab === 'stock' && <StockView />}
          </div>
        </div>
      </div>
    );
  }

  if (!loggedInUser && !isExecutiveView) return <LoginView />;

  // 🎨 กำหนด Style ของปุ่มเมนู
  const navItemBaseStyle = "snap-start flex-shrink-0 flex items-center space-x-3 w-auto md:w-full px-4 py-3 md:py-4 rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base group border border-transparent";
  const navItemActiveStyle = "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-lg shadow-blue-500/20 transform md:scale-105 border-transparent";
  const navItemInactiveStyle = "text-slate-600 hover:bg-white hover:text-blue-600 font-bold hover:shadow-sm hover:border-slate-100";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans w-full overflow-hidden">
      <style>{`input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`}</style>
      
      {/* 🚀 แก้ไขข้อ 3 (ส่วนที่ 2): ปรับ z-index ของ Sidebar เป็น z-10 เพื่อให้เนื้อหาหลักซ้อนทับได้ */}
      <div className="w-full md:w-72 bg-slate-50/80 backdrop-blur-xl border-b md:border-r border-slate-200 flex-shrink-0 z-10 relative overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="relative z-10 flex flex-col h-full">
          <div className="p-5 md:p-6 flex items-center justify-center border-b border-slate-200/60"><ResilientLogo className="h-16 w-full rounded-2xl shadow-sm" /></div>
          <nav className="px-4 py-5 space-x-2 md:space-x-0 md:space-y-2 flex md:flex-col overflow-x-auto md:overflow-visible scrollbar-hide snap-x">
            {canAccess('dashboard') && <button onClick={() => setActiveTab('dashboard')} className={`${navItemBaseStyle} ${activeTab === 'dashboard' ? navItemActiveStyle : navItemInactiveStyle}`}><LayoutDashboard size={22} className={activeTab !== 'dashboard' && "text-slate-400 group-hover:text-blue-500 transition-colors"}/><span>Dashboard</span></button>}
            {canAccess('products') && <button onClick={() => setActiveTab('products')} className={`${navItemBaseStyle} ${activeTab === 'products' ? navItemActiveStyle : navItemInactiveStyle}`}><Package size={22} className={activeTab !== 'products' && "text-slate-400 group-hover:text-blue-500 transition-colors"}/><span>การจัดการสินค้า</span></button>}
            {canAccess('stock') && <button onClick={() => setActiveTab('stock')} className={`${navItemBaseStyle} ${activeTab === 'stock' ? navItemActiveStyle : navItemInactiveStyle}`}><Boxes size={22} className={activeTab !== 'stock' && "text-slate-400 group-hover:text-blue-500 transition-colors"}/><span>สต๊อกสินค้า</span></button>}
            {canAccess('users') && <button onClick={() => setActiveTab('users')} className={`${navItemBaseStyle} ${activeTab === 'users' ? navItemActiveStyle : navItemInactiveStyle}`}><Users size={22} className={activeTab !== 'users' && "text-slate-400 group-hover:text-blue-500 transition-colors"}/><span>การจัดการผู้ใช้</span></button>}
            {canAccess('history') && <button onClick={() => setActiveTab('history')} className={`${navItemBaseStyle} ${activeTab === 'history' ? navItemActiveStyle : navItemInactiveStyle}`}><History size={22} className={activeTab !== 'history' && "text-slate-400 group-hover:text-blue-500 transition-colors"}/><span>ประวัติการขาย</span></button>}
            {canAccess('sales') && <button onClick={() => setActiveTab('sales')} className={`${navItemBaseStyle} ${activeTab === 'sales' ? navItemActiveStyle : navItemInactiveStyle}`}><ShoppingCart size={22} className={activeTab !== 'sales' && "text-slate-400 group-hover:text-blue-500 transition-colors"}/><span>บันทึกการขาย (POS)</span></button>}
          </nav>
        </div>
      </div>

      {/* 🚀 แก้ไขข้อ 3 (ส่วนที่ 3): ปรับ Main Panel เป็น z-20 เพื่อให้มันและลูกๆ (เช่น Modal) ซ้อนทับเหนือ Sidebar */}
      <div className="flex-1 flex flex-col h-[calc(100vh-120px)] md:h-screen overflow-hidden relative z-20 w-full bg-slate-50/50">
        <header className="bg-white/80 backdrop-blur-xl h-20 border-b border-slate-200 flex items-center justify-between px-6 md:px-8 flex-shrink-0 shadow-sm z-10 w-full">
          <div className="text-slate-800 font-black text-lg hidden sm:block tracking-wide">
            {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'products' ? 'การจัดการสินค้า' : activeTab === 'stock' ? 'สต๊อกสินค้า' : activeTab === 'users' ? 'การจัดการผู้ใช้' : activeTab === 'history' ? 'ประวัติการขาย' : 'บันทึกการขาย (POS)'}
          </div>
          <div className="flex items-center space-x-3 md:space-x-4 ml-auto w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center space-x-2.5 text-sm text-slate-700 bg-white shadow-sm py-2 px-4 rounded-full border border-slate-200"><User size={16} className="text-blue-600" /><span className="font-black">{loggedInUser.username}</span><span className="text-slate-400 font-bold text-xs uppercase tracking-wider ml-1 px-2 py-0.5 bg-slate-100 rounded-md">({loggedInUser.role === 'admin' ? 'Admin' : 'Staff'})</span></div>
            <button onClick={() => { setLoggedInUser(null); setActiveTab('sales'); }} className="flex items-center space-x-2 text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 px-4 py-2 rounded-xl transition-all text-sm font-black shadow-sm" title="ออกจากระบบ"><LogOut size={18} /> <span className="sm:hidden">ออกระบบ</span></button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 pb-32 relative w-full">
          <div className="max-w-6xl mx-auto w-full">
            {activeTab === 'dashboard' && canAccess('dashboard') && <DashboardView />}
            {activeTab === 'products' && canAccess('products') && <ProductsView />}
            {activeTab === 'stock' && canAccess('stock') && <StockView />}
            {activeTab === 'users' && canAccess('users') && <UsersManagementView />}
            {activeTab === 'history' && canAccess('history') && <SalesHistoryView />}
            {activeTab === 'sales' && canAccess('sales') && <SalesView />}
          </div>
        </main>
      </div>
    </div>
  );
}