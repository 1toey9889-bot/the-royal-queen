// ==========================================
// 📦 1. นำเข้าเครื่องมือและไลบรารีต่างๆ (Imports)
// ==========================================
import React, { useState, useEffect, useMemo } from 'react';
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
  getDoc
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
  Store,
  Calculator 
} from 'lucide-react';

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
const db = getFirestore(app);

// ค่าเริ่มต้นสำหรับสิทธิ์ของพนักงาน
const defaultPermissions = {
  dashboard: false,
  products: false,
  stock: false,
  history: false
};

// ตัวเลือกช่องทางการขาย (ร้านค้า)
const STORE_OPTIONS = ['Shopee(หลัก)', 'Shopee(รอง)', 'Lazada(หลัก)', 'Lazada(รอง)'];

// ==========================================
// 🚀 3. คอมโพเนนต์หลักของระบบ (Main App Component)
// ==========================================
export default function App() {
  const isExecutiveView = new URLSearchParams(window.location.search).get('view') === 'dashboard';

  // --- 🗄️ 3.1 การจัดการตัวแปรสถานะ (State Management) ---
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [activeTab, setActiveTab] = useState(isExecutiveView ? 'dashboard' : 'sales');    
  
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  // --- 🔄 3.2 เชื่อมต่อและดึงข้อมูลแบบ Real-time ---
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

  // ตรวจสอบสิทธิ์แบบ Real-time
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

  // --- 🛠️ 3.3 ฟังก์ชันช่วยเหลือ (Helper Functions) ---
  const canAccess = (tabName) => {
    if (!loggedInUser) return false;
    if (loggedInUser.role === 'admin') return true; 
    if (tabName === 'sales') return true; 
    return !!loggedInUser.permissions?.[tabName]; 
  };

  const formatMoney = (amount) => {
    const validAmount = isNaN(amount) ? 0 : amount;
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(validAmount);
  };

  const getProduct = (id) => products.find(p => p.id === id);

  const getLocalISODate = (dateString) => {
    const d = dateString ? new Date(dateString) : new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  // ฟังก์ชันดาวน์โหลด Excel รองรับ iOS และ Android อย่างสมบูรณ์
  const downloadMobileSafeCSV = (csvString, filename) => {
    const universalBOM = "\uFEFF";
    const finalCSV = universalBOM + csvString;
    const blob = new Blob([finalCSV], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // ทริกเกอร์การคลิกอย่างปลอดภัย
    link.click();
    
    // ป้องกันปัญหาเบราว์เซอร์ลบไฟล์ก่อนโหลดเสร็จ
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  // ==========================================
  // 🖥️ 4. ส่วนแสดงผลหน้าจอต่างๆ (Views / Pages)
  // ==========================================

  // 👤 [View 1] หน้าเข้าสู่ระบบ (Login)
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
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 md:p-10 space-y-8">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-blue-50">
              <Lock size={32} strokeWidth={2} />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">The Royal Queen</h1>
            <p className="text-sm md:text-base text-gray-500 font-medium">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center font-bold">{error}</div>}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">ชื่อผู้ใช้งาน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm md:text-base outline-none bg-gray-50 hover:bg-white focus:bg-white" placeholder="admin หรือ user" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">รหัสผ่าน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
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

  // 📊 [View 2] หน้าสรุปยอดขาย (Dashboard)
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
    }, [sales, timeframe, filterDate, filterMonth, filterYear, filterProductId, filterStore]);

    let totalQty = 0; let totalRevenue = 0; let totalCost = 0; let totalProfit = 0; let totalNetIncome = 0;
    
    filteredSales.forEach(s => {
      totalQty += s.quantity; 
      totalRevenue += s.total;
      
      const p = getProduct(s.productId);
      const cost = p ? (p.cost * s.quantity) : 0;
      totalCost += cost;
      
      totalNetIncome += (s.netIncome !== undefined) ? s.netIncome : s.total;
      totalProfit += (s.netProfit !== undefined) ? s.netProfit : (s.total - cost);
    });

    const totalOrders = filteredSales.length;

    const productSalesCount = {};
    filteredSales.forEach(s => {
      productSalesCount[s.productId] = (productSalesCount[s.productId] || 0) + s.quantity;
    });
    
    const topProducts = Object.entries(productSalesCount)
      .map(([id, qty]) => ({ ...getProduct(id), qty }))
      .filter(p => p.name)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const exportDashboardToExcel = () => {
      if (filteredSales.length === 0) { alert("ไม่มีข้อมูลในเงื่อนไขที่เลือก"); return; }
      let timeLabel = '';
      if (timeframe === 'daily') timeLabel = `ประจำวันที่ ${filterDate}`;
      else if (timeframe === 'monthly') timeLabel = `ประจำเดือน ${filterMonth}`;
      else if (timeframe === 'yearly') timeLabel = `ประจำปี ${filterYear}`;
      else timeLabel = `ภาพรวมทั้งหมด (สะสม)`;

      const productLabel = filterProductId === 'all' ? 'ทุกสินค้า' : (getProduct(filterProductId)?.name || 'ไม่ทราบชื่อ');
      const storeLabel = filterStore === 'all' ? 'ทุกร้านค้า' : filterStore;

      const csvRows = [];
      csvRows.push(['รายงานสรุปยอดขาย - The Royal Queen']);
      csvRows.push(['ช่วงเวลา:', timeLabel]);
      csvRows.push(['ร้านค้า:', storeLabel]);
      csvRows.push(['สินค้าที่เลือก:', productLabel]);
      csvRows.push(['วันที่สั่งพิมพ์:', new Date().toLocaleString('th-TH')]);
      csvRows.push([]); 
      csvRows.push(['วันที่-เวลา', 'ร้านค้า', 'ชื่อสินค้า', 'ราคาคลินิก (ต้นทุน)', 'ราคาขาย', 'จำนวน', 'ต้นทุนรวม', 'ยอดขายก่อนหัก', 'รายได้เข้าบัญชี', 'กำไรสุทธิ', 'ผู้ทำรายการ']);

      filteredSales.forEach(s => {
        const p = getProduct(s.productId);
        const cost = p ? p.cost : 0;
        const price = p ? p.price : 0;
        const rowCost = cost * s.quantity;
        const rowProfit = (s.netProfit !== undefined) ? s.netProfit : (s.total - rowCost);
        const rowNetIncome = (s.netIncome !== undefined) ? s.netIncome : s.total;
        
        csvRows.push([`"${new Date(s.date).toLocaleString('th-TH')}"`, `"${s.store || '-'}"`, `"${p ? p.name : 'สินค้าถูกลบไปแล้ว'}"`, cost, price, s.quantity, rowCost, s.total, rowNetIncome, rowProfit, `"${s.soldBy || '-'}"`]);
      });

      csvRows.push([]);
      csvRows.push(['สรุปยอดรวมทั้งหมด', '', '', '', '', totalQty, totalCost, totalRevenue, totalNetIncome, totalProfit, '']);
      
      const csvString = csvRows.map(row => row.join(',')).join('\n');
      downloadMobileSafeCSV(csvString, `รายงานยอดขาย_${timeLabel}.csv`);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-md text-white">
              <BarChart3 size={20} strokeWidth={2.5} className="md:w-6 md:h-6" />
            </div>
            <h2 className="text-base md:text-xl lg:text-2xl font-extrabold text-gray-800 tracking-tight">สรุปยอดขาย</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
            {/* กรองร้านค้า */}
            <div className="flex items-center space-x-1.5 md:space-x-2 bg-slate-50 px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-gray-200">
               <span className="text-xs text-gray-500 font-medium">ร้านค้า:</span>
               <select value={filterStore} onChange={e => setFilterStore(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none w-20 md:w-auto font-medium text-gray-700">
                 <option value="all">ทุกร้านค้า</option>
                 {STORE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
            </div>
            {/* กรองสินค้า */}
            <div className="flex items-center space-x-1.5 md:space-x-2 bg-slate-50 px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-gray-200">
               <span className="text-xs text-gray-500 font-medium">สินค้า:</span>
               <select value={filterProductId} onChange={e => setFilterProductId(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none w-20 md:w-auto font-medium text-gray-700"><option value="all">ดูทั้งหมด</option>{products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}</select>
            </div>
            {/* กรองเวลา */}
            <div className="flex items-center space-x-1.5 md:space-x-2 bg-slate-50 px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-gray-200">
               <span className="text-xs text-gray-500 font-medium">ดูแบบ:</span>
               <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none font-medium text-gray-700"><option value="daily">รายวัน</option><option value="monthly">รายเดือน</option><option value="yearly">รายปี</option><option value="all">ยอดรวมสะสม</option></select>
            </div>
            {timeframe !== 'all' && (
              <div className="flex items-center space-x-1.5 md:space-x-2 bg-blue-50 px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-blue-100">
                {timeframe === 'daily' && <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none text-blue-700 font-medium" />}
                {timeframe === 'monthly' && <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none text-blue-700 font-medium" />}
                {timeframe === 'yearly' && <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none text-blue-700 font-medium">{yearOptions.map(y => <option key={y} value={y}>ปี {y}</option>)}</select>}
              </div>
            )}
            <button onClick={exportDashboardToExcel} className="flex flex-1 lg:flex-none justify-center items-center space-x-1.5 md:space-x-2 bg-green-600 text-white px-3 py-1.5 md:px-4 md:py-2.5 rounded-md md:rounded-lg hover:bg-green-700 transition-colors shadow-sm text-xs md:text-sm font-medium"><Download size={14} className="md:w-4 md:h-4" /><span>ส่งออก Excel</span></button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
            <h3 className="font-bold text-gray-500 text-xs md:text-sm flex items-center mb-1"><TrendingUp size={14} className="mr-1.5 text-blue-500"/> ยอดขาย (ก่อนหัก)</h3>
            <p className="text-xl md:text-2xl font-black text-gray-800 mt-2">{formatMoney(totalRevenue)}</p>
            <p className="text-[10px] md:text-xs text-gray-400 mt-1">{totalOrders} ออเดอร์ ({totalQty} ชิ้น)</p>
          </div>
          <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-400"></div>
            <h3 className="font-bold text-gray-500 text-xs md:text-sm flex items-center mb-1"><Store size={14} className="mr-1.5 text-purple-500"/> รายได้เข้าบัญชี</h3>
            <p className="text-xl md:text-2xl font-black text-purple-700 mt-2">{formatMoney(totalNetIncome)}</p>
            <p className="text-[10px] md:text-xs text-gray-400 mt-1">หลังหักค่าธรรมเนียมแพลตฟอร์ม</p>
          </div>
          <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
            <h3 className="font-bold text-gray-500 text-xs md:text-sm flex items-center mb-1"><Package size={14} className="mr-1.5 text-orange-500"/> ต้นทุนสินค้ารวม</h3>
            <p className="text-xl md:text-2xl font-black text-gray-800 mt-2">{formatMoney(totalCost)}</p>
            <p className="text-[10px] md:text-xs text-gray-400 mt-1">คำนวณจากราคาคลินิก</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 md:p-5 rounded-lg md:rounded-xl shadow-sm border border-green-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <h3 className="font-bold text-green-800 text-xs md:text-sm flex items-center mb-1"><DollarSign size={14} className="mr-1.5"/> กำไรสุทธิจริง</h3>
            <p className="text-xl md:text-2xl font-black text-green-700 mt-2">{formatMoney(totalProfit)}</p>
            <p className="text-[10px] md:text-xs text-green-600/70 mt-1 font-medium">หักค่าบริการและต้นทุนแล้ว</p>
          </div>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 flex items-center space-x-2">
            <CalendarDays size={18} className="text-gray-400"/>
            <h3 className="text-sm md:text-lg font-semibold text-gray-800">
              สินค้าขายดี (ตามเงื่อนไขที่เลือก)
            </h3>
          </div>
          <div className="p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {topProducts.map((p, index) => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <span className="text-gray-400 font-bold w-4 text-xs md:text-sm">{index + 1}.</span>
                    <span className="font-medium text-gray-700 text-xs md:text-base">{p.name}</span>
                  </div>
                  <div className="flex items-center space-x-3 md:space-x-4 ml-6 sm:ml-0">
                    <span className="text-xs md:text-sm text-gray-500 whitespace-nowrap font-medium">ขายแล้ว <strong className="text-blue-600">{p.qty}</strong> ชิ้น</span>
                    <div className="w-24 md:w-32 h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(p.qty / topProducts[0].qty) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && <p className="text-gray-500 text-xs md:text-sm text-center py-6 bg-gray-50 rounded-lg">ไม่มีข้อมูลการขายในเงื่อนไขที่คุณเลือก</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🕒 [View 3] หน้าประวัติการขาย และแก้ไขออเดอร์ (Sales History)
  const SalesHistoryView = () => {
    const [filterDate, setFilterDate] = useState(getLocalISODate());
    const [isEditing, setIsEditing] = useState(null);
    const [editForm, setEditForm] = useState({ productId: '', quantity: 1, date: '', store: '' });
    const [isProcessing, setIsProcessing] = useState(false);

    const formatForInput = (isoString) => {
      if (!isoString) return '';
      const d = new Date(isoString);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };

    const filteredSales = sales
      .filter(s => getLocalISODate(s.date) === filterDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const handleDelete = async (sale) => {
      if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบออเดอร์นี้?\n\n*สต๊อกสินค้าจะถูกคืนกลับอัตโนมัติ*')) return;
      setIsProcessing(true);
      try {
        await deleteDoc(doc(db, "sales", sale.id));
        if (getProduct(sale.productId)) {
          await updateDoc(doc(db, "products", sale.productId), { stock: increment(sale.quantity) });
        }
      } catch (error) {
        alert("เกิดข้อผิดพลาด: " + error.message);
      }
      setIsProcessing(false);
    };

    const handleSaveEdit = async (sale) => {
      setIsProcessing(true);
      try {
        const oldQty = sale.quantity;
        const newQty = Number(editForm.quantity) || 1;
        const oldProductId = sale.productId;
        const newProductId = editForm.productId;
        const newProductData = getProduct(newProductId);
        
        if (!newProductData) throw new Error("ไม่พบข้อมูลสินค้าใหม่");
        if (newQty < 1) throw new Error("จำนวนต้องมากกว่า 0");

        const parsedDate = new Date(editForm.date);
        if (isNaN(parsedDate.getTime())) throw new Error("รูปแบบวันที่ไม่ถูกต้อง");
        const newDateIso = parsedDate.toISOString();

        const newTotal = newProductData.price * newQty;
        const newCost = newProductData.cost * newQty;

        // คำนวณสัดส่วนค่าธรรมเนียมเดิม เพื่อให้ตอนแก้จำนวน กำไรสุทธิไม่เพี้ยน
        const originalRatio = sale.total > 0 && sale.netIncome !== undefined ? (sale.netIncome / sale.total) : 1;
        const newNetIncome = newTotal * originalRatio;
        const newNetProfit = newNetIncome - newCost;

        if (oldProductId !== newProductId) {
          if (getProduct(oldProductId)) {
            await updateDoc(doc(db, "products", oldProductId), { stock: increment(oldQty) });
          }
          await updateDoc(doc(db, "products", newProductId), { stock: increment(-newQty) });
        } else if (oldQty !== newQty) {
          const diff = newQty - oldQty;
          await updateDoc(doc(db, "products", oldProductId), { stock: increment(-diff) });
        }

        await updateDoc(doc(db, "sales", sale.id), {
          productId: newProductId,
          quantity: newQty,
          total: newTotal,
          netIncome: newNetIncome, 
          netProfit: newNetProfit, 
          date: newDateIso,
          store: editForm.store || STORE_OPTIONS[0]
        });

        setIsEditing(null);
      } catch (error) {
        alert("เกิดข้อผิดพลาด: " + error.message);
      }
      setIsProcessing(false);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">ประวัติการขาย (แก้ไขออเดอร์)</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">สามารถแก้ไขข้อมูล หรือลบออเดอร์ที่คีย์ผิดได้</p>
          </div>
          <div className="flex items-center space-x-2 bg-white px-2 py-1.5 md:px-3 md:py-2 rounded-lg border border-gray-200 shadow-sm w-full md:w-auto justify-between md:justify-start">
             <span className="text-xs md:text-sm text-gray-500 font-medium">ดูของวันที่:</span>
             <input 
                type="date" 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)} 
                className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none text-blue-600 font-medium" 
             />
          </div>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs md:text-sm">
                <th className="p-3 md:p-4 font-medium whitespace-nowrap">เวลาที่ขาย</th>
                <th className="p-3 md:p-4 font-medium whitespace-nowrap">ร้านค้า</th>
                <th className="p-3 md:p-4 font-medium">สินค้า</th>
                <th className="p-3 md:p-4 font-medium text-center">จำนวน</th>
                <th className="p-3 md:p-4 font-medium text-right">ยอด(ก่อนหัก)</th>
                <th className="p-3 md:p-4 font-medium text-right">กำไรสุทธิ</th>
                <th className="p-3 md:p-4 font-medium text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-xs md:text-sm">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-3 md:p-4 text-gray-500 whitespace-nowrap">
                    {isEditing === sale.id ? (
                      <input 
                        type="datetime-local" 
                        className="w-full p-1.5 md:p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-[10px] md:text-xs" 
                        value={editForm.date} 
                        onChange={e => setEditForm({...editForm, date: e.target.value})}
                        disabled={isProcessing}
                      />
                    ) : (
                      new Date(sale.date).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})
                    )}
                  </td>
                  <td className="p-3 md:p-4 whitespace-nowrap">
                    {isEditing === sale.id ? (
                      <select 
                        value={editForm.store} 
                        onChange={e => setEditForm({...editForm, store: e.target.value})} 
                        className="w-full p-1.5 md:p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs"
                        disabled={isProcessing}
                      >
                        {STORE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-md text-[10px] md:text-xs font-bold ${sale.store?.includes('Shopee') ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {sale.store || '-'}
                      </span>
                    )}
                  </td>
                  <td className="p-3 md:p-4 min-w-[150px]">
                    {isEditing === sale.id ? (
                      <select 
                        value={editForm.productId} 
                        onChange={e => setEditForm({...editForm, productId: e.target.value})} 
                        className="w-full p-1.5 md:p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs md:text-sm"
                        disabled={isProcessing}
                      >
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">{getProduct(sale.productId)?.name || 'สินค้าถูกลบไปแล้ว'}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">คีย์โดย: {sale.soldBy || '-'}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-center">
                    {isEditing === sale.id ? (
                      <input 
                        type="number" 
                        className="w-16 mx-auto p-1.5 md:p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm" 
                        value={editForm.quantity} 
                        onChange={e => setEditForm({...editForm, quantity: e.target.value})}
                        disabled={isProcessing}
                        min="1"
                      />
                    ) : (
                      <span className="font-bold">{sale.quantity}</span>
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-right text-blue-600 font-medium whitespace-nowrap">
                    {isEditing === sale.id ? (
                       <span>{formatMoney((getProduct(editForm.productId)?.price || 0) * (editForm.quantity || 0))}</span>
                    ) : (
                       formatMoney(sale.total)
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-right text-emerald-600 font-bold whitespace-nowrap">
                    {isEditing === sale.id ? (
                       <span className="text-gray-400 text-xs italic">คำนวณออโต้หลังบันทึก</span>
                    ) : (
                       formatMoney((sale.netProfit !== undefined) ? sale.netProfit : (sale.total - ((getProduct(sale.productId)?.cost || 0) * sale.quantity)))
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-center space-x-1 md:space-x-2 whitespace-nowrap">
                    {isEditing === sale.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(sale)} disabled={isProcessing} className="text-green-600 hover:bg-green-100 p-1.5 md:p-2 rounded-md md:rounded-lg transition"><Save size={16} className="md:w-4 md:h-4" /></button>
                        <button onClick={() => setIsEditing(null)} disabled={isProcessing} className="text-gray-500 hover:bg-gray-200 p-1.5 md:p-2 rounded-md md:rounded-lg transition"><X size={16} className="md:w-4 md:h-4" /></button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => { 
                            setIsEditing(sale.id); 
                            setEditForm({
                              productId: sale.productId, 
                              quantity: sale.quantity,
                              date: formatForInput(sale.date),
                              store: sale.store || STORE_OPTIONS[0]
                            }); 
                          }} 
                          className="text-blue-600 hover:bg-blue-100 p-1.5 md:p-2 rounded-md md:rounded-lg transition"
                        >
                          <Edit2 size={16} className="md:w-4 md:h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(sale)} 
                          className="text-red-600 hover:bg-red-100 p-1.5 md:p-2 rounded-md md:rounded-lg transition"
                        >
                          <Trash2 size={16} className="md:w-4 md:h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr><td colSpan="7" className="text-center p-6 md:p-8 text-gray-500 text-xs md:text-sm">ไม่มีรายการขายในวันที่เลือก</td></tr>
              )}
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
      if (searchTerm) {
        result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      result.sort((a, b) => {
        if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '', 'th');
        if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '', 'th');
        if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'stock_desc') return (b.stock || 0) - (a.stock || 0);
        return 0;
      });
      return result;
    }, [products, searchTerm, sortBy]);

    const exportProductsReport = () => {
      if (products.length === 0) return;
      const csvRows = [];
      csvRows.push(['รายงานสรุปสต๊อกสินค้า - The Royal Queen']);
      csvRows.push(['วันที่สั่งพิมพ์:', new Date().toLocaleString('th-TH')]);
      csvRows.push([]);
      csvRows.push(['ลำดับ', 'ชื่อสินค้า', 'ราคาคลินิก (ต้นทุน)', 'ราคาขาย', 'กำไรต่อชิ้น', 'สต๊อกคงเหลือ', 'มูลค่าต้นทุนรวม', 'มูลค่าขายรวม', 'กำไรคาดหวัง']);
      
      let sumStock = 0; let sumCostValue = 0; let sumSaleValue = 0; let sumExpectedProfit = 0;
      filteredAndSortedProducts.forEach((p, index) => {
        const stock = p.stock || 0; const costVal = stock * p.cost; const saleVal = stock * p.price; const profitVal = saleVal - costVal;
        sumStock += stock; sumCostValue += costVal; sumSaleValue += saleVal; sumExpectedProfit += profitVal;
        csvRows.push([index + 1, `"${p.name}"`, p.cost, p.price, p.price - p.cost, stock, costVal, saleVal, profitVal]);
      });
      csvRows.push([]);
      csvRows.push(['สรุปมูลค่าสต๊อกทั้งหมด', '', '', '', '', sumStock, sumCostValue, sumSaleValue, sumExpectedProfit]);

      const csvString = csvRows.map(row => row.join(',')).join('\n');
      downloadMobileSafeCSV(csvString, `สรุปข้อมูลสินค้าและมูลค่าสต๊อก_${getLocalISODate()}.csv`);
    };

    const handleSave = async (id) => {
      setIsProcessing(true);
      try {
        await updateDoc(doc(db, "products", id), { name: editForm.name, cost: Number(editForm.cost), price: Number(editForm.price) });
        setIsEditing(null);
      } catch (error) { alert("Error: " + error.message); }
      setIsProcessing(false);
    };

    const handleAdd = async () => {
      if (!editForm.name || !editForm.price || !editForm.cost) return;
      setIsProcessing(true);
      try {
        await addDoc(collection(db, "products"), { name: editForm.name, cost: Number(editForm.cost), price: Number(editForm.price), stock: 0 });
        setIsAdding(false);
        setEditForm({ name: '', cost: '', price: '' });
      } catch (error) { alert("Error: " + error.message); }
      setIsProcessing(false);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">จัดการข้อมูลสินค้า</h2>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button onClick={exportProductsReport} className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 md:space-x-2 bg-green-50 text-green-700 border border-green-200 px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-green-100 transition text-xs md:text-sm font-medium"><Download size={16} /><span>ส่งออก Excel</span></button>
              {!isAdding && <button onClick={() => { setIsAdding(true); setEditForm({name:'', cost:'', price:''}); setIsEditing(null); setSearchTerm(''); }} className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 md:space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg transition text-xs md:text-sm font-medium"><Plus size={16} /><span>เพิ่มสินค้าใหม่</span></button>}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-100">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="ค้นหาสินค้า..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><ArrowUpDown size={16} className="text-gray-500" /></div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto border border-gray-200 rounded-lg text-xs md:text-sm py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="name_asc">ชื่อ (ก - ฮ)</option>
                <option value="name_desc">ชื่อ (ฮ - ก)</option>
                <option value="price_desc">ราคาขาย (มากไปน้อย)</option>
                <option value="price_asc">ราคาขาย (น้อยไปมาก)</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs md:text-sm">
                <th className="p-3 md:p-4 font-medium text-center w-16">ลำดับ</th>
                <th className="p-3 md:p-4 font-medium">ชื่อสินค้า</th>
                <th className="p-3 md:p-4 font-medium">ราคาคลินิก</th>
                <th className="p-3 md:p-4 font-medium">ราคาขาย</th>
                <th className="p-3 md:p-4 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-xs md:text-sm">
              {isAdding && (
                <tr className="border-b border-blue-100 bg-blue-50/50">
                  <td className="p-3 md:p-4 text-center text-blue-400 font-bold">*</td>
                  <td className="p-2 md:p-4"><input className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ชื่อสินค้า..." value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                  <td className="p-2 md:p-4"><input type="number" className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ราคาคลินิก..." value={editForm.cost} onChange={e => setEditForm({...editForm, cost: e.target.value})} /></td>
                  <td className="p-2 md:p-4"><input type="number" className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ราคาขาย..." value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /></td>
                  <td className="p-2 md:p-4 text-right space-x-1 md:space-x-2 whitespace-nowrap">
                    <button onClick={handleAdd} className="text-green-600 bg-green-100 p-1.5 md:p-2 rounded-md hover:bg-green-200 transition"><Save size={16} /></button>
                    <button onClick={() => setIsAdding(false)} className="text-red-600 bg-red-100 p-1.5 md:p-2 rounded-md hover:bg-red-200 transition"><X size={16} /></button>
                  </td>
                </tr>
              )}
              {filteredAndSortedProducts.map((product, index) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-3 md:p-4 text-center font-bold text-gray-400">{index + 1}</td>
                  <td className="p-3 md:p-4">{isEditing === product.id ? <input className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /> : <span className="font-medium text-gray-800">{product.name}</span>}</td>
                  <td className="p-3 md:p-4">{isEditing === product.id ? <input type="number" className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.cost} onChange={e => setEditForm({...editForm, cost: e.target.value})} /> : <span className="text-orange-600 font-medium">{product.cost} ฿</span>}</td>
                  <td className="p-3 md:p-4">{isEditing === product.id ? <input type="number" className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /> : <span className="text-blue-600 font-medium">{product.price} ฿</span>}</td>
                  <td className="p-3 md:p-4 text-right space-x-1 md:space-x-2 whitespace-nowrap">
                    {isEditing === product.id ? (
                      <><button onClick={() => handleSave(product.id)} className="text-green-600 bg-green-100 hover:bg-green-200 p-1.5 md:p-2 rounded-md transition"><Save size={16} /></button><button onClick={() => setIsEditing(null)} className="text-gray-500 bg-gray-200 hover:bg-gray-300 p-1.5 md:p-2 rounded-md transition"><X size={16} /></button></>
                    ) : (
                      <><button onClick={() => { setIsEditing(product.id); setEditForm({name: product.name, cost: product.cost, price: product.price}); }} className="text-blue-600 hover:bg-blue-100 p-1.5 md:p-2 rounded-md transition"><Edit2 size={16} /></button><button onClick={async () => { if(confirm('ลบสินค้านี้?')) await deleteDoc(doc(db, "products", product.id)); }} className="text-red-600 hover:bg-red-100 p-1.5 md:p-2 rounded-md transition"><Trash2 size={16} /></button></>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAndSortedProducts.length === 0 && !isAdding && (
                <tr><td colSpan="5" className="text-center p-8 text-gray-500 text-xs md:text-sm">ไม่พบข้อมูลสินค้าที่ค้นหา</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 📋 [View 5] หน้าจัดการสต๊อกสินค้า (Stock)
  const StockView = () => {
    const [editingStockId, setEditingStockId] = useState(null);
    const [newStock, setNewStock] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name_asc');

    const filteredAndSortedProducts = useMemo(() => {
      let result = [...products];
      if (searchTerm) {
        result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      result.sort((a, b) => {
        if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '', 'th');
        if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '', 'th');
        if (sortBy === 'stock_desc') return (b.stock || 0) - (a.stock || 0);
        if (sortBy === 'stock_asc') return (a.stock || 0) - (b.stock || 0);
        return 0;
      });
      return result;
    }, [products, searchTerm, sortBy]);

    const handleSaveStock = async (id) => {
      await updateDoc(doc(db, "products", id), { stock: Number(newStock) || 0 });
      setEditingStockId(null);
    };

    const exportStockReport = () => {
      if (filteredAndSortedProducts.length === 0) { alert("ไม่มีข้อมูล"); return; }
      
      const csvRows = [];
      csvRows.push(['รายงานจำนวนสต๊อกสินค้าคงเหลือ - The Royal Queen']);
      csvRows.push(['วันที่สั่งพิมพ์:', new Date().toLocaleString('th-TH')]);
      csvRows.push([]);
      csvRows.push(['ลำดับ', 'ชื่อสินค้า', 'สต๊อกคงเหลือ']);
      
      filteredAndSortedProducts.forEach((p, index) => {
        csvRows.push([index + 1, `"${p.name}"`, p.stock || 0]);
      });
      
      const csvString = csvRows.map(row => row.join(',')).join('\n');
      downloadMobileSafeCSV(csvString, `รายงานจำนวนสต๊อกคงเหลือ_${getLocalISODate()}.csv`);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        
        <div className="flex flex-col bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">จัดการสต๊อกสินค้า</h2>
            <button onClick={exportStockReport} className="w-full sm:w-auto flex items-center justify-center space-x-1.5 md:space-x-2 bg-green-50 text-green-700 border border-green-200 px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-green-100 transition text-xs md:text-sm font-medium">
              <Download size={16} /><span>ส่งออกสต๊อก (Excel)</span>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-100">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="ค้นหาสินค้า..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><ArrowUpDown size={16} className="text-gray-500" /></div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto border border-gray-200 rounded-lg text-xs md:text-sm py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="name_asc">ชื่อ (ก - ฮ)</option>
                <option value="name_desc">ชื่อ (ฮ - ก)</option>
                <option value="stock_asc">จำนวนสต๊อก (น้อยไปมาก)</option>
                <option value="stock_desc">จำนวนสต๊อก (มากไปน้อย)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs md:text-sm">
                <th className="p-3 md:p-4 font-medium text-center w-16">ลำดับ</th>
                <th className="p-3 md:p-4 font-medium">ชื่อสินค้า</th>
                <th className="p-3 md:p-4 font-medium text-center">คงเหลือ</th>
                <th className="p-3 md:p-4 font-medium text-right">อัปเดต</th>
              </tr>
            </thead>
            <tbody className="text-xs md:text-sm">
              {filteredAndSortedProducts.map((product, index) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-3 md:p-4 text-center font-bold text-gray-400">{index + 1}</td>
                  <td className="p-3 md:p-4 font-medium text-gray-800">{product.name}</td>
                  <td className="p-3 md:p-4 text-center">
                    {editingStockId === product.id ? (
                      <input type="number" className="w-16 md:w-20 p-1.5 md:p-2 border rounded text-center text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={newStock} onChange={e => setNewStock(e.target.value)} /> 
                    ) : (
                      <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide ${product.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{product.stock || 0} ชิ้น</span>
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-right space-x-1 md:space-x-2">
                    {editingStockId === product.id ? (
                      <><button onClick={() => handleSaveStock(product.id)} className="text-green-600 bg-green-100 hover:bg-green-200 p-1.5 md:p-2 rounded-md transition"><Save size={16} /></button><button onClick={() => setEditingStockId(null)} className="text-gray-500 bg-gray-200 hover:bg-gray-300 p-1.5 md:p-2 rounded-md transition"><X size={16} /></button></>
                    ) : (
                      <button onClick={() => { setEditingStockId(product.id); setNewStock(product.stock || 0); }} className="text-blue-600 hover:bg-blue-100 p-1.5 md:p-2 rounded-md transition"><Edit2 size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAndSortedProducts.length === 0 && (
                <tr><td colSpan="4" className="text-center p-8 text-gray-500 text-xs md:text-sm">ไม่พบข้อมูลสินค้าที่ค้นหา</td></tr>
              )}
            </tbody>
          </table>
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
      setEditForm(prev => ({
        ...prev,
        permissions: { ...prev.permissions, [perm]: !prev.permissions[perm] }
      }));
    };

    const handleSave = async (id) => {
      setIsProcessing(true);
      try {
        await updateDoc(doc(db, "users", id), { 
          password: editForm.password, 
          role: editForm.role,
          permissions: editForm.permissions || defaultPermissions
        });
        setIsEditing(null);
      } catch (error) { alert("Error: " + error.message); }
      setIsProcessing(false);
    };

    const handleAdd = async () => {
      if (!editForm.username || !editForm.password) { alert('กรุณากรอกข้อมูลให้ครบ'); return; }
      if (users.find(u => u.username === editForm.username)) { alert('ชื่อนี้มีอยู่แล้ว'); return; }
      
      setIsProcessing(true);
      try {
        await addDoc(collection(db, "users"), { 
          username: editForm.username,
          password: editForm.password,
          role: editForm.role,
          permissions: editForm.permissions || defaultPermissions
        });
        setIsAdding(false);
        setEditForm({ username: '', password: '', role: 'staff', permissions: defaultPermissions });
      } catch(error) { alert("Error: " + error.message); }
      setIsProcessing(false);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">จัดการผู้ใช้งานและสิทธิ์</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">ตั้งค่ารหัสผ่าน และกำหนดสิทธิ์การเข้าถึงเมนูต่างๆ ของพนักงาน</p>
          </div>
          {!isAdding && <button onClick={() => { setIsAdding(true); setEditForm({username:'', password:'', role:'staff', permissions: defaultPermissions}); setIsEditing(null); }} className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg flex items-center space-x-1.5 md:space-x-2 text-xs md:text-sm w-full sm:w-auto justify-center"><Plus size={16} /><span>เพิ่มผู้ใช้</span></button>}
        </div>
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs md:text-sm">
                <th className="p-3 md:p-4 font-medium">Username</th>
                <th className="p-3 md:p-4 font-medium">รหัสผ่าน</th>
                <th className="p-3 md:p-4 font-medium">ระดับสิทธิ์ (Role)</th>
                <th className="p-3 md:p-4 font-medium">สิทธิ์การเข้าถึง (Permissions)</th>
                <th className="p-3 md:p-4 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-xs md:text-sm">
              {isAdding && (
                <tr className="bg-blue-50/50 align-top">
                  <td className="p-3 md:p-4"><input className="p-1.5 md:p-2 border rounded w-full text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="ชื่อ..." value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} disabled={isProcessing} /></td>
                  <td className="p-3 md:p-4"><input className="p-1.5 md:p-2 border rounded w-full text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="รหัสผ่าน..." value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} disabled={isProcessing} /></td>
                  <td className="p-3 md:p-4">
                    <select className="p-1.5 md:p-2 border rounded w-full text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} disabled={isProcessing}>
                      <option value="staff">พนักงาน (Staff)</option>
                      <option value="admin">ผู้ดูแล (Admin)</option>
                    </select>
                  </td>
                  <td className="p-3 md:p-4">
                    {editForm.role === 'admin' ? (
                      <span className="text-purple-600 font-bold bg-purple-100 px-2 py-1 rounded">เข้าถึงได้ทุกเมนู (Admin)</span>
                    ) : (
                      <div className="flex flex-col space-y-1.5">
                        <span className="text-gray-500 font-medium flex items-center"><ShieldCheck size={14} className="mr-1"/>เลือกเมนูที่อนุญาต:</span>
                        <label className="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" checked={editForm.permissions.dashboard} onChange={()=>handlePermissionChange('dashboard')} className="rounded text-blue-600 focus:ring-blue-500"/> <span>แดชบอร์ด</span></label>
                        <label className="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" checked={editForm.permissions.products} onChange={()=>handlePermissionChange('products')} className="rounded text-blue-600 focus:ring-blue-500"/> <span>จัดการสินค้า</span></label>
                        <label className="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" checked={editForm.permissions.stock} onChange={()=>handlePermissionChange('stock')} className="rounded text-blue-600 focus:ring-blue-500"/> <span>จัดการสต๊อก</span></label>
                        <label className="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" checked={editForm.permissions.history} onChange={()=>handlePermissionChange('history')} className="rounded text-blue-600 focus:ring-blue-500"/> <span>ประวัติการขาย (แก้/ลบ)</span></label>
                      </div>
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-right whitespace-nowrap">
                    <button onClick={handleAdd} disabled={isProcessing} className="text-green-600 hover:bg-green-100 p-1.5 md:p-2 rounded-md"><Save size={18} /></button>
                    <button onClick={() => setIsAdding(false)} disabled={isProcessing} className="text-red-600 hover:bg-red-100 p-1.5 md:p-2 rounded-md"><X size={18} /></button>
                  </td>
                </tr>
              )}

              {users.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50 align-top">
                  <td className="p-3 md:p-4 font-bold text-gray-800 pt-5">{u.username}</td>
                  <td className="p-3 md:p-4 pt-4">
                    {isEditing === u.id ? (
                      <input className="p-1.5 md:p-2 border rounded w-full text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} disabled={isProcessing} />
                    ) : (
                      <span className="text-gray-400 tracking-widest text-xs md:text-sm">••••••</span>
                    )}
                  </td>
                  <td className="p-3 md:p-4 pt-4">
                    {isEditing === u.id ? (
                      <select className="p-1.5 md:p-2 border rounded w-full text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} disabled={isProcessing}>
                        <option value="staff">พนักงาน (Staff)</option>
                        <option value="admin">ผู้ดูแล (Admin)</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{u.role.toUpperCase()}</span>
                    )}
                  </td>
                  <td className="p-3 md:p-4">
                    {isEditing === u.id ? (
                      editForm.role === 'admin' ? (
                        <span className="text-purple-600 font-bold bg-purple-100 px-2 py-1 rounded text-xs mt-2 inline-block">เข้าถึงได้ทุกเมนู (Admin)</span>
                      ) : (
                        <div className="flex flex-col space-y-1.5">
                          <label className="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" checked={editForm.permissions?.dashboard || false} onChange={()=>handlePermissionChange('dashboard')} className="rounded text-blue-600 focus:ring-blue-500"/> <span>แดชบอร์ด</span></label>
                          <label className="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" checked={editForm.permissions?.products || false} onChange={()=>handlePermissionChange('products')} className="rounded text-blue-600 focus:ring-blue-500"/> <span>จัดการสินค้า</span></label>
                          <label className="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" checked={editForm.permissions?.stock || false} onChange={()=>handlePermissionChange('stock')} className="rounded text-blue-600 focus:ring-blue-500"/> <span>จัดการสต๊อก</span></label>
                          <label className="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" checked={editForm.permissions?.history || false} onChange={()=>handlePermissionChange('history')} className="rounded text-blue-600 focus:ring-blue-500"/> <span>ประวัติการขาย (แก้/ลบ)</span></label>
                        </div>
                      )
                    ) : (
                      u.role === 'admin' ? (
                        <span className="text-purple-600 font-bold bg-purple-100 px-2 py-1 rounded text-xs mt-1 inline-block">เข้าถึงได้ทุกเมนู (Admin)</span>
                      ) : (
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
                    {isEditing === u.id ? (
                      <>
                        <button onClick={() => handleSave(u.id)} disabled={isProcessing} className="text-green-600 hover:bg-green-100 p-1.5 md:p-2 rounded-md"><Save size={18} /></button>
                        <button onClick={() => setIsEditing(null)} disabled={isProcessing} className="text-gray-500 hover:bg-gray-200 p-1.5 md:p-2 rounded-md"><X size={18} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setIsEditing(u.id); setEditForm({username: u.username, password: u.password, role: u.role, permissions: u.permissions || defaultPermissions}); }} className="text-blue-600 hover:bg-blue-100 p-1.5 md:p-2 rounded-md"><Edit2 size={18} /></button>
                        <button onClick={async () => { if(confirm('ลบผู้ใช้นี้ออกจากระบบ?')) await deleteDoc(doc(db, "users", u.id)); }} className={`text-red-600 hover:bg-red-100 p-1.5 md:p-2 rounded-md ${u.id === loggedInUser.id ? 'opacity-0 pointer-events-none' : ''}`}><Trash2 size={18} /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 🛒 [View 7] หน้าข้อมูลการขาย POS (Sales POS)
  const SalesView = () => {
    const [selectedStore, setSelectedStore] = useState(STORE_OPTIONS[0]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- ส่วนสถานะสำหรับเครื่องมือคำนวณ (Calculator State) ---
    const posTotal = selectedProduct ? getProduct(selectedProduct).price * quantity : 0;
    const [calcBasePrice, setCalcBasePrice] = useState('');
    const [calcTxFeePct, setCalcTxFeePct] = useState(3.21);
    const [calcCommFeePct, setCalcCommFeePct] = useState(7.49);
    const [calcServiceFeePct, setCalcServiceFeePct] = useState(7.49);
    const [calcManualFee, setCalcManualFee] = useState(0);
    const [calcSettingMessage, setCalcSettingMessage] = useState('');

    useEffect(() => {
      const loadCalcSettings = async () => {
        try {
          const snap = await getDoc(doc(db, "settings", "calculator"));
          if (snap.exists()) {
            const data = snap.data();
            if(data.txFee !== undefined) setCalcTxFeePct(data.txFee);
            if(data.commFee !== undefined) setCalcCommFeePct(data.commFee);
            if(data.serviceFee !== undefined) setCalcServiceFeePct(data.serviceFee);
            if(data.manualFee !== undefined) setCalcManualFee(data.manualFee);
          }
        } catch (error) {
          console.error("Load settings error", error);
        }
      };
      loadCalcSettings();
    }, []);

    useEffect(() => {
      setCalcBasePrice(posTotal > 0 ? posTotal.toString() : '');
    }, [posTotal]);

    const baseVal = parseFloat(calcBasePrice) || 0;
    const txFeeAmt = (baseVal * (parseFloat(calcTxFeePct) || 0)) / 100;
    const commFeeAmt = (baseVal * (parseFloat(calcCommFeePct) || 0)) / 100;
    const serviceFeeAmt = (baseVal * (parseFloat(calcServiceFeePct) || 0)) / 100;
    const manualFeeAmt = parseFloat(calcManualFee) || 0;
    
    const totalDeductions = txFeeAmt + commFeeAmt + serviceFeeAmt + manualFeeAmt;
    const netIncome = baseVal - totalDeductions;
    
    const totalCost = selectedProduct ? getProduct(selectedProduct).cost * quantity : 0;
    const finalNetProfit = netIncome - totalCost;

    const recentSales = sales
      .filter(s => getLocalISODate(s.date) === getLocalISODate())
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const saveCalcSettings = async () => {
      try {
        await setDoc(doc(db, "settings", "calculator"), {
          txFee: parseFloat(calcTxFeePct) || 0,
          commFee: parseFloat(calcCommFeePct) || 0,
          serviceFee: parseFloat(calcServiceFeePct) || 0,
          manualFee: parseFloat(calcManualFee) || 0
        });
        setCalcSettingMessage('บันทึกการตั้งค่าสำเร็จ!');
        setTimeout(() => setCalcSettingMessage(''), 3000);
      } catch (e) {
        console.error("Save settings error", e);
      }
    };

    const handleCheckout = async (e) => {
      e.preventDefault();
      if (!selectedProduct || !selectedStore) return;
      
      const product = getProduct(selectedProduct);
      if ((product.stock || 0) < quantity) { setIsError(true); setMessage('สต๊อกไม่พอ'); return; }
      
      setIsProcessing(true);
      try {
        await addDoc(collection(db, "sales"), { 
          store: selectedStore,
          productId: selectedProduct, 
          quantity: Number(quantity), 
          total: posTotal,
          netIncome: netIncome,
          netProfit: finalNetProfit,
          date: new Date().toISOString(), 
          soldBy: loggedInUser.username 
        });
        
        await updateDoc(doc(db, "products", product.id), { 
          stock: increment(-Number(quantity)) 
        });
        
        setSelectedProduct(''); 
        setQuantity(1); 
        setIsError(false); 
        setMessage('บันทึกสำเร็จ');
        setTimeout(() => setMessage(''), 3000);
      } catch (err) { 
        setMessage(err.message); 
        setIsError(true); 
      }
      setIsProcessing(false);
    };

    return (
      <div className="space-y-6 md:space-y-8 max-w-3xl mx-auto animate-in fade-in duration-300">
        
        {/* 1. ส่วนบันทึกการขาย (POS) */}
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4">ข้อมูลการขาย (POS)</h2>
          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
            <form onSubmit={handleCheckout} className="space-y-5 md:space-y-6">
              {message && <div className={`p-3 md:p-4 rounded-lg text-xs md:text-sm font-medium ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>}
              
              <div>
                <label className="block text-xs md:text-sm font-bold mb-2 md:mb-3 text-gray-700 flex items-center">
                  <Store size={16} className="mr-1.5 text-blue-600" /> เลือกร้านค้า (Channel)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                  {STORE_OPTIONS.map(store => (
                    <button
                      key={store}
                      type="button"
                      onClick={() => setSelectedStore(store)}
                      className={`flex items-center justify-center py-2.5 px-2 rounded-lg border text-xs md:text-sm font-bold transition-all duration-200 ${
                        selectedStore === store 
                          ? (store.includes('Shopee') 
                              ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/30 ring-2 ring-orange-500/50 ring-offset-1' 
                              : 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 ring-2 ring-blue-600/50 ring-offset-1') 
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      {store}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-b border-dashed border-gray-200"></div>

              <div>
                <label className="block text-xs md:text-sm font-bold mb-1.5 md:mb-2 text-gray-700 flex items-center">
                  <Package size={16} className="mr-1.5 text-blue-600" /> เลือกสินค้า
                </label>
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg bg-white text-sm md:text-base focus:ring-2 focus:ring-blue-500 outline-none" required disabled={isProcessing}>
                  <option value="" disabled>-- กรุณาเลือกสินค้า --</option>
                  {products.map(p => <option key={p.id} value={p.id} disabled={(p.stock || 0) <= 0}>{p.name} ({p.price} ฿) - เหลือ {p.stock || 0}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs md:text-sm font-bold mb-1.5 md:mb-2 text-gray-700">จำนวนชิ้น</label>
                <div className="flex items-center space-x-3 md:space-x-4">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 transition">-</button>
                  <input type="number" value={quantity} readOnly className="w-full text-center p-2.5 md:p-3 border border-gray-300 rounded-lg text-base md:text-lg font-bold" />
                  <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 transition">+</button>
                </div>
              </div>

              {/* ส่วนสรุป และกล่องกำไรสุทธิ */}
              <div className="pt-5 mt-2 border-t border-gray-100 flex flex-col md:flex-row justify-between md:items-end space-y-4 md:space-y-0 gap-4">
                <div className="flex flex-col sm:flex-row gap-2 md:gap-4 w-full md:w-auto">
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-50 flex-1 min-w-[130px]">
                    <p className="text-[10px] md:text-xs text-blue-600 font-bold uppercase tracking-wide">ยอดรวม (ก่อนหัก)</p>
                    <p className="text-xl md:text-2xl font-black text-blue-700">{formatMoney(posTotal)}</p>
                  </div>
                  <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-50 flex-1 min-w-[130px]">
                    <p className="text-[10px] md:text-xs text-purple-600 font-bold uppercase tracking-wide">รายได้เข้าบัญชี</p>
                    <p className="text-xl md:text-2xl font-black text-purple-700">{formatMoney(netIncome)}</p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex-1 min-w-[130px]">
                    <p className="text-[10px] md:text-xs text-emerald-600 font-bold uppercase tracking-wide">กำไรสุทธิ (หักทุน)</p>
                    <p className="text-xl md:text-2xl font-black text-emerald-700">{formatMoney(finalNetProfit)}</p>
                  </div>
                </div>
                <button type="submit" disabled={!selectedProduct || !selectedStore || isProcessing} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 md:px-8 md:py-4 rounded-xl text-sm md:text-base font-bold transition disabled:bg-gray-300 shadow-md hover:shadow-lg active:scale-95 flex justify-center whitespace-nowrap">
                  บันทึกการขาย
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 2. ส่วนเครื่องมือคำนวณ (Calculator) */}
        <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-4 md:mb-5 flex items-center border-b border-gray-100 pb-3">
            <Calculator size={20} className="mr-2 text-purple-600"/>
            เครื่องมือคำนวณรายรับสุทธิ (E-Commerce)
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* ฝั่งซ้าย: กล่องกรอกข้อมูล */}
            <div className="space-y-4">
              <div>
                 <label className="block text-xs font-bold text-gray-700 mb-1.5">ยอดขายตั้งต้น (บาท)</label>
                 <input 
                   type="number" 
                   value={calcBasePrice} 
                   onChange={(e)=>setCalcBasePrice(e.target.value)} 
                   placeholder="เช่น 3750"
                   className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50/30 font-semibold" 
                 />
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                 <div>
                   <label className="block text-[10px] md:text-xs font-bold text-gray-700 mb-1.5">1. ค่าธุรกรรม (%)</label>
                   <input type="number" step="0.01" value={calcTxFeePct} onChange={(e)=>setCalcTxFeePct(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-[10px] md:text-xs font-bold text-gray-700 mb-1.5">2. ค่าคอมมิชชั่น (%)</label>
                   <input type="number" step="0.01" value={calcCommFeePct} onChange={(e)=>setCalcCommFeePct(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-[10px] md:text-xs font-bold text-gray-700 mb-1.5">3. ค่าบริการ (%)</label>
                   <input type="number" step="0.01" value={calcServiceFeePct} onChange={(e)=>setCalcServiceFeePct(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-[10px] md:text-xs font-bold text-gray-700 mb-1.5">4. หักเพิ่มเติม (บาท)</label>
                   <input type="number" value={calcManualFee} onChange={(e)=>setCalcManualFee(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="เช่น 100" />
                 </div>
              </div>
            </div>

            {/* ฝั่งขวา: กล่องสรุปยอด */}
            <div className="bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200 flex flex-col justify-between h-full">
               <div>
                 <h4 className="text-xs md:text-sm font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">สรุปรายการหัก</h4>
                 <div className="space-y-2.5 text-xs md:text-sm font-medium">
                    <div className="flex justify-between text-slate-600"><span>ยอดขายตั้งต้น</span> <span>{formatMoney(baseVal)}</span></div>
                    <div className="flex justify-between text-red-500"><span>- ค่าธุรกรรม ({calcTxFeePct || 0}%)</span> <span>-{formatMoney(txFeeAmt)}</span></div>
                    <div className="flex justify-between text-red-500"><span>- ค่าคอมมิชชั่น ({calcCommFeePct || 0}%)</span> <span>-{formatMoney(commFeeAmt)}</span></div>
                    <div className="flex justify-between text-red-500"><span>- ค่าบริการ ({calcServiceFeePct || 0}%)</span> <span>-{formatMoney(serviceFeeAmt)}</span></div>
                    {manualFeeAmt > 0 && <div className="flex justify-between text-red-500"><span>- หักเพิ่มเติม (แมนนวล)</span> <span>-{formatMoney(manualFeeAmt)}</span></div>}
                 </div>
               </div>
               
               <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-end mb-4">
                  <span className="font-bold text-green-700 text-sm md:text-base">รายได้สุทธิ</span>
                  <span className="font-black text-2xl md:text-3xl text-green-600">{formatMoney(netIncome)}</span>
               </div>

               {/* ปุ่มบันทึกการตั้งค่า */}
               <div className="mt-auto pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2">
                 <span className="text-xs text-green-600 font-bold">{calcSettingMessage}</span>
                 <button type="button" onClick={saveCalcSettings} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap">
                   บันทึกการตั้งค่าเครื่องมือ
                 </button>
               </div>
            </div>
          </div>
        </div>

        {/* 3. ตารางรายการล่าสุด */}
        <div>
          <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center"><History size={18} className="mr-2 text-gray-400"/> รายการที่เพิ่งขายไปวันนี้ (5 รายการล่าสุด)</h3>
          <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs md:text-sm">
                  <th className="p-3 md:p-4 font-medium">เวลา</th>
                  <th className="p-3 md:p-4 font-medium">ร้านค้า</th>
                  <th className="p-3 md:p-4 font-medium">สินค้า</th>
                  <th className="p-3 md:p-4 font-medium text-center">จำนวน</th>
                  <th className="p-3 md:p-4 font-medium text-right">ยอดรวม</th>
                </tr>
              </thead>
              <tbody className="text-xs md:text-sm">
                {recentSales.map(sale => (
                  <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 md:p-4 text-[10px] md:text-xs text-gray-500 whitespace-nowrap">{new Date(sale.date).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="p-3 md:p-4 whitespace-nowrap">
                       <span className={`px-2 py-1 rounded-md text-[10px] md:text-xs font-bold ${sale.store?.includes('Shopee') ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                         {sale.store || '-'}
                       </span>
                    </td>
                    <td className="p-3 md:p-4 font-medium text-gray-800">
                      {getProduct(sale.productId)?.name || 'สินค้าถูกลบ'}
                      {sale.soldBy && <span className="block text-[10px] text-gray-400 font-normal mt-0.5">โดย: {sale.soldBy}</span>}
                    </td>
                    <td className="p-3 md:p-4 text-center font-bold text-gray-600">{sale.quantity}</td>
                    <td className="p-3 md:p-4 text-right text-blue-600 font-bold whitespace-nowrap">{formatMoney(sale.total)}</td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr><td colSpan="5" className="p-6 md:p-8 text-center text-gray-500 text-xs md:text-sm">ยังไม่มีการขายในวันนี้</td></tr>
                )}
              </tbody>
            </table>
          </div>
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
        <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm md:text-base font-medium">กำลังเตรียมระบบ The Royal Queen...</p>
        {loadError && (
          <div className="mt-4 p-3 md:p-4 bg-red-50 text-red-600 rounded-lg max-w-sm border border-red-100 text-xs md:text-sm">
            <p className="font-bold mb-1">พบปัญหาการเชื่อมต่อ</p>
            <p>{loadError}</p>
          </div>
        )}
      </div>
    );
  }

  // หน้าต่างสำหรับผู้บริหาร (เข้าผ่าน URL ?view=dashboard)
  if (isExecutiveView) {
    return (
      <div className="min-h-screen bg-slate-50 p-3 md:p-8 font-sans flex flex-col">
        <div className="max-w-5xl mx-auto w-full space-y-4 md:space-y-6">
          <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-lg md:text-2xl font-extrabold text-blue-600 tracking-tight flex items-center space-x-2">
              <ShoppingCart className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
              <span>The Royal Queen - ผู้บริหาร</span>
            </h1>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                แดชบอร์ด
              </button>
              <button 
                onClick={() => setActiveTab('stock')} 
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'stock' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                ดูสต๊อกสินค้า
              </button>
            </div>
          </div>
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'stock' && <StockView />}
        </div>
      </div>
    );
  }

  if (!loggedInUser) return <LoginView />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* แถบเมนูด้านซ้าย (Sidebar) - สลับเมนูตามสิทธิ์การเข้าถึง */}
      <div className="w-full md:w-64 bg-white border-b md:border-r border-gray-200 flex-shrink-0 z-10">
        <div className="p-4 md:p-6 flex items-center justify-center md:justify-start">
          <h1 className="text-lg md:text-xl font-extrabold text-blue-600 tracking-tight flex items-center space-x-2">
            <ShoppingCart className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
            <span>The Royal Queen</span>
          </h1>
        </div>
        
        <nav className="px-2 md:px-4 pb-2 md:pb-6 space-x-1 md:space-x-0 md:space-y-1 flex md:flex-col overflow-x-auto md:overflow-visible scrollbar-hide snap-x">
          {canAccess('dashboard') && <button onClick={() => setActiveTab('dashboard')} className={`snap-start flex-shrink-0 flex items-center space-x-2 md:space-x-3 w-auto md:w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl transition-colors whitespace-nowrap text-xs md:text-sm ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}><LayoutDashboard size={18} className="md:w-5 md:h-5" /><span>แดชบอร์ด</span></button>}
          {canAccess('products') && <button onClick={() => setActiveTab('products')} className={`snap-start flex-shrink-0 flex items-center space-x-2 md:space-x-3 w-auto md:w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl transition-colors whitespace-nowrap text-xs md:text-sm ${activeTab === 'products' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}><Package size={18} className="md:w-5 md:h-5" /><span>จัดการสินค้า</span></button>}
          {canAccess('stock') && <button onClick={() => setActiveTab('stock')} className={`snap-start flex-shrink-0 flex items-center space-x-2 md:space-x-3 w-auto md:w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl transition-colors whitespace-nowrap text-xs md:text-sm ${activeTab === 'stock' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}><Boxes size={18} className="md:w-5 md:h-5" /><span>สต๊อกสินค้า</span></button>}
          {canAccess('users') && <button onClick={() => setActiveTab('users')} className={`snap-start flex-shrink-0 flex items-center space-x-2 md:space-x-3 w-auto md:w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl transition-colors whitespace-nowrap text-xs md:text-sm ${activeTab === 'users' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}><Users size={18} className="md:w-5 md:h-5" /><span>จัดการผู้ใช้</span></button>}
          {canAccess('history') && <button onClick={() => setActiveTab('history')} className={`snap-start flex-shrink-0 flex items-center space-x-2 md:space-x-3 w-auto md:w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl transition-colors whitespace-nowrap text-xs md:text-sm ${activeTab === 'history' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}><History size={18} className="md:w-5 md:h-5" /><span>ประวัติการขาย</span></button>}
          {canAccess('sales') && <button onClick={() => setActiveTab('sales')} className={`snap-start flex-shrink-0 flex items-center space-x-2 md:space-x-3 w-auto md:w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl transition-colors whitespace-nowrap text-xs md:text-sm ${activeTab === 'sales' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}><ShoppingCart size={18} className="md:w-5 md:h-5" /><span>ข้อมูลการขาย (POS)</span></button>}
        </nav>
      </div>

      {/* พื้นที่แสดงผลด้านขวา (Main Content Area) */}
      <div className="flex-1 flex flex-col h-[calc(100vh-120px)] md:h-screen overflow-hidden relative">
        <header className="bg-white h-14 md:h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0 shadow-sm z-10">
          <div className="text-gray-500 font-semibold text-sm md:text-base hidden sm:block">
            {activeTab === 'dashboard' ? 'ระบบภาพรวม' : 
             activeTab === 'products' ? 'ตั้งค่าฐานข้อมูลสินค้า' : 
             activeTab === 'stock' ? 'ระบบคลังสินค้า' : 
             activeTab === 'users' ? 'ตั้งค่าบัญชีและสิทธิ์พนักงาน' : 
             activeTab === 'history' ? 'ประวัติการทำรายการ' : 'ข้อมูลการขาย (POS)'}
          </div>
          <div className="flex items-center space-x-3 md:space-x-4 ml-auto w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center space-x-1.5 md:space-x-2 text-xs md:text-sm text-gray-600 bg-gray-50 py-1 md:py-1.5 px-2 md:px-3 rounded-full border border-gray-100">
              <User size={14} className="text-blue-500 md:w-4 md:h-4" />
              <span className="font-bold">{loggedInUser.username}</span>
              <span className="text-gray-400 font-medium">({loggedInUser.role === 'admin' ? 'Admin' : 'Staff'})</span>
            </div>
            <button onClick={() => { setLoggedInUser(null); setActiveTab('sales'); }} className="flex items-center space-x-1 text-red-500 hover:bg-red-50 px-2 py-1.5 md:p-2 rounded-lg transition text-xs md:text-sm font-medium" title="ออกจากระบบ">
              <LogOut size={16} className="md:w-4 md:h-4"/> 
              <span className="sm:hidden">ออกระบบ</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-3 md:p-6 lg:p-8 bg-slate-50/50 pb-20 md:pb-8">
          <div className="max-w-5xl mx-auto">
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