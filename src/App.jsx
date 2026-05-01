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
  <div className={`bg-[#0A142A] flex items-center justify-center overflow-hidden ${className}`}>
    <svg viewBox="0 0 320 100" className="h-full w-auto py-2" fill="none" xmlns="http://www.w3.org/2000/svg">
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

const STORE_OPTIONS = ['Shopee(Re)', 'Shopee(Long)', 'Lazada(Re)', 'Lazada(Long)'];

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
          id: key,
          date: sale.date,
          orderId: sale.orderId,
          store: sale.store,
          soldBy: sale.soldBy,
          items: [],
          totalOrderValue: 0,
          totalItems: 0
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 md:p-10 space-y-8">
          <div className="text-center space-y-4">
            <ResilientLogo className="mx-auto h-24 md:h-32 rounded-2xl shadow-lg w-full max-w-[320px]" />
            <p className="text-sm md:text-base text-gray-500 font-medium">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center font-bold">{error}</div>}
            <div className="space-y-5">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">ชื่อผู้ใช้งาน</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={18} className="text-gray-400" /></div><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm md:text-base outline-none bg-gray-50 hover:bg-white" placeholder="admin หรือ user" required /></div></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">รหัสผ่าน</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400" /></div><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm md:text-base outline-none bg-gray-50 hover:bg-white" placeholder="••••••" required /></div></div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-xl text-base font-bold transition-all shadow-lg shadow-blue-600/30 transform hover:-translate-y-0.5">เข้าสู่ระบบ</button>
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

      return {
        totalQty: tQty,
        totalRevenue: tRev,
        totalCost: tCost,
        totalProfit: tProfit,
        totalOrders: uniqueOrders.size,
        topProducts: topList
      };
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-md text-white"><BarChart3 size={20} className="md:w-6 md:h-6" /></div>
            <h2 className="text-base md:text-xl lg:text-2xl font-extrabold text-gray-800 tracking-tight">สรุปยอดขาย</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
            <div className="flex items-center space-x-1.5 md:space-x-2 bg-slate-50 px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-gray-200">
               <span className="text-xs text-gray-500 font-medium">ร้านค้า</span>
               <select value={filterStore} onChange={e => setFilterStore(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none w-20 md:w-auto font-medium text-gray-700"><option value="all">ทุกร้านค้า</option>{STORE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div className="flex items-center space-x-1.5 md:space-x-2 bg-slate-50 px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-gray-200">
               <span className="text-xs text-gray-500 font-medium">สินค้า</span>
               <select value={filterProductId} onChange={e => setFilterProductId(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none w-20 md:w-auto font-medium text-gray-700"><option value="all">ดูทั้งหมด</option>{products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}</select>
            </div>
            <div className="flex items-center space-x-1.5 md:space-x-2 bg-slate-50 px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-gray-200">
               <span className="text-xs text-gray-500 font-medium">ดูแบบ</span>
               <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none font-medium text-gray-700"><option value="daily">รายวัน</option><option value="monthly">รายเดือน</option><option value="yearly">รายปี</option><option value="all">ยอดรวมสะสม</option></select>
            </div>
            {timeframe !== 'all' && (
              <div className="flex items-center space-x-1.5 md:space-x-2 bg-blue-50 px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-blue-100">
                {timeframe === 'daily' && <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none text-blue-700 font-medium" />}
                {timeframe === 'monthly' && <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none text-blue-700 font-medium" />}
                {timeframe === 'yearly' && <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none text-blue-700 font-medium">{yearOptions.map(y => <option key={y} value={y}>ปี {y}</option>)}</select>}
              </div>
            )}
            {canExportTab('dashboard') && (<button onClick={exportDashboardToExcel} className="flex flex-1 lg:flex-none justify-center items-center space-x-1.5 md:space-x-2 bg-green-600 text-white px-3 py-1.5 md:px-4 md:py-2.5 rounded-md md:rounded-lg hover:bg-green-700 transition-colors shadow-sm text-xs md:text-sm font-medium"><Download size={14} className="md:w-4 md:h-4" /><span>ส่งออก Excel</span></button>)}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
            <h3 className="font-bold text-gray-500 text-xs md:text-sm flex items-center mb-1"><TrendingUp size={14} className="mr-1.5 text-blue-500"/> ยอดขาย</h3>
            <p className="text-xl md:text-2xl font-black text-gray-800 mt-2">฿{formatMoney(dashboardStats.totalRevenue)}</p>
            <p className="text-[10px] md:text-xs text-gray-400 mt-1">{dashboardStats.totalOrders} ออเดอร์ ({dashboardStats.totalQty} ชิ้น)</p>
          </div>
          <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
            <h3 className="font-bold text-gray-500 text-xs md:text-sm flex items-center mb-1"><Package size={14} className="mr-1.5 text-orange-500"/> ต้นทุนสินค้ารวม</h3>
            <p className="text-xl md:text-2xl font-black text-gray-800 mt-2">฿{formatMoney(dashboardStats.totalCost)}</p>
            <p className="text-[10px] md:text-xs text-gray-400 mt-1">คำนวณจากราคาคลินิก</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 md:p-5 rounded-lg md:rounded-xl shadow-sm border border-green-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <h3 className="font-bold text-green-800 text-xs md:text-sm flex items-center mb-1"><ShoppingCart size={14} className="mr-1.5"/> จำนวนออเดอร์</h3>
            <p className="text-xl md:text-2xl font-black text-green-700 mt-2">{dashboardStats.totalOrders} ออเดอร์</p>
            <p className="text-[10px] md:text-xs text-green-600/70 mt-1 font-medium">รวมทั้งหมด {dashboardStats.totalQty} ชิ้น</p>
          </div>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 flex items-center space-x-2">
            <CalendarDays size={18} className="text-gray-400"/>
            <h3 className="text-sm md:text-lg font-semibold text-gray-800">สินค้าขายดี</h3>
          </div>
          <div className="p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {dashboardStats.topProducts.map((p, index) => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2 md:space-x-3"><span className="text-gray-400 font-bold w-4 text-xs md:text-sm">{index + 1}.</span><span className="font-medium text-gray-700 text-xs md:text-base">{p.name}</span></div>
                  <div className="flex items-center space-x-3 md:space-x-4 ml-6 sm:ml-0"><span className="text-xs md:text-sm text-gray-500 whitespace-nowrap font-medium">ขายแล้ว <strong className="text-blue-600">{p.qty}</strong> ชิ้น</span><div className="w-24 md:w-32 h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(p.qty / (dashboardStats.topProducts[0]?.qty || 1)) * 100}%` }}></div></div></div>
                </div>
              ))}
              {dashboardStats.topProducts.length === 0 && <p className="text-gray-500 text-xs md:text-sm text-center py-6 bg-gray-50 rounded-lg">ไม่มีข้อมูลการขายในเงื่อนไขที่คุณเลือก</p>}
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
      if (scanMode !== 'ocr_camera') {
         stopCamera();
      }
      return () => stopCamera();
    }, [scanMode]);

    // 🚀 เปิดกล้องสำหรับ OCR (Notebook/Mobile)
    const startOcrCamera = async () => {
      setScanMode('ocr_camera');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
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
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
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
      reader.onload = (event) => {
        const imageData = event.target.result;
        processOcrImage(imageData);
      };
      reader.readAsDataURL(file);
    };

    // 🚀 แกนหลักการทำงาน OCR
    const processOcrImage = async (imageData) => {
      setIsOcrProcessing(true);
      setOcrStatus('กำลังโหลดโมเดล AI...');
      stopCamera(); 

      try {
        const result = await Tesseract.recognize(imageData, 'tha+eng', {
          logger: m => {
             if (m.status === 'recognizing text') {
                setOcrStatus(`กำลังวิเคราะห์รูปภาพ... ${Math.round(m.progress * 100)}%`);
             }
          }
        });
        
        const extractedText = result.data.text;
        handleSmartExtract(extractedText);
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านข้อความจาก AI');
        setScanMode(null);
      }
      setIsOcrProcessing(false);
    };

    const filteredProductsForSelect = useMemo(() => {
      if (!productSearchTerm) return products;
      return products.filter(p => String(p?.name || '').toLowerCase().includes(String(productSearchTerm || '').toLowerCase()));
    }, [products, productSearchTerm]);

    // 🚀 ฟังก์ชันดึงข้อมูลจากข้อความอัจฉริยะ (Smart Extract) 
    const handleSmartExtract = (text) => {
      setSmartText(text);
      let foundOrder = false;

      // หารหัสออเดอร์
      const orderMatch = text.match(/(?:คำสั่งซื้อ|คำสังซื้อ|คําสั่งซื่อ|Order No\.?|Order ID|Order)[:\s]*([A-Z0-9_-]+)/i) || text.match(/(260[A-Z0-9]+)/i); 
      if (orderMatch && orderMatch[1]) {
          setOrderId(orderMatch[1].trim());
          foundOrder = true;
      }

      if (foundOrder) {
          setTimeout(() => {
             setScanMode(null);
             setSmartText('');
          }, 800); 
      } else {
          setScanMode('text'); 
      }
    };

    const addToCart = (product) => {
      const stockAmount = Number(product.stock) || 0;
      if (stockAmount <= 0) return;

      if (stockAmount <= 5) {
         alert(`⚠️ เตือน: สินค้า "${product.name}" ใกล้หมด!\nคงเหลือเพียง ${stockAmount} ชิ้น`);
      }

      const existingItem = cart.find(item => item.productId === product.id);
      if (existingItem) {
        setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      } else {
        setCart([...cart, { productId: product.id, name: product.name, price: Number(product.price) || 0, quantity: 1, stock: product.stock }]);
      }
      setIsDropdownOpen(false);
      setProductSearchTerm('');
    };

    const updateCartItem = (productId, field, value) => {
      setCart(cart.map(item => {
        if (item.productId === productId) {
          return { ...item, [field]: value };
        }
        return item;
      }));
    };
    
    const removeFromCart = (productId) => { setCart(cart.filter(item => item.productId !== productId)); };

    const posTotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const finalTotal = customGrandTotal !== '' ? Number(customGrandTotal) : posTotal;

    // 🚀 กรองข้อมูลออเดอร์ของวันนี้ และจัดกลุ่มตาม Transaction
    const recentSalesFlat = sales.filter(s => getLocalISODate(s.date) === getLocalISODate());
    
    // 💡 การแก้ไขจุดสำคัญ: เก็บค่ารวมทั้งหมดก่อน แล้วค่อย slice ไปแสดงผล
    const allGroupedRecentSales = groupSalesByTransaction(recentSalesFlat);
    const totalTodayOrders = allGroupedRecentSales.length; 
    const groupedRecentSales = allGroupedRecentSales.slice(0, 5); 

    const handleCheckoutPreflight = (e) => {
      e.preventDefault();
      if (cart.length === 0) { setIsError(true); setMessage('กรุณาเพิ่มสินค้าลงตะกร้าอย่างน้อย 1 รายการ'); return; }
      if (!selectedStore) { setIsError(true); setMessage('กรุณาเลือกร้านค้า'); return; }
      if (!orderId || orderId.trim() === '') { setIsError(true); setMessage('กรุณาระบุ รหัสออเดอร์ / คำสั่งซื้อ'); return; } 
      for (const item of cart) {
         if (Number(item.quantity) < 1) { setIsError(true); setMessage(`จำนวนของ ${item.name} ต้องมากกว่า 0`); return; }
      }
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
             const item = cart[i];
             const pData = productDocs[item.productId].data;
             const pRef = productDocs[item.productId].ref;
             const itemCost = Number(pData.cost) || 0;
             
             const isLastItem = i === cart.length - 1;
             const baseItemTotal = Number(item.price) * Number(item.quantity);
             let rowTotal = 0;
             if (isLastItem) {
                 rowTotal = remainingTotal;
             } else {
                 rowTotal = Math.round((baseItemTotal * ratio) * 100) / 100;
                 remainingTotal -= rowTotal;
             }
             const unitPrice = Number(item.quantity) > 0 ? (rowTotal / Number(item.quantity)) : 0;
             
             transaction.update(pRef, { 
               stock: Number(pData.stock) - Number(item.quantity), 
               updatedAt: new Date().toISOString() 
             });

             const salesRef = doc(collection(db, "sales"));
             transaction.set(salesRef, {
               orderId: orderId || '-', 
               customerName: '-', 
               store: selectedStore,
               productId: item.productId, 
               quantity: Number(item.quantity), 
               total: rowTotal, 
               unitPrice: unitPrice,         
               unitCost: itemCost, 
               date: checkoutTime, 
               soldBy: loggedInUser?.username || 'unknown'
             });

             totalOrderRevenue += rowTotal;
             totalOrderProfit += (rowTotal - (itemCost * Number(item.quantity)));
          }

          transaction.set(summaryRef, {
            totalRevenue: increment(totalOrderRevenue),
            totalProfit: increment(totalOrderProfit),
            totalOrders: increment(1),
            date: todayStr
          }, { merge: true });

          transaction.set(doc(collection(db, "audit_logs")), {
            action: "CREATE_ORDER",
            user: loggedInUser?.username || 'unknown',
            details: `สร้างออเดอร์ ${orderId||'ไม่มี ID'} ยอด ${totalOrderRevenue} (รวม ${cart.length} รายการย่อย)`,
            timestamp: new Date().toISOString()
          });
        });
        
        setCart([]); setOrderId(''); setCustomGrandTotal(''); setShowConfirmModal(false);
        setIsError(false); setMessage('บันทึกออเดอร์สำเร็จ!'); setTimeout(() => setMessage(''), 3000);
      } catch (err) { 
        setShowConfirmModal(false);
        setMessage(err.message); setIsError(true); 
      }
      setIsProcessing(false);
    };

    return (
      <div className="relative space-y-6 md:space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300 w-full">
        <div className="absolute inset-0 bg-[#f4f7ff] -z-20 rounded-[3rem]"></div>
        
        {/* Modal ยืนยันทำรายการ */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 w-full h-full">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">
               <div className="bg-blue-600 p-4 md:p-5 text-center text-white shrink-0">
                  <h3 className="text-lg md:text-xl font-bold">ยืนยันการทำรายการขาย</h3>
               </div>
               <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1 w-full">
                  <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <div><span className="text-slate-500 block mb-1">ร้านค้า:</span><span className={`inline-block px-3 py-1 rounded-lg font-bold text-xs md:text-sm ${selectedStore.includes('Shopee') ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{selectedStore}</span></div>
                     <div><span className="text-slate-500 block mb-1">รหัสออเดอร์:</span><span className="font-bold text-slate-800 text-sm md:text-base">{orderId || '-'}</span></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 mb-3 text-base md:text-lg">รายการสินค้า ({cart.length})</h4>
                    <div className="space-y-2 bg-white rounded-xl border border-slate-100 overflow-hidden">
                       {cart.map((item, idx) => (
                          <div key={idx} className="flex flex-row justify-between items-center text-sm p-3 border-b border-slate-50 hover:bg-slate-50 transition">
                             <div className="flex-1 pr-4">
                                <span className="font-bold text-slate-800 break-words text-sm md:text-base">{item.name}</span> 
                                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-black ml-2 text-xs md:text-sm">x{item.quantity}</span>
                             </div>
                             <div className="font-black text-slate-700 shrink-0 text-sm md:text-base">฿{formatMoney(item.price * item.quantity)}</div>
                          </div>
                       ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-end pt-5 border-t border-slate-200 mt-2">
                     <span className="font-bold text-slate-600 mb-1 text-base md:text-lg">ราคารวมสุทธิ:</span>
                     <div className="text-right">
                       {customGrandTotal !== '' && Number(customGrandTotal) !== posTotal && (
                         <div className="text-xs text-slate-400 line-through mb-1">ปกติ ฿{formatMoney(posTotal)}</div>
                       )}
                       <span className="font-black text-blue-600 text-3xl md:text-4xl">฿{formatMoney(finalTotal)}</span>
                     </div>
                  </div>
               </div>
               <div className="p-4 md:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 shrink-0">
                  <button type="button" onClick={() => setShowConfirmModal(false)} className="w-full sm:flex-1 py-3.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition shadow-sm text-sm md:text-base">ยกเลิกแก้ไข</button>
                  <button type="button" onClick={executeCheckout} disabled={isProcessing} className="w-full sm:flex-1 py-3.5 bg-green-600 rounded-xl font-bold text-white hover:bg-green-700 transition shadow-sm flex items-center justify-center text-sm md:text-base">
                    {isProcessing ? 'กำลังบันทึก...' : <><CheckCircle2 size={20} className="mr-2"/> ยืนยันการขาย</>}
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* 🚀 Modal สแกน Barcode และ Smart Extract (กล้อง + เลือกรูป) */}
        {scanMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 w-full h-full">
            <div className="bg-white p-5 md:p-8 rounded-[2rem] w-full max-w-lg space-y-5 shadow-2xl flex flex-col max-h-[90vh]">
               
               <div className="flex bg-slate-100 p-1.5 rounded-xl shrink-0 gap-1">
                  <button onClick={() => setScanMode('camera')} className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-lg flex justify-center items-center ${scanMode === 'camera' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Barcode size={16} className="mr-1.5"/> สแกนโค้ด</button>
                  <button onClick={() => startOcrCamera()} className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-lg flex justify-center items-center ${scanMode === 'ocr_camera' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Camera size={16} className="mr-1.5"/> ดึงด้วย AI</button>
                  <button onClick={() => setScanMode('text')} className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-lg flex justify-center items-center ${scanMode === 'text' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><FileText size={16} className="mr-1.5"/> วางข้อความ</button>
               </div>

               {/* โหมด 1: สแกนบาร์โค้ดปกติ */}
               {scanMode === 'camera' && (
                 <>
                   <div className="text-center">
                      <h3 className="font-black text-xl text-slate-800">สแกน Barcode</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">นำกล้องไปส่องที่บาร์โค้ดใบปะหน้า</p>
                   </div>
                   <div className="rounded-xl overflow-hidden border-4 border-slate-200 bg-black aspect-square w-full relative shrink-0">
                      <Scanner 
                         onResult={(text) => {
                           setOrderId(text);
                           setScanMode(null);
                         }}
                         onError={(error) => console.log(error?.message)}
                      />
                   </div>
                 </>
               )}

               {/* 🚀 โหมด 2: ถ่ายรูป หรือ อัปโหลดรูป ให้ AI อ่านข้อมูล */}
               {scanMode === 'ocr_camera' && (
                 <div className="flex flex-col items-center space-y-4 w-full">
                    <div className="text-center">
                      <h3 className="font-black text-xl text-teal-700">ดึงข้อมูลด้วย AI</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">สามารถถ่ายภาพสด หรือเลือกรูปจากคลังภาพได้เลย</p>
                    </div>
                    
                    {/* ส่วนแสดงวิดีโอจากกล้อง */}
                    <div className="w-full relative rounded-xl overflow-hidden bg-black aspect-video border-4 border-teal-200">
                       <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                       <canvas ref={canvasRef} className="hidden"></canvas>
                       {isOcrProcessing && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4 text-center z-10">
                             <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                             <p className="font-bold text-sm">{ocrStatus}</p>
                          </div>
                       )}
                    </div>

                    {/* ปุ่ม ควบคุม */}
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full">
                       <button 
                          type="button" 
                          onClick={captureAndRead} 
                          disabled={isOcrProcessing}
                          className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center transition disabled:opacity-50"
                       >
                          <Aperture size={20} className="mr-2" /> ถ่ายภาพจากกล้อง
                       </button>
                       
                       <button 
                          type="button" 
                          onClick={() => fileInputRef.current && fileInputRef.current.click()} 
                          disabled={isOcrProcessing}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center transition disabled:opacity-50"
                       >
                          <ImageIcon size={20} className="mr-2" /> เลือกรูปจากคลัง
                       </button>
                       {/* ซ่อน Input File ไว้ เพื่อผูกกับปุ่มด้านบน */}
                       <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={fileInputRef}
                          onChange={handleImageForOcr} 
                       />
                    </div>
                 </div>
               )}

               {/* โหมด 3: ดึงข้อความจากการวาง (Smart Text / Live Text) */}
               {scanMode === 'text' && (
                 <div className="flex-1 flex flex-col min-h-[250px]">
                    <div className="text-center mb-3">
                      <h3 className="font-black text-xl text-purple-700">ดึงข้อมูลอัตโนมัติ</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">คัดลอกข้อความจากรูปภาพ (Live Text / Google Lens) มาวางด้านล่าง</p>
                    </div>
                    <textarea 
                       value={smartText} 
                       onChange={(e) => handleSmartExtract(e.target.value)} 
                       className="w-full flex-1 p-4 border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none text-sm text-slate-700 bg-purple-50/30"
                       placeholder="วางข้อความทั้งหมดที่นี่..."
                       autoFocus
                    ></textarea>
                 </div>
               )}

               <button type="button" onClick={() => { setScanMode(null); setSmartText(''); }} className="w-full py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition shrink-0">ปิดหน้าต่าง</button>
            </div>
          </div>
        )}

        <div className="w-full">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">บันทึกการขาย (POS)</h2>
          </div>

          <form onSubmit={handleCheckoutPreflight} className="space-y-6 md:space-y-8 w-full">
            {message && <div className={`p-4 rounded-xl text-sm font-bold flex items-center justify-center ${isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>{message}</div>}
            
            {/* 🚀 UI เลือกร้านค้าและรหัสออเดอร์ */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-5 w-full max-w-4xl mx-auto">
               <div className="bg-white p-4 md:p-6 rounded-[1.5rem] border border-slate-100 shadow-sm relative overflow-hidden group flex-1">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10 h-full flex flex-col justify-center">
                     <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-gradient-to-br from-orange-400 to-red-500 p-2.5 rounded-xl text-white shadow-md shadow-orange-200">
                           <Store size={22} />
                        </div>
                        <label className="text-lg font-extrabold text-slate-800 tracking-wide">เลือกร้านค้า</label>
                     </div>
                     <div className="grid grid-cols-2 gap-3 w-full">
                        {STORE_OPTIONS.map(s => {
                           const isShopee = s.includes('Shopee');
                           const isLazada = s.includes('Lazada');
                           const isActive = selectedStore === s;
                           
                           let colorClass = "bg-slate-50 text-slate-500 hover:bg-slate-100 border-transparent";
                           if (isActive) {
                              if (isShopee) colorClass = "bg-[#EE4D2D] text-white shadow-lg shadow-[#EE4D2D]/30 border-transparent";
                              else if (isLazada) colorClass = "bg-[#0F146D] text-white shadow-lg shadow-blue-900/30 border-transparent";
                              else colorClass = "bg-blue-600 text-white shadow-lg border-transparent";
                           } else {
                              if (isShopee) colorClass = "bg-[#FFF0ED] text-[#EE4D2D] hover:bg-[#FFE4DF] border-[#FFE4DF]";
                              else if (isLazada) colorClass = "bg-[#F2F3FF] text-[#0F146D] hover:bg-[#E6E8FF] border-[#E6E8FF]";
                           }

                           return (
                             <button type="button" key={s} onClick={() => setSelectedStore(s)} className={`px-2 py-3.5 rounded-xl border-2 text-sm md:text-base font-bold transition-all duration-200 transform active:scale-95 ${colorClass} truncate w-full`}>
                                {s}
                             </button>
                           )
                        })}
                     </div>
                  </div>
               </div>

               <div className="bg-white p-4 md:p-6 rounded-[1.5rem] border border-slate-100 shadow-sm relative overflow-hidden group flex-1">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10 h-full flex flex-col justify-center">
                     <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-blue-200">
                           <Barcode size={22} />
                        </div>
                        <label className="text-lg font-extrabold text-slate-800 tracking-wide">รหัสออเดอร์ / คำสั่งซื้อ <span className="text-red-500 ml-1">*</span></label>
                     </div>
                     <div className="flex space-x-3 w-full mt-auto">
                        <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} className="w-full p-3.5 border-2 border-slate-100 focus:border-blue-500 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none text-base md:text-lg font-bold text-slate-700 transition-all placeholder:text-slate-400 placeholder:font-medium" placeholder="ระบุรหัสออเดอร์..." />
                        <button type="button" onClick={() => setScanMode('camera')} className="px-5 bg-slate-800 hover:bg-black text-white rounded-xl shadow-md transition-all flex items-center justify-center shrink-0 transform active:scale-95 hover:-translate-y-1" title="สแกน หรือ ดึงข้อมูล">
                           <Scan size={26} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="border-b border-dashed border-slate-200/60 mx-4 md:mx-10 mt-6"></div>

            {/* 🚀 UI ค้นหาสินค้า */}
            <div className="relative z-10 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm w-full mt-6" ref={dropdownRef}>
              <div className="flex items-center justify-center space-x-3 mb-6">
                 <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-2.5 rounded-2xl text-white shadow-md shadow-emerald-200">
                    <Package size={24} />
                 </div>
                 <h3 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 tracking-wide">เลือกสินค้าลงตะกร้า</h3>
              </div>
              
              <div onClick={() => !isProcessing && setIsDropdownOpen(!isDropdownOpen)} className={`w-full p-4 md:p-5 border-2 rounded-2xl bg-slate-50 text-sm md:text-base cursor-pointer flex justify-between items-center transition-all shadow-inner relative ${isDropdownOpen ? 'border-emerald-500 bg-white ring-4 ring-emerald-500/10' : 'border-slate-100 hover:border-emerald-300 hover:bg-white'} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center space-x-3">
                   <Search size={20} className={isDropdownOpen ? 'text-emerald-500' : 'text-slate-400'} />
                   <span className={`${isDropdownOpen ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'}`}>คลิกเพื่อค้นหาและเลือกสินค้า...</span>
                </div>
                <ChevronDown size={24} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-emerald-500' : 'text-slate-400'}`} />
              </div>

              {isDropdownOpen && (
                <div className="absolute w-full mt-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.12)] max-h-[350px] flex flex-col top-full left-0 z-50 origin-top animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-base font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-sm" placeholder="พิมพ์ชื่อสินค้าที่ต้องการ..." value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} autoFocus />
                    </div>
                  </div>
                  <ul className="overflow-y-auto flex-1 p-3 space-y-2 scrollbar-hide">
                    {filteredProductsForSelect.map(p => {
                      const stockAmount = Number(p.stock) || 0;
                      const isOutOfStock = stockAmount <= 0;
                      const isLowStock = stockAmount <= 5 && !isOutOfStock;

                      return (
                        <li key={p.id} onClick={() => { if (!isOutOfStock) addToCart(p); }} className={`px-5 py-4 rounded-2xl text-sm flex flex-col sm:flex-row sm:justify-between sm:items-center cursor-pointer transition-all ${isOutOfStock ? "opacity-50 cursor-not-allowed bg-slate-50" : "bg-white hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 hover:shadow-md"}`}>
                          <div className="flex items-center space-x-2 mb-2 sm:mb-0 pr-2">
                             {isLowStock && <AlertCircle size={16} className="text-red-500 shrink-0" />}
                             <span className="font-bold text-base md:text-lg text-slate-800">{p.name}</span>
                          </div>
                          
                          <span className={`text-[11px] md:text-sm font-bold px-4 py-2 rounded-xl shrink-0 border ${isOutOfStock ? 'bg-slate-100 text-slate-500 border-slate-200' : isLowStock ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' : 'bg-green-50 text-green-700 border-green-200 shadow-sm'}`}>
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
               <div className="border border-blue-100 bg-blue-50/30 rounded-[2rem] overflow-hidden w-full shadow-sm mt-6">
                  <div className="bg-blue-100/50 px-5 py-4 border-b border-blue-100 font-bold text-blue-800 text-base flex items-center">
                    <ShoppingCart size={20} className="mr-2"/> รายการในตะกร้า ({cart.length})
                  </div>
                  <div className="divide-y divide-blue-50 p-3 w-full">
                     {cart.map((item, index) => (
                        <div key={index} className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 md:p-5 gap-4 bg-white rounded-2xl mb-3 shadow-sm border border-slate-100 w-full transition hover:shadow-md">
                           <div className="flex-1 font-bold text-slate-800 break-words w-full lg:w-auto text-base md:text-lg leading-tight">{item.name}</div>
                           
                           <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end w-full lg:w-auto gap-3 md:gap-5 shrink-0">
                              <div className="flex items-center space-x-2">
                                 <span className="text-xs text-slate-500 font-bold lg:hidden">ราคา/ชิ้น:</span>
                                 <input type="number" value={item.price} onChange={e => updateCartItem(item.productId, 'price', e.target.value)} className="w-20 md:w-28 p-2.5 text-center border-2 border-slate-100 rounded-xl text-sm md:text-base font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50 transition" placeholder="ราคา"/>
                              </div>

                              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1.5 shrink-0">
                                 <button type="button" onClick={() => updateCartItem(item.productId, 'quantity', Math.max(1, Number(item.quantity) - 1))} className="p-2 md:p-2.5 bg-white rounded-lg shadow-sm hover:bg-blue-50 hover:text-blue-600 transition"><Minus size={16}/></button>
                                 <input type="number" value={item.quantity} onChange={e => updateCartItem(item.productId, 'quantity', Math.max(1, parseInt(e.target.value) || 1))} className="w-12 md:w-16 text-center bg-transparent font-black outline-none text-base md:text-lg"/>
                                 <button type="button" onClick={() => updateCartItem(item.productId, 'quantity', Number(item.quantity) + 1)} className="p-2 md:p-2.5 bg-white rounded-lg shadow-sm hover:bg-blue-50 hover:text-blue-600 transition"><Plus size={16}/></button>
                              </div>
                              
                              <div className="flex items-center justify-end gap-4 min-w-[120px] shrink-0">
                                 <span className="font-black text-blue-600 text-right text-lg md:text-xl">฿{formatMoney(Number(item.price) * Number(item.quantity))}</span>
                                 <button type="button" onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:bg-red-50 hover:text-red-600 p-3 rounded-xl transition-colors"><Trash2 size={20}/></button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            <div className="pt-2 w-full mt-6">
              <div className="bg-[#eef5ff] p-6 md:p-10 rounded-[2rem] border border-[#e0ebff] flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm w-full">
                
                <div className="text-center md:text-left w-full md:w-auto flex flex-col items-center md:items-start">
                  <p className="text-sm md:text-base font-bold text-[#6a8ce2] mb-3">ราคารวมทั้งหมด {cart.length > 0 ? `(${cart.length} รายการ)` : ''}</p>
                  <div className="flex items-center relative w-full md:w-auto justify-center md:justify-start">
                    <span className="text-4xl md:text-5xl font-black text-[#3761e9] absolute left-5 select-none">฿</span>
                    <input 
                      type="number" 
                      value={customGrandTotal} 
                      placeholder={posTotal}    
                      onChange={(e) => setCustomGrandTotal(e.target.value)}
                      className="w-full md:w-72 pl-14 md:pl-16 pr-4 py-4 md:py-5 text-4xl md:text-5xl font-black text-[#3761e9] bg-white border-2 border-blue-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/30 text-left disabled:bg-transparent disabled:border-transparent placeholder:text-blue-300 transition-all shadow-md"
                      disabled={cart.length === 0}
                    />
                  </div>
                  {customGrandTotal !== '' && Number(customGrandTotal) !== posTotal && (
                    <p className="text-sm text-orange-600 mt-4 font-bold bg-orange-100 px-4 py-2 rounded-full inline-flex items-center">
                      <AlertCircle size={16} className="mr-1.5" /> แก้ไขจากราคาปกติ ฿{formatMoney(posTotal)}
                    </p>
                  )}
                </div>

                <button type="submit" disabled={cart.length === 0 || isProcessing} className="w-full md:w-auto bg-gradient-to-r from-[#94a8f1] to-[#6082f0] hover:from-[#7690ed] hover:to-[#4e74ea] text-white px-8 md:px-12 py-5 md:py-6 rounded-[1.5rem] text-lg md:text-2xl font-black transition-all disabled:opacity-50 shadow-xl shadow-blue-500/30 transform hover:-translate-y-1 active:translate-y-0 whitespace-nowrap">
                  บันทึกการขาย
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 🚀 UI ส่วนแสดงรายการที่เพิ่งขายไปวันนี้แบบตีกรอบแยกกล่องออเดอร์ */}
        <div className="pt-2 w-full pb-10">
          <h3 className="text-lg md:text-xl font-extrabold text-slate-700 mb-4 px-2">รายการที่เพิ่งขายไปวันนี้</h3>
          <div className="w-full overflow-x-auto p-2">
            <table className="w-full text-left border-separate min-w-[700px]" style={{ borderSpacing: '0 16px' }}>
              <thead>
                <tr className="text-slate-500 text-sm">
                  <th className="px-3 md:px-4 pb-2 font-bold whitespace-nowrap">ลำดับ / เวลา</th>
                  <th className="px-3 md:px-4 pb-2 font-bold">ออเดอร์</th>
                  <th className="px-3 md:px-4 pb-2 font-bold">ร้านค้า</th>
                  <th className="px-3 md:px-4 pb-2 font-bold">สินค้า</th>
                  <th className="px-3 md:px-4 pb-2 font-bold text-center">จำนวน</th>
                  <th className="px-3 md:px-4 pb-2 font-bold text-right">ยอดรวม</th>
                </tr>
              </thead>
              {groupedRecentSales.length === 0 ? (
                <tbody><tr><td colSpan="6" className="p-12 text-center text-slate-400 text-base font-medium bg-white rounded-2xl shadow-sm border border-slate-100">ยังไม่มีการคีย์ยอดขายในวันนี้</td></tr></tbody>
              ) : (
                groupedRecentSales.map((group, groupIndex) => {
                  let timeString = '-'; 
                  try { const d = new Date(group.date); if(!isNaN(d.getTime())) timeString = d.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) + ' น.'; } catch(e) {}
                  
                  return (
                    <tbody key={group.id} className="shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 rounded-2xl bg-white relative">
                      {group.items.map((sale, itemIdx) => {
                        const isFirstRow = itemIdx === 0;
                        return (
                          <tr key={sale.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                            <td className={`p-3 md:p-4 text-slate-500 font-medium whitespace-nowrap border-l border-slate-200 ${isFirstRow ? 'border-t rounded-tl-2xl bg-slate-50/50' : 'border-t border-slate-50'}`}>
                               {isFirstRow ? (
                                  <div className="flex flex-col space-y-1.5">
                                     <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] md:text-xs font-black px-2.5 py-1 rounded-md shadow-sm text-center">ออเดอร์ที่ {totalTodayOrders - groupIndex}</span>
                                     <span className="text-slate-600 font-bold text-xs md:text-sm flex items-center justify-center"><CalendarDays size={12} className="mr-1"/> {timeString}</span>
                                  </div>
                               ) : ''}
                            </td>
                            <td className={`p-3 md:p-4 font-medium text-slate-600 ${isFirstRow ? 'border-t border-slate-200 bg-slate-50/50' : 'border-t border-slate-50'}`}>{isFirstRow ? (sale.orderId || '-') : ''}</td>
                            <td className={`p-3 md:p-4 whitespace-nowrap ${isFirstRow ? 'border-t border-slate-200 bg-slate-50/50' : 'border-t border-slate-50'}`}><span className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold border ${String(sale.store || '').includes('Shopee') ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{sale.store || '-'}</span></td>
                            <td className={`p-3 md:p-4 font-bold text-slate-800 ${isFirstRow ? 'border-t border-slate-200 bg-slate-50/50' : 'border-t border-slate-50'}`}>{getProduct(sale.productId)?.name || 'สินค้าถูกลบ'}</td>
                            <td className={`p-3 md:p-4 text-center font-bold text-slate-600 ${isFirstRow ? 'border-t border-slate-200 bg-slate-50/50' : 'border-t border-slate-50'}`}>{sale.quantity}</td>
                            <td className={`p-3 md:p-4 text-right text-slate-700 font-medium whitespace-nowrap text-sm md:text-base border-r border-slate-200 ${isFirstRow ? 'border-t rounded-tr-2xl bg-slate-50/50' : 'border-t border-slate-50'}`}>฿{formatMoney(sale.total)}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gradient-to-r from-blue-50 to-indigo-50/50">
                        <td colSpan="4" className="p-3 md:p-4 text-right text-indigo-800 font-extrabold text-xs md:text-sm border-l border-b border-indigo-100 rounded-bl-2xl">ราคารวมสุทธิออเดอร์นี้</td>
                        <td className="p-3 md:p-4 text-center text-indigo-900 font-black text-base border-b border-indigo-100">{group.totalItems}</td>
                        <td className="p-3 md:p-4 text-right text-blue-700 font-black whitespace-nowrap text-lg md:text-xl border-r border-b border-indigo-100 rounded-br-2xl">฿{formatMoney(group.totalOrderValue)} บาท</td>
                      </tr>
                    </tbody>
                  );
                })
              )}
            </table>
          </div>
        </div>
      </div>
    );
  };

  const SalesHistoryView = () => {
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
          // 1. รวมจำนวนสินค้าที่จะต้องคืนสต๊อก (เผื่อมีสินค้าซ้ำกันในบิลเดียว)
          const returnQuantities = {};
          group.items.forEach(sale => {
            returnQuantities[sale.productId] = (returnQuantities[sale.productId] || 0) + Number(sale.quantity);
          });

          // 2. [PHASE READ] ดึงข้อมูลสินค้าทั้งหมด "ก่อน" ที่จะทำการเขียน
          const productReadDocs = {};
          for (const productId of Object.keys(returnQuantities)) {
            const pRef = doc(db, "products", productId);
            const pDoc = await transaction.get(pRef);
            if (pDoc.exists()) {
              productReadDocs[productId] = { ref: pRef, currentStock: Number(pDoc.data().stock) || 0 };
            }
          }

          // 3. [PHASE WRITE] เขียนข้อมูลลงฐานข้อมูลหลังจากอ่านเสร็จหมดแล้ว
          // คืนสต๊อกสินค้า
          for (const [productId, qtyToReturn] of Object.entries(returnQuantities)) {
            if (productReadDocs[productId]) {
               const pData = productReadDocs[productId];
               transaction.update(pData.ref, { stock: pData.currentStock + qtyToReturn });
            }
          }
          // ลบรายการขาย
          for (const sale of group.items) {
             transaction.delete(doc(db, "sales", sale.id));
          }
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
        const newFinalTotal = Number(groupEditTotal);
        const oldTotal = group.totalOrderValue;
        
        if (newFinalTotal === oldTotal) {
          setIsEditingGroup(null);
          setIsProcessing(false);
          return;
        }

        const ratio = oldTotal > 0 ? (newFinalTotal / oldTotal) : 1;
        let remainingTotal = newFinalTotal;

        await runTransaction(db, async (transaction) => {
          for (let i = 0; i < group.items.length; i++) {
            const sale = group.items[i];
            const isLastItem = i === group.items.length - 1;
            const baseItemTotal = Number(sale.total);
            
            let rowTotal = 0;
            if (isLastItem) {
              rowTotal = remainingTotal;
            } else {
              rowTotal = Math.round((baseItemTotal * ratio) * 100) / 100;
              remainingTotal -= rowTotal;
            }
            
            const unitPrice = Number(sale.quantity) > 0 ? (rowTotal / Number(sale.quantity)) : 0;
            
            transaction.update(doc(db, "sales", sale.id), {
              total: rowTotal,
              unitPrice: unitPrice
            });
          }
        });
        setIsEditingGroup(null);
      } catch (error) { alert("เกิดข้อผิดพลาด: " + error.message); }
      setIsProcessing(false);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        
        {/* 🚀 ปรับโฉมหน้า Header ให้สวยและน่าสนใจขึ้น */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 bg-white p-5 md:p-6 rounded-[1.5rem] shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-indigo-600"></div>
          <div className="flex items-center space-x-4 pl-2">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
              <History size={28} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">ประวัติการขาย</h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">สามารถแก้ไขข้อมูล หรือลบออเดอร์ย่อยที่คีย์ผิดได้</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border border-slate-200 shadow-inner w-full md:w-auto justify-between md:justify-start">
             <span className="text-xs md:text-sm text-slate-500 font-bold">ดูของวันที่</span>
             <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border-none focus:ring-0 text-sm md:text-base bg-transparent cursor-pointer outline-none text-blue-600 font-black" />
          </div>
        </div>
        
        {/* 🚀 UI ส่วนแสดงประวัติการขายแบบตีกรอบแยกกล่องออเดอร์ และมีลูกเล่น */}
        <div className="w-full overflow-x-auto pb-4 pt-2">
          <table className="w-full text-left border-separate min-w-[800px]" style={{ borderSpacing: '0 16px' }}>
            <thead>
              <tr className="text-slate-500 text-xs md:text-sm">
                <th className="px-3 md:px-4 pb-3 font-bold text-slate-600 whitespace-nowrap">ลำดับ / เวลา</th>
                <th className="px-3 md:px-4 pb-3 font-bold text-slate-600">ออเดอร์ ID</th>
                <th className="px-3 md:px-4 pb-3 font-bold text-slate-600 whitespace-nowrap">ร้านค้า</th>
                <th className="px-3 md:px-4 pb-3 font-bold text-slate-600">สินค้า</th>
                <th className="px-3 md:px-4 pb-3 font-bold text-slate-600 text-center">จำนวน</th>
                <th className="px-3 md:px-4 pb-3 font-bold text-slate-600 text-right">ยอดรวม</th>
                <th className="px-3 md:px-4 pb-3 font-bold text-slate-600 text-center">ผู้ทำรายการ</th>
                {canEditTab('history') && <th className="px-3 md:px-4 pb-3 font-bold text-slate-600 text-right">จัดการ</th>}
              </tr>
            </thead>
            
            {groupedHistorySales.length === 0 ? (
              <tbody><tr><td colSpan="8" className="text-center p-6 md:p-8 text-gray-500 text-xs md:text-sm bg-white rounded-2xl shadow-sm border border-slate-100">ไม่มีรายการขายในวันที่เลือก</td></tr></tbody>
            ) : (
              groupedHistorySales.map((group, groupIndex) => {
                let timeString = '-'; 
                try { const d = new Date(group.date); if(!isNaN(d.getTime())) timeString = d.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}); } catch(e) {}
                
                return (
                  <tbody key={group.id} className="shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 rounded-2xl bg-white relative">
                    {group.items.map((sale, itemIdx) => {
                      const isCurrentRowEditing = isEditing === sale.id;
                      const isFirstRow = itemIdx === 0;
                      
                      return (
                        <tr key={sale.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                          <td className={`p-3 md:p-4 text-gray-500 whitespace-nowrap border-l border-slate-200 ${isFirstRow ? 'border-t rounded-tl-2xl bg-slate-50/50' : 'border-t border-slate-50'}`}>
                            {isCurrentRowEditing ? (
                               <input type="datetime-local" className="w-full p-1.5 md:p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-[10px] md:text-xs" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})}/> 
                            ) : (
                               isFirstRow ? (
                                  <div className="flex flex-col space-y-1.5">
                                     <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] md:text-xs font-black px-2.5 py-1 rounded-md shadow-sm text-center">ออเดอร์ที่ {groupedHistorySales.length - groupIndex}</span>
                                     <span className="text-slate-600 font-bold text-xs md:text-sm flex items-center justify-center"><CalendarDays size={12} className="mr-1"/> {timeString}</span>
                                  </div>
                               ) : ''
                            )}
                          </td>
                          <td className={`p-3 md:p-4 text-gray-600 font-medium ${isFirstRow ? 'border-t border-slate-200 bg-slate-50/50' : 'border-t border-slate-50'}`}>{isCurrentRowEditing ? <input type="text" className="w-20 p-1.5 md:p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-xs" value={editForm.orderId} onChange={e => setEditForm({...editForm, orderId: e.target.value})}/> : (isFirstRow ? (sale.orderId || '-') : '')}</td>
                          <td className={`p-3 md:p-4 whitespace-nowrap ${isFirstRow ? 'border-t border-slate-200 bg-slate-50/50' : 'border-t border-slate-50'}`}>{isCurrentRowEditing ? <select value={editForm.store} onChange={e => setEditForm({...editForm, store: e.target.value})} className="w-full p-1.5 md:p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs">{STORE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select> : <span className={`px-2 py-1 rounded-md text-[10px] md:text-xs font-bold ${String(sale.store || '').includes('Shopee') ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{sale.store || '-'}</span>}</td>
                          <td className={`p-3 md:p-4 min-w-[150px] ${isFirstRow ? 'border-t border-slate-200 bg-slate-50/50' : 'border-t border-slate-50'}`}>{isCurrentRowEditing ? <select value={editForm.productId} onChange={e => setEditForm({...editForm, productId: e.target.value, customPrice: getProduct(e.target.value)?.price||0})} className="w-full p-1.5 md:p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs md:text-sm">{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select> : <span className="font-medium text-gray-800">{getProduct(sale.productId)?.name || 'ลบแล้ว'}</span>}</td>
                          <td className={`p-3 md:p-4 text-center ${isFirstRow ? 'border-t border-slate-200 bg-slate-50/50' : 'border-t border-slate-50'}`}>{isCurrentRowEditing ? <input type="number" className="w-16 mx-auto p-1.5 md:p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: Math.max(1, parseInt(e.target.value)||1)})} /> : <span className="font-bold">{sale.quantity}</span>}</td>
                          <td className={`p-3 md:p-4 text-right text-slate-700 font-medium whitespace-nowrap ${isFirstRow ? 'border-t border-slate-200 bg-slate-50/50' : 'border-t border-slate-50'}`}>{isCurrentRowEditing ? <div className="flex flex-col items-end"><input type="number" className="w-20 p-1 border border-gray-300 rounded text-right text-xs mb-1 outline-none focus:ring-1 focus:ring-blue-500" value={editForm.customPrice} onChange={e => setEditForm({...editForm, customPrice: e.target.value})} placeholder="ราคา/ชิ้น"/><span>฿{formatMoney((Number(editForm.customPrice) || 0) * (Number(editForm.quantity) || 0))}</span></div> : `฿${formatMoney(sale.total)}`}</td>
                          <td className={`p-3 md:p-4 text-center text-gray-500 ${!canEditTab('history') ? 'border-r border-slate-200' : ''} ${isFirstRow ? (!canEditTab('history') ? 'border-t rounded-tr-2xl bg-slate-50/50' : 'border-t border-slate-200 bg-slate-50/50') : 'border-t border-slate-50'}`}><span className="bg-gray-100 px-2 py-1 rounded-full text-[10px] md:text-xs">{sale.soldBy || '-'}</span></td>
                          {canEditTab('history') && (
                            <td className={`p-3 md:p-4 text-right whitespace-nowrap border-r border-slate-200 ${isFirstRow ? 'border-t rounded-tr-2xl bg-slate-50/50' : 'border-t border-slate-50'}`}>
                              {isCurrentRowEditing ? (
                                <div className="flex justify-end space-x-1 md:space-x-2">
                                  <button onClick={() => handleSaveEdit(sale)} disabled={isProcessing} className="text-green-600 hover:bg-green-100 p-1 md:p-1.5 rounded-md transition"><Save size={16}/></button>
                                  <button onClick={() => setIsEditing(null)} disabled={isProcessing} className="text-gray-500 hover:bg-gray-200 p-1 md:p-1.5 rounded-md transition"><X size={16}/></button>
                                </div>
                              ) : (
                                <div className="flex justify-end space-x-1 md:space-x-2">
                                  <button onClick={() => { setIsEditing(sale.id); setIsEditingGroup(null); setEditForm({productId: sale.productId, quantity: sale.quantity, date: formatForInput(sale.date), store: sale.store || STORE_OPTIONS[0], customPrice: sale.unitPrice || (sale.total/sale.quantity), orderId: sale.orderId || ''}); }} className="text-blue-600 hover:bg-blue-100 p-1 md:p-1.5 rounded-md transition" title="แก้ไขรายการนี้"><Edit2 size={16}/></button>
                                  <button onClick={() => handleDelete(sale)} className="text-red-600 hover:bg-red-100 p-1 md:p-1.5 rounded-md transition" title="ลบรายการนี้"><Trash2 size={16}/></button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {/* 🚀 สรุปยอดรวมและปุ่มแก้ไข/ลบ ระดับกลุ่ม (Group Order) มีคำว่า บาท */}
                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50/50">
                      <td colSpan="4" className="p-3 md:p-4 text-right text-indigo-800 font-extrabold text-sm border-l border-b border-indigo-100 rounded-bl-2xl">ราคารวมสุทธิออเดอร์นี้</td>
                      <td className="p-3 md:p-4 text-center text-indigo-900 font-black text-base border-b border-indigo-100">{group.totalItems}</td>
                      <td className="p-3 md:p-4 text-right text-blue-700 font-black whitespace-nowrap text-lg md:text-xl border-b border-indigo-100">
                        {isEditingGroup === group.id ? (
                           <input type="number" className="w-24 p-1.5 border-2 border-blue-400 rounded-lg text-right focus:ring-2 focus:ring-blue-500 outline-none text-black bg-white shadow-sm" value={groupEditTotal} onChange={e => setGroupEditTotal(e.target.value)} />
                        ) : (
                           `฿${formatMoney(group.totalOrderValue)} บาท`
                        )}
                      </td>
                      <td colSpan={canEditTab('history') ? 2 : 1} className="border-r border-b border-indigo-100 rounded-br-2xl text-right p-3 md:p-4">
                        {canEditTab('history') && (
                           isEditingGroup === group.id ? (
                              <div className="flex justify-end space-x-1 md:space-x-2">
                                 <button onClick={() => handleSaveGroupEdit(group)} disabled={isProcessing} className="text-green-600 bg-green-100 hover:bg-green-200 p-1.5 md:p-2 rounded-lg transition shadow-sm" title="บันทึกยอดรวมใหม่"><Save size={16} /></button>
                                 <button onClick={() => setIsEditingGroup(null)} disabled={isProcessing} className="text-gray-500 bg-gray-200 hover:bg-gray-300 p-1.5 md:p-2 rounded-lg transition shadow-sm" title="ยกเลิก"><X size={16} /></button>
                              </div>
                           ) : (
                              <div className="flex justify-end space-x-1 md:space-x-2">
                                 <button onClick={() => { setIsEditingGroup(group.id); setGroupEditTotal(group.totalOrderValue); setIsEditing(null); }} className="text-blue-600 bg-white hover:bg-blue-100 shadow-sm p-1.5 md:p-2 rounded-lg transition" title="แก้ไขราคารวมทั้งออเดอร์"><Edit2 size={16} /></button>
                                 <button onClick={() => handleDeleteGroup(group)} className="text-red-600 bg-white hover:bg-red-100 shadow-sm p-1.5 md:p-2 rounded-lg transition" title="ลบทั้งออเดอร์ (คืนสต๊อกทั้งหมด)"><Trash2 size={16} /></button>
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
        <div className="flex flex-col bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">การจัดการสินค้า</h2>
            <div className="flex space-x-2 w-full sm:w-auto">
              {canExportTab('products') && (<button onClick={exportProductsReport} className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 md:space-x-2 bg-green-50 text-green-700 border border-green-200 px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-green-100 transition text-xs md:text-sm font-medium"><Download size={16} /><span>ส่งออก Excel</span></button>)}
              {!isAdding && canEditTab('products') && (<button onClick={() => { setIsAdding(true); setEditForm({name:'', cost:'', price:''}); setIsEditing(null); setSearchTerm(''); }} className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 md:space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg transition text-xs md:text-sm font-medium"><Plus size={16} /><span>เพิ่มสินค้าใหม่</span></button>)}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-100">
            <div className="relative flex-1 sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="ค้นหาสินค้า..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div className="flex items-center space-x-2 w-full sm:w-auto"><div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><ArrowUpDown size={16} className="text-gray-500" /></div><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto border border-gray-200 rounded-lg text-xs md:text-sm py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white"><option value="name_asc">ชื่อ (ก - ฮ)</option><option value="name_desc">ชื่อ (ฮ - ก)</option><option value="price_desc">ราคาขาย (มากไปน้อย)</option><option value="price_asc">ราคาขาย (น้อยไปมาก)</option></select></div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs md:text-sm"><th className="p-3 md:p-4 font-medium text-center w-16">ลำดับ</th><th className="p-3 md:p-4 font-medium">ชื่อสินค้า</th><th className="p-3 md:p-4 font-medium">ราคาคลินิก</th><th className="p-3 md:p-4 font-medium">ราคาขาย</th>{canEditTab('products') && <th className="p-3 md:p-4 font-medium text-right">จัดการ</th>}</tr>
            </thead>
            <tbody className="text-xs md:text-sm">
              {isAdding && (
                <tr className="border-b border-blue-100 bg-blue-50/50">
                  <td className="p-3 md:p-4 text-center text-blue-400 font-bold">*</td>
                  <td className="p-2 md:p-4"><input className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ชื่อสินค้า..." value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                  <td className="p-2 md:p-4"><input type="number" className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ราคาคลินิก..." value={editForm.cost} onChange={e => setEditForm({...editForm, cost: e.target.value})} /></td>
                  <td className="p-2 md:p-4"><input type="number" className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ราคาขาย..." value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /></td>
                  <td className="p-2 md:p-4 text-right space-x-1 md:space-x-2 whitespace-nowrap"><button onClick={handleAdd} className="text-green-600 bg-green-100 p-1.5 md:p-2 rounded-md hover:bg-green-200 transition"><Save size={16} /></button><button onClick={() => setIsAdding(false)} className="text-red-600 bg-red-100 p-1.5 md:p-2 rounded-md hover:bg-red-200 transition"><X size={16} /></button></td>
                </tr>
              )}
              {filteredAndSortedProducts.map((product, index) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-3 md:p-4 text-center font-bold text-gray-400">{index + 1}</td>
                  <td className="p-3 md:p-4">{isEditing === product.id ? <input className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /> : <span className="font-medium text-gray-800">{product.name}</span>}</td>
                  <td className="p-3 md:p-4">{isEditing === product.id ? <input type="number" className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.cost} onChange={e => setEditForm({...editForm, cost: e.target.value})} /> : <span className="text-orange-600 font-medium">฿{formatMoney(product.cost)}</span>}</td>
                  <td className="p-3 md:p-4">{isEditing === product.id ? <input type="number" className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /> : <span className="text-blue-600 font-medium">฿{formatMoney(product.price)}</span>}</td>
                  {canEditTab('products') && (
                    <td className="p-3 md:p-4 text-right space-x-1 md:space-x-2 whitespace-nowrap">
                      {isEditing === product.id ? (<><button onClick={() => handleSave(product.id)} className="text-green-600 bg-green-100 hover:bg-green-200 p-1.5 md:p-2 rounded-md transition"><Save size={16} /></button><button onClick={() => setIsEditing(null)} className="text-gray-500 bg-gray-200 hover:bg-gray-300 p-1.5 md:p-2 rounded-md transition"><X size={16} /></button></>) : (<><button onClick={() => { setIsEditing(product.id); setEditForm({name: product.name, cost: product.cost, price: product.price}); }} className="text-blue-600 hover:bg-blue-100 p-1.5 md:p-2 rounded-md transition"><Edit2 size={16} /></button><button onClick={async () => { if(confirm('ลบสินค้านี้?')) { await deleteDoc(doc(db, "products", product.id)); await addDoc(collection(db, "audit_logs"), { action: "DELETE_PRODUCT", user: loggedInUser?.username || 'unknown', details: `ลบสินค้า ${product.name}`, timestamp: new Date().toISOString() }); } }} className="text-red-600 hover:bg-red-100 p-1.5 md:p-2 rounded-md transition"><Trash2 size={16} /></button></>)}
                    </td>
                  )}
                </tr>
              ))}
              {filteredAndSortedProducts.length === 0 && !isAdding && (<tr><td colSpan="5" className="text-center p-8 text-gray-500 text-xs md:text-sm">ไม่พบข้อมูลสินค้าที่ค้นหา</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const StockView = () => {
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
        const productRef = doc(db, "products", id);
        const auditRef = doc(collection(db, "audit_logs"));
        const newStockValue = Number(newStock) || 0;

        await runTransaction(db, async (transaction) => {
           const pDoc = await transaction.get(productRef);
           const oldStock = pDoc.exists() ? (Number(pDoc.data().stock)||0) : 0;
           const pName = pDoc.exists() ? pDoc.data().name : 'ไม่ทราบชื่อ';

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
        <div className="flex flex-col bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">สต๊อกสินค้า</h2>
            {canExportTab('stock') && (<button onClick={exportStockReport} className="w-full sm:w-auto flex items-center justify-center space-x-1.5 md:space-x-2 bg-green-50 text-green-700 border border-green-200 px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-green-100 transition text-xs md:text-sm font-medium"><Download size={16} /><span>ส่งออกสต๊อก (Excel)</span></button>)}
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-100">
            <div className="relative flex-1 sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="ค้นหาสินค้า..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div className="flex items-center space-x-2 w-full sm:w-auto"><div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><ArrowUpDown size={16} className="text-gray-500" /></div><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto border border-gray-200 rounded-lg text-xs md:text-sm py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white"><option value="name_asc">ชื่อ (ก - ฮ)</option><option value="name_desc">ชื่อ (ฮ - ก)</option><option value="stock_asc">จำนวนสต๊อก (น้อยไปมาก)</option><option value="stock_desc">จำนวนสต๊อก (มากไปน้อย)</option></select></div>
          </div>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-[11px] sm:text-xs md:text-sm"><th className="py-3 px-1 sm:px-3 md:p-4 font-medium text-center w-10 sm:w-16">ลำดับ</th><th className="py-3 px-1 sm:px-3 md:p-4 font-medium">ชื่อสินค้า</th><th className="py-3 px-1 sm:px-3 md:p-4 font-medium text-center whitespace-nowrap">คงเหลือ</th>{!isExecutiveView && canEditTab('stock') && <th className="py-3 px-1 sm:px-3 md:p-4 font-medium text-right whitespace-nowrap">อัปเดต</th>}</tr>
              </thead>
              <tbody className="text-[11px] sm:text-xs md:text-sm">
                {filteredAndSortedProducts.map((product, index) => {
                  const stockAmount = Number(product.stock) || 0;
                  return (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-1 sm:px-3 md:p-4 text-center font-bold text-gray-400">{index + 1}</td>
                    <td className="py-3 px-1 sm:px-3 md:p-4 font-medium text-gray-800 break-words">{product.name}</td>
                    <td className="py-3 px-1 sm:px-3 md:p-4 text-center whitespace-nowrap">{editingStockId === product.id ? (<input type="number" className="w-full max-w-[80px] p-1 md:p-1.5 border rounded text-center text-xs focus:ring-2 focus:ring-blue-500 outline-none" value={newStock} onChange={e => setNewStock(e.target.value)} disabled={isProcessing} /> ) : (<span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide ${stockAmount <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{stockAmount} ชิ้น</span>)}</td>
                    {!isExecutiveView && canEditTab('stock') && (<td className="py-3 px-1 sm:px-3 md:p-4 text-right space-x-1 whitespace-nowrap">{editingStockId === product.id ? (<><button onClick={() => handleSaveStock(product.id)} disabled={isProcessing} className="text-green-600 bg-green-100 hover:bg-green-200 p-1 md:p-1.5 rounded-md transition"><Save size={14} className="md:w-4 md:h-4"/></button><button onClick={() => setEditingStockId(null)} disabled={isProcessing} className="text-gray-500 bg-gray-200 hover:bg-gray-300 p-1 md:p-1.5 rounded-md transition"><X size={14} className="md:w-4 md:h-4"/></button></>) : (<button onClick={() => { setEditingStockId(product.id); setNewStock(stockAmount); }} className="text-blue-600 hover:bg-blue-100 p-1 md:p-1.5 rounded-md transition"><Edit2 size={14} className="md:w-4 md:h-4"/></button>)}</td>)}
                  </tr>
                )})}
                {filteredAndSortedProducts.length === 0 && (<tr><td colSpan={isExecutiveView || !canEditTab('stock') ? 3 : 4} className="text-center p-6 md:p-8 text-gray-500 text-xs md:text-sm">ไม่พบข้อมูลสินค้าที่ค้นหา</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const UsersManagementView = () => {
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div><h2 className="text-lg md:text-2xl font-bold text-gray-800">การจัดการผู้ใช้</h2><p className="text-xs md:text-sm text-gray-500 mt-1">ตั้งค่ารหัสผ่าน และกำหนดสิทธิ์การเข้าถึงเมนูต่างๆ ของพนักงาน</p></div>
          {!isAdding && <button onClick={() => { setIsAdding(true); setEditForm({username:'', password:'', role:'staff', permissions: defaultPermissions}); setIsEditing(null); }} className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg flex items-center space-x-1.5 md:space-x-2 text-xs md:text-sm w-full sm:w-auto justify-center"><Plus size={16} /><span>เพิ่มผู้ใช้</span></button>}
        </div>
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs md:text-sm"><th className="p-3 md:p-4 font-medium">Username</th><th className="p-3 md:p-4 font-medium">รหัสผ่าน</th><th className="p-3 md:p-4 font-medium">ระดับสิทธิ์</th><th className="p-3 md:p-4 font-medium">ตั้งค่าความสามารถของพนักงาน (Permissions)</th><th className="p-3 md:p-4 font-medium text-right">จัดการ</th></tr>
            </thead>
            <tbody className="text-xs md:text-sm">
              {isAdding && (
                <tr className="bg-blue-50/50 align-top">
                  <td className="p-3 md:p-4"><input className="p-1.5 md:p-2 border rounded w-full text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="ชื่อ..." value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} disabled={isProcessing} /></td>
                  <td className="p-3 md:p-4"><input className="p-1.5 md:p-2 border rounded w-full text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="รหัสผ่าน..." value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} disabled={isProcessing} /></td>
                  <td className="p-3 md:p-4"><select className="p-1.5 md:p-2 border rounded w-full text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} disabled={isProcessing}><option value="staff">พนักงาน (Staff)</option><option value="admin">ผู้ดูแล (Admin)</option></select></td>
                  <td className="p-3 md:p-4">
                    {editForm.role === 'admin' ? (<span className="text-purple-600 font-bold bg-purple-100 px-2 py-1 rounded">เข้าถึงได้ทุกเมนู (Admin)</span>) : (
                      <div className="flex flex-col space-y-3">
                        <span className="text-gray-500 font-medium flex items-center"><ShieldCheck size={14} className="mr-1"/>เลือกเมนูที่อนุญาต:</span>
                        <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.dashboard || false} onChange={()=>handlePermissionChange('dashboard')} className="rounded text-blue-600"/> <span>Dashboard</span></label><div className="ml-5"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.dashboardExport || false} onChange={()=>handlePermissionChange('dashboardExport')} disabled={!editForm.permissions.dashboard} className="rounded text-green-600"/> <span>ส่งออก Excel ได้</span></label></div></div>
                        <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.products || false} onChange={()=>handlePermissionChange('products')} className="rounded text-blue-600"/> <span>การจัดการสินค้า</span></label><div className="ml-5 flex flex-wrap gap-2"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.productsEdit || false} onChange={()=>handlePermissionChange('productsEdit')} disabled={!editForm.permissions.products} className="rounded text-orange-500"/> <span>เพิ่ม/ลบ/แก้ไข ได้</span></label><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.productsExport || false} onChange={()=>handlePermissionChange('productsExport')} disabled={!editForm.permissions.products} className="rounded text-green-600"/> <span>ส่งออก Excel ได้</span></label></div></div>
                        <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.stock || false} onChange={()=>handlePermissionChange('stock')} className="rounded text-blue-600"/> <span>สต๊อกสินค้า</span></label><div className="ml-5 flex flex-wrap gap-2"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.stockEdit || false} onChange={()=>handlePermissionChange('stockEdit')} disabled={!editForm.permissions.stock} className="rounded text-orange-500"/> <span>อัปเดตตัวเลขได้</span></label><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.stockExport || false} onChange={()=>handlePermissionChange('stockExport')} disabled={!editForm.permissions.stock} className="rounded text-green-600"/> <span>ส่งออก Excel ได้</span></label></div></div>
                        <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.history || false} onChange={()=>handlePermissionChange('history')} className="rounded text-blue-600"/> <span>ประวัติการขาย</span></label><div className="ml-5"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.historyEdit || false} onChange={()=>handlePermissionChange('historyEdit')} disabled={!editForm.permissions.history} className="rounded text-orange-500"/> <span>แก้ไข/ลบออเดอร์ ได้</span></label></div></div>
                      </div>
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-right whitespace-nowrap"><button onClick={handleAdd} disabled={isProcessing} className="text-green-600 hover:bg-green-100 p-1.5 md:p-2 rounded-md"><Save size={18} /></button><button onClick={() => setIsAdding(false)} disabled={isProcessing} className="text-red-600 hover:bg-red-100 p-1.5 md:p-2 rounded-md"><X size={18} /></button></td>
                </tr>
              )}
              {users.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50 align-top">
                  <td className="p-3 md:p-4 font-bold text-gray-800 pt-5">{u.username}</td>
                  <td className="p-3 md:p-4 pt-4">{isEditing === u.id ? (<input className="p-1.5 md:p-2 border rounded w-full text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} disabled={isProcessing} />) : (<span className="text-gray-400 tracking-widest text-xs md:text-sm">••••••</span>)}</td>
                  <td className="p-3 md:p-4 pt-4">{isEditing === u.id ? (<select className="p-1.5 md:p-2 border rounded w-full text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} disabled={isProcessing}><option value="staff">พนักงาน (Staff)</option><option value="admin">ผู้ดูแล (Admin)</option></select>) : (<span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{u.role.toUpperCase()}</span>)}</td>
                  <td className="p-3 md:p-4">
                    {isEditing === u.id ? (editForm.role === 'admin' ? (<span className="text-purple-600 font-bold bg-purple-100 px-2 py-1 rounded text-xs mt-2 inline-block">เข้าถึงได้ทุกเมนู (Admin)</span>) : (
                        <div className="flex flex-col space-y-3">
                          <span className="text-gray-500 font-medium flex items-center"><ShieldCheck size={14} className="mr-1"/>เลือกเมนูที่อนุญาต:</span>
                          <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.dashboard || false} onChange={()=>handlePermissionChange('dashboard')} className="rounded text-blue-600"/> <span>Dashboard</span></label><div className="ml-5"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.dashboardExport || false} onChange={()=>handlePermissionChange('dashboardExport')} disabled={!editForm.permissions.dashboard} className="rounded text-green-600"/> <span>ส่งออก Excel ได้</span></label></div></div>
                          <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.products || false} onChange={()=>handlePermissionChange('products')} className="rounded text-blue-600"/> <span>การจัดการสินค้า</span></label><div className="ml-5 flex flex-wrap gap-2"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.productsEdit || false} onChange={()=>handlePermissionChange('productsEdit')} disabled={!editForm.permissions.products} className="rounded text-orange-500"/> <span>เพิ่ม/ลบ/แก้ไข ได้</span></label><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.productsExport || false} onChange={()=>handlePermissionChange('productsExport')} disabled={!editForm.permissions.products} className="rounded text-green-600"/> <span>ส่งออก Excel ได้</span></label></div></div>
                          <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.stock || false} onChange={()=>handlePermissionChange('stock')} className="rounded text-blue-600"/> <span>สต๊อกสินค้า</span></label><div className="ml-5 flex flex-wrap gap-2"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.stockEdit || false} onChange={()=>handlePermissionChange('stockEdit')} disabled={!editForm.permissions.stock} className="rounded text-orange-500"/> <span>อัปเดตตัวเลขได้</span></label><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.stockExport || false} onChange={()=>handlePermissionChange('stockExport')} disabled={!editForm.permissions.stock} className="rounded text-green-600"/> <span>ส่งออก Excel ได้</span></label></div></div>
                          <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.history || false} onChange={()=>handlePermissionChange('history')} className="rounded text-blue-600"/> <span>ประวัติการขาย</span></label><div className="ml-5"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.historyEdit || false} onChange={()=>handlePermissionChange('historyEdit')} disabled={!editForm.permissions.history} className="rounded text-orange-500"/> <span>แก้ไข/ลบออเดอร์ ได้</span></label></div></div>
                        </div>
                      )
                    ) : (u.role === 'admin' ? (<span className="text-purple-600 font-bold bg-purple-100 px-2 py-1 rounded text-xs mt-1 inline-block">เข้าถึงได้ทุกเมนู (Admin)</span>) : (
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">ขาย (POS)</span>
                          {u.permissions?.dashboard && <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full">Dashboard</span>}
                          {u.permissions?.products && <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full">การจัดการสินค้า</span>}
                          {u.permissions?.stock && <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full">สต๊อกสินค้า</span>}
                          {u.permissions?.history && <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full">ประวัติการขาย</span>}
                        </div>
                      )
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-right space-x-1 md:space-x-2 whitespace-nowrap pt-4">
                    {isEditing === u.id ? (<><button onClick={() => handleSave(u.id)} disabled={isProcessing} className="text-green-600 hover:bg-green-100 p-1.5 md:p-2 rounded-md"><Save size={18} /></button><button onClick={() => setIsEditing(null)} disabled={isProcessing} className="text-gray-500 hover:bg-gray-200 p-1.5 md:p-2 rounded-md"><X size={18} /></button></>) : (<><button onClick={() => { setIsEditing(u.id); setEditForm({username: u.username, password: u.password, role: u.role, permissions: u.permissions || defaultPermissions}); }} className="text-blue-600 hover:bg-blue-100 p-1.5 md:p-2 rounded-md"><Edit2 size={18} /></button><button onClick={async () => { if(confirm('ลบผู้ใช้นี้ออกจากระบบ?')) await deleteDoc(doc(db, "users", u.id)); }} className={`text-red-600 hover:bg-red-100 p-1.5 md:p-2 rounded-md ${u.id === loggedInUser.id ? 'opacity-0 pointer-events-none' : ''}`}><Trash2 size={18} /></button></>)}
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col space-y-4 font-sans px-4 text-center">
        <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><p className="text-gray-500 text-sm md:text-base font-medium">กำลังเตรียมระบบ The Resilient Clinic...</p>
        {loadError && (<div className="mt-4 p-3 md:p-4 bg-red-50 text-red-600 rounded-lg max-w-sm border border-red-100 text-xs md:text-sm"><p className="font-bold mb-1">พบปัญหาการเชื่อมต่อ</p><p>{loadError}</p></div>)}
      </div>
    );
  }

  // หน้าต่างสำหรับผู้บริหาร (Executive view)
  if (isExecutiveView) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        <style>{`input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`}</style>
        <div className="bg-white shadow-sm border-b border-gray-200 z-10 sticky top-0">
          <div className="p-4 md:p-6 flex flex-col items-center justify-center space-y-4 max-w-5xl mx-auto w-full">
            <div className="flex items-center space-x-3"><ResilientLogo className="h-14 md:h-16 rounded-xl shadow-sm px-4 w-[200px] md:w-[250px]" /></div>
            <div className="flex space-x-2 w-full max-w-sm bg-gray-100 p-1.5 rounded-xl"><button onClick={() => setActiveTab('dashboard')} className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}><LayoutDashboard size={18} /><span>Dashboard</span></button><button onClick={() => setActiveTab('stock')} className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'stock' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}><Boxes size={18} /><span>สต๊อกสินค้า</span></button></div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3 md:p-6 pb-20">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex items-center mb-1 md:mb-2"><div className="bg-white border border-gray-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-bold flex items-center shadow-sm"><span className="text-amber-500 mr-2 text-base leading-none">👑</span> Executive View</div></div>
            {activeTab === 'dashboard' && <DashboardView />}{activeTab === 'stock' && <StockView />}
          </div>
        </div>
      </div>
    );
  }

  if (!loggedInUser && !isExecutiveView) return <LoginView />;

  // 🎨 กำหนด Style ของปุ่มเมนู
  const navItemBaseStyle = "snap-start flex-shrink-0 flex items-center space-x-3 w-auto md:w-full px-4 py-3 md:py-3.5 rounded-xl transition-all duration-200 whitespace-nowrap text-sm md:text-base";
  const navItemActiveStyle = "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30";
  const navItemInactiveStyle = "text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans w-full overflow-hidden">
      <style>{`input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`}</style>
      
      <div className="w-full md:w-64 bg-gradient-to-br from-white via-white to-blue-50 border-b md:border-r border-slate-200 flex-shrink-0 z-10 relative overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="relative z-10 flex flex-col h-full">
          <div className="p-4 flex items-center justify-center border-b border-slate-100"><ResilientLogo className="h-16 w-full rounded-lg shadow-sm" /></div>
          {/* ✅ เมนูด้านข้าง อัปเดตชื่อให้ตรงกับโจทย์ทั้งหมด */}
          <nav className="px-3 md:px-4 py-4 space-x-2 md:space-x-0 md:space-y-1.5 flex md:flex-col overflow-x-auto md:overflow-visible scrollbar-hide snap-x">
            {canAccess('dashboard') && <button onClick={() => setActiveTab('dashboard')} className={`${navItemBaseStyle} ${activeTab === 'dashboard' ? navItemActiveStyle : navItemInactiveStyle}`}><LayoutDashboard size={20} /><span>Dashboard</span></button>}
            {canAccess('products') && <button onClick={() => setActiveTab('products')} className={`${navItemBaseStyle} ${activeTab === 'products' ? navItemActiveStyle : navItemInactiveStyle}`}><Package size={20} /><span>การจัดการสินค้า</span></button>}
            {canAccess('stock') && <button onClick={() => setActiveTab('stock')} className={`${navItemBaseStyle} ${activeTab === 'stock' ? navItemActiveStyle : navItemInactiveStyle}`}><Boxes size={20} /><span>สต๊อกสินค้า</span></button>}
            {canAccess('users') && <button onClick={() => setActiveTab('users')} className={`${navItemBaseStyle} ${activeTab === 'users' ? navItemActiveStyle : navItemInactiveStyle}`}><Users size={20} /><span>การจัดการผู้ใช้</span></button>}
            {canAccess('history') && <button onClick={() => setActiveTab('history')} className={`${navItemBaseStyle} ${activeTab === 'history' ? navItemActiveStyle : navItemInactiveStyle}`}><History size={20} /><span>ประวัติการขาย</span></button>}
            {canAccess('sales') && <button onClick={() => setActiveTab('sales')} className={`${navItemBaseStyle} ${activeTab === 'sales' ? navItemActiveStyle : navItemInactiveStyle}`}><ShoppingCart size={20} /><span>บันทึกการขาย (POS)</span></button>}
          </nav>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-[calc(100vh-120px)] md:h-screen overflow-hidden relative w-full">
        <header className="bg-white/80 backdrop-blur-md h-16 border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10 w-full">
          <div className="text-slate-600 font-bold text-base hidden sm:block">
            {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'products' ? 'การจัดการสินค้า' : activeTab === 'stock' ? 'สต๊อกสินค้า' : activeTab === 'users' ? 'การจัดการผู้ใช้' : activeTab === 'history' ? 'ประวัติการขาย' : 'บันทึกการขาย (POS)'}
          </div>
          <div className="flex items-center space-x-3 md:space-x-4 ml-auto w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center space-x-2 text-sm text-slate-700 bg-slate-100/80 py-1.5 px-3 rounded-full border border-slate-200"><User size={14} className="text-blue-600" /><span className="font-bold">{loggedInUser.username}</span><span className="text-slate-400 font-medium">({loggedInUser.role === 'admin' ? 'Admin' : 'Staff'})</span></div>
            <button onClick={() => { setLoggedInUser(null); setActiveTab('sales'); }} className="flex items-center space-x-1.5 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition text-sm font-bold" title="ออกจากระบบ"><LogOut size={16} /> <span className="sm:hidden">ออกระบบ</span></button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-10 relative w-full">
          <div className="max-w-5xl mx-auto relative z-10 w-full">
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