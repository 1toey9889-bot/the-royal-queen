// ==========================================
// 📦 1. นำเข้าเครื่องมือและไลบรารีต่างๆ (Imports)
// ==========================================
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, increment, setDoc, runTransaction 
} from "firebase/firestore";
import { 
  LayoutDashboard, Package, ShoppingCart, Plus, Edit2, Trash2, Save, X, TrendingUp, DollarSign, Boxes, Users, LogOut, Lock, User, Download, History, BarChart3, CalendarDays, ShieldCheck, Search, ArrowUpDown, ChevronDown, 
  QrCode, MinusCircle, PlusCircle, ShoppingBag, Receipt 
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// ==========================================
// 🎨 โลโก้ The Resilient Clinic (วาดตามต้นฉบับ)
// ==========================================
const ResilientLogo = ({ className = "" }) => (
  <div className={`bg-[#0A142A] flex items-center justify-center overflow-hidden ${className}`}>
    <svg viewBox="0 0 320 100" className="h-full w-auto py-2" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(15, 15) scale(0.75)">
        <circle cx="50" cy="50" r="7" fill="#FFFFFF"/>
        <path d="M50 10 C 35 35 35 65 50 75 C 65 65 65 35 50 10 Z" stroke="#CEA85E" strokeWidth="4.5" strokeLinejoin="round"/>
        <path d="M 40 70 C 20 65 15 40 22 25 C 20 45 28 55 38 60" stroke="#CEA85E" strokeWidth="4.5" strokeLinecap="round"/>
        <path d="M 60 70 C 80 65 85 40 78 25 C 80 45 72 55 62 60" stroke="#CEA85E" strokeWidth="4.5" strokeLinecap="round"/>
        <path d="M 30 73 C 10 73 -5 55 5 40 C 5 55 15 65 25 68" stroke="#CEA85E" strokeWidth="4.5" strokeLinecap="round"/>
        <path d="M 70 73 C 90 73 105 55 95 40 C 95 55 85 65 75 68" stroke="#CEA85E" strokeWidth="4.5" strokeLinecap="round"/>
      </g>
      <text x="105" y="38" fontFamily="system-ui, -apple-system, sans-serif" fontSize="12" fontWeight="500" fill="#FFFFFF" letterSpacing="1.5">THE</text>
      <text x="103" y="64" fontFamily="system-ui, -apple-system, sans-serif" fontSize="26" fontWeight="800" fill="#CEA85E" letterSpacing="1.5">RESILIENT</text>
      <text x="105" y="84" fontFamily="system-ui, -apple-system, sans-serif" fontSize="12" fontWeight="500" fill="#FFFFFF" letterSpacing="2.5">CLINIC</text>
    </svg>
  </div>
);

// ==========================================
// 🔥 2. ตั้งค่าการเชื่อมต่อฐานข้อมูล
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

const STORE_OPTIONS = ['Shopee(Re)', 'Shopee(Long)', 'Lazada(Re)', 'Lazada(Long)', 'หน้าร้าน (Walk-in)'];

// ==========================================
// 🚀 3. คอมโพเนนต์หลักของระบบ
// ==========================================
export default function App() {
  const isExecutiveView = new URLSearchParams(window.location.search).get('view') === 'dashboard';

  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [activeTab, setActiveTab] = useState(isExecutiveView ? 'dashboard' : 'sales');    
  
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [users, setUsers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  const productMap = useMemo(() => {
    return products.reduce((map, product) => { map[product.id] = product; return map; }, {});
  }, [products]);

  useEffect(() => {
    const connectionTimeout = setTimeout(() => {
      if (!isUsersLoaded || isLoading) setLoadError("การเชื่อมต่อใช้เวลานานผิดปกติ กรุณาตรวจสอบอินเทอร์เน็ต");
    }, 10000);

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) {
        setDoc(doc(db, "users", "default_admin"), { username: 'admin', password: '123456', role: 'admin', permissions: defaultPermissions });
      } else {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setIsUsersLoaded(true); setLoadError('');
      }
    });

    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false); setLoadError('');
    });

    return () => { clearTimeout(connectionTimeout); unsubscribeUsers(); unsubscribeProducts(); unsubscribeOrders(); };
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      const updatedUser = users.find(u => u.id === loggedInUser.id);
      if (updatedUser) {
        setLoggedInUser(updatedUser);
        if (activeTab !== 'sales' && updatedUser.role !== 'admin' && !updatedUser.permissions?.[activeTab]) setActiveTab('sales');
      } else { setLoggedInUser(null); }
    }
  }, [users, loggedInUser, activeTab]);

  // --- Helpers ---
  const canAccess = (tabName) => { if (isExecutiveView) return tabName === 'dashboard' || tabName === 'stock'; if (!loggedInUser) return false; return loggedInUser.role === 'admin' || tabName === 'sales' || !!loggedInUser.permissions?.[tabName]; };
  const canEditTab = (tabName) => !loggedInUser ? false : (loggedInUser.role === 'admin' || !!loggedInUser.permissions?.[tabName + 'Edit']);
  const canExportTab = (tabName) => !loggedInUser ? false : (loggedInUser.role === 'admin' || !!loggedInUser.permissions?.[tabName + 'Export']);
  const formatMoney = (amount) => new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(isNaN(amount) || amount === null ? 0 : amount);
  const getProduct = (id) => productMap[id];
  const getLocalISODate = (dateString) => { try { const d = dateString ? new Date(dateString) : new Date(); if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0]; d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().split('T')[0]; } catch (e) { return new Date().toISOString().split('T')[0]; } };

  const downloadMobileSafeCSV = (csvString, filename) => {
    const finalCSV = "\uFEFF" + csvString;
    const blob = new Blob([finalCSV], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.setAttribute('download', filename); link.style.display = 'none'; document.body.appendChild(link);
    link.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }));
    setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 1000);
  };

  // ==========================================
  // 🖥️ 4. Views
  // ==========================================

  // 👤 [View 1] Login
  const LoginView = () => { 
    const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
    const handleLogin = (e) => { e.preventDefault(); const foundUser = users.find(u => u.username === username && u.password === password); if (foundUser) { setLoggedInUser(foundUser); setActiveTab(foundUser.role === 'admin' || foundUser.permissions?.dashboard ? 'dashboard' : 'sales'); setError(''); } else { setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); } };
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans"><div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 md:p-10 space-y-8"><div className="text-center space-y-4"><ResilientLogo className="mx-auto h-24 md:h-32 rounded-2xl shadow-lg mb-4 w-full max-w-[320px]" /><p className="text-sm md:text-base text-gray-500 font-medium">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p></div><form onSubmit={handleLogin} className="space-y-6">{error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center font-bold">{error}</div>}<div className="space-y-5"><div><label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">ชื่อผู้ใช้งาน</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={18} className="text-gray-400" /></div><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-gray-50 hover:bg-white focus:bg-white" required /></div></div><div><label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">รหัสผ่าน</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400" /></div><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-gray-50 hover:bg-white focus:bg-white" required /></div></div></div><button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-xl text-base font-bold shadow-lg shadow-blue-600/30 transform hover:-translate-y-0.5">เข้าสู่ระบบ</button></form></div></div>
    );
  };

  // 📊 [View 2] Dashboard
  const DashboardView = () => {
    const [timeframe, setTimeframe] = useState('monthly'); 
    const currentDateStr = getLocalISODate();
    const [filterDate, setFilterDate] = useState(currentDateStr); 
    const [filterMonth, setFilterMonth] = useState(currentDateStr.substring(0, 7)); 
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
    const [filterProductId, setFilterProductId] = useState('all');
    const [filterStore, setFilterStore] = useState('all'); 
    const currentYearNum = new Date().getFullYear();
    const yearOptions = Array.from({length: 8}, (_, i) => currentYearNum - 5 + i);

    const filteredOrders = useMemo(() => {
      return orders.filter(o => {
        const orderDateLocal = getLocalISODate(o.createdAt || o.date);
        const orderMonthLocal = orderDateLocal.substring(0, 7);
        const orderYearLocal = orderDateLocal.substring(0, 4);
        let isTimeMatch = false;
        if (timeframe === 'daily') isTimeMatch = (orderDateLocal === filterDate);
        else if (timeframe === 'monthly') isTimeMatch = (orderMonthLocal === filterMonth);
        else if (timeframe === 'yearly') isTimeMatch = (orderYearLocal === filterYear);
        else if (timeframe === 'all') isTimeMatch = true;
        const isStoreMatch = filterStore === 'all' || o.store === filterStore;
        const isProductMatch = filterProductId === 'all' || (o.items && o.items.some(item => item.productId === filterProductId));
        return isTimeMatch && isStoreMatch && isProductMatch;
      });
    }, [orders, timeframe, filterDate, filterMonth, filterYear, filterProductId, filterStore]);

    let totalQty = 0; let totalRevenue = 0; let totalCost = 0; let totalProfit = 0;
    const productSalesCount = {};
    filteredOrders.forEach(o => {
      if (!o.items) return;
      o.items.forEach(item => {
        if (filterProductId !== 'all' && item.productId !== filterProductId) return;
        const p = getProduct(item.productId); if (!p) return; 
        const qty = Number(item.quantity) || 0;
        const itemCost = item.unitCost !== undefined ? Number(item.unitCost) : Number(p.cost);
        const itemRevenue = Number(item.total) || (Number(item.unitPrice) * qty);
        const itemTotalCost = itemCost * qty;
        totalQty += qty; totalRevenue += itemRevenue; totalCost += itemTotalCost; totalProfit += (itemRevenue - itemTotalCost);
        productSalesCount[item.productId] = (productSalesCount[item.productId] || 0) + qty;
      });
    });

    const topProducts = Object.entries(productSalesCount).map(([id, qty]) => ({ ...getProduct(id), qty })).filter(p => p && p.name).sort((a, b) => b.qty - a.qty).slice(0, 5);

    const exportDashboardToExcel = () => {
      if (filteredOrders.length === 0) { alert("ไม่มีข้อมูลในเงื่อนไขที่เลือก"); return; }
      let timeLabel = timeframe === 'daily' ? `ประจำวันที่ ${filterDate}` : timeframe === 'monthly' ? `ประจำเดือน ${filterMonth}` : timeframe === 'yearly' ? `ประจำปี ${filterYear}` : `ภาพรวมทั้งหมด`;
      const csvRows = [['รายงานสรุปยอดขาย (รายออเดอร์) - The Resilient Clinic'], ['ช่วงเวลา:', timeLabel, 'ร้านค้า:', filterStore, 'วันที่:', new Date().toLocaleString('th-TH')], [], ['หมายเลขออเดอร์', 'วันที่-เวลา', 'ร้านค้า', 'ผู้ทำรายการ', 'ชื่อสินค้า', 'ต้นทุน/ชิ้น', 'ราคาขาย/ชิ้น', 'จำนวน', 'รวมต้นทุน', 'ยอดขาย', 'กำไรสุทธิ']];
      filteredOrders.forEach(o => {
        let safeDate = '-'; try { const d = new Date(o.createdAt || o.date); if(!isNaN(d.getTime())) safeDate = d.toLocaleString('th-TH'); } catch(e) {}
        if (o.items) { o.items.forEach(item => { if (filterProductId !== 'all' && item.productId !== filterProductId) return; const p = getProduct(item.productId); const itemCost = item.unitCost !== undefined ? Number(item.unitCost) : (p ? Number(p.cost) : 0); const qty = Number(item.quantity) || 0; const itemRevenue = Number(item.total) || (Number(item.unitPrice) * qty); csvRows.push([ `"${o.id}"`, `"${safeDate}"`, `"${o.store || '-'}"`, `"${o.soldBy || '-'}"`, `"${p ? p.name : 'สินค้าถูกลบ'}"`, itemCost, item.unitPrice, qty, (itemCost * qty), itemRevenue, (itemRevenue - (itemCost * qty)) ]); }); }
      });
      csvRows.push([], ['สรุปยอดรวมทั้งหมด', '', '', '', '', '', '', totalQty, totalCost, totalRevenue, totalProfit]);
      downloadMobileSafeCSV(csvRows.map(row => row.join(',')).join('\n'), `รายงานยอดขาย_${timeLabel}.csv`);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 md:space-x-3"><div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-md text-white"><BarChart3 size={20} strokeWidth={2.5} className="md:w-6 md:h-6" /></div><h2 className="text-base md:text-xl lg:text-2xl font-extrabold text-gray-800 tracking-tight">สรุปยอดขาย</h2></div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
            <div className="flex items-center space-x-1.5 md:space-x-2 bg-slate-50 px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-gray-200"><span className="text-xs text-gray-500 font-medium">ร้านค้า</span><select value={filterStore} onChange={e => setFilterStore(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none w-20 md:w-auto font-medium text-gray-700"><option value="all">ทุกร้านค้า</option>{STORE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="flex items-center space-x-1.5 md:space-x-2 bg-slate-50 px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-gray-200"><span className="text-xs text-gray-500 font-medium">สินค้า</span><select value={filterProductId} onChange={e => setFilterProductId(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none w-20 md:w-auto font-medium text-gray-700"><option value="all">ดูทั้งหมด</option>{products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}</select></div>
            <div className="flex items-center space-x-1.5 md:space-x-2 bg-slate-50 px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-gray-200"><span className="text-xs text-gray-500 font-medium">ดูแบบ</span><select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none font-medium text-gray-700"><option value="daily">รายวัน</option><option value="monthly">รายเดือน</option><option value="yearly">รายปี</option><option value="all">ยอดรวมสะสม</option></select></div>
            {timeframe !== 'all' && (<div className="flex items-center space-x-1.5 md:space-x-2 bg-blue-50 px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-blue-100">{timeframe === 'daily' && <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none text-blue-700 font-medium" />}{timeframe === 'monthly' && <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none text-blue-700 font-medium" />}{timeframe === 'yearly' && <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none text-blue-700 font-medium">{yearOptions.map(y => <option key={y} value={y}>ปี {y}</option>)}</select>}</div>)}
            {canExportTab('dashboard') && (<button onClick={exportDashboardToExcel} className="flex flex-1 lg:flex-none justify-center items-center space-x-1.5 md:space-x-2 bg-green-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm text-xs md:text-sm font-medium"><Download size={14} className="md:w-4 md:h-4" /><span>ส่งออก Excel</span></button>)}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl shadow-sm border border-gray-100 relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div><h3 className="font-bold text-gray-500 text-xs md:text-sm flex items-center mb-1"><TrendingUp size={14} className="mr-1.5 text-blue-500"/> ยอดขาย</h3><p className="text-xl md:text-2xl font-black text-gray-800 mt-2">฿{formatMoney(totalRevenue)}</p><p className="text-[10px] md:text-xs text-gray-400 mt-1">{filteredOrders.length} บิล ({totalQty} ชิ้น)</p></div>
          <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl shadow-sm border border-gray-100 relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div><h3 className="font-bold text-gray-500 text-xs md:text-sm flex items-center mb-1"><Package size={14} className="mr-1.5 text-orange-500"/> ต้นทุนสินค้ารวม</h3><p className="text-xl md:text-2xl font-black text-gray-800 mt-2">฿{formatMoney(totalCost)}</p><p className="text-[10px] md:text-xs text-gray-400 mt-1">คำนวณจากราคาคลินิก</p></div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 md:p-5 rounded-lg md:rounded-xl shadow-sm border border-green-200 relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div><h3 className="font-bold text-green-800 text-xs md:text-sm flex items-center mb-1"><DollarSign size={14} className="mr-1.5"/> กำไรสุทธิจริง</h3><p className="text-xl md:text-2xl font-black text-green-700 mt-2">฿{formatMoney(totalProfit)}</p><p className="text-[10px] md:text-xs text-green-600/70 mt-1 font-medium">หักต้นทุนแล้ว</p></div>
        </div>
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-hidden"><div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 flex items-center space-x-2"><CalendarDays size={18} className="text-gray-400"/><h3 className="text-sm md:text-lg font-semibold text-gray-800">สินค้าขายดี (ตามเงื่อนไขที่เลือก)</h3></div>
          <div className="p-4 md:p-6"><div className="space-y-3 md:space-y-4">{topProducts.map((p, index) => (<div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0"><div className="flex items-center space-x-2 md:space-x-3"><span className="text-gray-400 font-bold w-4 text-xs md:text-sm">{index + 1}.</span><span className="font-medium text-gray-700 text-xs md:text-base">{p.name}</span></div><div className="flex items-center space-x-3 md:space-x-4 ml-6 sm:ml-0"><span className="text-xs md:text-sm text-gray-500 whitespace-nowrap font-medium">ขายแล้ว <strong className="text-blue-600">{p.qty}</strong> ชิ้น</span><div className="w-24 md:w-32 h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(p.qty / (topProducts[0]?.qty || 1)) * 100}%` }}></div></div></div></div>))}{topProducts.length === 0 && <p className="text-gray-500 text-xs md:text-sm text-center py-6 bg-gray-50 rounded-lg">ไม่มีข้อมูลการขายในเงื่อนไขที่คุณเลือก</p>}</div></div>
        </div>
      </div>
    );
  };

  // 🛒 [View 7] POS 🚀 (บังคับใส่ ID หรือสแกน)
  const SalesView = () => {
    const [customOrderId, setCustomOrderId] = useState('');
    const [selectedStore, setSelectedStore] = useState(STORE_OPTIONS[0]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [customPrice, setCustomPrice] = useState(''); 
    const [quantity, setQuantity] = useState(1);
    const [cart, setCart] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanTarget, setScanTarget] = useState('product'); 
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false); };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
      let scanner = null;
      if (isScanning) {
        setTimeout(() => {
          scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true }, false);
          scanner.render((decodedText) => {
            if (scanTarget === 'orderId') { setCustomOrderId(decodedText); setIsScanning(false); scanner.clear(); } 
            else {
              const scannedProduct = productMap[decodedText];
              if (scannedProduct) { setSelectedProduct(decodedText); setCustomPrice(scannedProduct.price); setIsScanning(false); scanner.clear(); } 
              else { alert(`สแกนสำเร็จรหัส: ${decodedText} แต่ไม่พบในฐานข้อมูลสินค้า`); }
            }
          });
        }, 100);
      }
      return () => { if (scanner) { scanner.clear().catch(e=>console.error(e)); } };
    }, [isScanning, scanTarget, productMap]);

    const filteredProductsForSelect = useMemo(() => {
      if (!productSearchTerm) return products;
      return products.filter(p => String(p?.name || '').toLowerCase().includes(String(productSearchTerm || '').toLowerCase()));
    }, [products, productSearchTerm]);

    useEffect(() => { if (selectedProduct) { const p = getProduct(selectedProduct); if (p) setCustomPrice(p.price); } else { setCustomPrice(''); } }, [selectedProduct, productMap]);

    const cartTotalAmount = cart.reduce((sum, item) => sum + item.total, 0);

    const handleAddToCart = (e) => {
      e.preventDefault();
      const finalQuantity = Number(quantity) || 0;
      const finalPrice = Number(customPrice) || 0;
      if (!selectedProduct) return;
      if (finalQuantity < 1) { setIsError(true); setMessage('จำนวนต้องมากกว่า 0'); return; }
      const product = getProduct(selectedProduct);
      const existingInCart = cart.find(i => i.productId === selectedProduct)?.qty || 0;
      if ((product.stock || 0) < (finalQuantity + existingInCart)) { setIsError(true); setMessage(`สต๊อกไม่พอ`); return; }
      setCart([...cart, { cartId: Date.now().toString(), productId: selectedProduct, name: product.name, qty: finalQuantity, price: finalPrice, cost: Number(product.cost), total: finalPrice * finalQuantity }]);
      setSelectedProduct(''); setCustomPrice(''); setQuantity(1); setProductSearchTerm(''); setIsError(false); setMessage('');
    };

    const removeFromCart = (cartId) => { setCart(cart.filter(i => i.cartId !== cartId)); };

    const handleConfirmOrder = async () => {
      // 🚀 บังคับกรอก ID
      if (customOrderId.trim() === '') { setIsError(true); setMessage('กรุณากรอกหรือสแกน "เลขที่ออเดอร์" ก่อนยืนยันการขาย'); return; }
      if (cart.length === 0 || !selectedStore) return;
      setIsProcessing(true);
      try {
        let safeOrderId = customOrderId.trim().replace(/\//g, '-');
        const orderRef = doc(db, "orders", safeOrderId);
        const auditRef = collection(db, "audit_logs");
        const todayStr = getLocalISODate();
        const summaryRef = doc(db, "daily_summary", todayStr);
        await runTransaction(db, async (transaction) => {
          const existingOrder = await transaction.get(orderRef);
          if (existingOrder.exists()) throw new Error(`เลขที่ออเดอร์ "${safeOrderId}" นี้ถูกใช้ไปแล้ว`);
          const productDocs = {};
          for (const item of cart) {
            if (!productDocs[item.productId]) {
              const pRef = doc(db, "products", item.productId);
              const pDoc = await transaction.get(pRef);
              if (!pDoc.exists()) throw new Error(`ไม่พบสินค้า ${item.name}`);
              productDocs[item.productId] = { ref: pRef, data: pDoc.data(), toDeduct: 0 };
            }
            productDocs[item.productId].toDeduct += item.qty;
          }
          for (const id in productDocs) {
            const p = productDocs[id];
            if (Number(p.data.stock) < p.toDeduct) throw new Error(`สต๊อกไม่พอ`);
            transaction.update(p.ref, { stock: Number(p.data.stock) - p.toDeduct });
          }
          const totalCost = cart.reduce((sum, item) => sum + (item.cost * item.qty), 0);
          transaction.set(orderRef, { store: selectedStore, totalAmount: cartTotalAmount, totalCost, totalProfit: cartTotalAmount - totalCost, createdAt: new Date().toISOString(), soldBy: loggedInUser?.username || 'unknown', items: cart.map(i => ({ productId: i.productId, quantity: i.qty, unitPrice: i.price, unitCost: i.cost, total: i.total })) });
          transaction.set(summaryRef, { totalRevenue: increment(cartTotalAmount), totalProfit: increment(cartTotalAmount - totalCost), totalOrders: increment(1), date: todayStr }, { merge: true });
          transaction.add(doc(auditRef), { action: "CREATE_ORDER", user: loggedInUser?.username || 'unknown', details: `สร้างบิล ${safeOrderId}`, timestamp: new Date().toISOString() });
        });
        setCart([]); setCustomOrderId(''); setIsError(false); setMessage('บันทึกสำเร็จ!'); setTimeout(() => setMessage(''), 3000);
      } catch (err) { setMessage(err.message); setIsError(true); }
      setIsProcessing(false);
    };

    return (
      <div className="relative space-y-6 md:space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-[#f4f7ff] -z-20 rounded-[3rem]"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-sm rounded-[2rem] shadow-xl border border-white p-6 md:p-8">
            <div className="text-center mb-6"><h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">บันทึกรายการขาย (POS)</h2></div>
            {isScanning && (<div className="w-full bg-black rounded-xl overflow-hidden shadow-inner flex flex-col justify-center items-center relative min-h-[250px] mb-6"><div className="absolute top-2 left-2 z-10 bg-black/50 text-white px-3 py-1 rounded text-xs">สแกน: {scanTarget === 'orderId' ? 'เลขที่ออเดอร์' : 'รหัสสินค้า'}</div><button onClick={() => setIsScanning(false)} className="absolute top-2 right-2 z-10 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"><X size={16}/></button><div id="qr-reader" className="w-full h-full text-white text-center">กำลังเปิดกล้อง...</div></div>)}
            <form onSubmit={handleAddToCart} className="space-y-6">
              {message && <div className={`p-4 rounded-xl text-sm font-bold flex items-center justify-center ${isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>{message}</div>}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center justify-center"><Receipt size={16} className="mr-1.5" /> เลขที่ออเดอร์ (ระบุเอง / สแกน) *</label>
                <div className="flex items-center justify-center gap-2 max-w-sm mx-auto relative">
                  <input type="text" value={customOrderId} onChange={(e) => setCustomOrderId(e.target.value)} disabled={isProcessing} placeholder="กรุณากรอกเลขที่ออเดอร์..." className="w-full pl-4 pr-10 py-2.5 border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-slate-700 bg-white" required />
                  <button type="button" onClick={() => { setIsScanning(true); setScanTarget('orderId'); }} className="absolute right-2 p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"><QrCode size={16} /></button>
                </div>
              </div>
              <div className="text-center"><label className="block text-sm font-bold text-slate-700 mb-3 text-center">เลือกร้านค้า</label><div className="flex flex-wrap justify-center gap-2">{STORE_OPTIONS.map(store => (<button key={store} type="button" onClick={() => setSelectedStore(store)} className={`relative px-3 py-2.5 rounded-xl border text-xs md:text-sm font-bold transition-all duration-300 overflow-hidden flex-1 min-w-[100px] max-w-[140px] ${selectedStore === store ? String(store).includes('Shopee') ? 'bg-[#f97316] border-[#f97316] text-white' : 'bg-[#2563eb] border-[#2563eb] text-white' : 'bg-white border-slate-200 text-slate-500'}`}>{store}{selectedStore === store && <div className="absolute top-0 right-0 w-3 h-3 bg-white/25 rounded-bl-lg"></div>}</button>))}</div></div>
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-5"><div className="flex justify-between items-end mb-2"><label className="block text-sm font-bold text-slate-700 text-center flex-1">เลือกสินค้า</label><button type="button" onClick={() => { setIsScanning(true); setScanTarget('product'); }} className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-white border border-slate-200 text-slate-600"><QrCode size={14} /> <span>สแกน QR สินค้า</span></button></div>
                <div className="space-y-3 relative" ref={dropdownRef}><div onClick={() => !isProcessing && setIsDropdownOpen(!isDropdownOpen)} className={`w-full p-3.5 border rounded-xl bg-white text-base cursor-pointer flex justify-center items-center transition-all duration-300 shadow-sm relative ${isDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-slate-200'}`}><div className="flex-1 text-center truncate pr-6"><span className={selectedProduct ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'}>{selectedProduct ? (getProduct(selectedProduct)?.name || 'ไม่พบสินค้า') : 'กรุณาเลือกสินค้า'}</span></div><ChevronDown size={20} className={`absolute right-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} /></div>{isDropdownOpen && (<div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl max-h-[250px] overflow-hidden flex flex-col top-full left-0"><div className="p-3 border-b border-slate-100 bg-slate-50/50"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="พิมพ์ค้นหาชื่อสินค้า..." value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} autoFocus /></div></div><ul className="overflow-y-auto flex-1 p-2 space-y-1 scrollbar-hide">{filteredProductsForSelect.map(p => (<li key={p.id} onClick={() => { if (Number(p.stock) <= 0) return; setSelectedProduct(p.id); setCustomPrice(p.price); setIsDropdownOpen(false); setProductSearchTerm(''); }} className={`px-4 py-3 rounded-xl text-sm flex justify-between items-center cursor-pointer ${Number(p.stock) <= 0 ? "opacity-50" : selectedProduct === p.id ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"}`}><span className="font-bold truncate pr-2">{p.name}</span><span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border">฿{formatMoney(p.price)}</span></li>))}</ul></div>)}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5"><div className="text-center"><label className="block text-sm font-bold text-slate-700 mb-2 text-center">ราคาขาย/ชิ้น (บาท)</label><div className="flex items-center h-[50px] shadow-sm rounded-xl overflow-hidden border border-slate-200 bg-white relative"><button type="button" disabled={!selectedProduct || isProcessing} onClick={() => setCustomPrice(Math.max(0, (Number(customPrice)||0) - 1))} className="h-full w-14 bg-slate-50 font-black">-</button><input type="number" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} className="h-full w-full text-center text-lg font-bold outline-none" disabled={!selectedProduct || isProcessing} required /><button type="button" disabled={!selectedProduct || isProcessing} onClick={() => setCustomPrice((Number(customPrice)||0) + 1)} className="h-full w-14 bg-slate-50 font-black">+</button></div></div><div className="text-center"><label className="block text-sm font-bold text-slate-700 mb-2 text-center">จำนวนชิ้น</label><div className="flex items-center h-[50px] shadow-sm rounded-xl overflow-hidden border border-slate-200 bg-white relative"><button type="button" onClick={() => setQuantity(Math.max(1, (Number(quantity)||0) - 1))} className="h-full w-14 bg-slate-50 font-black">-</button><input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)||1))} className="h-full w-full text-center text-lg font-bold outline-none" min="1" /><button type="button" onClick={() => setQuantity((Number(quantity)||0) + 1)} className="h-full w-14 bg-slate-50 font-black">+</button></div></div></div><div className="pt-2"><button type="submit" disabled={!selectedProduct || isProcessing} className="w-full flex items-center justify-center space-x-2 bg-blue-100 text-blue-700 py-3.5 rounded-xl text-base font-bold transition-all"><PlusCircle size={20} /> <span>เพิ่มลงตะกร้าบิลนี้</span></button></div></div>
            </form>
          </div>
          <div className="lg:col-span-5 bg-white rounded-[2rem] shadow-lg border border-slate-100 p-6 flex flex-col h-full"><h3 className="text-lg font-extrabold text-slate-800 flex items-center mb-4 border-b border-slate-100 pb-4"><ShoppingBag className="mr-2 text-blue-600" size={20}/> บิลปัจจุบัน</h3><div className="mb-3 px-2 text-sm"><div className="flex justify-between text-slate-500 mb-1"><span className="font-bold">ร้านค้า:</span> <span>{selectedStore}</span></div><div className="flex justify-between text-slate-500"><span className="font-bold">เลขบิล:</span> <span className={`font-mono font-bold ${customOrderId ? 'text-blue-600' : 'text-red-400'}`}>{customOrderId || 'ยังไม่ได้ระบุ *'}</span></div></div><div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] content-start scrollbar-hide border-t border-slate-50 pt-3">{cart.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 mt-10"><ShoppingCart size={48} className="mb-3" /><p className="font-medium text-sm">ยังไม่มีสินค้าในตะกร้า</p></div>) : (cart.map((item) => (<div key={item.cartId} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100"><div className="flex-1 pr-3"><p className="font-bold text-slate-800 text-sm">{item.name}</p><p className="text-[11px] text-slate-500 mt-0.5">{item.qty} ชิ้น × ฿{formatMoney(item.price)}</p></div><div className="flex flex-col items-end"><span className="font-black text-blue-600 text-sm">฿{formatMoney(item.total)}</span><button onClick={() => removeFromCart(item.cartId)} className="text-red-400 mt-1"><MinusCircle size={16}/></button></div></div>)))}</div><div className="pt-4 mt-auto border-t border-slate-100"><div className="flex justify-between items-end mb-4 px-2"><span className="text-sm font-bold text-slate-500">ยอดรวมทั้งบิล</span><span className="text-3xl font-black text-blue-600">฿{formatMoney(cartTotalAmount)}</span></div><button onClick={handleConfirmOrder} disabled={cart.length === 0 || customOrderId.trim() === '' || isProcessing} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl text-lg font-bold transition-all disabled:opacity-50 shadow-lg shadow-green-500/30 transform active:scale-95">ยืนยันการขาย (Checkout)</button></div></div>
        </div>
      </div>
    );
  };

  // 👥 [View 6] จัดการผู้ใช้งาน (Users Management)
  const UsersManagementView = () => {
    const [isEditing, setIsEditing] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', password: '', role: 'staff', permissions: defaultPermissions });
    const [isAdding, setIsAdding] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const handlePermissionChange = (perm) => { setEditForm(prev => { const newPerms = { ...prev.permissions, [perm]: !prev.permissions[perm] }; if (perm === 'dashboard' && !newPerms.dashboard) newPerms.dashboardExport = false; if (perm === 'products' && !newPerms.products) { newPerms.productsEdit = false; newPerms.productsExport = false; } if (perm === 'stock' && !newPerms.stock) { newPerms.stockEdit = false; newPerms.stockExport = false; } if (perm === 'history' && !newPerms.history) newPerms.historyEdit = false; return { ...prev, permissions: newPerms }; }); };
    const handleSave = async (id) => { setIsProcessing(true); try { await updateDoc(doc(db, "users", id), { password: editForm.password, role: editForm.role, permissions: editForm.permissions || defaultPermissions }); setIsEditing(null); } catch (error) { alert(error.message); } setIsProcessing(false); };
    const handleAdd = async () => { if (!editForm.username || !editForm.password) return; setIsProcessing(true); try { await addDoc(collection(db, "users"), { username: editForm.username, password: editForm.password, role: editForm.role, permissions: editForm.permissions || defaultPermissions }); setIsAdding(false); setEditForm({ username: '', password: '', role: 'staff', permissions: defaultPermissions }); } catch(error) { alert(error.message); } setIsProcessing(false); };
    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0"><div><h2 className="text-lg md:text-2xl font-bold text-gray-800">จัดการผู้ใช้งาน</h2></div>{!isAdding && <button onClick={() => { setIsAdding(true); setEditForm({username:'', password:'', role:'staff', permissions: defaultPermissions}); setIsEditing(null); }} className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center space-x-1.5 text-xs md:text-sm w-full sm:w-auto justify-center"><Plus size={16} /><span>เพิ่มผู้ใช้</span></button>}</div>
        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto"><table className="w-full text-left border-collapse min-w-[700px]"><thead><tr className="bg-gray-50 text-gray-600 border-b text-xs md:text-sm"><th className="p-3">Username</th><th className="p-3">รหัสผ่าน</th><th className="p-3">ระดับสิทธิ์</th><th className="p-3">Permissions</th><th className="p-3 text-right">จัดการ</th></tr></thead><tbody className="text-xs md:text-sm">{isAdding && (<tr className="bg-blue-50/50 align-top"><td className="p-3"><input className="p-1.5 border rounded w-full outline-none" value={editForm.username} onChange={e=>setEditForm({...editForm, username:e.target.value})}/></td><td className="p-3"><input className="p-1.5 border rounded w-full outline-none" value={editForm.password} onChange={e=>setEditForm({...editForm, password:e.target.value})}/></td><td className="p-3"><select className="p-1.5 border rounded w-full" value={editForm.role} onChange={e=>setEditForm({...editForm, role:e.target.value})}><option value="staff">Staff</option><option value="admin">Admin</option></select></td><td className="p-3">{(editForm.role==='staff') && <div className="flex flex-col space-y-1"><label className="flex items-center space-x-1"><input type="checkbox" checked={editForm.permissions.dashboard} onChange={()=>handlePermissionChange('dashboard')}/><span>แดชบอร์ด</span></label></div>}</td><td className="p-3 text-right space-x-1"><button onClick={handleAdd} className="text-green-600 p-1.5 border rounded-md"><Save size={16}/></button><button onClick={()=>setIsAdding(false)} className="text-red-500 p-1.5 border rounded-md"><X size={16}/></button></td></tr>)}{users.map(u=>(<tr key={u.id} className="border-b hover:bg-gray-50 align-top"><td className="p-3 font-bold">{u.username}</td><td className="p-3">{isEditing===u.id ? <input className="p-1.5 border rounded w-full" value={editForm.password} onChange={e=>setEditForm({...editForm, password:e.target.value})}/> : '••••••'}</td><td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role==='admin'?'bg-purple-100 text-purple-700':'bg-gray-100'}`}>{u.role.toUpperCase()}</span></td><td className="p-3">{(isEditing===u.id && editForm.role!=='admin') ? <div className="flex flex-col space-y-1"><label className="flex items-center space-x-1"><input type="checkbox" checked={editForm.permissions?.dashboard} onChange={()=>handlePermissionChange('dashboard')}/><span>แดชบอร์ด</span></label></div> : (u.role==='admin' ? 'ทุกเมนู' : 'กำหนดเอง')}</td><td className="p-3 text-right space-x-1">{isEditing===u.id ? <><button onClick={()=>handleSave(u.id)} className="text-green-600 p-1.5 border rounded-md"><Save size={16}/></button><button onClick={()=>setIsEditing(null)} className="text-gray-400 p-1.5 border rounded-md"><X size={16}/></button></> : <><button onClick={()=>{setIsEditing(u.id); setEditForm({username:u.username, password:u.password, role:u.role, permissions:u.permissions||defaultPermissions});}} className="text-blue-600 p-1.5 border rounded-md"><Edit2 size={16}/></button><button onClick={async()=>{if(confirm('ลบ?')) await deleteDoc(doc(db, "users", u.id));}} className="text-red-500 p-1.5 border rounded-md"><Trash2 size={16}/></button></>}</td></tr>))}</tbody></table></div>
      </div>
    );
  };

  const navItemBaseStyle = "snap-start flex-shrink-0 flex items-center space-x-3 w-auto md:w-full px-4 py-3 md:py-3.5 rounded-xl transition-all duration-200 whitespace-nowrap text-sm md:text-base";
  const navItemActiveStyle = "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30";
  const navItemInactiveStyle = "text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium";

  // ==========================================
  // 🎨 5. Main Layout
  // ==========================================

  if (!isUsersLoaded || isLoading) return (<div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col space-y-4 font-sans px-4 text-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><p className="text-gray-500 font-medium text-sm md:text-base">กำลังเตรียมระบบ The Resilient Clinic...</p></div>);

  if (isExecutiveView) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col"><style>{`input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`}</style>
        <div className="bg-white shadow-sm border-b z-10 sticky top-0"><div className="p-4 md:p-6 flex flex-col items-center justify-center space-y-4 max-w-5xl mx-auto w-full"><div className="flex items-center space-x-3"><ResilientLogo className="h-14 md:h-16 rounded-xl shadow-sm px-4 w-[200px] md:w-[250px]" /></div><div className="flex space-x-2 w-full max-w-sm bg-gray-100 p-1.5 rounded-xl"><button onClick={() => setActiveTab('dashboard')} className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}><LayoutDashboard size={18} /><span>Dashboard</span></button><button onClick={() => setActiveTab('stock')} className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'stock' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}><Boxes size={18} /><span>สต๊อกสินค้า</span></button></div></div></div>
        <div className="flex-1 overflow-auto p-3 md:p-6 pb-20"><div className="max-w-5xl mx-auto space-y-4"><div className="flex items-center mb-1 md:mb-2"><div className="bg-white border border-gray-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-bold flex items-center shadow-sm"><span className="text-amber-500 mr-2 text-base leading-none">👑</span> Executive View</div></div>{activeTab === 'dashboard' && <DashboardView />}{activeTab === 'stock' && <StockView />}</div></div>
      </div>
    );
  }

  if (!loggedInUser) return <LoginView />;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans">
      <style>{`input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`}</style>
      <div className="w-full md:w-64 bg-gradient-to-br from-white via-white to-blue-50 border-b md:border-r border-slate-200 flex-shrink-0 z-10 relative overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="relative z-10 flex flex-col h-full"><div className="p-4 flex items-center justify-center border-b border-slate-100"><ResilientLogo className="h-16 w-full rounded-lg shadow-sm" /></div><nav className="px-3 md:px-4 py-4 space-x-2 md:space-x-0 md:space-y-1.5 flex md:flex-col overflow-x-auto md:overflow-visible scrollbar-hide snap-x">
            {canAccess('dashboard') && <button onClick={() => setActiveTab('dashboard')} className={`${navItemBaseStyle} ${activeTab === 'dashboard' ? navItemActiveStyle : navItemInactiveStyle}`}><LayoutDashboard size={20} /><span>Dashboard</span></button>}
            {canAccess('products') && <button onClick={() => setActiveTab('products')} className={`${navItemBaseStyle} ${activeTab === 'products' ? navItemActiveStyle : navItemInactiveStyle}`}><Package size={20} /><span>จัดการสินค้า</span></button>}
            {canAccess('stock') && <button onClick={() => setActiveTab('stock')} className={`${navItemBaseStyle} ${activeTab === 'stock' ? navItemActiveStyle : navItemInactiveStyle}`}><Boxes size={20} /><span>สต๊อกสินค้า</span></button>}
            {canAccess('users') && <button onClick={() => setActiveTab('users')} className={`${navItemBaseStyle} ${activeTab === 'users' ? navItemActiveStyle : navItemInactiveStyle}`}><Users size={20} /><span>จัดการผู้ใช้</span></button>}
            {canAccess('history') && <button onClick={() => setActiveTab('history')} className={`${navItemBaseStyle} ${activeTab === 'history' ? navItemActiveStyle : navItemInactiveStyle}`}><History size={20} /><span>ประวัติการขาย</span></button>}
            {canAccess('sales') && <button onClick={() => setActiveTab('sales')} className={`${navItemBaseStyle} ${activeTab === 'sales' ? navItemActiveStyle : navItemInactiveStyle}`}><ShoppingCart size={20} /><span>บันทึกรายการขาย (POS)</span></button>}
          </nav></div>
      </div>
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative"><header className="bg-white/80 backdrop-blur-md h-16 border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10"><div className="text-slate-600 font-bold text-base hidden sm:block">{activeTab === 'dashboard' ? 'ระบบภาพรวม' : activeTab === 'products' ? 'ตั้งค่าฐานข้อมูลสินค้า' : activeTab === 'stock' ? 'ระบบคลังสินค้า' : activeTab === 'users' ? 'ตั้งค่าบัญชีและสิทธิ์พนักงาน' : activeTab === 'history' ? 'ประวัติการทำรายการ' : 'บันทึกรายการขาย (POS)'}</div><div className="flex items-center space-x-3 md:space-x-4 ml-auto w-full sm:w-auto justify-between sm:justify-end"><div className="flex items-center space-x-2 text-sm text-slate-700 bg-slate-100/80 py-1.5 px-3 rounded-full border border-slate-200"><User size={14} className="text-blue-600" /><span className="font-bold">{loggedInUser.username}</span><span className="text-slate-400 font-medium">({loggedInUser.role === 'admin' ? 'Admin' : 'Staff'})</span></div><button onClick={() => { setLoggedInUser(null); setActiveTab('sales'); }} className="flex items-center space-x-1.5 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition text-sm font-bold" title="ออกจากระบบ"><LogOut size={16} /> <span className="sm:hidden">ออกระบบ</span></button></div></header><main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-10 relative"><div className="max-w-5xl mx-auto relative z-10">
            {activeTab === 'dashboard' && canAccess('dashboard') && <DashboardView />}
            {activeTab === 'products' && canAccess('products') && <ProductsView />}
            {activeTab === 'stock' && canAccess('stock') && <StockView />}
            {activeTab === 'users' && canAccess('users') && <UsersManagementView />}
            {activeTab === 'history' && canAccess('history') && <SalesHistoryView />}
            {activeTab === 'sales' && canAccess('sales') && <SalesView />}
          </div></main></div>
    </div>
  );
}