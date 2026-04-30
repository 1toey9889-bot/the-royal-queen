// ==========================================
// 📦 1. นำเข้าเครื่องมือและไลบรารีต่างๆ (Imports)
// ==========================================
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, addDoc, updateDoc, 
  deleteDoc, doc, increment, setDoc, runTransaction,
  query, where, orderBy, limit, startAt, endAt
} from "firebase/firestore";
import { 
  LayoutDashboard, Package, ShoppingCart, Plus, Edit2, Trash2, 
  Save, X, TrendingUp, CalendarDays, DollarSign, Boxes, Users, 
  LogOut, Lock, User, Download, History, BarChart3, ShieldCheck, 
  Search, ArrowUpDown, ChevronDown, Scan, Minus, CheckCircle2, AlertCircle,
  Barcode, Store, UserCircle, FileText, Camera, Aperture, Image as ImageIcon, Menu, Filter
} from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import Tesseract from 'tesseract.js';

// ==========================================
// 🎨 โลโก้ The Resilient Clinic 
// ==========================================
const ResilientLogo = ({ className = "", collapsed = false }) => (
  <div className={`bg-gradient-to-br from-[#0A142A] to-[#112044] flex items-center justify-center overflow-hidden shadow-lg transition-all duration-300 ${className}`}>
    <svg viewBox={collapsed ? "25 15 50 70" : "0 0 320 100"} className="h-full w-auto py-2 drop-shadow-md transition-all duration-500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(15, 12) scale(0.75)">
        <path d="M50 15 C 30 40 35 75 50 85 C 65 75 70 40 50 15 Z" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinejoin="round"/>
        <circle cx="50" cy="55" r="7.5" fill="#FFFFFF"/>
        <path d="M 45 83 C 20 80 10 50 18 30 C 20 50 30 55 35 45" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M 55 83 C 80 80 90 50 82 30 C 80 50 70 55 65 45" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M 38 85 C 10 85 -5 65 2 45 C 5 60 18 65 25 58" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M 62 85 C 90 85 105 65 98 45 C 95 60 82 65 75 58" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
      </g>
      {!collapsed && (
        <g className="animate-in fade-in duration-500">
          <text x="105" y="38" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="500" fill="#FFFFFF" letterSpacing="1.5">THE</text>
          <text x="103" y="64" fontFamily="system-ui, -apple-system, sans-serif" fontSize="26" fontWeight="800" fill="#CEA85E" letterSpacing="1.5">RESILIENT</text>
          <text x="105" y="84" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="500" fill="#FFFFFF" letterSpacing="2.5">CLINIC</text>
        </g>
      )}
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  // 🛠️ State สำหรับการ Query Sales ตามช่วงเวลา (แก้ปัญหา Quota)
  const [salesFilter, setSalesFilter] = useState({
    timeframe: 'daily',
    date: new Date().toISOString().split('T')[0],
    month: new Date().toISOString().substring(0, 7),
    year: new Date().getFullYear().toString()
  });

  const productMap = useMemo(() => {
    return products.reduce((map, product) => {
      map[product.id] = product;
      return map;
    }, {});
  }, [products]);

  // 📡 1. ดึงข้อมูลพนักงานและสินค้า (ดึงครั้งเดียวหรือ Real-time ปกติเพราะข้อมูลน้อย)
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) {
        setDoc(doc(db, "users", "default_admin"), { username: 'admin', password: '123456', role: 'admin', permissions: defaultPermissions });
        setDoc(doc(db, "users", "default_user"), { username: 'user', password: '123456', role: 'staff', permissions: defaultPermissions });
      } else {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setIsUsersLoaded(true);
      }
    });

    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubscribeUsers(); unsubscribeProducts(); };
  }, []);

  // 📡 2. ดึงข้อมูลยอดขายแบบ Smart Query (จำกัดเฉพาะช่วงเวลาที่เลือกเพื่อลด Quota)
  useEffect(() => {
    setIsLoading(true);
    let salesQuery;
    const salesCol = collection(db, "sales");

    // กำหนดจุดเริ่มต้นและสิ้นสุดของเวลาในการ Query (ISO String)
    let start, end;
    if (salesFilter.timeframe === 'daily') {
      start = `${salesFilter.date}T00:00:00.000Z`;
      end = `${salesFilter.date}T23:59:59.999Z`;
    } else if (salesFilter.timeframe === 'monthly') {
      start = `${salesFilter.month}-01T00:00:00.000Z`;
      end = `${salesFilter.month}-31T23:59:59.999Z`;
    } else if (salesFilter.timeframe === 'yearly') {
      start = `${salesFilter.year}-01-01T00:00:00.000Z`;
      end = `${salesFilter.year}-12-31T23:59:59.999Z`;
    }

    if (salesFilter.timeframe === 'all') {
      // ดูทั้งหมด: ดึงข้อมูล 300 รายการล่าสุด (เพื่อป้องกัน Quota เต็มกะทันหัน)
      salesQuery = query(salesCol, orderBy("date", "desc"), limit(300));
    } else {
      // ดึงตามช่วงเวลา: ดึงเฉพาะที่อยู่ใน range
      salesQuery = query(
        salesCol, 
        where("date", ">=", start), 
        where("date", "<=", end),
        orderBy("date", "desc")
      );
    }

    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
      setLoadError('');
    }, (error) => {
      console.error("Sales Query Error:", error);
      if (error.code === 'resource-exhausted') {
        setLoadError("โควต้า Firebase เต็ม (Quota Exceeded) กรุณารอพรุ่งนี้หรืออัปเกรดแพลน");
      }
      setIsLoading(false);
    });

    return () => unsubscribeSales();
  }, [salesFilter]);

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
    const url = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.setAttribute('download', filename);
    document.body.appendChild(link); link.click(); setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 1000);
  };

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
    const [filterProductId, setFilterProductId] = useState('all');
    const [filterStore, setFilterStore] = useState('all'); 
    const currentYearNum = new Date().getFullYear(); 
    const yearOptions = Array.from({length: 8}, (_, i) => currentYearNum - 5 + i);

    // Filter ข้อมูลในหน่วยความจำ (สำหรับสินค้าและร้านค้า) หลังจาก Firestore Query มาแล้ว
    const filteredSales = useMemo(() => {
      return sales.filter(s => {
        const isProductMatch = filterProductId === 'all' || s.productId === filterProductId;
        const isStoreMatch = filterStore === 'all' || s.store === filterStore;
        return isProductMatch && isStoreMatch;
      });
    }, [sales, filterProductId, filterStore]);

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
      let timeLabel = salesFilter.timeframe === 'daily' ? `ประจำวันที่ ${salesFilter.date}` : salesFilter.timeframe === 'monthly' ? `ประจำเดือน ${salesFilter.month}` : salesFilter.timeframe === 'yearly' ? `ประจำปี ${salesFilter.year}` : `ภาพรวมทั้งหมด`;
      const csvRows = [['รายงานสรุปยอดขาย'], [`ช่วงเวลา: ${timeLabel}`], []];
      csvRows.push(['วันที่-เวลา', 'รหัสออเดอร์', 'ร้านค้า', 'ชื่อสินค้า', 'ราคาขาย', 'จำนวน', 'ยอดขาย', 'กำไรสุทธิ']);
      filteredSales.forEach(s => {
        const p = getProduct(s.productId);
        const rowProfit = (Number(s.total) || 0) - ((s.unitCost || p?.cost || 0) * (s.quantity || 0));
        csvRows.push([new Date(s.date).toLocaleString('th-TH'), s.orderId, s.store, p?.name, s.unitPrice, s.quantity, s.total, rowProfit]);
      });
      downloadMobileSafeCSV(csvRows.map(row => row.join(',')).join('\n'), `รายงานยอดขาย.csv`);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-2xl text-white"><BarChart3 size={24} /></div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-800">สรุปยอดขาย</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
               <span className="text-xs text-slate-500 font-bold">ร้านค้า</span>
               <select value={filterStore} onChange={e => setFilterStore(e.target.value)} className="bg-transparent text-xs font-black text-blue-700 outline-none"><option value="all">ทุกร้านค้า</option>{STORE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
               <span className="text-xs text-slate-500 font-bold">ดูแบบ</span>
               <select value={salesFilter.timeframe} onChange={e => setSalesFilter({...salesFilter, timeframe: e.target.value})} className="bg-transparent text-xs font-black text-blue-700 outline-none"><option value="daily">รายวัน</option><option value="monthly">รายเดือน</option><option value="yearly">รายปี</option><option value="all">ล่าสุด 300 รายการ</option></select>
            </div>
            {salesFilter.timeframe !== 'all' && (
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                {salesFilter.timeframe === 'daily' && <input type="date" value={salesFilter.date} onChange={e => setSalesFilter({...salesFilter, date: e.target.value})} className="bg-transparent text-xs font-black text-blue-700 outline-none" />}
                {salesFilter.timeframe === 'monthly' && <input type="month" value={salesFilter.month} onChange={e => setSalesFilter({...salesFilter, month: e.target.value})} className="bg-transparent text-xs font-black text-blue-700 outline-none" />}
                {salesFilter.timeframe === 'yearly' && <select value={salesFilter.year} onChange={e => setSalesFilter({...salesFilter, year: e.target.value})} className="bg-transparent text-xs font-black text-blue-700 outline-none">{yearOptions.map(y => <option key={y} value={y}>ปี {y}</option>)}</select>}
              </div>
            )}
            {canExportTab('dashboard') && (<button onClick={exportDashboardToExcel} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 text-xs font-bold flex items-center"><Download size={16} className="mr-1.5" />ส่งออก</button>)}
          </div>
        </div>

        {/* Loading State เมื่อ Query ข้อมูลจาก Firebase */}
        {isLoading ? (
          <div className="p-20 text-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-slate-500 font-bold">กำลังดึงข้อมูลจาก Database...</p></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                <h3 className="font-bold text-slate-500 text-sm flex items-center mb-2"><TrendingUp size={16} className="mr-2 text-blue-500"/> ยอดขายรวม</h3>
                <p className="text-xl md:text-2xl font-black text-slate-800 mt-2 truncate">฿{formatMoney(dashboardStats.totalRevenue)}</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">{dashboardStats.totalOrders} ออเดอร์ ({dashboardStats.totalQty} ชิ้น)</p>
              </div>
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>
                <h3 className="font-bold text-slate-500 text-sm flex items-center mb-2"><Package size={16} className="mr-2 text-orange-500"/> ต้นทุนสินค้ารวม</h3>
                <p className="text-xl md:text-2xl font-black text-slate-800 mt-2 truncate">฿{formatMoney(dashboardStats.totalCost)}</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">คำนวณจากราคาคลินิก</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-100/50 p-5 md:p-6 rounded-3xl shadow-sm border border-emerald-100 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <h3 className="font-bold text-emerald-800 text-sm flex items-center mb-2"><ShoppingCart size={16} className="mr-2"/> จำนวนออเดอร์</h3>
                <p className="text-xl md:text-2xl font-black text-emerald-700 mt-2 truncate">{dashboardStats.totalOrders} <span className="text-base md:text-lg font-bold">ออเดอร์</span></p>
                <p className="text-xs text-emerald-600/80 mt-2 font-bold">รวมทั้งหมด {dashboardStats.totalQty} ชิ้น</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
                <CalendarDays size={20} className="text-slate-400"/>
                <h3 className="text-base font-black text-slate-800">สินค้าขายดี (ในช่วงที่เลือก)</h3>
              </div>
              <div className="p-5 md:p-6">
                <div className="space-y-4">
                  {dashboardStats.topProducts.map((p, index) => (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-black text-xs">{index + 1}</span>
                        <span className="font-bold text-slate-700 text-sm">{p.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 ml-9 sm:ml-0">
                        <span className="text-xs text-slate-500">ขาย <strong className="text-blue-600">{p.qty}</strong> ชิ้น</span>
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(p.qty / (dashboardStats.topProducts[0]?.qty || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {dashboardStats.topProducts.length === 0 && <p className="text-slate-500 text-sm text-center py-8">ไม่มีข้อมูลการขายในเงื่อนไขที่คุณเลือก</p>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const SalesView = () => {
    const [selectedStore, setSelectedStore] = useState(STORE_OPTIONS[0]);
    const [orderId, setOrderId] = useState(''); 
    const [scanMode, setScanMode] = useState(null); 
    const [cart, setCart] = useState([]); 
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [customGrandTotal, setCustomGrandTotal] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');

    const posTotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const finalTotal = customGrandTotal !== '' ? Number(customGrandTotal) : posTotal;

    const addToCart = (product) => {
      const stockAmount = Number(product.stock) || 0;
      if (stockAmount <= 0) return;
      const existingItem = cart.find(item => item.productId === product.id);
      if (existingItem) setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      else setCart([...cart, { productId: product.id, name: product.name, price: Number(product.price) || 0, quantity: 1, stock: product.stock }]);
      setIsDropdownOpen(false); setProductSearchTerm('');
    };

    const updateCartItem = (productId, field, value) => {
      setCart(cart.map(item => item.productId === productId ? { ...item, [field]: value } : item));
    };

    const executeCheckout = async () => {
      setIsProcessing(true);
      try {
        const checkoutTime = new Date().toISOString();
        await runTransaction(db, async (transaction) => {
          for (const item of cart) {
            const productRef = doc(db, "products", item.productId);
            const pDoc = await transaction.get(productRef);
            if (!pDoc.exists()) throw new Error("ไม่พบสินค้า");
            if (Number(pDoc.data().stock) < item.quantity) throw new Error(`สต๊อก ${item.name} ไม่พอ`);
            
            transaction.update(productRef, { stock: increment(-item.quantity) });
            const salesRef = doc(collection(db, "sales"));
            transaction.set(salesRef, {
              orderId: orderId || '-', store: selectedStore, productId: item.productId, 
              quantity: Number(item.quantity), total: (finalTotal/posTotal) * (item.price * item.quantity),
              unitPrice: item.price, unitCost: pDoc.data().cost, date: checkoutTime, soldBy: loggedInUser?.username || 'unknown'
            });
          }
        });
        setCart([]); setOrderId(''); setCustomGrandTotal(''); setShowConfirmModal(false);
        setMessage('บันทึกสำเร็จ!'); setTimeout(() => setMessage(''), 3000);
      } catch (err) { alert(err.message); }
      setIsProcessing(false);
    };

    return (
      <div className="space-y-4 max-w-5xl mx-auto w-full z-10 animate-in fade-in">
        <div className="flex items-center space-x-3 mb-2">
           <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600"><ShoppingCart size={24} /></div>
           <h2 className="text-xl font-black text-slate-800">บันทึกการขาย (POS)</h2>
        </div>

        {showConfirmModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
              <h3 className="text-xl font-bold mb-4 text-center">ยืนยันการขาย</h3>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between"><span>ร้านค้า:</span><span className="font-bold">{selectedStore}</span></div>
                <div className="flex justify-between"><span>ยอดรวม:</span><span className="font-bold text-blue-600">฿{formatMoney(finalTotal)}</span></div>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">ยกเลิก</button>
                <button onClick={executeCheckout} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">ตกลง</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="grid grid-cols-5 gap-2">
            {STORE_OPTIONS.map(s => (
              <button key={s} onClick={() => setSelectedStore(s)} className={`py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${selectedStore === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-transparent'}`}>{s}</button>
            ))}
          </div>
          <div className="flex space-x-3">
            <input type="text" value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="รหัสออเดอร์..." className="flex-1 p-3 border rounded-xl bg-slate-50 font-bold" />
            <button onClick={() => setScanMode('camera')} className="px-4 py-3 bg-slate-800 text-white rounded-xl"><Scan size={20} /></button>
          </div>
          <div className="relative">
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full p-3 border rounded-xl text-left flex justify-between bg-slate-50 font-medium"><span>เลือกสินค้า...</span><ChevronDown size={20} /></button>
            {isDropdownOpen && (
              <div className="absolute w-full mt-2 bg-white border rounded-xl shadow-xl max-h-60 overflow-y-auto z-50">
                {products.map(p => (
                  <div key={p.id} onClick={() => addToCart(p)} className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between border-b">
                    <span className="font-bold">{p.name}</span>
                    <span className="text-xs text-slate-500">คงเหลือ {p.stock}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cart.length > 0 && (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="font-bold text-sm flex-1">{item.name}</span>
                  <div className="flex items-center space-x-3">
                    <input type="number" value={item.quantity} onChange={e => updateCartItem(item.productId, 'quantity', e.target.value)} className="w-12 text-center bg-white border rounded" />
                    <span className="font-bold w-20 text-right">฿{formatMoney(item.price * item.quantity)}</span>
                    <button onClick={() => setCart(cart.filter(c => c.productId !== item.productId))} className="text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-blue-600 text-white rounded-2xl flex justify-between items-center mt-4">
                <span className="font-bold">ยอดรวมสุทธิ</span>
                <input type="number" value={customGrandTotal} placeholder={posTotal} onChange={e => setCustomGrandTotal(e.target.value)} className="bg-white/20 text-white font-black text-xl text-right w-32 outline-none rounded p-1" />
              </div>
              <button onClick={() => setShowConfirmModal(true)} className="w-full py-4 bg-blue-700 text-white rounded-2xl font-black shadow-lg">บันทึกการขาย</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SalesHistoryView = () => {
    const groupedHistorySales = useMemo(() => groupSalesByTransaction(sales), [sales]);
    
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><History size={24} /></div>
            <h2 className="text-xl font-black text-slate-800">ประวัติการขาย (Query Filter)</h2>
          </div>
          <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-2xl">
             <select value={salesFilter.timeframe} onChange={e => setSalesFilter({...salesFilter, timeframe: e.target.value})} className="bg-transparent text-sm font-bold text-blue-700 outline-none">
                <option value="daily">รายวัน</option><option value="monthly">รายเดือน</option><option value="yearly">รายปี</option><option value="all">ล่าสุด 300 รายการ</option>
             </select>
             {salesFilter.timeframe === 'daily' && <input type="date" value={salesFilter.date} onChange={e => setSalesFilter({...salesFilter, date: e.target.value})} className="bg-transparent text-sm font-bold" />}
          </div>
        </div>

        <div className="overflow-x-auto pb-8">
          <table className="w-full text-left border-separate min-w-[800px]" style={{ borderSpacing: '0 8px' }}>
            <thead>
              <tr className="text-slate-400 text-xs uppercase font-bold">
                <th className="px-4">เวลา</th><th className="px-4">รหัสออเดอร์</th><th className="px-4">ร้านค้า</th><th className="px-4">สินค้า</th><th className="px-4 text-center">จำนวน</th><th className="px-4 text-right">ยอดรวม</th><th className="px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            {groupedHistorySales.map(group => (
              <tbody key={group.id} className="bg-white shadow-sm rounded-2xl">
                {group.items.map((sale, idx) => (
                  <tr key={sale.id} className="text-xs border-t">
                    <td className="p-4">{idx === 0 ? new Date(sale.date).toLocaleTimeString('th-TH') : ''}</td>
                    <td className="p-4 font-bold">{sale.orderId}</td>
                    <td className="p-4">{sale.store}</td>
                    <td className="p-4 font-medium">{getProduct(sale.productId)?.name || 'N/A'}</td>
                    <td className="p-4 text-center">{sale.quantity}</td>
                    <td className="p-4 text-right font-black">฿{formatMoney(sale.total)}</td>
                    <td className="p-4 text-right">
                      <button onClick={async () => {
                        if(confirm('ลบรายการนี้?')) {
                          await runTransaction(db, async (t) => {
                            const pRef = doc(db, "products", sale.productId);
                            const pDoc = await t.get(pRef);
                            if(pDoc.exists()) t.update(pRef, { stock: increment(sale.quantity) });
                            t.delete(doc(db, "sales", sale.id));
                          });
                        }
                      }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </div>
    );
  };

  const ProductsView = () => {
    const [isAdding, setIsAdding] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', cost: '', price: '' });
    
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-black">การจัดการสินค้า</h2>
          <button onClick={() => setIsAdding(!isAdding)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold">+ เพิ่มสินค้า</button>
        </div>
        {isAdding && (
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 grid grid-cols-4 gap-4">
            <input placeholder="ชื่อสินค้า" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="p-2 border rounded-xl" />
            <input placeholder="ต้นทุน" type="number" value={editForm.cost} onChange={e => setEditForm({...editForm, cost: e.target.value})} className="p-2 border rounded-xl" />
            <input placeholder="ราคาขาย" type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className="p-2 border rounded-xl" />
            <button onClick={async () => {
              await addDoc(collection(db, "products"), { ...editForm, stock: 0 });
              setIsAdding(false);
            }} className="bg-emerald-600 text-white rounded-xl font-bold">บันทึก</button>
          </div>
        )}
        <div className="bg-white rounded-3xl overflow-hidden border shadow-sm">
          <table className="w-full text-left">
            <tr className="bg-slate-50 text-xs font-bold uppercase"><th className="p-4">ชื่อสินค้า</th><th className="p-4">ต้นทุน</th><th className="p-4">ราคาขาย</th><th className="p-4 text-right">จัดการ</th></tr>
            {products.map(p => (
              <tr key={p.id} className="border-t text-sm">
                <td className="p-4 font-bold">{p.name}</td>
                <td className="p-4 text-orange-600">฿{formatMoney(p.cost)}</td>
                <td className="p-4 text-blue-600">฿{formatMoney(p.price)}</td>
                <td className="p-4 text-right">
                  <button onClick={() => deleteDoc(doc(db, "products", p.id))} className="text-red-400"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </table>
        </div>
      </div>
    );
  };

  const StockView = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
        <h2 className="text-xl font-black">สต๊อกคงเหลือ</h2>
      </div>
      <div className="bg-white rounded-3xl overflow-hidden border shadow-sm">
        <table className="w-full text-left">
          <tr className="bg-slate-50 text-xs font-bold uppercase"><th className="p-4">ชื่อสินค้า</th><th className="p-4 text-center">สต๊อก</th><th className="p-4 text-right">ปรับปรุง</th></tr>
          {products.map(p => (
            <tr key={p.id} className="border-t text-sm">
              <td className="p-4 font-bold">{p.name}</td>
              <td className="p-4 text-center"><span className={`px-2 py-1 rounded-lg font-bold ${p.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{p.stock}</span></td>
              <td className="p-4 text-right">
                <button onClick={() => {
                  const val = prompt('ใส่จำนวนสต๊อกใหม่:', p.stock);
                  if(val !== null) updateDoc(doc(db, "products", p.id), { stock: Number(val) });
                }} className="text-blue-600"><Edit2 size={16} /></button>
              </td>
            </tr>
          ))}
        </table>
      </div>
    </div>
  );

  const UsersManagementView = () => (
    <div className="p-10 text-center text-slate-400 font-bold">ระบบจัดการผู้ใช้ (Admin Only)</div>
  );

  // ==========================================
  // 🎨 5. โครงสร้างหน้าจอหลัก (Main Layout Render)
  // ==========================================
  if (!isUsersLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col space-y-5 px-4 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-bold">กำลังเชื่อมต่อฐานข้อมูล...</p>
      </div>
    );
  }

  if (!loggedInUser && !isExecutiveView) return <LoginView />;

  const navItemBaseStyle = `snap-start flex-shrink-0 flex items-center md:w-full py-3.5 rounded-xl transition-all duration-200 text-sm group border border-transparent ${isSidebarCollapsed ? 'md:justify-center px-4 md:px-0' : 'px-4'}`;
  const navItemActiveStyle = "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20";
  const navItemInactiveStyle = "text-slate-600 hover:bg-slate-100 hover:text-blue-600 font-medium";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row w-full overflow-hidden">
      <div className={`w-full ${isSidebarCollapsed ? 'md:w-[80px]' : 'md:w-64'} bg-white border-b md:border-r border-slate-200 flex-shrink-0 transition-all duration-300`}>
        <div className="flex flex-col h-full">
          {!isSidebarCollapsed && (
            <div className="p-4 flex items-center justify-center border-b border-slate-100">
              <ResilientLogo className="h-12 w-full rounded-xl" />
            </div>
          )}
          <nav className="px-3 py-4 space-x-2 md:space-x-0 md:space-y-1.5 flex md:flex-col overflow-x-auto scrollbar-hide">
            {canAccess('dashboard') && <button onClick={() => setActiveTab('dashboard')} className={`${navItemBaseStyle} ${activeTab === 'dashboard' ? navItemActiveStyle : navItemInactiveStyle}`}><LayoutDashboard size={20} /><span className={`${isSidebarCollapsed ? 'md:hidden' : 'ml-2.5'}`}>Dashboard</span></button>}
            {canAccess('products') && <button onClick={() => setActiveTab('products')} className={`${navItemBaseStyle} ${activeTab === 'products' ? navItemActiveStyle : navItemInactiveStyle}`}><Package size={20} /><span className={`${isSidebarCollapsed ? 'md:hidden' : 'ml-2.5'}`}>สินค้า</span></button>}
            {canAccess('stock') && <button onClick={() => setActiveTab('stock')} className={`${navItemBaseStyle} ${activeTab === 'stock' ? navItemActiveStyle : navItemInactiveStyle}`}><Boxes size={20} /><span className={`${isSidebarCollapsed ? 'md:hidden' : 'ml-2.5'}`}>สต๊อก</span></button>}
            {canAccess('history') && <button onClick={() => setActiveTab('history')} className={`${navItemBaseStyle} ${activeTab === 'history' ? navItemActiveStyle : navItemInactiveStyle}`}><History size={20} /><span className={`${isSidebarCollapsed ? 'md:hidden' : 'ml-2.5'}`}>ประวัติ</span></button>}
            {canAccess('sales') && <button onClick={() => setActiveTab('sales')} className={`${navItemBaseStyle} ${activeTab === 'sales' ? navItemActiveStyle : navItemInactiveStyle}`}><ShoppingCart size={20} /><span className={`${isSidebarCollapsed ? 'md:hidden' : 'ml-2.5'}`}>ขาย (POS)</span></button>}
          </nav>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-6">
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 bg-slate-50 rounded-lg md:flex hidden"><Menu size={18} /></button>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-black text-slate-700">{loggedInUser?.username || 'Guest'}</span>
            <button onClick={() => setLoggedInUser(null)} className="text-red-500"><LogOut size={18} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {loadError && <div className="bg-red-600 text-white p-4 rounded-2xl mb-6 font-bold text-center animate-bounce">{loadError}</div>}
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'products' && <ProductsView />}
            {activeTab === 'stock' && <StockView />}
            {activeTab === 'users' && <UsersManagementView />}
            {activeTab === 'history' && <SalesHistoryView />}
            {activeTab === 'sales' && <SalesView />}
          </div>
        </main>
      </div>
    </div>
  );
}