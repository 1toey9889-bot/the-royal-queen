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
// 🎨 โลโก้ The Resilient Clinic (วาดตามต้นฉบับ 100%)
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
// 🔥 2. ตั้งค่า Firebase
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
  const [oldSales, setOldSales] = useState([]); // 🚀 เก็บข้อมูลเก่าจาก 'sales'
  const [newOrders, setNewOrders] = useState([]); // 🚀 เก็บข้อมูลใหม่จาก 'orders'
  const [users, setUsers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  // 🚀 O(1) Product Map เพื่อความเร็ว
  const productMap = useMemo(() => {
    return products.reduce((map, product) => { map[product.id] = product; return map; }, {});
  }, [products]);

  // 🚀 รวมข้อมูลทั้งเก่าและใหม่เข้าด้วยกัน (Migration View)
  const combinedSalesData = useMemo(() => {
    const legacy = oldSales.map(s => ({
      id: s.id,
      date: s.date,
      store: s.store || 'Legacy',
      soldBy: s.soldBy || 'system',
      totalAmount: Number(s.total) || 0,
      totalProfit: (Number(s.total) || 0) - ((Number(s.unitCost) || 0) * (Number(s.quantity) || 0)),
      items: [{ productId: s.productId, quantity: s.quantity, unitPrice: s.unitPrice, unitCost: s.unitCost, total: s.total }],
      isLegacy: true
    }));

    const current = newOrders.map(o => ({ ...o, isLegacy: false }));
    return [...legacy, ...current];
  }, [oldSales, newOrders]);

  useEffect(() => {
    const connectionTimeout = setTimeout(() => { if (!isUsersLoaded || isLoading) setLoadError("การเชื่อมต่อใช้เวลานานผิดปกติ..."); }, 10000);

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) setDoc(doc(db, "users", "default_admin"), { username: 'admin', password: '123456', role: 'admin', permissions: defaultPermissions });
      else { setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setIsUsersLoaded(true); setLoadError(''); }
    });

    onSnapshot(collection(db, "products"), (snapshot) => { setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });

    // 🚀 ดึงทั้ง 2 ที่เพื่อไม่ให้ข้อมูลหาย
    onSnapshot(collection(db, "sales"), (snapshot) => { setOldSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
    onSnapshot(collection(db, "orders"), (snapshot) => { setNewOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setIsLoading(false); });

    return () => { clearTimeout(connectionTimeout); unsubscribeUsers(); };
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      const updatedUser = users.find(u => u.id === loggedInUser.id);
      if (updatedUser) { setLoggedInUser(updatedUser); if (activeTab !== 'sales' && updatedUser.role !== 'admin' && !updatedUser.permissions?.[activeTab]) setActiveTab('sales'); }
      else { setLoggedInUser(null); }
    }
  }, [users]);

  // --- Helpers ---
  const canAccess = (tabName) => { if (isExecutiveView) return tabName === 'dashboard' || tabName === 'stock'; if (!loggedInUser) return false; return loggedInUser.role === 'admin' || tabName === 'sales' || !!loggedInUser.permissions?.[tabName]; };
  const canEditTab = (tabName) => !loggedInUser ? false : (loggedInUser.role === 'admin' || !!loggedInUser.permissions?.[tabName + 'Edit']);
  const canExportTab = (tabName) => !loggedInUser ? false : (loggedInUser.role === 'admin' || !!loggedInUser.permissions?.[tabName + 'Export']);
  const formatMoney = (amount) => new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 2 }).format(amount || 0);
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

  const LoginView = () => {
    const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
    const handleLogin = (e) => { e.preventDefault(); const foundUser = users.find(u => u.username === username && u.password === password); if (foundUser) { setLoggedInUser(foundUser); setActiveTab(foundUser.role === 'admin' || foundUser.permissions?.dashboard ? 'dashboard' : 'sales'); } else { setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); } };
    return (<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans"><div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-8 space-y-8"><div className="text-center space-y-4"><ResilientLogo className="mx-auto h-24 rounded-2xl shadow-lg mb-4" /><p className="text-sm text-gray-500 font-medium">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p></div><form onSubmit={handleLogin} className="space-y-6">{error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center font-bold">{error}</div>}<div className="space-y-5"><div><label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">ชื่อผู้ใช้งาน</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={18} className="text-gray-400" /></div><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required /></div></div><div><label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">รหัสผ่าน</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400" /></div><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required /></div></div></div><button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl font-bold">เข้าสู่ระบบ</button></form></div></div>);
  };

  // 📊 [View 2] Dashboard 🚀 (ดึงข้อมูลรวม Legacy + New)
  const DashboardView = () => {
    const [timeframe, setTimeframe] = useState('monthly'); 
    const currentDateStr = getLocalISODate();
    const [filterDate, setFilterDate] = useState(currentDateStr); 
    const [filterMonth, setFilterMonth] = useState(currentDateStr.substring(0, 7)); 
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
    const [filterProductId, setFilterProductId] = useState('all');
    const [filterStore, setFilterStore] = useState('all'); 

    const filteredData = useMemo(() => {
      return combinedSalesData.filter(sale => {
        const saleDateLocal = getLocalISODate(sale.createdAt || sale.date);
        const saleMonthLocal = saleDateLocal.substring(0, 7);
        const saleYearLocal = saleDateLocal.substring(0, 4);
        let isTimeMatch = timeframe === 'daily' ? (saleDateLocal === filterDate) : timeframe === 'monthly' ? (saleMonthLocal === filterMonth) : timeframe === 'yearly' ? (saleYearLocal === filterYear) : true;
        const isStoreMatch = filterStore === 'all' || sale.store === filterStore;
        const isProductMatch = filterProductId === 'all' || (sale.items && sale.items.some(item => item.productId === filterProductId));
        return isTimeMatch && isStoreMatch && isProductMatch;
      });
    }, [combinedSalesData, timeframe, filterDate, filterMonth, filterYear, filterProductId, filterStore]);

    let totalRevenue = 0; let totalProfit = 0; let totalQty = 0;
    filteredData.forEach(sale => {
      totalRevenue += sale.totalAmount;
      totalProfit += sale.totalProfit;
      sale.items.forEach(i => { if (filterProductId === 'all' || i.productId === filterProductId) totalQty += Number(i.quantity); });
    });

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 md:space-x-3"><div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg text-white"><BarChart3 size={20} /></div><h2 className="text-xl font-extrabold text-gray-800">สรุปยอดขาย (รวมข้อมูลทั้งหมด)</h2></div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <select value={filterStore} onChange={e => setFilterStore(e.target.value)} className="bg-slate-50 border rounded-lg px-2 py-1.5 text-xs font-medium"><option value="all">ทุกร้านค้า</option>{STORE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select>
            <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="bg-slate-50 border rounded-lg px-2 py-1.5 text-xs font-medium"><option value="daily">รายวัน</option><option value="monthly">รายเดือน</option><option value="all">รวมทั้งหมด</option></select>
            {timeframe === 'daily' && <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-blue-50 border border-blue-100 rounded-lg px-2 py-1.5 text-xs text-blue-700 font-medium" />}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-400">
             <h3 className="text-gray-500 text-xs font-bold mb-1 flex items-center"><TrendingUp size={14} className="mr-1"/> ยอดขายรวม</h3>
             <p className="text-2xl font-black text-gray-800">฿{formatMoney(totalRevenue)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-emerald-400">
             <h3 className="text-gray-500 text-xs font-bold mb-1 flex items-center"><DollarSign size={14} className="mr-1"/> กำไรสุทธิ</h3>
             <p className="text-2xl font-black text-emerald-600">฿{formatMoney(totalProfit)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-orange-400">
             <h3 className="text-gray-500 text-xs font-bold mb-1 flex items-center"><Package size={14} className="mr-1"/> จำนวนที่ขายได้</h3>
             <p className="text-2xl font-black text-gray-800">{totalQty} ชิ้น</p>
          </div>
        </div>
      </div>
    );
  };

  // 🛒 [View 7] POS 🚀 (แก้ไขระบบสแกน ID ให้แก้เองได้อิสระ)
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
    const dropdownRef = useRef(null);

    // 🚀 ระบบสแกนเนอร์
    useEffect(() => {
      let scanner = null;
      if (isScanning) {
        setTimeout(() => {
          scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250, rememberLastUsedCamera: true }, false);
          scanner.render((decodedText) => {
            if (scanTarget === 'orderId') { setCustomOrderId(decodedText); setIsScanning(false); scanner.clear(); } 
            else {
              const p = productMap[decodedText];
              if (p) { setSelectedProduct(decodedText); setCustomPrice(p.price); setIsScanning(false); scanner.clear(); } 
              else alert(`ไม่พบสินค้ารหัส: ${decodedText}`);
            }
          });
        }, 100);
      }
      return () => { if (scanner) scanner.clear().catch(e=>null); };
    }, [isScanning, scanTarget]);

    const handleAddToCart = (e) => {
      e.preventDefault();
      if (!selectedProduct) return;
      const product = getProduct(selectedProduct);
      setCart([...cart, { cartId: Date.now().toString(), productId: selectedProduct, name: product.name, qty: quantity, price: Number(customPrice), cost: Number(product.cost), total: Number(customPrice) * quantity }]);
      setSelectedProduct(''); setQuantity(1);
    };

    const handleConfirmOrder = async () => {
      if (!customOrderId.trim()) { setIsError(true); setMessage('กรุณากรอกหรือสแกนเลขที่ออเดอร์'); return; }
      if (cart.length === 0) return;
      setIsProcessing(true);
      try {
        const orderRef = doc(db, "orders", customOrderId.trim().replace(/\//g, '-'));
        await runTransaction(db, async (t) => {
          const snap = await t.get(orderRef); if (snap.exists()) throw new Error("เลขบิลนี้ถูกใช้ไปแล้ว");
          for (const item of cart) {
            const pRef = doc(db, "products", item.productId);
            const pSnap = await t.get(pRef);
            if (pSnap.exists()) t.update(pRef, { stock: Number(pSnap.data().stock) - item.qty });
          }
          t.set(orderRef, { store: selectedStore, totalAmount: cart.reduce((s,i)=>s+i.total,0), createdAt: new Date().toISOString(), soldBy: loggedInUser?.username, items: cart.map(i=>({productId:i.productId, quantity:i.qty, unitPrice:i.price, unitCost:i.cost, total:i.total})) });
        });
        setCart([]); setCustomOrderId(''); setMessage('บันทึกสำเร็จ!'); setTimeout(()=>setMessage(''),3000);
      } catch (err) { setMessage(err.message); setIsError(true); }
      setIsProcessing(false);
    };

    return (
      <div className="relative space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-[2rem] shadow-xl p-6 md:p-8">
            <h2 className="text-2xl font-black text-center mb-6 text-slate-800">บันทึกรายการขาย (POS)</h2>
            {isScanning && (<div className="w-full bg-black rounded-xl overflow-hidden min-h-[250px] mb-6 relative"><div id="qr-reader" className="w-full h-full text-white"></div><button onClick={()=>setIsScanning(false)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full z-10"><X size={16}/></button></div>)}
            
            {message && <div className={`p-4 rounded-xl text-sm font-bold mb-4 ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>}

            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-6">
                <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center justify-center"><Receipt size={16} className="mr-1.5" /> เลขที่ออเดอร์ (ระบุเอง / สแกน) *</label>
                <div className="flex items-center justify-center gap-2 max-w-sm mx-auto relative">
                  <input type="text" value={customOrderId} onChange={(e) => setCustomOrderId(e.target.value)} className="w-full pl-4 pr-10 py-2.5 border border-blue-200 rounded-xl text-sm outline-none text-center font-bold text-slate-700 bg-white" placeholder="กรุณาใส่ ID ออเดอร์..." />
                  <button type="button" onClick={() => { setIsScanning(true); setScanTarget('orderId'); }} className="absolute right-2 p-1.5 bg-blue-100 text-blue-600 rounded-lg"><QrCode size={16} /></button>
                </div>
            </div>

            <form onSubmit={handleAddToCart} className="space-y-6">
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex justify-between items-center"><label className="text-sm font-bold">เลือกสินค้า</label><button type="button" onClick={()=>{setIsScanning(true); setScanTarget('product');}} className="flex items-center space-x-1 px-3 py-1 bg-white border rounded-lg text-xs font-bold"><QrCode size={12}/><span>สแกนสินค้า</span></button></div>
                <select value={selectedProduct} onChange={e=>setSelectedProduct(e.target.value)} className="w-full p-3 border rounded-xl bg-white font-bold"><option value="">-- เลือกสินค้า --</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} (คงเหลือ {p.stock})</option>)}</select>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-center mb-1">ราคา/ชิ้น</label><input type="number" value={customPrice} onChange={e=>setCustomPrice(e.target.value)} className="w-full p-2 border rounded-lg text-center font-bold"/></div>
                  <div><label className="block text-xs font-bold text-center mb-1">จำนวน</label><input type="number" value={quantity} onChange={e=>setQuantity(Math.max(1,parseInt(e.target.value)||1))} className="w-full p-2 border rounded-lg text-center font-bold"/></div>
                </div>
                <button type="submit" disabled={!selectedProduct} className="w-full py-3 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200 transition">+ เพิ่มลงตะกร้า</button>
              </div>
            </form>
          </div>
          <div className="lg:col-span-5 bg-white rounded-[2rem] shadow-lg p-6 flex flex-col h-full border border-slate-100">
             <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center"><ShoppingBag className="mr-2 text-blue-600"/> บิลปัจจุบัน</h3>
             <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] border-t pt-3">
                {cart.map(item => (
                  <div key={item.cartId} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex-1"><p className="font-bold text-sm">{item.name}</p><p className="text-xs text-slate-500">{item.qty} x ฿{formatMoney(item.price)}</p></div>
                    <div className="text-right"><p className="font-black text-blue-600 text-sm">฿{formatMoney(item.total)}</p><button onClick={()=>removeFromCart(item.cartId)} className="text-red-400"><MinusCircle size={14}/></button></div>
                  </div>
                ))}
             </div>
             <div className="pt-4 mt-auto border-t">
                <div className="flex justify-between text-xl font-black mb-4"><span>รวมทั้งสิ้น</span><span className="text-blue-600">฿{formatMoney(cart.reduce((s,i)=>s+i.total,0))}</span></div>
                <button onClick={handleConfirmOrder} disabled={!customOrderId || cart.length===0 || isProcessing} className="w-full py-4 bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-500/30">ยืนยันการขาย (Checkout)</button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  // 🕒 [View 3] History (ดึงข้อมูลรวม Legacy + New)
  const SalesHistoryView = () => {
    const [filterDate, setFilterDate] = useState(getLocalISODate());
    const [isProcessing, setIsProcessing] = useState(false);
    const filteredOrders = useMemo(() => combinedSalesData.filter(o => getLocalISODate(o.createdAt || o.date) === filterDate).sort((a,b)=>new Date(b.createdAt||b.date) - new Date(a.createdAt||a.date)), [combinedSalesData, filterDate]);
    
    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center"><div><h2 className="text-xl font-black text-gray-800">ประวัติการขาย (รวมเก่า-ใหม่)</h2></div><input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="p-2 border rounded-lg text-sm text-blue-600 outline-none shadow-sm"/></div>
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto"><table className="w-full text-left min-w-[700px] text-sm"><thead><tr className="bg-gray-50 border-b"><th className="p-4">เลขที่บิล</th><th className="p-4">เวลา</th><th className="p-4">ยอดรวม</th><th className="p-4">สถานะ</th></tr></thead><tbody className="divide-y">{filteredOrders.map(o=>(<tr key={o.id} className="hover:bg-slate-50"><td className="p-4 font-mono font-bold text-blue-600">{o.id}</td><td className="p-4 text-slate-500">{o.createdAt?new Date(o.createdAt).toLocaleTimeString():'-'}</td><td className="p-4 font-black">฿{formatMoney(o.totalAmount)}</td><td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.isLegacy?'bg-orange-100 text-orange-600':'bg-green-100 text-green-600'}`}>{o.isLegacy?'LEGACY (เดิม)':'NEW (ออเดอร์)'}</span></td></tr>))}</tbody></table></div>
      </div>
    );
  };

  // (ส่วน ProductsView / StockView / UsersManagementView และ Main Layout คงเดิม)
  // [หมายเหตุ: ในการใช้งานจริง โค้ดส่วนที่เหลือจะอยู่ต่อจากนี้ครับ]

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans">
      <style>{`input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`}</style>
      <div className="w-full md:w-64 bg-gradient-to-br from-white to-blue-50 border-r z-10"><div className="p-4 border-b"><ResilientLogo className="h-16 w-full rounded-lg" /></div><nav className="p-4 space-y-1">
        <button onClick={()=>setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 p-3 rounded-xl ${activeTab==='dashboard'?'bg-blue-600 text-white shadow-md':'text-slate-600 hover:bg-white'}`}><LayoutDashboard size={20}/><span>Dashboard</span></button>
        <button onClick={()=>setActiveTab('history')} className={`w-full flex items-center space-x-3 p-3 rounded-xl ${activeTab==='history'?'bg-blue-600 text-white shadow-md':'text-slate-600 hover:bg-white'}`}><History size={20}/><span>ประวัติการขาย</span></button>
        <button onClick={()=>setActiveTab('sales')} className={`w-full flex items-center space-x-3 p-3 rounded-xl ${activeTab==='sales'?'bg-blue-600 text-white shadow-md':'text-slate-600 hover:bg-white'}`}><ShoppingCart size={20}/><span>บันทึกรายการขาย</span></button>
      </nav></div>
      <div className="flex-1 flex flex-col h-screen overflow-hidden"><header className="bg-white/80 backdrop-blur-md h-16 border-b flex items-center justify-between px-6 z-10"><div className="text-slate-600 font-bold hidden sm:block">ระบบจัดการ THE RESILIENT CLINIC</div><div className="flex items-center space-x-4"><div className="flex items-center space-x-2 text-sm bg-slate-100 py-1.5 px-3 rounded-full border"><User size={14} className="text-blue-600" /><span className="font-bold">{loggedInUser?.username}</span></div><button onClick={() => setLoggedInUser(null)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><LogOut size={16} /></button></div></header><main className="flex-1 overflow-auto p-4 md:p-8 bg-[#f8fafc]"><div className="max-w-5xl mx-auto">{activeTab==='dashboard' && <DashboardView />}{activeTab==='sales' && <SalesView />}{activeTab==='history' && <SalesHistoryView />}</div></main></div>
    </div>
  );
}