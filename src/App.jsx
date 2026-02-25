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
  increment
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
  BarChart3 
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

// ใช้การเชื่อมต่อแบบมาตรฐานที่เสถียรที่สุด (ปิด Offline Cache เพื่อแก้ปัญหาข้อมูลไม่ซิงค์)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// ==========================================
// 🚀 3. คอมโพเนนต์หลักของระบบ (Main App Component)
// ==========================================
export default function App() {
  // ตรวจสอบว่าเข้าใช้งานผ่านลิงก์ของผู้บริหารหรือไม่ (?view=dashboard)
  const isExecutiveView = new URLSearchParams(window.location.search).get('view') === 'dashboard';

  // --- 🗄️ 3.1 การจัดการตัวแปรสถานะ (State Management) ---
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [activeTab, setActiveTab] = useState('sales');    
  
  // ตัวแปรสำหรับเก็บข้อมูลจากฐานข้อมูล
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  
  // ตัวแปรสำหรับจัดการสถานะการโหลดข้อมูลและแจ้งเตือน Error
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  // --- 🔄 3.2 เชื่อมต่อและดึงข้อมูลแบบ Real-time (Firebase Subscription) ---
  useEffect(() => {
    // ดักจับกรณีโหลดข้อมูลนานเกิน 10 วินาที
    const connectionTimeout = setTimeout(() => {
      if (!isUsersLoaded || isLoading) {
        setLoadError("การเชื่อมต่อใช้เวลานานผิดปกติ กรุณาตรวจสอบอินเทอร์เน็ตหรือรีเฟรชหน้าจอใหม่");
      }
    }, 10000);

    // ดึงข้อมูล "บัญชีผู้ใช้งาน"
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) {
        // หากไม่มีข้อมูลเลย ให้สร้างบัญชีตั้งต้น
        addDoc(collection(db, "users"), { username: 'admin', password: '123456', role: 'admin' });
        addDoc(collection(db, "users"), { username: 'user', password: '123456', role: 'staff' });
      } else {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
        setIsUsersLoaded(true);
        setLoadError('');
      }
    }, (error) => {
      console.error("Users Error:", error);
      setLoadError("ไม่สามารถดึงข้อมูลบัญชีผู้ใช้ได้ (อาจเกิดจาก Rules ของ Firebase ยังไม่ถูกตั้งเป็น true)");
      setIsUsersLoaded(true);
    });

    // ดึงข้อมูล "สินค้า"
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
    }, (error) => {
      console.error("Products Error:", error);
      setLoadError("ไม่สามารถดึงข้อมูลสินค้าได้ (ตรวจสอบ Firebase Rules)");
    });

    // ดึงข้อมูล "ยอดขาย"
    const unsubscribeSales = onSnapshot(collection(db, "sales"), (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSales(salesData);
      setIsLoading(false);
      setLoadError('');
    }, (error) => {
      console.error("Sales Error:", error);
      setLoadError("ไม่สามารถดึงข้อมูลยอดขายได้ (ตรวจสอบ Firebase Rules)");
      setIsLoading(false);
    });

    // คืนค่า (Cleanup) เมื่อออกจากหน้าเว็บ
    return () => {
      clearTimeout(connectionTimeout);
      unsubscribeUsers();
      unsubscribeProducts();
      unsubscribeSales();
    };
  }, []);

  // --- 🛠️ 3.3 ฟังก์ชันช่วยเหลือ (Helper Functions) ---
  
  // แปลงตัวเลขเป็นรูปแบบเงินบาท
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
  };

  // ค้นหาสินค้าจากไอดี
  const getProduct = (id) => products.find(p => p.id === id);

  // ฟังก์ชันดาวน์โหลดไฟล์ CSV
  const downloadCSV = (data, filename) => {
    const csvRows = [];
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ดึงยอดขายออกเป็นไฟล์
  const exportSalesReport = () => {
    if (sales.length === 0) return;
    const reportData = sales.map(s => {
      const p = getProduct(s.productId);
      return {
        'วันที่-เวลา': new Date(s.date).toLocaleString('th-TH'),
        'สินค้า': p ? p.name : 'สินค้าถูกลบ',
        'จำนวน': s.quantity,
        'ราคาต่อหน่วย': p ? p.price : 0,
        'ยอดรวม': s.total,
        'ผู้ขาย': s.soldBy || '-'
      };
    });
    downloadCSV(reportData, `ยอดขาย_TheRoyalQueen_${new Date().toLocaleDateString()}.csv`);
  };

  // ดึงรายการสินค้าออกเป็นไฟล์
  const exportProductsReport = () => {
    if (products.length === 0) return;
    const reportData = products.map(p => ({
      'รหัสสินค้า': p.id,
      'ชื่อสินค้า': p.name,
      'ราคาคลินิก': p.cost,
      'ราคาขาย': p.price,
      'สต๊อกคงเหลือ': p.stock || 0
    }));
    downloadCSV(reportData, `รายการสินค้า_TheRoyalQueen_${new Date().toLocaleDateString()}.csv`);
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
        setActiveTab('dashboard'); 
        setError('');
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 space-y-6 md:space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 md:w-16 md:h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Lock size={28} />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">The Royal Queen</h1>
            <p className="text-sm md:text-base text-gray-500">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            {error && <div className="bg-red-50 text-red-600 p-2 md:p-3 rounded-lg text-xs md:text-sm text-center font-medium">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้งาน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={16} className="text-gray-400" /></div>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-9 p-2 md:p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" placeholder="admin หรือ user" required />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={16} className="text-gray-400" /></div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-9 p-2 md:p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" placeholder="••••••" required />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 md:p-3 rounded-xl text-sm md:text-base font-medium transition-colors shadow-sm">เข้าสู่ระบบ</button>
          </form>
        </div>
      </div>
    );
  };

  // 📊 [View 2] หน้าสรุปยอดขาย (Dashboard)
  const DashboardView = () => {
    const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString('en-CA')); 
    const [filterMonth, setFilterMonth] = useState(new Date().toLocaleDateString('en-CA').substring(0, 7)); 
    const [filterProductId, setFilterProductId] = useState('all');

    const todaySales = sales.filter(s => {
      const saleDateLocal = new Date(s.date).toLocaleDateString('en-CA');
      const isDateMatch = saleDateLocal === filterDate;
      const isProductMatch = filterProductId === 'all' || s.productId === filterProductId;
      return isDateMatch && isProductMatch;
    });

    const monthSales = sales.filter(s => {
      const saleMonthLocal = new Date(s.date).toLocaleDateString('en-CA').substring(0, 7);
      const isMonthMatch = saleMonthLocal === filterMonth;
      const isProductMatch = filterProductId === 'all' || s.productId === filterProductId;
      return isMonthMatch && isProductMatch;
    });

    const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
    const todayCost = todaySales.reduce((sum, s) => {
      const p = getProduct(s.productId);
      return sum + (p ? p.cost * s.quantity : 0);
    }, 0);
    const todayProfit = todayTotal - todayCost;

    const monthTotal = monthSales.reduce((sum, s) => sum + s.total, 0);
    const monthCost = monthSales.reduce((sum, s) => {
      const p = getProduct(s.productId);
      return sum + (p ? p.cost * s.quantity : 0);
    }, 0);
    const monthProfit = monthTotal - monthCost;

    const allTimeFilteredSales = sales.filter(s => filterProductId === 'all' || s.productId === filterProductId);
    const allTimeTotal = allTimeFilteredSales.reduce((sum, s) => sum + s.total, 0);
    const allTimeCost = allTimeFilteredSales.reduce((sum, s) => {
      const p = getProduct(s.productId);
      return sum + (p ? p.cost * s.quantity : 0);
    }, 0);
    const allTimeProfit = allTimeTotal - allTimeCost;

    const productSalesCount = {};
    monthSales.forEach(s => {
      productSalesCount[s.productId] = (productSalesCount[s.productId] || 0) + s.quantity;
    });
    
    const topProducts = Object.entries(productSalesCount)
      .map(([id, qty]) => ({ ...getProduct(id), qty }))
      .filter(p => p.name)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0">
          
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-md text-white">
              <BarChart3 size={20} strokeWidth={2.5} className="md:w-6 md:h-6" />
            </div>
            <h2 className="text-base md:text-xl lg:text-2xl font-extrabold text-gray-800 tracking-tight">สรุปยอดขาย (The Royal Queen)</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 md:space-x-2 bg-white px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-gray-200 shadow-sm">
               <span className="text-xs text-gray-500 font-medium">สินค้า:</span>
               <select 
                  value={filterProductId} 
                  onChange={e => setFilterProductId(e.target.value)} 
                  className="border-none focus:ring-0 text-xs bg-transparent cursor-pointer outline-none w-20 md:w-auto"
               >
                 <option value="all">ทั้งหมด</option>
                 {products.map(p => (
                   <option key={p.id} value={p.id}>{p.name}</option>
                 ))}
               </select>
            </div>
            
            <div className="flex items-center space-x-1.5 md:space-x-2 bg-white px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-gray-200 shadow-sm">
               <span className="text-xs text-gray-500 font-medium">รายวัน:</span>
               <input 
                  type="date" 
                  value={filterDate} 
                  onChange={e => setFilterDate(e.target.value)} 
                  className="border-none focus:ring-0 text-xs bg-transparent cursor-pointer outline-none" 
               />
            </div>

            <div className="flex items-center space-x-1.5 md:space-x-2 bg-white px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-gray-200 shadow-sm">
               <span className="text-xs text-gray-500 font-medium">รายเดือน:</span>
               <input 
                  type="month" 
                  value={filterMonth} 
                  onChange={e => setFilterMonth(e.target.value)} 
                  className="border-none focus:ring-0 text-xs bg-transparent cursor-pointer outline-none" 
               />
            </div>
            
            {(loggedInUser?.role === 'admin' || isExecutiveView) && (
              <button 
                onClick={exportSalesReport}
                className="flex items-center space-x-1.5 md:space-x-2 bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1.5 md:px-4 md:py-2 rounded-md md:rounded-lg hover:bg-blue-100 transition-colors shadow-sm ml-auto text-xs md:text-sm"
              >
                <Download size={14} className="md:w-4 md:h-4" />
                <span className="hidden lg:inline">ส่งออกยอดขายทั้งหมด</span>
                <span className="lg:hidden">ส่งออก</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
          <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex items-center space-x-2.5 mb-3 md:mb-4">
              <div className="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-md md:rounded-lg"><Calendar size={18} className="md:w-5 md:h-5" /></div>
              <h3 className="font-bold text-gray-800 text-sm md:text-base">วันที่เลือก</h3>
            </div>
            <div className="space-y-1.5 md:space-y-2.5">
              <div className="flex justify-between text-gray-600"><span className="text-xs md:text-sm">ยอดขาย</span><span className="font-medium text-sm md:text-base">{formatMoney(todayTotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span className="text-xs md:text-sm">หักต้นทุน</span><span className="text-xs md:text-sm">{formatMoney(todayCost)}</span></div>
              <div className="pt-2 mt-1 border-t border-gray-100 flex justify-between items-end">
                <span className="font-bold text-green-600 text-xs md:text-sm">กำไร</span>
                <span className="font-bold text-lg md:text-xl text-green-600">{formatMoney(todayProfit)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <div className="flex items-center space-x-2.5 mb-3 md:mb-4">
              <div className="p-1.5 md:p-2 bg-purple-50 text-purple-600 rounded-md md:rounded-lg"><TrendingUp size={18} className="md:w-5 md:h-5" /></div>
              <h3 className="font-bold text-gray-800 text-sm md:text-base">เดือนที่เลือก</h3>
            </div>
            <div className="space-y-1.5 md:space-y-2.5">
              <div className="flex justify-between text-gray-600"><span className="text-xs md:text-sm">ยอดขาย</span><span className="font-medium text-sm md:text-base">{formatMoney(monthTotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span className="text-xs md:text-sm">หักต้นทุน</span><span className="text-xs md:text-sm">{formatMoney(monthCost)}</span></div>
              <div className="pt-2 mt-1 border-t border-gray-100 flex justify-between items-end">
                <span className="font-bold text-green-600 text-xs md:text-sm">กำไร</span>
                <span className="font-bold text-lg md:text-xl text-green-600">{formatMoney(monthProfit)}</span>
              </div>
              <div className="text-[10px] md:text-xs text-right text-gray-400 font-medium">({monthSales.length} ออเดอร์)</div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 relative overflow-hidden bg-gradient-to-br from-white to-gray-50">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <div className="flex items-center space-x-2.5 mb-3 md:mb-4">
              <div className="p-1.5 md:p-2 bg-green-50 text-green-600 rounded-md md:rounded-lg"><DollarSign size={18} className="md:w-5 md:h-5" /></div>
              <h3 className="font-bold text-gray-800 text-sm md:text-base">ภาพรวมทั้งหมด (สะสม)</h3>
            </div>
            <div className="space-y-1.5 md:space-y-2.5">
              <div className="flex justify-between text-gray-600"><span className="text-xs md:text-sm">ยอดขายรวม</span><span className="font-medium text-sm md:text-base">{formatMoney(allTimeTotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span className="text-xs md:text-sm">ต้นทุนรวม</span><span className="text-xs md:text-sm">{formatMoney(allTimeCost)}</span></div>
              <div className="pt-2 mt-1 border-t border-gray-200 flex justify-between items-end">
                <span className="font-bold text-green-600 text-xs md:text-sm">กำไรสุทธิ</span>
                <span className="font-bold text-lg md:text-xl text-green-600">{formatMoney(allTimeProfit)}</span>
              </div>
              <div className="text-[10px] md:text-xs text-right text-gray-400 font-medium">({allTimeFilteredSales.length} ออเดอร์)</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100">
            <h3 className="text-sm md:text-lg font-semibold text-gray-800">
              {filterProductId === 'all' ? 'สินค้าขายดี ประจำเดือนที่เลือก (Top 5)' : 'สรุปยอดขายสินค้าที่เลือก'}
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
                    <span className="text-xs md:text-sm text-gray-500 whitespace-nowrap">ขายแล้ว {p.qty} ชิ้น</span>
                    <div className="w-24 md:w-32 h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(p.qty / topProducts[0].qty) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && <p className="text-gray-500 text-xs md:text-sm text-center py-4">ไม่มีข้อมูลการขายตามเงื่อนไขที่เลือก</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🕒 [View 3] หน้าประวัติการขาย และแก้ไขออเดอร์ (Sales History)
  const SalesHistoryView = () => {
    const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [isEditing, setIsEditing] = useState(null);
    const [editForm, setEditForm] = useState({ productId: '', quantity: 1, date: '' });
    const [isProcessing, setIsProcessing] = useState(false);

    const formatForInput = (isoString) => {
      if (!isoString) return '';
      const d = new Date(isoString);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };

    const filteredSales = sales
      .filter(s => new Date(s.date).toLocaleDateString('en-CA') === filterDate)
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
        const newQty = Number(editForm.quantity);
        const oldProductId = sale.productId;
        const newProductId = editForm.productId;
        const newProductData = getProduct(newProductId);
        
        if (!newProductData) throw new Error("ไม่พบข้อมูลสินค้าใหม่");
        if (newQty < 1) throw new Error("จำนวนต้องมากกว่า 0");

        const parsedDate = new Date(editForm.date);
        if (isNaN(parsedDate.getTime())) throw new Error("รูปแบบวันที่ไม่ถูกต้อง");
        const newDateIso = parsedDate.toISOString();

        const newTotal = newProductData.price * newQty;

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
          date: newDateIso
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
                className="border-none focus:ring-0 text-xs md:text-sm bg-transparent cursor-pointer outline-none" 
             />
          </div>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs md:text-sm">
                <th className="p-3 md:p-4 font-medium whitespace-nowrap">เวลาที่ขาย</th>
                <th className="p-3 md:p-4 font-medium">สินค้า</th>
                <th className="p-3 md:p-4 font-medium text-center">จำนวน</th>
                <th className="p-3 md:p-4 font-medium text-right">ยอดรวม</th>
                <th className="p-3 md:p-4 font-medium text-center">ผู้ทำรายการ</th>
                <th className="p-3 md:p-4 font-medium text-right">จัดการ</th>
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
                      <span className="font-medium text-gray-800">{getProduct(sale.productId)?.name || 'สินค้าถูกลบไปแล้ว'}</span>
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
                      <span>{sale.quantity}</span>
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-right text-blue-600 font-medium whitespace-nowrap">
                    {isEditing === sale.id ? (
                       <span>{formatMoney((getProduct(editForm.productId)?.price || 0) * (editForm.quantity || 0))}</span>
                    ) : (
                       formatMoney(sale.total)
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-center text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded-full text-[10px] md:text-xs">{sale.soldBy || '-'}</span>
                  </td>
                  <td className="p-3 md:p-4 text-right space-x-1 md:space-x-2 whitespace-nowrap">
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
                              date: formatForInput(sale.date)
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
                <tr><td colSpan="6" className="text-center p-6 md:p-8 text-gray-500 text-xs md:text-sm">ไม่มีรายการขายในวันที่เลือก</td></tr>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">จัดการสินค้า</h2>
          <div className="flex space-x-2 md:space-x-3 w-full sm:w-auto">
            <button onClick={exportProductsReport} className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 md:space-x-2 bg-white text-gray-700 border border-gray-200 px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-gray-50 transition text-xs md:text-sm"><Download size={16} /><span>ส่งออก</span></button>
            {!isAdding && <button onClick={() => { setIsAdding(true); setEditForm({name:'', cost:'', price:''}); setIsEditing(null); }} className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 md:space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg transition text-xs md:text-sm"><Plus size={16} /><span>เพิ่มสินค้าใหม่</span></button>}
          </div>
        </div>
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs md:text-sm">
                <th className="p-3 md:p-4 font-medium">ชื่อสินค้า</th>
                <th className="p-3 md:p-4 font-medium">ราคาคลินิก</th>
                <th className="p-3 md:p-4 font-medium">ราคาขาย</th>
                <th className="p-3 md:p-4 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-xs md:text-sm">
              {isAdding && (
                <tr className="border-b border-gray-50 bg-blue-50/50">
                  <td className="p-2 md:p-4"><input className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm" placeholder="ชื่อสินค้า..." value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                  <td className="p-2 md:p-4"><input type="number" className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm" placeholder="ราคาคลินิก..." value={editForm.cost} onChange={e => setEditForm({...editForm, cost: e.target.value})} /></td>
                  <td className="p-2 md:p-4"><input type="number" className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm" placeholder="ราคาขาย..." value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /></td>
                  <td className="p-2 md:p-4 text-right space-x-1 md:space-x-2 whitespace-nowrap">
                    <button onClick={handleAdd} className="text-green-600 p-1 md:p-1.5"><Save size={16} /></button>
                    <button onClick={() => setIsAdding(false)} className="text-red-600 p-1 md:p-1.5"><X size={16} /></button>
                  </td>
                </tr>
              )}
              {products.map(product => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-3 md:p-4">{isEditing === product.id ? <input className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /> : <span className="font-medium text-gray-800">{product.name}</span>}</td>
                  <td className="p-3 md:p-4">{isEditing === product.id ? <input type="number" className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm" value={editForm.cost} onChange={e => setEditForm({...editForm, cost: e.target.value})} /> : <span>{product.cost} ฿</span>}</td>
                  <td className="p-3 md:p-4">{isEditing === product.id ? <input type="number" className="w-full p-1.5 md:p-2 border rounded text-xs md:text-sm" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /> : <span>{product.price} ฿</span>}</td>
                  <td className="p-3 md:p-4 text-right space-x-1 md:space-x-2 whitespace-nowrap">
                    {isEditing === product.id ? (
                      <><button onClick={() => handleSave(product.id)} className="text-green-600 hover:bg-green-100 p-1.5 md:p-2 rounded-md"><Save size={16} /></button><button onClick={() => setIsEditing(null)} className="text-gray-500 hover:bg-gray-200 p-1.5 md:p-2 rounded-md"><X size={16} /></button></>
                    ) : (
                      <><button onClick={() => { setIsEditing(product.id); setEditForm({name: product.name, cost: product.cost, price: product.price}); }} className="text-blue-600 hover:bg-blue-100 p-1.5 md:p-2 rounded-md"><Edit2 size={16} /></button><button onClick={async () => { if(confirm('ลบสินค้านี้?')) await deleteDoc(doc(db, "products", product.id)); }} className="text-red-600 hover:bg-red-100 p-1.5 md:p-2 rounded-md"><Trash2 size={16} /></button></>
                    )}
                  </td>
                </tr>
              ))}
              {products.length === 0 && !isAdding && (
                <tr><td colSpan="4" className="text-center p-6 text-gray-500 text-xs md:text-sm">ไม่มีข้อมูลสินค้า</td></tr>
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
    const handleSaveStock = async (id) => {
      await updateDoc(doc(db, "products", id), { stock: Number(newStock) });
      setEditingStockId(null);
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <h2 className="text-lg md:text-2xl font-bold text-gray-800">จัดการสต๊อกสินค้า</h2>
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[400px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs md:text-sm">
                <th className="p-3 md:p-4 font-medium">ชื่อสินค้า</th>
                <th className="p-3 md:p-4 font-medium text-center">คงเหลือ</th>
                <th className="p-3 md:p-4 font-medium text-right">อัปเดต</th>
              </tr>
            </thead>
            <tbody className="text-xs md:text-sm">
              {products.map(product => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-3 md:p-4 font-medium text-gray-800">{product.name}</td>
                  <td className="p-3 md:p-4 text-center">
                    {editingStockId === product.id ? (
                      <input type="number" className="w-16 md:w-20 p-1.5 md:p-2 border rounded text-center text-xs md:text-sm" value={newStock} onChange={e => setNewStock(e.target.value)} /> 
                    ) : (
                      <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide ${product.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{product.stock || 0} ชิ้น</span>
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-right space-x-1 md:space-x-2">
                    {editingStockId === product.id ? (
                      <><button onClick={() => handleSaveStock(product.id)} className="text-green-600 hover:bg-green-100 p-1.5 md:p-2 rounded-md"><Save size={16} /></button><button onClick={() => setEditingStockId(null)} className="text-gray-500 hover:bg-gray-200 p-1.5 md:p-2 rounded-md"><X size={16} /></button></>
                    ) : (
                      <button onClick={() => { setEditingStockId(product.id); setNewStock(product.stock || 0); }} className="text-blue-600 hover:bg-blue-100 p-1.5 md:p-2 rounded-md"><Edit2 size={16} /></button>
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

  // 👥 [View 6] หน้าจัดการผู้ใช้งานระบบ (Users Management)
  const UsersManagementView = () => {
    const [isEditing, setIsEditing] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', password: '', role: 'staff' });
    const [isAdding, setIsAdding] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSave = async (id) => {
      setIsProcessing(true);
      try {
        await updateDoc(doc(db, "users", id), { 
          password: editForm.password, 
          role: editForm.role 
        });
        setIsEditing(null);
      } catch (error) { alert("Error: " + error.message); }
      setIsProcessing(false);
    };

    const handleAdd = async () => {
      if (users.find(u => u.username === editForm.username)) { alert('ชื่อนี้มีอยู่แล้ว'); return; }
      await addDoc(collection(db, "users"), { ...editForm });
      setIsAdding(false);
      setEditForm({ username: '', password: '', role: 'staff' });
    };

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">จัดการผู้ใช้งาน</h2>
          {!isAdding && <button onClick={() => { setIsAdding(true); setEditForm({username:'', password:'', role:'staff'}); }} className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg flex items-center space-x-1.5 md:space-x-2 text-xs md:text-sm w-full sm:w-auto justify-center"><Plus size={16} /><span>เพิ่มผู้ใช้</span></button>}
        </div>
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs md:text-sm">
                <th className="p-3 md:p-4 font-medium">Username</th>
                <th className="p-3 md:p-4 font-medium">รหัสผ่าน</th>
                <th className="p-3 md:p-4 font-medium">ระดับสิทธิ์</th>
                <th className="p-3 md:p-4 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-xs md:text-sm">
              {isAdding && (
                <tr className="bg-blue-50/50">
                  <td className="p-2 md:p-4"><input className="p-1.5 md:p-2 border rounded w-full text-xs md:text-sm" placeholder="ชื่อ..." value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} /></td>
                  <td className="p-2 md:p-4"><input className="p-1.5 md:p-2 border rounded w-full text-xs md:text-sm" placeholder="รหัสผ่าน..." value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} /></td>
                  <td className="p-2 md:p-4"><select className="p-1.5 md:p-2 border rounded w-full text-xs md:text-sm" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}><option value="staff">Staff</option><option value="admin">Admin</option></select></td>
                  <td className="p-2 md:p-4 text-right whitespace-nowrap">
                    <button onClick={handleAdd} className="text-green-600 p-1 md:p-1.5"><Save size={16} /></button>
                    <button onClick={() => setIsAdding(false)} className="text-red-600 p-1 md:p-1.5"><X size={16} /></button>
                  </td>
                </tr>
              )}
              {users.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 md:p-4 font-medium text-gray-800">{u.username}</td>
                  <td className="p-3 md:p-4">
                    {isEditing === u.id ? (
                      <input 
                        className="p-1.5 md:p-2 border rounded w-full text-xs md:text-sm" 
                        value={editForm.password} 
                        onChange={e => setEditForm({...editForm, password: e.target.value})} 
                      />
                    ) : (
                      <span className="text-gray-400 tracking-widest text-xs md:text-sm">••••••</span>
                    )}
                  </td>
                  <td className="p-3 md:p-4">
                    {isEditing === u.id ? (
                      <select className="p-1.5 md:p-2 border rounded text-xs md:text-sm" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{u.role.toUpperCase()}</span>
                    )}
                  </td>
                  <td className="p-3 md:p-4 text-right space-x-1 md:space-x-2 whitespace-nowrap">
                    {isEditing === u.id ? (
                      <>
                        <button onClick={() => handleSave(u.id)} className="text-green-600 hover:bg-green-100 p-1.5 md:p-2 rounded-md"><Save size={16} /></button>
                        <button onClick={() => setIsEditing(null)} className="text-gray-500 hover:bg-gray-200 p-1.5 md:p-2 rounded-md"><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setIsEditing(u.id); setEditForm({username: u.username, password: u.password, role: u.role}); }} className="text-blue-600 hover:bg-blue-100 p-1.5 md:p-2 rounded-md"><Edit2 size={16} /></button>
                        <button onClick={async () => { if(confirm('ลบผู้ใช้?')) await deleteDoc(doc(db, "users", u.id)); }} className={`text-red-600 hover:bg-red-100 p-1.5 md:p-2 rounded-md ${u.id === loggedInUser.id ? 'opacity-0 pointer-events-none' : ''}`}><Trash2 size={16} /></button>
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

  // 🛒 [View 7] หน้าคีย์ยอดขาย POS (Sales POS)
  const SalesView = () => {
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const recentSales = sales
      .filter(s => new Date(s.date).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA'))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const handleCheckout = async (e) => {
      e.preventDefault();
      if (!selectedProduct) return;
      const product = getProduct(selectedProduct);
      if ((product.stock || 0) < quantity) { setIsError(true); setMessage('สต๊อกไม่พอ'); return; }
      
      setIsProcessing(true);
      try {
        await addDoc(collection(db, "sales"), { 
          productId: selectedProduct, 
          quantity, 
          total: product.price * quantity, 
          date: new Date().toISOString(), 
          soldBy: loggedInUser.username 
        });
        
        await updateDoc(doc(db, "products", product.id), { 
          stock: increment(-quantity) 
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
      <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
        <h2 className="text-lg md:text-2xl font-bold text-gray-800">คีย์ข้อมูลการขาย (POS)</h2>
        <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleCheckout} className="space-y-4 md:space-y-6">
            {message && <div className={`p-3 md:p-4 rounded-lg text-xs md:text-sm font-medium ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>}
            <div>
              <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">เลือกสินค้า</label>
              <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg bg-white text-sm md:text-base focus:ring-2 focus:ring-blue-500 outline-none" required disabled={isProcessing}>
                <option value="" disabled>-- เลือกสินค้า --</option>
                {products.map(p => <option key={p.id} value={p.id} disabled={(p.stock || 0) === 0}>{p.name} ({p.price} ฿) - เหลือ {p.stock || 0}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">จำนวน</label>
              <div className="flex items-center space-x-3 md:space-x-4">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 transition">-</button>
                <input type="number" value={quantity} readOnly className="w-full text-center p-2.5 md:p-3 border border-gray-300 rounded-lg text-base md:text-lg font-medium" />
                <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 transition">+</button>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between sm:items-end space-y-4 sm:space-y-0">
              <div>
                <p className="text-xs md:text-sm text-gray-500 font-medium">ยอดรวมทั้งหมด</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-600">{formatMoney(selectedProduct ? getProduct(selectedProduct).price * quantity : 0)}</p>
              </div>
              <button type="submit" disabled={!selectedProduct || isProcessing} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 md:px-8 md:py-3 rounded-lg text-sm md:text-base font-medium transition disabled:bg-gray-300 shadow-sm">
                บันทึกการขาย
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 md:mt-8">
          <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">รายการที่เพิ่งขายไปวันนี้ (5 รายการล่าสุด)</h3>
          <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[400px]">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs md:text-sm">
                  <th className="p-3 md:p-4 font-medium">เวลา</th>
                  <th className="p-3 md:p-4 font-medium">สินค้า</th>
                  <th className="p-3 md:p-4 font-medium text-center">จำนวน</th>
                  <th className="p-3 md:p-4 font-medium text-right">ยอดรวม</th>
                </tr>
              </thead>
              <tbody className="text-xs md:text-sm">
                {recentSales.map(sale => (
                  <tr key={sale.id} className="border-b border-gray-50">
                    <td className="p-3 md:p-4 text-[10px] md:text-xs text-gray-500 whitespace-nowrap">{new Date(sale.date).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="p-3 md:p-4 font-medium text-gray-800">
                      {getProduct(sale.productId)?.name || 'สินค้าถูกลบ'}
                      {sale.soldBy && <span className="block text-[10px] text-gray-400 font-normal mt-0.5">โดย: {sale.soldBy}</span>}
                    </td>
                    <td className="p-3 md:p-4 text-center">{sale.quantity}</td>
                    <td className="p-3 md:p-4 text-right text-blue-600 font-medium whitespace-nowrap">{formatMoney(sale.total)}</td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr><td colSpan="4" className="p-4 md:p-6 text-center text-gray-500 text-xs md:text-sm">ยังไม่มีการขายในวันนี้</td></tr>
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

  // ระหว่างโหลด ให้โชว์หน้า Loading (หากโหลดไม่ขึ้นจะโชว์ Error)
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

  // หากเข้าด้วยลิงก์ผู้บริหาร จะแสดงหน้า Dashboard เท่านั้น โดยไม่ต้อง Login
  if (isExecutiveView) {
    return (
      <div className="min-h-screen bg-slate-50 p-3 md:p-8 font-sans">
        <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
          <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <h1 className="text-lg md:text-2xl font-extrabold text-blue-600 tracking-tight flex items-center space-x-2"><ShoppingCart className="text-blue-600 w-5 h-5 md:w-6 md:h-6" /><span>The Royal Queen - ผู้บริหาร</span></h1>
          </div>
          <DashboardView />
        </div>
      </div>
    );
  }

  // หากยังไม่ได้ Login ให้โชว์หน้า Login
  if (!loggedInUser) return <LoginView />;

  // หน้าต่างระบบหลักเมื่อ Login สำเร็จ (มีแถบเมนูซ้ายมือ)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* แถบเมนูด้านซ้าย (Sidebar) */}
      <div className="w-full md:w-64 bg-white border-b md:border-r border-gray-200 flex-shrink-0 z-10">
        <div className="p-4 md:p-6 flex items-center justify-center md:justify-start">
          <h1 className="text-lg md:text-xl font-extrabold text-blue-600 tracking-tight flex items-center space-x-2">
            <ShoppingCart className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
            <span>The Royal Queen</span>
          </h1>
        </div>
        
        {/* เมนูนำทาง (ปรับให้เป็นแนวนอนบนมือถือ และปัดซ้ายขวาได้) */}
        <nav className="px-2 md:px-4 pb-2 md:pb-6 space-x-1 md:space-x-0 md:space-y-1 flex md:flex-col overflow-x-auto md:overflow-visible scrollbar-hide snap-x">
          <button onClick={() => setActiveTab('dashboard')} className={`snap-start flex-shrink-0 flex items-center space-x-2 md:space-x-3 w-auto md:w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl transition-colors whitespace-nowrap text-xs md:text-sm ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}><LayoutDashboard size={18} className="md:w-5 md:h-5" /><span>แดชบอร์ด</span></button>
          
          {loggedInUser.role === 'admin' && (
            <>
              <button onClick={() => setActiveTab('products')} className={`snap-start flex-shrink-0 flex items-center space-x-2 md:space-x-3 w-auto md:w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl transition-colors whitespace-nowrap text-xs md:text-sm ${activeTab === 'products' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}><Package size={18} className="md:w-5 md:h-5" /><span>จัดการสินค้า</span></button>
              <button onClick={() => setActiveTab('stock')} className={`snap-start flex-shrink-0 flex items-center space-x-2 md:space-x-3 w-auto md:w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl transition-colors whitespace-nowrap text-xs md:text-sm ${activeTab === 'stock' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}><Boxes size={18} className="md:w-5 md:h-5" /><span>สต๊อกสินค้า</span></button>
              <button onClick={() => setActiveTab('users')} className={`snap-start flex-shrink-0 flex items-center space-x-2 md:space-x-3 w-auto md:w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl transition-colors whitespace-nowrap text-xs md:text-sm ${activeTab === 'users' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}><Users size={18} className="md:w-5 md:h-5" /><span>จัดการผู้ใช้</span></button>
              <button onClick={() => setActiveTab('history')} className={`snap-start flex-shrink-0 flex items-center space-x-2 md:space-x-3 w-auto md:w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl transition-colors whitespace-nowrap text-xs md:text-sm ${activeTab === 'history' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}><History size={18} className="md:w-5 md:h-5" /><span>ประวัติการขาย</span></button>
            </>
          )}
          
          <button onClick={() => setActiveTab('sales')} className={`snap-start flex-shrink-0 flex items-center space-x-2 md:space-x-3 w-auto md:w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl transition-colors whitespace-nowrap text-xs md:text-sm ${activeTab === 'sales' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}><ShoppingCart size={18} className="md:w-5 md:h-5" /><span>คีย์ยอดขาย (POS)</span></button>
        </nav>
      </div>

      {/* พื้นที่แสดงผลด้านขวา (Main Content Area) */}
      <div className="flex-1 flex flex-col h-[calc(100vh-120px)] md:h-screen overflow-hidden relative">
        <header className="bg-white h-14 md:h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0 shadow-sm z-10">
          <div className="text-gray-500 font-semibold text-sm md:text-base hidden sm:block">
            {activeTab === 'dashboard' ? 'ระบบภาพรวม' : 
             activeTab === 'products' ? 'ตั้งค่าฐานข้อมูลสินค้า' : 
             activeTab === 'stock' ? 'ระบบคลังสินค้า' : 
             activeTab === 'users' ? 'ตั้งค่าบัญชีผู้ใช้' : 
             activeTab === 'history' ? 'ประวัติการทำรายการ' : 'แคชเชียร์ (POS)'}
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
            {/* สลับการแสดงผลหน้าต่างๆ ตามเมนูที่เลือก */}
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'products' && loggedInUser.role === 'admin' && <ProductsView />}
            {activeTab === 'stock' && loggedInUser.role === 'admin' && <StockView />}
            {activeTab === 'users' && loggedInUser.role === 'admin' && <UsersManagementView />}
            {activeTab === 'history' && loggedInUser.role === 'admin' && <SalesHistoryView />}
            {activeTab === 'sales' && <SalesView />}
          </div>
        </main>
      </div>
    </div>
  );
}