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
// 🚀 3. คอมโพเนนต์หลัก
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
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) setDoc(doc(db, "users", "default_admin"), { username: 'admin', password: '123456', role: 'admin', permissions: defaultPermissions });
      else { setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setIsUsersLoaded(true); }
    });
    onSnapshot(collection(db, "products"), (snapshot) => { setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
    onSnapshot(collection(db, "orders"), (snapshot) => { setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setIsLoading(false); });
    return () => unsubscribeUsers();
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      const updatedUser = users.find(u => u.id === loggedInUser.id);
      if (updatedUser) setLoggedInUser(updatedUser);
    }
  }, [users]);

  // --- Helpers ---
  const canAccess = (tabName) => (isExecutiveView && (tabName === 'dashboard' || tabName === 'stock')) || (loggedInUser && (loggedInUser.role === 'admin' || tabName === 'sales' || !!loggedInUser.permissions?.[tabName]));
  const canEditTab = (tabName) => loggedInUser?.role === 'admin' || !!loggedInUser?.permissions?.[tabName + 'Edit'];
  const canExportTab = (tabName) => loggedInUser?.role === 'admin' || !!loggedInUser?.permissions?.[tabName + 'Export'];
  const formatMoney = (amount) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(amount || 0);
  const getProduct = (id) => productMap[id];
  const getLocalISODate = (dateString) => { const d = dateString ? new Date(dateString) : new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().split('T')[0]; };

  const downloadMobileSafeCSV = (csvString, filename) => {
    const finalCSV = "\uFEFF" + csvString;
    const blob = new Blob([finalCSV], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 1000);
  };

  // 👤 [View 1] Login
  const LoginView = () => {
    const [u, setU] = useState(''); const [p, setP] = useState('');
    const handleLogin = (e) => { e.preventDefault(); const user = users.find(x => x.username === u && x.password === p); if (user) { setLoggedInUser(user); setActiveTab(user.role === 'admin' || user.permissions?.dashboard ? 'dashboard' : 'sales'); } };
    return (<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6"><div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-slate-100"><div className="mb-8"><ResilientLogo className="h-24 w-full rounded-2xl mb-4" /><p className="text-center text-slate-500 font-bold">กรุณาเข้าสู่ระบบ</p></div><form onSubmit={handleLogin} className="space-y-6"><div><label className="text-xs font-bold text-slate-500 ml-1">USERNAME</label><input type="text" onChange={e => setU(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required /></div><div><label className="text-xs font-bold text-slate-500 ml-1">PASSWORD</label><input type="password" onChange={e => setP(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required /></div><button className="w-full py-4 bg-[#0A142A] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-transform">เข้าสู่ระบบ</button></form></div></div>);
  };

  // 📊 [View 2] Dashboard 🚀 (Excel Included)
  const DashboardView = () => {
    const [timeframe, setTimeframe] = useState('monthly'); 
    const currentDateStr = getLocalISODate();
    const [filterDate, setFilterDate] = useState(currentDateStr); 
    const [filterStore, setFilterStore] = useState('all'); 

    const filtered = useMemo(() => orders.filter(o => {
      const orderDate = getLocalISODate(o.createdAt);
      return (timeframe === 'daily' ? orderDate === filterDate : true) && (filterStore === 'all' || o.store === filterStore);
    }), [orders, timeframe, filterDate, filterStore]);

    const totalRev = filtered.reduce((s, o) => s + o.totalAmount, 0);
    const totalProf = filtered.reduce((s, o) => s + o.totalProfit, 0);

    const exportToExcel = () => {
      const rows = [['หมายเลขออเดอร์', 'วันที่', 'ร้านค้า', 'ยอดขาย', 'กำไร']];
      filtered.forEach(o => rows.push([`"${o.id}"`, getLocalISODate(o.createdAt), o.store, o.totalAmount, o.totalProfit]));
      downloadMobileSafeCSV(rows.map(r => r.join(',')).join('\n'), `Report_Sales.csv`);
    };

    return (<div className="space-y-6"><div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-6 rounded-3xl border shadow-sm"><div className="flex items-center space-x-3"><BarChart3 className="text-blue-600" /><h2 className="text-xl font-black">Dashboard</h2></div><div className="flex flex-wrap gap-2"><select value={timeframe} onChange={e=>setTimeframe(e.target.value)} className="bg-slate-50 border p-2 rounded-xl text-xs font-bold"><option value="daily">วันนี้</option><option value="monthly">เดือนนี้</option></select>{canExportTab('dashboard') && <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Download size={14}/> Excel</button>}</div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="bg-white p-6 rounded-3xl border-l-8 border-blue-500 shadow-sm"><h3 className="text-xs font-bold text-slate-400 mb-1">ยอดขายรวม</h3><p className="text-3xl font-black text-slate-800">฿{formatMoney(totalRev)}</p></div><div className="bg-white p-6 rounded-3xl border-l-8 border-emerald-500 shadow-sm"><h3 className="text-xs font-bold text-slate-400 mb-1">กำไรสุทธิ</h3><p className="text-3xl font-black text-emerald-600">฿{formatMoney(totalProf)}</p></div></div></div>);
  };

  // 🛒 [View 7] POS 🚀 (iPad/iPhone Optimized)
  const SalesView = () => {
    const [orderId, setOrderId] = useState(''); const [store, setStore] = useState(STORE_OPTIONS[0]);
    const [pid, setPid] = useState(''); const [price, setPrice] = useState(''); const [qty, setQty] = useState(1);
    const [cart, setCart] = useState([]); const [scanning, setScanning] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
      let scanner = null;
      if (scanning) {
        setTimeout(() => {
          scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
          scanner.render((txt) => {
            const prod = productMap[txt];
            if (prod) { setPid(txt); setPrice(prod.price); setScanning(false); scanner.clear(); }
            else { setOrderId(txt); setScanning(false); scanner.clear(); }
          });
        }, 100);
      }
      return () => { if (scanner) scanner.clear().catch(() => null); };
    }, [scanning]);

    const addToCart = (e) => {
      e.preventDefault(); if (!pid) return;
      const p = getProduct(pid);
      setCart([...cart, { id: Date.now(), pid, name: p.name, qty, price: Number(price), cost: Number(p.cost), total: Number(price) * qty }]);
      setPid(''); setQty(1);
    };

    const confirmOrder = async () => {
      if (!orderId.trim() || cart.length === 0) return alert('กรุณาใส่ ID และเลือกสินค้า');
      setProcessing(true);
      try {
        await runTransaction(db, async (t) => {
          const oRef = doc(db, "orders", orderId.trim());
          if ((await t.get(oRef)).exists()) throw new Error("เลขบิลซ้ำ");
          cart.forEach(i => { const pRef = doc(db,"products",i.pid); t.update(pRef, { stock: increment(-i.qty) }); });
          t.set(oRef, { store, totalAmount: cart.reduce((s,i)=>s+i.total,0), totalProfit: cart.reduce((s,i)=>s+(i.total-(i.cost*i.qty)),0), createdAt: new Date().toISOString(), soldBy: loggedInUser.username, items: cart });
        });
        setCart([]); setOrderId(''); alert('สำเร็จ!');
      } catch (err) { alert(err.message); }
      setProcessing(false);
    };

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl p-6 md:p-8 border border-slate-100">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><ShoppingCart className="text-blue-600"/> POS</h2>
            {scanning && <div className="mb-6 rounded-2xl overflow-hidden bg-black aspect-video"><div id="qr-reader"></div></div>}
            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 mb-6 space-y-4">
              <div className="flex items-center justify-between font-bold text-blue-800 text-sm"><span>หมายเลขบิล *</span><button onClick={()=>setScanning(true)} className="p-2 bg-white rounded-lg shadow-sm border"><QrCode size={16}/></button></div>
              <input type="text" value={orderId} onChange={e=>setOrderId(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-blue-200 text-center font-black outline-none focus:border-blue-500" placeholder="กรอกหรือสแกนเลขบิล" />
            </div>
            <form onSubmit={addToCart} className="bg-slate-50 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center font-bold text-sm"><span>สินค้า</span><button type="button" onClick={()=>setScanning(true)} className="text-blue-600"><QrCode size={14}/></button></div>
              <select value={pid} onChange={e=>{const p=getProduct(e.target.value); setPid(e.target.value); setPrice(p?.price||'');}} className="w-full p-4 rounded-2xl border-0 bg-white shadow-sm font-bold"><option value="">เลือกสินค้า</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}</select>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={price} onChange={e=>setPrice(e.target.value)} className="p-4 rounded-2xl bg-white shadow-sm font-bold text-center" placeholder="ราคา" />
                <input type="number" value={qty} onChange={e=>setQty(Math.max(1,parseInt(e.target.value)||1))} className="p-4 rounded-2xl bg-white shadow-sm font-bold text-center" placeholder="จำนวน" />
              </div>
              <button type="submit" disabled={!pid} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 disabled:opacity-50">+ เพิ่มลงบิล</button>
            </form>
          </div>
          <div className="w-full lg:w-[350px] bg-white rounded-[2.5rem] shadow-xl p-6 border flex flex-col min-h-[500px]">
            <h3 className="font-black text-slate-800 border-b pb-4 mb-4 flex items-center gap-2"><ShoppingBag size={18}/> รายการสินค้า</h3>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2">
              {cart.map(i=>(<div key={i.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border"><div className="text-xs"><b>{i.name}</b><br/>{i.qty} x ฿{formatMoney(i.price)}</div><button onClick={()=>setCart(cart.filter(x=>x.id!==i.id))} className="text-red-400"><MinusCircle size={20}/></button></div>))}
            </div>
            <div className="pt-4 border-t mt-4">
              <div className="flex justify-between items-end mb-6"><div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Amount</p><p className="text-3xl font-black text-blue-600">฿{formatMoney(cart.reduce((s,i)=>s+i.total,0))}</p></div></div>
              <button onClick={confirmOrder} disabled={processing || cart.length===0} className="w-full py-5 bg-green-500 text-white rounded-[1.5rem] font-black shadow-lg shadow-green-100 disabled:opacity-50">ชำระเงิน (CHECKOUT)</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🕒 [View 3] ประวัติการขาย (Orders)
  const SalesHistoryView = () => {
    const [filterDate, setFilterDate] = useState(getLocalISODate());
    const sorted = useMemo(() => orders.filter(o => getLocalISODate(o.createdAt) === filterDate).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)), [orders, filterDate]);
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex justify-between items-center">
          <h2 className="text-xl font-black">ประวัติการขาย</h2>
          <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="p-2 border rounded-xl text-blue-600 font-bold outline-none" />
        </div>
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr className="text-slate-400 font-bold"><th className="p-4">บิล</th><th className="p-4">รายการ</th><th className="p-4 text-right">ยอดรวม</th><th className="p-4 text-right">จัดการ</th></tr></thead>
            <tbody className="divide-y">{sorted.map(o=>(<tr key={o.id} className="hover:bg-slate-50/50"><td className="p-4 font-mono font-bold text-blue-600">{o.id}</td><td className="p-4 text-[11px] text-slate-500">{o.items?.length} รายการ</td><td className="p-4 text-right font-black">฿{formatMoney(o.totalAmount)}</td><td className="p-4 text-right">{canEditTab('history') && <button onClick={async()=>{if(confirm('ลบ?')) await deleteDoc(doc(db,"orders",o.id));}} className="text-red-400 p-2"><Trash2 size={16}/></button>}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
    );
  };

  // 👥 [View 6] จัดการผู้ใช้งาน
  const UsersManagementView = () => {
    const [isAdding, setIsAdding] = useState(false);
    const [u, setU] = useState(''); const [p, setP] = useState(''); const [r, setR] = useState('staff');
    const handleAdd = async () => { if(!u || !p) return; await addDoc(collection(db,"users"), { username: u, password: p, role: r, permissions: defaultPermissions }); setIsAdding(false); setU(''); setP(''); };
    return (<div className="space-y-6"><div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm"><h2 className="text-xl font-black">จัดการผู้ใช้งาน</h2><button onClick={()=>setIsAdding(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm">+ เพิ่มผู้ใช้</button></div>
      {isAdding && <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-wrap gap-4"><input placeholder="User" value={u} onChange={e=>setU(e.target.value)} className="p-3 rounded-xl border flex-1" /><input placeholder="Pass" value={p} onChange={e=>setP(e.target.value)} className="p-3 rounded-xl border flex-1" /><select value={r} onChange={e=>setR(e.target.value)} className="p-3 rounded-xl border"><option value="staff">Staff</option><option value="admin">Admin</option></select><button onClick={handleAdd} className="bg-green-600 text-white px-6 rounded-xl font-bold">บันทึก</button></div>}
      <div className="bg-white rounded-3xl border overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr className="text-slate-500 font-bold"><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4 text-right">จัดการ</th></tr></thead><tbody className="divide-y">{users.map(user=>(<tr key={user.id}><td className="p-4 font-bold">{user.username}</td><td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black uppercase">{user.role}</span></td><td className="p-4 text-right"><button onClick={async()=>{if(confirm('ลบ?')) await deleteDoc(doc(db,"users",user.id));}} className="text-red-400 p-2"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></div>);
  };

  // 📦 จัดการสินค้า & สต๊อกสินค้า
  const ProductsView = () => (<div className="bg-white p-6 rounded-3xl border"><h2 className="text-xl font-black mb-4">จัดการสินค้า</h2><table className="w-full text-sm"><thead><tr className="bg-slate-50 border-b text-left"><th className="p-4">ชื่อ</th><th className="p-4">ราคา</th><th className="p-4 text-right">สต๊อก</th></tr></thead><tbody className="divide-y">{products.map(p=>(<tr key={p.id}><td className="p-4 font-bold">{p.name}</td><td className="p-4 font-bold text-blue-600">฿{formatMoney(p.price)}</td><td className="p-4 text-right">{p.stock}</td></tr>))}</tbody></table></div>);
  const StockView = () => (<div className="bg-white p-6 rounded-3xl border"><h2 className="text-xl font-black mb-4">สต๊อกสินค้า</h2><table className="w-full text-sm"><thead><tr className="bg-slate-50 border-b text-left"><th className="p-4">ชื่อ</th><th className="p-4 text-center">คงเหลือ</th></tr></thead><tbody className="divide-y">{products.map(p=>(<tr key={p.id}><td className="p-4 font-bold">{p.name}</td><td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold ${p.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.stock}</span></td></tr>))}</tbody></table></div>);

  if (!loggedInUser && !isExecutiveView) return <LoginView />;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-sans">
      <style>{`input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`}</style>
      
      {/* 🚀 Navigation Optimized for iPad/iPhone */}
      <div className="w-full lg:w-64 bg-[#0A142A] text-white flex-shrink-0 z-20 shadow-2xl">
        <div className="p-6 border-b border-white/5"><ResilientLogo className="h-16 w-full" /></div>
        <nav className="p-4 space-y-1 flex lg:flex-col overflow-x-auto scrollbar-hide">
          <button onClick={()=>setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 p-4 rounded-2xl transition-all ${activeTab==='dashboard'?'bg-[#CEA85E] text-white shadow-lg':'text-slate-400 hover:bg-white/5'}`}><LayoutDashboard size={20}/> <span className="text-xs font-bold uppercase tracking-wider">Dashboard</span></button>
          <button onClick={()=>setActiveTab('sales')} className={`w-full flex items-center space-x-3 p-4 rounded-2xl transition-all ${activeTab==='sales'?'bg-[#CEA85E] text-white shadow-lg':'text-slate-400 hover:bg-white/5'}`}><ShoppingCart size={20}/> <span className="text-xs font-bold uppercase tracking-wider">POS</span></button>
          <button onClick={()=>setActiveTab('history')} className={`w-full flex items-center space-x-3 p-4 rounded-2xl transition-all ${activeTab==='history'?'bg-[#CEA85E] text-white shadow-lg':'text-slate-400 hover:bg-white/5'}`}><History size={20}/> <span className="text-xs font-bold uppercase tracking-wider">History</span></button>
          {loggedInUser?.role === 'admin' && <button onClick={()=>setActiveTab('users')} className={`w-full flex items-center space-x-3 p-4 rounded-2xl transition-all ${activeTab==='users'?'bg-[#CEA85E] text-white shadow-lg':'text-slate-400 hover:bg-white/5'}`}><Users size={20}/> <span className="text-xs font-bold uppercase tracking-wider">Users</span></button>}
          <button onClick={()=>setLoggedInUser(null)} className="w-full flex items-center space-x-3 p-4 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all"><LogOut size={20}/> <span className="text-xs font-bold uppercase tracking-wider">Logout</span></button>
        </nav>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md h-16 border-b px-6 flex items-center justify-between z-10"><div className="text-slate-600 font-black text-xs uppercase tracking-widest hidden sm:block">Management System</div><div className="flex items-center space-x-2 text-xs bg-slate-100 py-1.5 px-4 rounded-full border"><User size={12} className="text-blue-600" /><span className="font-bold">{loggedInUser?.username}</span></div></header>
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-24"><div className="max-w-5xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'stock' && <StockView />}
          {activeTab === 'history' && <SalesHistoryView />}
          {activeTab === 'sales' && <SalesView />}
          {activeTab === 'users' && <UsersManagementView />}
        </div></main>
      </div>
    </div>
  );
}