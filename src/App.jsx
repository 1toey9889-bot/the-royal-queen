// ==========================================
// 📦 1. นำเข้าเครื่องมือและไลบรารีต่างๆ (Imports)
// ==========================================
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  increment,
  setDoc,
  runTransaction // 🚀 นำเข้า runTransaction สำหรับ Enterprise Atomic POS
} from "firebase/firestore";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  TrendingUp,
  Calendar,
  DollarSign,
  Boxes,
  Users,
  LogOut,
  Lock,
  User,
  Download,
  History,
  BarChart3,
  CalendarDays,
  ShieldCheck,
  Search,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';

// ==========================================
// 🎨 โลโก้ The Resilient Clinic 
// ==========================================
const ResilientLogo = ({ className = "" }) => (
  <div className={`bg-[#0A142A] flex items-center justify-center overflow-hidden ${className}`}>
    <svg viewBox="0 0 320 100" className="h-full w-auto py-2" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Lotus Icon */}
      <g transform="translate(15, 12) scale(0.75)">
        <path d="M50 15 C 30 40 35 75 50 85 C 65 75 70 40 50 15 Z" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinejoin="round"/>
        <circle cx="50" cy="55" r="7.5" fill="#FFFFFF"/>
        <path d="M 45 83 C 20 80 10 50 18 30 C 20 50 30 55 35 45" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M 55 83 C 80 80 90 50 82 30 C 80 50 70 55 65 45" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M 38 85 C 10 85 -5 65 2 45 C 5 60 18 65 25 58" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M 62 85 C 90 85 105 65 98 45 C 95 60 82 65 75 58" stroke="#CEA85E" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
      </g>
      {/* Text */}
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
export const db = getFirestore(app); // Export db สำหรับ service functions

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

  // 🚀 O(1) Product Map (Enterprise Pattern) - ทำงานเร็วกว่า Array.find()
  const productMap = useMemo(() => {
    return products.reduce((map, product) => {
      map[product.id] = product;
      return map;
    }, {});
  }, [products]);

  useEffect(() => {
    const connectionTimeout = setTimeout(() => {
      if (!isUsersLoaded || isLoading) {
        setLoadError("การเชื่อมต่อใช้เวลานานผิดปกติ กรุณาตรวจสอบอินเทอร์เน็ตหรือรีเฟรชหน้าจอใหม่");
      }
    }, 10000);

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) {
        setDoc(doc(db, "users", "default_admin"), { username: 'admin', password: '123456', role: 'admin', permissions: defaultPermissions });
        setDoc(doc(db, "users", "default_user"), { username: 'user', password: '123456', role: 'staff', permissions: defaultPermissions });
      } else {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
        setIsUsersLoaded(true);
        setLoadError('');
      }
    }, (error) => {
      console.error("Users Error:", error);
      setLoadError("ไม่สามารถดึงข้อมูลบัญชีผู้ใช้ได้");
      setIsUsersLoaded(true);
    });

    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
    }, (error) => {
      console.error("Products Error:", error);
    });

    const unsubscribeSales = onSnapshot(collection(db, "sales"), (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSales(salesData);
      setIsLoading(false);
      setLoadError('');
    }, (error) => {
      console.error("Sales Error:", error);
      setIsLoading(false);
    });

    return () => {
      clearTimeout(connectionTimeout);
      unsubscribeUsers();
      unsubscribeProducts();
      unsubscribeSales();
    };
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      const updatedUser = users.find(u => u.id === loggedInUser.id);
      if (updatedUser) {
        setLoggedInUser(updatedUser);
        if (activeTab !== 'sales' && updatedUser.role !== 'admin' && !updatedUser.permissions?.[activeTab]) {
          setActiveTab('sales');
        }
      } else {
        setLoggedInUser(null);
      }
    }
  }, [users]);

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

  // ดึงข้อมูลผ่าน O(1) Map
  const getProduct = (id) => productMap[id];

  const getLocalISODate = (dateString) => {
    try {
      const d = dateString ? new Date(dateString) : new Date();
      if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  };

  const downloadMobileSafeCSV = (csvString, filename) => {
    const universalBOM = "\uFEFF";
    const finalCSV = universalBOM + csvString;
    const blob = new Blob([finalCSV], { type: 'text/csv;charset=utf-8;' });
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename); return;
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    const event = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 1000);
  };

  // ==========================================
  // 🖥️ 4. ส่วนแสดงผลหน้าจอต่างๆ (Views / Pages)
  // ==========================================

  // 👤 [View 1] Login
  const LoginView = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
      e.preventDefault();
      const foundUser = users.find(u => u.username === username && u.password === password);
      if (foundUser) {
        setLoggedInUser(foundUser);
        const startTab = foundUser.role === 'admin' || foundUser.permissions?.dashboard ? 'dashboard' : 'sales';
        setActiveTab(startTab); 
        setError('');
      } else { setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 md:p-10 space-y-8">
          <div className="text-center space-y-4">
            <ResilientLogo className="mx-auto h-24 md:h-32 rounded-2xl shadow-lg mb-4 w-full max-w-[320px]" />
            <p className="text-sm md:text-base text-gray-500 font-medium">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center font-bold">{error}</div>}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">ชื่อผู้ใช้งาน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={18} className="text-gray-400" /></div>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm md:text-base outline-none bg-gray-50 hover:bg-white focus:bg-white" placeholder="admin หรือ user" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">รหัสผ่าน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400" /></div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm md:text-base outline-none bg-gray-50 hover:bg-white focus:bg-white" placeholder="••••••" required />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-xl text-base font-bold transition-all shadow-lg shadow-blue-600/30 transform hover:-translate-y-0.5 active:translate-y-0">เข้าสู่ระบบ</button>
          </form>
        </div>
      </div>
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

    const filteredSales = useMemo(() => {
      return sales.filter(s => {
        const saleDateLocal = getLocalISODate(s.date);
        const saleMonthLocal = saleDateLocal.substring(0, 7);
        const saleYearLocal = saleDateLocal.substring(0, 4);
        let isTimeMatch = false;
        if (timeframe === 'daily') isTimeMatch = (saleDateLocal === filterDate);
        else if (timeframe === 'monthly') isTimeMatch = (saleMonthLocal === filterMonth);
        else if (timeframe === 'yearly') isTimeMatch = (saleYearLocal === filterYear);
        else if (timeframe === 'all') isTimeMatch = true;
        const isProductMatch = filterProductId === 'all' || s.productId === filterProductId;
        const isStoreMatch = filterStore === 'all' || s.store === filterStore;
        return isTimeMatch && isProductMatch && isStoreMatch;
      });
    }, [sales, products, timeframe, filterDate, filterMonth, filterYear, filterProductId, filterStore]);

    let totalQty = 0; let totalRevenue = 0; let totalCost = 0; let totalProfit = 0;
    filteredSales.forEach(s => {
      const p = getProduct(s.productId);
      if (!p) return; 
      const qty = Number(s.quantity) || 0;
      totalQty += qty; 
      totalRevenue += Number(s.total) || 0;
      const itemCost = s.unitCost !== undefined ? Number(s.unitCost) : Number(p.cost);
      const cost = itemCost * qty;
      totalCost += cost;
      totalProfit += ((Number(s.total) || 0) - cost);
    });
    const totalOrders = filteredSales.length;

    const productSalesCount = {};
    filteredSales.forEach(s => {
      productSalesCount[s.productId] = (productSalesCount[s.productId] || 0) + (Number(s.quantity) || 0);
    });
    const topProducts = Object.entries(productSalesCount)
      .map(([id, qty]) => ({ ...getProduct(id), qty }))
      .filter(p => p && p.name).sort((a, b) => b.qty - a.qty).slice(0, 5);

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
      csvRows.push(['วันที่-เวลา', 'ร้านค้า', 'ชื่อสินค้า', 'ราคาคลินิก (ต้นทุน)', 'ราคาขาย', 'จำนวน', 'ต้นทุนรวม', 'ยอดขาย', 'กำไรสุทธิ', 'ผู้ทำรายการ']);

      filteredSales.forEach(s => {
        const p = getProduct(s.productId);
        const itemCost = s.unitCost !== undefined ? Number(s.unitCost) : (p ? Number(p.cost) : 0);
        const qty = Number(s.quantity) || 0;
        const total = Number(s.total) || 0;
        const actualPricePerUnit = s.unitPrice !== undefined ? Number(s.unitPrice) : (qty > 0 ? (total / qty) : 0);
        const rowCost = itemCost * qty;
        const rowProfit = total - rowCost;
        let safeDate = '-';
        try { const d = new Date(s.date); if(!isNaN(d.getTime())) safeDate = d.toLocaleString('th-TH'); } catch(e) {}
        csvRows.push([`"${safeDate}"`, `"${s.store || '-'}"`, `"${p ? p.name : 'สินค้าถูกลบไปแล้ว'}"`, itemCost, actualPricePerUnit.toFixed(2), qty, rowCost, total, rowProfit, `"${s.soldBy || '-'}"`]);
      });
      csvRows.push([]);
      csvRows.push(['สรุปยอดรวมทั้งหมด', '', '', '', '', totalQty, totalCost, totalRevenue, totalProfit, '']);
      downloadMobileSafeCSV(csvRows.map(row => row.join(',')).join('\n'), `รายงานยอดขาย_${timeLabel}.csv`);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-md text-white"><BarChart3 size={20} strokeWidth={2.5} className="md:w-6 md:h-6" /></div>
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
          <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl shadow-sm border border-gray-100 relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div><h3 className="font-bold text-gray-500 text-xs md:text-sm flex items-center mb-1"><TrendingUp size={14} className="mr-1.5 text-blue-500"/> ยอดขาย</h3><p className="text-xl md:text-2xl font-black text-gray-800 mt-2">฿{formatMoney(totalRevenue)}</p><p className="text-[10px] md:text-xs text-gray-400 mt-1">{totalOrders} ออเดอร์ ({totalQty} ชิ้น)</p></div>
          <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl shadow-sm border border-gray-100 relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div><h3 className="font-bold text-gray-500 text-xs md:text-sm flex items-center mb-1"><Package size={14} className="mr-1.5 text-orange-500"/> ต้นทุนสินค้ารวม</h3><p className="text-xl md:text-2xl font-black text-gray-800 mt-2">฿{formatMoney(totalCost)}</p><p className="text-[10px] md:text-xs text-gray-400 mt-1">คำนวณจากราคาคลินิก</p></div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 md:p-5 rounded-lg md:rounded-xl shadow-sm border border-green-200 relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div><h3 className="font-bold text-green-800 text-xs md:text-sm flex items-center mb-1"><DollarSign size={14} className="mr-1.5"/> กำไรสุทธิจริง</h3><p className="text-xl md:text-2xl font-black text-green-700 mt-2">฿{formatMoney(totalProfit)}</p><p className="text-[10px] md:text-xs text-green-600/70 mt-1 font-medium">หักต้นทุนแล้ว</p></div>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 flex items-center space-x-2"><CalendarDays size={18} className="text-gray-400"/><h3 className="text-sm md:text-lg font-semibold text-gray-800">สินค้าขายดี (ตามเงื่อนไขที่เลือก)</h3></div>
          <div className="p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {topProducts.map((p, index) => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2 md:space-x-3"><span className="text-gray-400 font-bold w-4 text-xs md:text-sm">{index + 1}.</span><span className="font-medium text-gray-700 text-xs md:text-base">{p.name}</span></div>
                  <div className="flex items-center space-x-3 md:space-x-4 ml-6 sm:ml-0"><span className="text-xs md:text-sm text-gray-500 whitespace-nowrap font-medium">ขายแล้ว <strong className="text-blue-600">{p.qty}</strong> ชิ้น</span><div className="w-24 md:w-32 h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(p.qty / (topProducts[0]?.qty || 1)) * 100}%` }}></div></div></div>
                </div>
              ))}
              {topProducts.length === 0 && <p className="text-gray-500 text-xs md:text-sm text-center py-6 bg-gray-50 rounded-lg">ไม่มีข้อมูลการขายในเงื่อนไขที่คุณเลือก</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🛒 [View 7] บันทึกรายการขาย (POS) 🚀 ENTERPRISE ATOMIC TRANSACTION
  const SalesView = () => {
    const [selectedStore, setSelectedStore] = useState(STORE_OPTIONS[0]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [customPrice, setCustomPrice] = useState(''); 
    const [quantity, setQuantity] = useState(1);
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

    const filteredProductsForSelect = useMemo(() => {
      if (!productSearchTerm) return products;
      return products.filter(p => String(p?.name || '').toLowerCase().includes(String(productSearchTerm || '').toLowerCase()));
    }, [products, productSearchTerm]);

    useEffect(() => {
      if (selectedProduct) {
        const p = getProduct(selectedProduct);
        if (p) setCustomPrice(p.price);
      } else {
        setCustomPrice('');
      }
    }, [selectedProduct, productMap]);

    const posTotal = selectedProduct ? (Number(customPrice) || 0) * (Number(quantity) || 0) : 0;

    const recentSales = sales
      .filter(s => getLocalISODate(s.date) === getLocalISODate())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // 🚀 ENTERPRISE LOGIC: Atomic Transaction
    const handleCheckout = async (e) => {
      e.preventDefault();
      const finalQuantity = Number(quantity) || 0;
      const finalPrice = Number(customPrice) || 0;
      
      if (!selectedProduct || !selectedStore) return;
      if (finalQuantity < 1) { setIsError(true); setMessage('จำนวนต้องมากกว่า 0'); return; }
      
      setIsProcessing(true);
      try {
        const productRef = doc(db, "products", selectedProduct);
        const salesRef = doc(collection(db, "sales")); // อ้างอิง ID ใหม่ล่วงหน้า
        const auditRef = doc(collection(db, "audit_logs"));
        const todayStr = getLocalISODate();
        const summaryRef = doc(db, "daily_summary", todayStr);

        await runTransaction(db, async (transaction) => {
          // 1. อ่านข้อมูลล่าสุดป้องกัน Race Condition
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists()) throw new Error("ไม่พบข้อมูลสินค้านี้ในระบบ");

          const productData = productDoc.data();
          const currentStock = Number(productData.stock) || 0;

          // 2. เช็คสต๊อกแบบ Real-time สุดๆ ณ วินาทีที่กำลังจะเขียน
          if (currentStock < finalQuantity) throw new Error("สต๊อกสินค้าไม่เพียงพอ (อาจมีคนเพิ่งขายไป)");

          const itemCost = Number(productData.cost) || 0;
          const total = finalPrice * finalQuantity;

          // 3. หักสต๊อกสินค้า
          transaction.update(productRef, { 
            stock: currentStock - finalQuantity,
            updatedAt: new Date().toISOString()
          });

          // 4. บันทึกยอดขาย
          transaction.set(salesRef, {
            store: selectedStore,
            productId: selectedProduct, 
            quantity: finalQuantity, 
            total: total, 
            unitPrice: finalPrice,          
            unitCost: itemCost, 
            date: new Date().toISOString(), 
            soldBy: loggedInUser?.username || 'unknown'
          });

          // 5. อัปเดต Summary Cache (Dashboard ดึงเร็วขึ้นในอนาคต)
          transaction.set(summaryRef, {
            totalRevenue: increment(total),
            totalProfit: increment(total - (itemCost * finalQuantity)),
            totalOrders: increment(1),
            date: todayStr
          }, { merge: true });

          // 6. เขียน Audit Log
          transaction.set(auditRef, {
            action: "CREATE_SALE",
            user: loggedInUser?.username || 'unknown',
            details: `ขาย ${productData.name} จำนวน ${finalQuantity} ชิ้น`,
            timestamp: new Date().toISOString()
          });
        });
        
        setSelectedProduct(''); setCustomPrice(''); setQuantity(1); setProductSearchTerm(''); 
        setIsError(false); setMessage('บันทึกสำเร็จ'); setTimeout(() => setMessage(''), 3000);
      } catch (err) { 
        setMessage(err.message); setIsError(true); 
      }
      setIsProcessing(false);
    };

    return (
      <div className="relative space-y-6 md:space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-[#f4f7ff] -z-20 rounded-[3rem]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/60 via-transparent to-transparent -z-10 pointer-events-none"></div>

        <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] shadow-xl border border-white p-6 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">บันทึกรายการขาย (POS)</h2>
          </div>

          <form onSubmit={handleCheckout} className="space-y-8">
            {message && <div className={`p-4 rounded-xl text-sm font-bold flex items-center justify-center ${isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>{message}</div>}
            
            <div className="text-center">
              <label className="block text-sm font-bold text-slate-700 mb-3 text-center">เลือกร้านค้า</label>
              <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                {STORE_OPTIONS.map(store => {
                  const isSelected = selectedStore === store;
                  const isShopee = String(store || '').includes('Shopee');
                  return (
                    <button key={store} type="button" onClick={() => setSelectedStore(store)}
                      className={`relative px-4 py-3 rounded-xl border text-sm font-bold transition-all duration-300 overflow-hidden flex-1 min-w-[120px] max-w-[160px] ${
                        isSelected ? isShopee ? 'bg-[#f97316] border-[#f97316] text-white shadow-md shadow-orange-500/30 transform scale-105 z-10' : 'bg-[#2563eb] border-[#2563eb] text-white shadow-md shadow-blue-600/30 transform scale-105 z-10' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {store}
                      {isSelected && <div className="absolute top-0 right-0 w-3 h-3 bg-white/25 rounded-bl-lg"></div>}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="border-b border-dashed border-slate-200/60 mx-10"></div>

            <div className="bg-gray-50/50 p-5 md:p-6 rounded-2xl border border-gray-100 space-y-6">
              <div className="space-y-3 relative" ref={dropdownRef}>
                <label className="block text-sm font-bold text-slate-700 mb-3 text-center">เลือกสินค้า</label>
                
                <div onClick={() => !isProcessing && setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full p-4 border rounded-xl bg-white text-base cursor-pointer flex justify-center items-center transition-all duration-300 shadow-sm relative ${
                    isDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-slate-200 hover:border-blue-400'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex-1 text-center truncate pr-6">
                    <span className={selectedProduct ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'}>
                      {selectedProduct ? (getProduct(selectedProduct)?.name || 'ไม่พบสินค้า') : 'กรุณาเลือกสินค้า'}
                    </span>
                  </div>
                  <ChevronDown size={20} className={`absolute right-4 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl max-h-[300px] flex flex-col top-full left-0 origin-top animate-in fade-in zoom-in-95 duration-200 text-left">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm" placeholder="พิมพ์ค้นหาชื่อสินค้า..." value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} autoFocus />
                      </div>
                    </div>
                    <ul className="overflow-y-auto flex-1 p-2 space-y-1 scrollbar-hide">
                      {filteredProductsForSelect.map(p => {
                        const isOutOfStock = (Number(p.stock) || 0) <= 0;
                        const isSelected = selectedProduct === p.id;
                        return (
                          <li key={p.id} onClick={() => { if (isOutOfStock) return; setSelectedProduct(p.id); setCustomPrice(p.price); setIsDropdownOpen(false); setProductSearchTerm(''); }}
                            className={`px-4 py-3.5 rounded-xl text-sm flex flex-col sm:flex-row sm:justify-between sm:items-center cursor-pointer transition-all ${
                              isOutOfStock ? "opacity-50 cursor-not-allowed bg-slate-50" : isSelected ? "bg-blue-50 text-blue-700 border border-blue-100 shadow-sm" : "hover:bg-slate-50 text-slate-700 border border-transparent"
                            }`}
                          >
                            <span className="font-bold mb-1.5 sm:mb-0 text-base sm:text-sm truncate pr-2">{p.name}</span>
                            <span className={`text-[11px] md:text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 border ${isOutOfStock ? 'bg-red-50 text-red-600 border-red-100' : isSelected ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-green-50 text-green-700 border-green-100'}`}>
                              {isOutOfStock ? 'สินค้าหมด' : `เหลือ ${Number(p.stock) || 0} ชิ้น`} (฿{formatMoney(p.price)})
                            </span>
                          </li>
                        );
                      })}
                      {filteredProductsForSelect.length === 0 && (
                        <li className="px-4 py-10 text-center flex flex-col items-center justify-center text-slate-400">
                          <Package size={32} className="text-slate-300 mb-3 opacity-50"/><span className="text-sm font-medium">ไม่พบสินค้าที่คุณค้นหา</span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                <div className="text-center">
                  <label className="block text-sm font-bold text-slate-700 mb-3 text-center">ราคาขาย/ชิ้น (บาท)</label>
                  <div className="flex items-center h-[54px] shadow-sm rounded-xl overflow-hidden border border-slate-200 bg-white relative">
                    <button type="button" disabled={!selectedProduct || isProcessing} onClick={() => setCustomPrice(Math.max(0, (Number(customPrice)||0) - 1))} className="h-full w-16 bg-slate-50 hover:bg-slate-100 font-black text-slate-600 transition-colors border-r border-slate-200 focus:outline-none active:bg-slate-200 text-xl disabled:opacity-50 disabled:cursor-not-allowed z-10">-</button>
                    <input type="number" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} className="h-full w-full text-center text-xl font-bold text-slate-800 outline-none focus:ring-inset focus:ring-2 focus:ring-blue-500 bg-white transition-all disabled:opacity-50 z-0" disabled={!selectedProduct || isProcessing} placeholder="0" required />
                    <button type="button" disabled={!selectedProduct || isProcessing} onClick={() => setCustomPrice((Number(customPrice)||0) + 1)} className="h-full w-16 bg-slate-50 hover:bg-slate-100 font-black text-slate-600 transition-colors border-l border-slate-200 focus:outline-none active:bg-slate-200 text-xl disabled:opacity-50 disabled:cursor-not-allowed z-10">+</button>
                  </div>
                </div>

                <div className="text-center">
                  <label className="block text-sm font-bold text-slate-700 mb-3 text-center">จำนวนชิ้น</label>
                  <div className="flex items-center h-[54px] shadow-sm rounded-xl overflow-hidden border border-slate-200 bg-white relative">
                    <button type="button" onClick={() => setQuantity(Math.max(1, (Number(quantity)||0) - 1))} className="h-full w-16 bg-slate-50 hover:bg-slate-100 font-black text-slate-600 transition-colors border-r border-slate-200 focus:outline-none active:bg-slate-200 text-xl z-10">-</button>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))} className="h-full w-full text-center text-xl font-bold text-slate-800 outline-none focus:ring-inset focus:ring-2 focus:ring-blue-500 bg-white z-0" min="1" />
                    <button type="button" onClick={() => setQuantity((Number(quantity)||0) + 1)} className="h-full w-16 bg-slate-50 hover:bg-slate-100 font-black text-slate-600 transition-colors border-l border-slate-200 focus:outline-none active:bg-slate-200 text-xl z-10">+</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="bg-[#eef5ff] p-6 md:p-8 rounded-[1.5rem] border border-[#e0ebff] flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                <div className="text-center md:text-left w-full md:w-auto">
                  <p className="text-sm font-bold text-[#6a8ce2] mb-1">ยอดรวมทั้งหมด</p>
                  <p className="text-4xl md:text-5xl font-black text-[#3761e9] tracking-tight">฿{formatMoney(posTotal)}</p>
                </div>
                <button type="submit" disabled={!selectedProduct || !selectedStore || isProcessing} className="w-full md:w-auto bg-gradient-to-r from-[#94a8f1] to-[#6082f0] hover:from-[#7690ed] hover:to-[#4e74ea] text-white px-10 py-3.5 md:py-4 rounded-xl text-base md:text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap">
                  บันทึกการขาย
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="pt-2">
          <h3 className="text-base font-bold text-slate-700 mb-4 px-2">รายการที่เพิ่งขายไปวันนี้ (5 รายการล่าสุด)</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100 text-xs md:text-sm">
                  <th className="p-4 font-bold">เวลา</th><th className="p-4 font-bold">ร้านค้า</th><th className="p-4 font-bold">สินค้า</th><th className="p-4 font-bold text-center">จำนวน</th><th className="p-4 font-bold text-right">ยอดรวม</th>
                </tr>
              </thead>
              <tbody className="text-xs md:text-sm divide-y divide-slate-50">
                {recentSales.map(sale => {
                  let timeString = '-';
                  try { const d = new Date(sale.date); if(!isNaN(d.getTime())) timeString = d.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) + ' น.'; } catch(e) {}
                  return (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-500 whitespace-nowrap font-medium">{timeString}</td>
                    <td className="p-4 whitespace-nowrap"><span className={`px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-bold border ${String(sale.store || '').includes('Shopee') ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{sale.store || '-'}</span></td>
                    <td className="p-4 font-bold text-slate-800">{getProduct(sale.productId)?.name || 'สินค้าถูกลบ'}</td>
                    <td className="p-4 text-center font-bold text-slate-600">{sale.quantity}</td>
                    <td className="p-4 text-right text-blue-600 font-black whitespace-nowrap text-sm">฿{formatMoney(sale.total)}</td>
                  </tr>
                )})}
                {recentSales.length === 0 && (<tr><td colSpan="5" className="p-10 text-center text-slate-400 text-sm font-medium">ยังไม่มีการคีย์ยอดขายในวันนี้</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 🕒 [View 3] หน้าประวัติการขาย และแก้ไขออเดอร์ (Sales History) 🚀 ENTERPRISE ATOMIC TRANSACTION
  const SalesHistoryView = () => {
    const [filterDate, setFilterDate] = useState(getLocalISODate());
    const [isEditing, setIsEditing] = useState(null);
    const [editForm, setEditForm] = useState({ productId: '', quantity: 1, date: '', store: '', customPrice: '' });
    const [isProcessing, setIsProcessing] = useState(false);

    const formatForInput = (isoString) => {
      try { const d = new Date(isoString); if (isNaN(d.getTime())) return ''; d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); } catch (e) { return ''; }
    };

    const filteredSales = sales.filter(s => getLocalISODate(s.date) === filterDate).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 🚀 ENTERPRISE LOGIC: Delete Atomically
    const handleDelete = async (sale) => {
      if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบออเดอร์นี้?\n\n*สต๊อกสินค้าจะถูกคืนกลับอัตโนมัติ*')) return;
      setIsProcessing(true);
      try {
        const productRef = doc(db, "products", sale.productId);
        const saleRef = doc(db, "sales", sale.id);
        const auditRef = doc(collection(db, "audit_logs"));

        await runTransaction(db, async (transaction) => {
          const productDoc = await transaction.get(productRef);
          if (productDoc.exists()) {
             const currentStock = Number(productDoc.data().stock) || 0;
             transaction.update(productRef, { stock: currentStock + Number(sale.quantity) });
          }
          transaction.delete(saleRef);
          transaction.set(auditRef, {
            action: "DELETE_SALE", user: loggedInUser?.username || 'unknown',
            details: `ลบออเดอร์ (รหัสสินค้า: ${sale.productId}) คืนสต๊อก ${sale.quantity} ชิ้น`,
            timestamp: new Date().toISOString()
          });
        });
      } catch (error) { alert("เกิดข้อผิดพลาด: " + error.message); }
      setIsProcessing(false);
    };

    // 🚀 ENTERPRISE LOGIC: Edit Atomically
    const handleSaveEdit = async (sale) => {
      setIsProcessing(true);
      try {
        const oldQty = Number(sale.quantity) || 0;
        const newQty = Math.max(1, Number(editForm.quantity) || 1);
        const oldProductId = sale.productId;
        const newProductId = editForm.productId;
        const newProductData = getProduct(newProductId);
        if (!newProductData) throw new Error("ไม่พบข้อมูลสินค้าใหม่");

        let newDateIso = sale.date;
        try { const pd = new Date(editForm.date); if (!isNaN(pd.getTime())) newDateIso = pd.toISOString(); } catch (e) {}

        const unitPrice = Number(editForm.customPrice) || 0;
        const newTotal = unitPrice * newQty;

        const oldProductRef = doc(db, "products", oldProductId);
        const newProductRef = doc(db, "products", newProductId);
        const saleRef = doc(db, "sales", sale.id);
        const auditRef = doc(collection(db, "audit_logs"));

        await runTransaction(db, async (transaction) => {
          if (oldProductId !== newProductId) {
            const oldP = await transaction.get(oldProductRef);
            if(oldP.exists()) transaction.update(oldProductRef, { stock: (Number(oldP.data().stock)||0) + oldQty });
            
            const newP = await transaction.get(newProductRef);
            if(newP.exists()) transaction.update(newProductRef, { stock: (Number(newP.data().stock)||0) - newQty });
          } else if (oldQty !== newQty) {
            const diff = newQty - oldQty;
            const p = await transaction.get(oldProductRef);
            if(p.exists()) transaction.update(oldProductRef, { stock: (Number(p.data().stock)||0) - diff });
          }

          transaction.update(saleRef, {
            productId: newProductId, quantity: newQty, total: newTotal, unitPrice: unitPrice, unitCost: newProductData.cost, date: newDateIso, store: editForm.store || STORE_OPTIONS[0]
          });

          transaction.set(auditRef, {
            action: "EDIT_SALE", user: loggedInUser?.username || 'unknown',
            details: `แก้ไขออเดอร์ ${sale.id} เป็น จำนวน ${newQty} ราคา ${unitPrice}`, timestamp: new Date().toISOString()
          });
        });
        setIsEditing(null);
      } catch (error) { alert("เกิดข้อผิดพลาด: " + error.message); }
      setIsProcessing(false);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
          <div><h2 className="text-lg md:text-2xl font-bold text-gray-800">ประวัติการขาย (แก้ไขออเดอร์)</h2><p className="text-xs md:text-sm text-gray-500 mt-1">สามารถแก้ไขข้อมูล หรือลบออเดอร์ที่คีย์ผิดได้</p></div>
          <div className="flex items-center space-x-2 bg-white px-2 py-1.5 md:px-3 md:py-2 rounded-lg border border-gray-200 shadow-sm w-full md:w-auto justify-between md:justify-start">
             <span className="text-xs md:text-sm text-gray-500 font-medium">ดูของวันที่</span><input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none text-blue-600 font-medium" />
          </div>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs md:text-sm">
                <th className="p-3 md:p-4 font-medium whitespace-nowrap">เวลาที่ขาย</th><th className="p-3 md:p-4 font-medium whitespace-nowrap">ร้านค้า</th><th className="p-3 md:p-4 font-medium">สินค้า</th><th className="p-3 md:p-4 font-medium text-center">จำนวน</th><th className="p-3 md:p-4 font-medium text-right">ยอดรวม</th><th className="p-3 md:p-4 font-medium text-center">ผู้ทำรายการ</th><th className="p-3 md:p-4 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-xs md:text-sm">
              {filteredSales.map(sale => {
                const isCurrentRowEditing = isEditing === sale.id;
                const safeQty = Number(sale.quantity) || 0;
                const actualPricePerUnit = sale.unitPrice !== undefined ? Number(sale.unitPrice) : (safeQty > 0 ? (Number(sale.total) / safeQty) : 0);
                let dateDisplay = '-'; try { const d = new Date(sale.date); if (!isNaN(d.getTime())) dateDisplay = d.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}); } catch(e) { }

                return (
                <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-3 md:p-4 text-gray-500 whitespace-nowrap">{isCurrentRowEditing ? (<input type="datetime-local" className="w-full p-1.5 md:p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-[10px] md:text-xs" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} disabled={isProcessing}/>) : (dateDisplay)}</td>
                  <td className="p-3 md:p-4 whitespace-nowrap">{isCurrentRowEditing ? (<select value={editForm.store} onChange={e => setEditForm({...editForm, store: e.target.value})} className="w-full p-1.5 md:p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs" disabled={isProcessing}>{STORE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select>) : (<span className={`px-2 py-1 rounded-md text-[10px] md:text-xs font-bold ${String(sale.store || '').includes('Shopee') ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{sale.store || '-'}</span>)}</td>
                  <td className="p-3 md:p-4 min-w-[150px]">{isCurrentRowEditing ? (<select value={editForm.productId} onChange={e => { const newPData = getProduct(e.target.value); setEditForm({...editForm, productId: e.target.value, customPrice: newPData ? newPData.price : 0}); }} className="w-full p-1.5 md:p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs md:text-sm" disabled={isProcessing}>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>) : (<div className="flex flex-col"><span className="font-medium text-gray-800">{getProduct(sale.productId)?.name || 'สินค้าถูกลบไปแล้ว'}</span></div>)}</td>
                  <td className="p-3 md:p-4 text-center">{isCurrentRowEditing ? (<input type="number" className="w-16 mx-auto p-1.5 md:p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: Math.max(1, parseInt(e.target.value) || 1)})} disabled={isProcessing} min="1"/>) : (<span className="font-bold">{sale.quantity}</span>)}</td>
                  <td className="p-3 md:p-4 text-right text-blue-600 font-medium whitespace-nowrap">{isCurrentRowEditing ? (<div className="flex flex-col items-end"><input type="number" className="w-20 p-1 border border-gray-300 rounded text-right text-xs mb-1 outline-none focus:ring-1 focus:ring-blue-500" value={editForm.customPrice} onChange={e => setEditForm({...editForm, customPrice: e.target.value})} placeholder="ราคา/ชิ้น"/><span>฿{formatMoney((Number(editForm.customPrice) || 0) * (Number(editForm.quantity) || 0))}</span></div>) : (`฿${formatMoney(sale.total)}`)}</td>
                  <td className="p-3 md:p-4 text-center text-gray-500"><span className="bg-gray-100 px-2 py-1 rounded-full text-[10px] md:text-xs">{sale.soldBy || '-'}</span></td>
                  <td className="p-3 md:p-4 text-right space-x-1 md:space-x-2 whitespace-nowrap">
                    {canEditTab('history') ? (isCurrentRowEditing ? (<><button onClick={() => handleSaveEdit(sale)} disabled={isProcessing} className="text-green-600 hover:bg-green-100 p-1.5 md:p-2 rounded-md md:rounded-lg transition"><Save size={16} className="md:w-4 md:h-4" /></button><button onClick={() => setIsEditing(null)} disabled={isProcessing} className="text-gray-500 hover:bg-gray-200 p-1.5 md:p-2 rounded-md md:rounded-lg transition"><X size={16} className="md:w-4 md:h-4" /></button></>) : (<><button onClick={() => { setIsEditing(sale.id); setEditForm({productId: sale.productId, quantity: sale.quantity, date: formatForInput(sale.date), store: sale.store || STORE_OPTIONS[0], customPrice: actualPricePerUnit}); }} className="text-blue-600 hover:bg-blue-100 p-1.5 md:p-2 rounded-md md:rounded-lg transition"><Edit2 size={16} className="md:w-4 md:h-4" /></button><button onClick={() => handleDelete(sale)} className="text-red-600 hover:bg-red-100 p-1.5 md:p-2 rounded-md md:rounded-lg transition"><Trash2 size={16} className="md:w-4 md:h-4" /></button></>)) : (<span className="text-gray-400 text-[10px]">ดูได้เท่านั้น</span>)}
                  </td>
                </tr>
              )})}
              {filteredSales.length === 0 && (<tr><td colSpan="7" className="text-center p-6 md:p-8 text-gray-500 text-xs md:text-sm">ไม่มีรายการขายในวันที่เลือก</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 📦 [View 4] หน้าจัดการข้อมูลสินค้า (Products)
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
        
        // Audit
        await addDoc(collection(db, "audit_logs"), {
          action: "EDIT_PRODUCT", user: loggedInUser?.username || 'unknown',
          details: `แก้ไขข้อมูลสินค้า ${editForm.name}`, timestamp: new Date().toISOString()
        });

        setIsEditing(null);
      } catch (error) { alert("Error: " + error.message); }
      setIsProcessing(false);
    };

    const handleAdd = async () => {
      if (!editForm.name) return;
      setIsProcessing(true);
      try {
        await addDoc(collection(db, "products"), { name: editForm.name, cost: Number(editForm.cost) || 0, price: Number(editForm.price) || 0, stock: 0 });
        
        // Audit
        await addDoc(collection(db, "audit_logs"), {
          action: "ADD_PRODUCT", user: loggedInUser?.username || 'unknown',
          details: `เพิ่มสินค้าใหม่ ${editForm.name}`, timestamp: new Date().toISOString()
        });

        setIsAdding(false); setEditForm({ name: '', cost: '', price: '' });
      } catch (error) { alert("Error: " + error.message); }
      setIsProcessing(false);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">จัดการข้อมูลสินค้า</h2>
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

  // 📋 [View 5] หน้าจัดการสต๊อกสินค้า (Stock) 🚀 ENTERPRISE ATOMIC UPDATE
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
           
           transaction.set(auditRef, {
             action: "UPDATE_STOCK", user: loggedInUser?.username || 'unknown',
             details: `ปรับสต๊อก ${pName} จาก ${oldStock} เป็น ${newStockValue}`,
             timestamp: new Date().toISOString()
           });
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
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">จัดการสต๊อกสินค้า</h2>
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
                    <td className="py-3 px-1 sm:px-3 md:p-4 text-center whitespace-nowrap">{editingStockId === product.id ? (<input type="number" className="w-14 sm:w-16 md:w-20 p-1 md:p-1.5 border rounded text-center text-xs focus:ring-2 focus:ring-blue-500 outline-none" value={newStock} onChange={e => setNewStock(e.target.value)} disabled={isProcessing} /> ) : (<span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide ${stockAmount <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{stockAmount} ชิ้น</span>)}</td>
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

  // 👥 [View 6] หน้าจัดการผู้ใช้งานระบบและกำหนดสิทธิ์ (Users Management)
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
          <div><h2 className="text-lg md:text-2xl font-bold text-gray-800">จัดการผู้ใช้งานและสิทธิ์</h2><p className="text-xs md:text-sm text-gray-500 mt-1">ตั้งค่ารหัสผ่าน และกำหนดสิทธิ์การเข้าถึงเมนูต่างๆ ของพนักงาน</p></div>
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
                        <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.dashboard || false} onChange={()=>handlePermissionChange('dashboard')} className="rounded text-blue-600"/> <span>แดชบอร์ด</span></label><div className="ml-5"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.dashboardExport || false} onChange={()=>handlePermissionChange('dashboardExport')} disabled={!editForm.permissions.dashboard} className="rounded text-green-600"/> <span>ส่งออก Excel ได้</span></label></div></div>
                        <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.products || false} onChange={()=>handlePermissionChange('products')} className="rounded text-blue-600"/> <span>จัดการสินค้า</span></label><div className="ml-5 flex flex-wrap gap-2"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.productsEdit || false} onChange={()=>handlePermissionChange('productsEdit')} disabled={!editForm.permissions.products} className="rounded text-orange-500"/> <span>เพิ่ม/ลบ/แก้ไข ได้</span></label><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.productsExport || false} onChange={()=>handlePermissionChange('productsExport')} disabled={!editForm.permissions.products} className="rounded text-green-600"/> <span>ส่งออก Excel ได้</span></label></div></div>
                        <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.stock || false} onChange={()=>handlePermissionChange('stock')} className="rounded text-blue-600"/> <span>จัดการสต๊อก</span></label><div className="ml-5 flex flex-wrap gap-2"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.stockEdit || false} onChange={()=>handlePermissionChange('stockEdit')} disabled={!editForm.permissions.stock} className="rounded text-orange-500"/> <span>อัปเดตตัวเลขได้</span></label><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.stockExport || false} onChange={()=>handlePermissionChange('stockExport')} disabled={!editForm.permissions.stock} className="rounded text-green-600"/> <span>ส่งออก Excel ได้</span></label></div></div>
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
                          <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.dashboard || false} onChange={()=>handlePermissionChange('dashboard')} className="rounded text-blue-600"/> <span>แดชบอร์ด</span></label><div className="ml-5"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.dashboardExport || false} onChange={()=>handlePermissionChange('dashboardExport')} disabled={!editForm.permissions.dashboard} className="rounded text-green-600"/> <span>ส่งออก Excel ได้</span></label></div></div>
                          <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.products || false} onChange={()=>handlePermissionChange('products')} className="rounded text-blue-600"/> <span>จัดการสินค้า</span></label><div className="ml-5 flex flex-wrap gap-2"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.productsEdit || false} onChange={()=>handlePermissionChange('productsEdit')} disabled={!editForm.permissions.products} className="rounded text-orange-500"/> <span>เพิ่ม/ลบ/แก้ไข ได้</span></label><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.productsExport || false} onChange={()=>handlePermissionChange('productsExport')} disabled={!editForm.permissions.products} className="rounded text-green-600"/> <span>ส่งออก Excel ได้</span></label></div></div>
                          <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.stock || false} onChange={()=>handlePermissionChange('stock')} className="rounded text-blue-600"/> <span>จัดการสต๊อก</span></label><div className="ml-5 flex flex-wrap gap-2"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.stockEdit || false} onChange={()=>handlePermissionChange('stockEdit')} disabled={!editForm.permissions.stock} className="rounded text-orange-500"/> <span>อัปเดตตัวเลขได้</span></label><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.stockExport || false} onChange={()=>handlePermissionChange('stockExport')} disabled={!editForm.permissions.stock} className="rounded text-green-600"/> <span>ส่งออก Excel ได้</span></label></div></div>
                          <div className="bg-white p-2 rounded border border-gray-200 shadow-sm"><label className="flex items-center space-x-1.5 font-bold mb-1"><input type="checkbox" checked={editForm.permissions.history || false} onChange={()=>handlePermissionChange('history')} className="rounded text-blue-600"/> <span>ประวัติการขาย</span></label><div className="ml-5"><label className="flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={editForm.permissions.historyEdit || false} onChange={()=>handlePermissionChange('historyEdit')} disabled={!editForm.permissions.history} className="rounded text-orange-500"/> <span>แก้ไข/ลบออเดอร์ ได้</span></label></div></div>
                        </div>
                      )
                    ) : (u.role === 'admin' ? (<span className="text-purple-600 font-bold bg-purple-100 px-2 py-1 rounded text-xs mt-1 inline-block">เข้าถึงได้ทุกเมนู (Admin)</span>) : (
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">ขาย (POS)</span>
                          {u.permissions?.dashboard && <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full">แดชบอร์ด</span>}
                          {u.permissions?.products && <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full">จัดสินค้า</span>}
                          {u.permissions?.stock && <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full">จัดสต๊อก</span>}
                          {u.permissions?.history && <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full">ประวัติ</span>}
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

  // 🎨 กำหนด Style ของปุ่มเมนู
  const navItemBaseStyle = "snap-start flex-shrink-0 flex items-center space-x-3 w-auto md:w-full px-4 py-3 md:py-3.5 rounded-xl transition-all duration-200 whitespace-nowrap text-sm md:text-base";
  const navItemActiveStyle = "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30";
  const navItemInactiveStyle = "text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium";

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

  // หน้าต่างสำหรับผู้บริหาร
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

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans">
      <style>{`input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`}</style>
      
      <div className="w-full md:w-64 bg-gradient-to-br from-white via-white to-blue-50 border-b md:border-r border-slate-200 flex-shrink-0 z-10 relative overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="relative z-10 flex flex-col h-full">
          <div className="p-4 flex items-center justify-center border-b border-slate-100"><ResilientLogo className="h-16 w-full rounded-lg shadow-sm" /></div>
          <nav className="px-3 md:px-4 py-4 space-x-2 md:space-x-0 md:space-y-1.5 flex md:flex-col overflow-x-auto md:overflow-visible scrollbar-hide snap-x">
            {canAccess('dashboard') && <button onClick={() => setActiveTab('dashboard')} className={`${navItemBaseStyle} ${activeTab === 'dashboard' ? navItemActiveStyle : navItemInactiveStyle}`}><LayoutDashboard size={20} /><span>Dashboard</span></button>}
            {canAccess('products') && <button onClick={() => setActiveTab('products')} className={`${navItemBaseStyle} ${activeTab === 'products' ? navItemActiveStyle : navItemInactiveStyle}`}><Package size={20} /><span>จัดการสินค้า</span></button>}
            {canAccess('stock') && <button onClick={() => setActiveTab('stock')} className={`${navItemBaseStyle} ${activeTab === 'stock' ? navItemActiveStyle : navItemInactiveStyle}`}><Boxes size={20} /><span>สต๊อกสินค้า</span></button>}
            {canAccess('users') && <button onClick={() => setActiveTab('users')} className={`${navItemBaseStyle} ${activeTab === 'users' ? navItemActiveStyle : navItemInactiveStyle}`}><Users size={20} /><span>จัดการผู้ใช้</span></button>}
            {canAccess('history') && <button onClick={() => setActiveTab('history')} className={`${navItemBaseStyle} ${activeTab === 'history' ? navItemActiveStyle : navItemInactiveStyle}`}><History size={20} /><span>ประวัติการขาย</span></button>}
            {canAccess('sales') && <button onClick={() => setActiveTab('sales')} className={`${navItemBaseStyle} ${activeTab === 'sales' ? navItemActiveStyle : navItemInactiveStyle}`}><ShoppingCart size={20} /><span>บันทึกรายการขาย (POS)</span></button>}
          </nav>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-[calc(100vh-120px)] md:h-screen overflow-hidden relative">
        <header className="bg-white/80 backdrop-blur-md h-16 border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10">
          <div className="text-slate-600 font-bold text-base hidden sm:block">
            {activeTab === 'dashboard' ? 'ระบบภาพรวม' : activeTab === 'products' ? 'ตั้งค่าฐานข้อมูลสินค้า' : activeTab === 'stock' ? 'ระบบคลังสินค้า' : activeTab === 'users' ? 'ตั้งค่าบัญชีและสิทธิ์พนักงาน' : activeTab === 'history' ? 'ประวัติการทำรายการ' : 'บันทึกรายการขาย (POS)'}
          </div>
          <div className="flex items-center space-x-3 md:space-x-4 ml-auto w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center space-x-2 text-sm text-slate-700 bg-slate-100/80 py-1.5 px-3 rounded-full border border-slate-200"><User size={14} className="text-blue-600" /><span className="font-bold">{loggedInUser.username}</span><span className="text-slate-400 font-medium">({loggedInUser.role === 'admin' ? 'Admin' : 'Staff'})</span></div>
            <button onClick={() => { setLoggedInUser(null); setActiveTab('sales'); }} className="flex items-center space-x-1.5 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition text-sm font-bold" title="ออกจากระบบ"><LogOut size={16} /> <span className="sm:hidden">ออกระบบ</span></button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-10 relative">
          <div className="max-w-5xl mx-auto relative z-10">
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