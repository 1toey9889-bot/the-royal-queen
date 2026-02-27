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
// 🎨 โลโก้ The Resilient Clinic
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
  const [orders, setOrders] = useState([]); 
  const [users, setUsers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  const productMap = useMemo(() => {
    return products.reduce((map, product) => { map[product.id] = product; return map; }, {});
  }, [products]);

  useEffect(() => {
    const connectionTimeout = setTimeout(() => { if (!isUsersLoaded || isLoading) setLoadError("การเชื่อมต่อใช้เวลานานผิดปกติ..."); }, 10000);

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) setDoc(doc(db, "users", "default_admin"), { username: 'admin', password: '123456', role: 'admin', permissions: defaultPermissions });
      else { setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setIsUsersLoaded(true); setLoadError(''); }
    });

    onSnapshot(collection(db, "products"), (snapshot) => { setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
    onSnapshot(collection(db, "orders"), (snapshot) => { setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setIsLoading(false); });

    return () => { clearTimeout(connectionTimeout); unsubscribeUsers(); };
  }, [isLoading, isUsersLoaded]);

  useEffect(() => {
    if (loggedInUser) {
      const updatedUser = users.find(u => u.id === loggedInUser.id);
      if (updatedUser) { setLoggedInUser(updatedUser); if (activeTab !== 'sales' && updatedUser.role !== 'admin' && !updatedUser.permissions?.[activeTab]) setActiveTab('sales'); }
    }
  }, [users, loggedInUser, activeTab]);

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
    link.click();
    setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 1000);
  };

  // ✅ [NEW] 4. ฟังก์ชัน Merge Orders (เตรียมไว้ให้เรียกใช้)
  const mergeOrders = async (id1, id2) => {
    try {
      await runTransaction(db, async (t) => {
        const o1Ref = doc(db,"orders",id1);
        const o2Ref = doc(db,"orders",id2);
        const o1 = await t.get(o1Ref);
        const o2 = await t.get(o2Ref);

        if (!o1.exists() || !o2.exists()) throw new Error("ไม่พบ order ที่ต้องการรวม");

        const mergedItems = [...o1.data().items, ...o2.data().items];
        const totalAmount = o1.data().totalAmount + o2.data().totalAmount;
        const totalProfit = o1.data().totalProfit + o2.data().totalProfit;

        const newOrderRef = doc(collection(db,"orders"));
        t.set(newOrderRef, {
          store: o1.data().store, // ยึดร้านแรกเป็นหลัก
          status: "completed",
          items: mergedItems,
          totalAmount,
          totalProfit,
          mergedFrom: [id1, id2],
          createdAt: new Date().toISOString(),
          soldBy: loggedInUser.username
        });

        // ลบออเดอร์เก่า
        t.delete(o1Ref);
        t.delete(o2Ref);
        
        // Audit log สำหรับการ Merge
        const auditRef = doc(collection(db, "audit_logs"));
        t.set(auditRef, { action: "MERGE_ORDERS", oldOrders: [id1, id2], newOrderId: newOrderRef.id, user: loggedInUser.username, timestamp: new Date().toISOString() });
      });
      alert('รวมบิลสำเร็จ!');
    } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
  };

  // ==========================================
  // 🖥️ 5. Views
  // ==========================================

  const LoginView = () => {
    const [u, setU] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState('');
    const handleLogin = (e) => { e.preventDefault(); const user = users.find(x => x.username === u && x.password === p); if (user) setLoggedInUser(user); else setErr('ข้อมูลไม่ถูกต้อง'); };
    return (<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans"><div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-8 space-y-8"><div className="text-center space-y-4"><ResilientLogo className="mx-auto h-24 rounded-2xl shadow-lg mb-4" /><p className="text-sm text-gray-500 font-medium text-center">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p></div><form onSubmit={handleLogin} className="space-y-6">{err && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs text-center font-bold">{err}</div>}<div className="space-y-5"><div><label className="block text-xs font-bold text-gray-500 mb-1 ml-1">USERNAME</label><input type="text" onChange={e => setU(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required /></div><div><label className="block text-xs font-bold text-gray-500 mb-1 ml-1">PASSWORD</label><input type="password" onChange={e => setP(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required /></div></div><button className="w-full py-4 bg-[#0A142A] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20">เข้าสู่ระบบ</button></form></div></div>);
  };

  // 📊 Dashboard
  const DashboardView = () => {
    const [filterStore, setFilterStore] = useState('all');
    const [filterDate, setFilterDate] = useState(getLocalISODate()); // ✅ [NEW] เพิ่ม filterDate

    const filtered = useMemo(() => orders.filter(o => 
      (filterStore === 'all' || o.store === filterStore) &&
      getLocalISODate(o.createdAt) === filterDate // ✅ [NEW] เช็ควันที่ด้วย
    ), [orders, filterStore, filterDate]);

    const totalRev = filtered.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
    const totalProf = filtered.reduce((s, o) => s + (Number(o.totalProfit) || 0), 0);

    const exportToExcel = () => {
      const rows = [['เลขที่ออเดอร์', 'วันที่', 'ร้านค้า', 'ยอดขาย', 'กำไร']];
      filtered.forEach(o => rows.push([`"${o.id}"`, getLocalISODate(o.createdAt), o.store, o.totalAmount, o.totalProfit]));
      downloadMobileSafeCSV(rows.map(r => r.join(',')).join('\n'), `Sales_Summary_${filterDate}.csv`);
    };

    return (<div className="space-y-6 animate-in fade-in"><div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm"><div className="flex items-center space-x-3"><div className="bg-blue-600 p-2 rounded-lg text-white"><BarChart3 size={20}/></div><h2 className="text-xl font-black">สรุปยอดขาย</h2></div><div className="flex flex-wrap gap-2">
      <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="border rounded-xl px-2 py-1.5 text-xs font-bold bg-slate-50 outline-none" /> {/* ✅ [NEW] Input วันที่ */}
      <select value={filterStore} onChange={e=>setFilterStore(e.target.value)} className="border rounded-xl px-2 py-1.5 text-xs font-bold bg-slate-50"><option value="all">ทุกร้านค้า</option>{STORE_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}</select>{canExportTab('dashboard') && <button onClick={exportToExcel} className="bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"><Download size={14}/> Excel</button>}</div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="bg-white p-6 rounded-3xl border-l-8 border-blue-500 shadow-sm"><h3 className="text-xs font-bold text-slate-400 mb-1">ยอดขายรวม</h3><p className="text-3xl font-black text-slate-800">฿{formatMoney(totalRev)}</p></div><div className="bg-white p-6 rounded-3xl border-l-8 border-emerald-500 shadow-sm"><h3 className="text-xs font-bold text-slate-400 mb-1">กำไรสุทธิ</h3><p className="text-3xl font-black text-emerald-600">฿{formatMoney(totalProf)}</p></div></div></div>);
  };

  // 🛒 POS 🚀
  const SalesView = () => {
    const [orderId, setOrderId] = useState(''); const [store, setStore] = useState(STORE_OPTIONS[0]);
    const [pid, setPid] = useState(''); const [price, setPrice] = useState(''); const [qty, setQty] = useState(1);
    const [cart, setCart] = useState([]); const [scanning, setScanning] = useState(false); const [processing, setProcessing] = useState(false);

    useEffect(() => {
      let scanner = null; if (scanning) { setTimeout(() => { scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
      scanner.render((txt) => { const p = productMap[txt]; if (p) { setPid(txt); setPrice(p.price); setScanning(false); scanner.clear(); } else { setOrderId(txt); setScanning(false); scanner.clear(); } }); }, 100); }
      return () => { if (scanner) scanner.clear().catch(() => null); };
    }, [scanning]);

    const handleAddToCart = (e) => { e.preventDefault(); if(!pid) return; const p = getProduct(pid); setCart([...cart, { id: Date.now(), pid, name: p.name, qty, price: Number(price), cost: Number(p.cost), total: Number(price) * qty }]); setPid(''); setQty(1); };
    
    // ✅ [NEW] แก้ไขระบบ Checkout ครบถ้วนตาม Requirement
    const confirmOrder = async () => {
      const finalOrderId = orderId.trim(); // 9. Trim Whitespace
      if(!finalOrderId || cart.length === 0) return alert('กรุณาใส่เลขบิลและเลือกสินค้า');
      
      setProcessing(true);
      try {
        await runTransaction(db, async (t) => {
          const oRef = doc(db, "orders", finalOrderId); 
          if((await t.get(oRef)).exists()) throw new Error("เลขบิลซ้ำ");
          
          // 2. Real-time Stock Check 
          for (const i of cart) {
            const productRef = doc(db, "products", i.pid);
            const productDoc = await t.get(productRef);
            if (!productDoc.exists()) throw new Error(`ไม่พบสินค้า ${i.name}`);
            
            const currentStock = Number(productDoc.data().stock) || 0;
            if (currentStock < i.qty) throw new Error(`สต๊อก ${i.name} ไม่พอ (เหลือ ${currentStock})`);
            
            t.update(productRef, { stock: currentStock - i.qty });
          }

          const totalAmount = cart.reduce((s,i)=>s+i.total,0);
          const totalProfit = cart.reduce((s,i)=>s+(i.total-(i.cost*i.qty)),0);

          // 1. Audit Log สร้างบิล
          const auditRef = doc(collection(db, "audit_logs"));
          t.set(auditRef, { action: "CREATE_ORDER", orderId: finalOrderId, totalAmount: totalAmount, user: loggedInUser.username, timestamp: new Date().toISOString() });

          // 8. Order Status "completed"
          t.set(oRef, { store, status: "completed", totalAmount, totalProfit, createdAt: new Date().toISOString(), soldBy: loggedInUser.username, items: cart });

          // 6. Daily Summary Cache
          const todayStr = getLocalISODate();
          const summaryRef = doc(db,"daily_summary", todayStr);
          t.set(summaryRef, { totalRevenue: increment(totalAmount), totalProfit: increment(totalProfit), totalOrders: increment(1), totalItems: increment(cart.reduce((s,i)=>s+i.qty,0)) }, { merge: true });
        });

        setCart([]); setOrderId(''); alert('บันทึกสำเร็จ!');
      } catch (err) { alert(err.message); }
      setProcessing(false);
    };

    return (
      <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in"><div className="flex-1 bg-white rounded-[2rem] shadow-xl p-6 md:p-8 border border-slate-100"><h2 className="text-2xl font-black mb-6 text-slate-800">บันทึกการขาย (POS)</h2>
          {scanning && <div className="mb-6 rounded-2xl overflow-hidden bg-black aspect-video"><div id="qr-reader"></div></div>}
          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 mb-6 space-y-4">
            <div className="flex items-center justify-between font-bold text-blue-800 text-xs uppercase tracking-wider"><span>หมายเลขบิล (ระบุเองหรือสแกน) *</span><button onClick={()=>setScanning(true)} className="p-2 bg-white rounded-lg shadow-sm border"><QrCode size={16}/></button></div>
            <input type="text" value={orderId} onChange={e=>setOrderId(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-blue-200 text-center font-black outline-none focus:border-blue-500" placeholder="เลขบิลพัสดุ / ID" />
          </div>
          <form onSubmit={handleAddToCart} className="space-y-4">
            <div className="flex justify-between font-bold text-xs text-slate-500 px-1"><span>สินค้า</span><button type="button" onClick={()=>setScanning(true)} className="text-blue-600"><QrCode size={14}/></button></div>
            <select value={pid} onChange={e=>{const p=getProduct(e.target.value); setPid(e.target.value); setPrice(p?.price||'');}} className="w-full p-4 rounded-2xl bg-slate-50 border-0 shadow-inner font-bold text-slate-700 outline-none"><option value="">-- เลือกสินค้า --</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} (คงเหลือ {p.stock})</option>)}</select>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center"><label className="text-[10px] font-bold text-slate-400">ราคา/ชิ้น</label><input type="number" value={price} onChange={e=>setPrice(e.target.value)} className="w-full p-3 border rounded-xl text-center font-bold" /></div>
              <div className="text-center"><label className="text-[10px] font-bold text-slate-400">จำนวน</label><input type="number" value={qty} onChange={e=>setQty(Math.max(1,parseInt(e.target.value)||1))} className="w-full p-3 border rounded-xl text-center font-bold" /></div>
            </div>
            <button disabled={!pid} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 disabled:opacity-50">+ เพิ่มลงบิล</button>
          </form></div>
        <div className="w-full lg:w-[350px] bg-white rounded-[2rem] shadow-xl p-6 border flex flex-col min-h-[500px]"><h3 className="font-black text-slate-800 border-b pb-4 mb-4 flex items-center gap-2"><ShoppingBag size={18} className="text-blue-600"/> รายการบิลนี้</h3>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-2 scrollbar-hide">
            {cart.map(i=>(<div key={i.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border"><div className="text-xs"><b>{i.name}</b><br/>{i.qty} x ฿{formatMoney(i.price)}</div><button onClick={()=>setCart(cart.filter(x=>x.id!==i.id))} className="text-red-400 p-1"><MinusCircle size={20}/></button></div>))}
            {cart.length===0 && <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10"><ShoppingCart size={40} className="mb-2 opacity-20"/><p className="text-xs font-bold">ตะกร้าว่างเปล่า</p></div>}
          </div>
          <div className="pt-4 border-t mt-4"><div className="flex justify-between items-end mb-6"><div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Amount</p><p className="text-3xl font-black text-blue-600">฿{formatMoney(cart.reduce((s,i)=>s+i.total,0))}</p></div></div><button onClick={confirmOrder} disabled={processing || cart.length===0 || !orderId.trim()} className="w-full py-5 bg-green-500 text-white rounded-[1.5rem] font-black shadow-lg shadow-green-100 disabled:opacity-50">ยืนยัน (CHECKOUT)</button></div>
        </div></div>
    );
  };

  // 🕒 ประวัติการขาย (Orders Only)
  const SalesHistoryView = () => {
    const [filterDate, setFilterDate] = useState(getLocalISODate());
    const filtered = useMemo(() => orders.filter(o => getLocalISODate(o.createdAt) === filterDate).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)), [orders, filterDate]);
    const exportExcel = () => { const rows = [['เลขบิล','ยอดรวม','คนขาย']]; filtered.forEach(o=>rows.push([o.id, o.totalAmount, o.soldBy])); downloadMobileSafeCSV(rows.map(r=>r.join(',')).join('\n'), `Orders_${filterDate}.csv`); };
    
    // ✅ [NEW] 3. ลบออเดอร์แล้วคืน Stock ผ่าน Transaction + Audit
    const handleDeleteOrder = async (orderId) => {
      if(!confirm('ลบออเดอร์และคืนสต๊อก?')) return;
      try {
        await runTransaction(db, async (t) => {
          const orderRef = doc(db,"orders", orderId);
          const orderDoc = await t.get(orderRef);
          if (!orderDoc.exists()) throw new Error("ไม่พบออเดอร์");

          const items = orderDoc.data().items || [];
          for (const item of items) {
            const productRef = doc(db,"products",item.pid);
            const productDoc = await t.get(productRef);
            if (productDoc.exists()) {
              const currentStock = Number(productDoc.data().stock) || 0;
              t.update(productRef, { stock: currentStock + item.qty });
            }
          }
          t.delete(orderRef);

          const auditRef = doc(collection(db,"audit_logs"));
          t.set(auditRef, { action: "DELETE_ORDER", orderId: orderId, user: loggedInUser.username, timestamp: new Date().toISOString() });
        });
        alert('ลบข้อมูลและคืนสต๊อกสำเร็จ');
      } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
    };

    return (<div className="space-y-6 animate-in fade-in"><div className="bg-white p-6 rounded-3xl border shadow-sm flex justify-between items-center"><h2 className="text-xl font-black">ประวัติการขาย</h2><div className="flex gap-2"><input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="p-2 border rounded-xl text-blue-600 font-bold text-xs outline-none shadow-sm" />{canExportTab('history') && <button onClick={exportExcel} className="p-2 bg-green-600 text-white rounded-xl"><Download size={16}/></button>}</div></div><div className="bg-white rounded-3xl border shadow-sm overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr className="text-slate-400 font-bold"><th className="p-4">บิล</th><th className="p-4">สถานะ</th><th className="p-4">รายการ</th><th className="p-4 text-right">ยอดรวม</th><th className="p-4 text-right">จัดการ</th></tr></thead><tbody className="divide-y">{filtered.map(o=>(<tr key={o.id} className="hover:bg-slate-50/50"><td className="p-4 font-mono font-bold text-blue-600">{o.id}</td><td className="p-4 text-xs font-bold text-green-600 uppercase">{o.status || 'N/A'}</td><td className="p-4 text-[11px] text-slate-500">{o.items?.length} รายการ</td><td className="p-4 text-right font-black">฿{formatMoney(o.totalAmount)}</td><td className="p-4 text-right">{canEditTab('history') && <button onClick={()=>handleDeleteOrder(o.id)} className="text-red-400 p-2"><Trash2 size={16}/></button>}</td></tr>))}</tbody></table></div></div>);
  };

  // 📦 จัดการสินค้า & สต๊อกสินค้า
  const ProductsView = () => (<div className="space-y-6 animate-in fade-in"><div className="bg-white p-6 rounded-3xl border shadow-sm flex justify-between items-center"><h2 className="text-xl font-black">จัดการสินค้า</h2>{canExportTab('products') && <button onClick={()=>{const rows=[['ชื่อ','ราคา']]; products.forEach(p=>rows.push([p.name, p.price])); downloadMobileSafeCSV(rows.map(r=>r.join(',')).join('\n'), 'Products.csv');}} className="bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"><Download size={14}/> Excel</button>}</div><div className="bg-white rounded-3xl border overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="bg-slate-50 border-b font-bold text-slate-400"><th className="p-4">ชื่อสินค้า</th><th className="p-4">ราคา</th><th className="p-4 text-right">สต๊อก</th></tr></thead><tbody className="divide-y">{products.map(p=>(<tr key={p.id}><td className="p-4 font-bold">{p.name}</td><td className="p-4 font-black text-blue-600">฿{formatMoney(p.price)}</td><td className="p-4 text-right font-bold text-slate-500">{p.stock}</td></tr>))}</tbody></table></div></div>);
  const StockView = () => (<div className="space-y-6 animate-in fade-in"><div className="bg-white p-6 rounded-3xl border shadow-sm flex justify-between items-center"><h2 className="text-xl font-black">สต๊อกสินค้า</h2>{canExportTab('stock') && <button onClick={()=>{const rows=[['ชื่อ','คงเหลือ']]; products.forEach(p=>rows.push([p.name, p.stock])); downloadMobileSafeCSV(rows.map(r=>r.join(',')).join('\n'), 'Stock.csv');}} className="bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"><Download size={14}/> Excel</button>}</div><div className="bg-white rounded-3xl border overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="bg-slate-50 border-b font-bold text-slate-400"><th className="p-4">ชื่อสินค้า</th><th className="p-4 text-center">คงเหลือ</th></tr></thead><tbody className="divide-y">{products.map(p=>(<tr key={p.id}><td className="p-4 font-bold">{p.name}</td><td className="p-4 text-center"><span className={`px-4 py-1.5 rounded-full text-xs font-bold ${p.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.stock} ชิ้น</span></td></tr>))}</tbody></table></div></div>);

  // 👥 จัดการผู้ใช้
  const UsersManagementView = () => {
    const [isAdding, setIsAdding] = useState(false); const [u, setU] = useState(''); const [p, setP] = useState(''); const [r, setR] = useState('staff');
    const handleAdd = async () => { if(!u || !p) return; await addDoc(collection(db,"users"), { username: u, password: p, role: r, permissions: defaultPermissions }); setIsAdding(false); setU(''); setP(''); };
    return (<div className="space-y-6 animate-in fade-in"><div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm"><h2 className="text-xl font-black">จัดการผู้ใช้งาน</h2><button onClick={()=>setIsAdding(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs">+ เพิ่มพนักงาน</button></div>{isAdding && <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-wrap gap-4 animate-in slide-in-from-top-2"><input placeholder="User" value={u} onChange={e=>setU(e.target.value)} className="p-3 rounded-xl border flex-1 outline-none focus:ring-2 focus:ring-blue-400" /><input placeholder="Pass" value={p} onChange={e=>setP(e.target.value)} className="p-3 rounded-xl border flex-1 outline-none focus:ring-2 focus:ring-blue-400" /><select value={r} onChange={e=>setR(e.target.value)} className="p-3 rounded-xl border font-bold"><option value="staff">Staff</option><option value="admin">Admin</option></select><button onClick={handleAdd} className="bg-green-600 text-white px-8 rounded-xl font-bold">บันทึก</button></div>}<div className="bg-white rounded-3xl border shadow-sm overflow-hidden overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 border-b font-bold text-slate-400"><tr className="uppercase"> <th className="p-4">User</th> <th className="p-4">Role</th> <th className="p-4 text-right">จัดการ</th> </tr></thead><tbody className="divide-y">{users.map(user=>(<tr key={user.id} className="hover:bg-slate-50/50"><td className="p-4 font-bold text-slate-700">{user.username}</td><td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-500">{user.role}</span></td><td className="p-4 text-right"><button onClick={async()=>{if(confirm('ลบ?')) await deleteDoc(doc(db,"users",user.id));}} className="text-red-400 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></div>);
  };

  if (!loggedInUser && !isExecutiveView) return <LoginView />;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-sans uppercase-tracking">
      <style>{`input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`}</style>
      <div className="w-full lg:w-64 bg-[#0A142A] text-white flex-shrink-0 z-20 shadow-2xl relative">
        <div className="p-6 flex items-center justify-center border-b border-white/5"><ResilientLogo className="h-16 w-full" /></div>
        <nav className="p-4 space-y-1 flex lg:flex-col overflow-x-auto scrollbar-hide snap-x">
          <button onClick={()=>setActiveTab('dashboard')} className={`snap-start w-full flex items-center space-x-3 p-4 rounded-2xl transition-all flex-shrink-0 ${activeTab==='dashboard'?'bg-[#CEA85E] text-white shadow-lg':'text-slate-400 hover:bg-white/5'}`}><LayoutDashboard size={20}/><span className="text-[10px] font-black tracking-widest">DASHBOARD</span></button>
          <button onClick={()=>setActiveTab('sales')} className={`snap-start w-full flex items-center space-x-3 p-4 rounded-2xl transition-all flex-shrink-0 ${activeTab==='sales'?'bg-[#CEA85E] text-white shadow-lg':'text-slate-400 hover:bg-white/5'}`}><ShoppingCart size={20}/><span className="text-[10px] font-black tracking-widest">POS</span></button>
          <button onClick={()=>setActiveTab('history')} className={`snap-start w-full flex items-center space-x-3 p-4 rounded-2xl transition-all flex-shrink-0 ${activeTab==='history'?'bg-[#CEA85E] text-white shadow-lg':'text-slate-400 hover:bg-white/5'}`}><History size={20}/><span className="text-[10px] font-black tracking-widest">HISTORY</span></button>
          {canAccess('products') && <button onClick={()=>setActiveTab('products')} className={`snap-start w-full flex items-center space-x-3 p-4 rounded-2xl transition-all flex-shrink-0 ${activeTab==='products'?'bg-[#CEA85E] text-white shadow-lg':'text-slate-400 hover:bg-white/5'}`}><Package size={20}/><span className="text-[10px] font-black tracking-widest">PRODUCTS</span></button>}
          {canAccess('stock') && <button onClick={()=>setActiveTab('stock')} className={`snap-start w-full flex items-center space-x-3 p-4 rounded-2xl transition-all flex-shrink-0 ${activeTab==='stock'?'bg-[#CEA85E] text-white shadow-lg':'text-slate-400 hover:bg-white/5'}`}><Boxes size={20}/><span className="text-[10px] font-black tracking-widest">STOCK</span></button>}
          {loggedInUser?.role === 'admin' && <button onClick={()=>setActiveTab('users')} className={`snap-start w-full flex items-center space-x-3 p-4 rounded-2xl transition-all flex-shrink-0 ${activeTab==='users'?'bg-[#CEA85E] text-white shadow-lg':'text-slate-400 hover:bg-white/5'}`}><Users size={20}/><span className="text-[10px] font-black tracking-widest">USERS</span></button>}
          <button onClick={()=>setLoggedInUser(null)} className="snap-start w-full flex items-center space-x-3 p-4 rounded-2xl text-red-400 hover:bg-red-400/10 flex-shrink-0"><LogOut size={20}/><span className="text-[10px] font-black tracking-widest">LOGOUT</span></button>
        </nav>
      </div>
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md h-16 border-b px-6 flex items-center justify-between z-10 shadow-sm"><div className="text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase hidden sm:block">Management System</div><div className="flex items-center space-x-2 text-xs bg-slate-100 py-1.5 px-4 rounded-full border border-slate-200"><User size={12} className="text-blue-600" /><span className="font-black text-slate-700">{loggedInUser?.username}</span></div></header>
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-24"><div className="max-w-5xl mx-auto">
          {activeTab === 'dashboard' && canAccess('dashboard') && <DashboardView />}
          {activeTab === 'products' && canAccess('products') && <ProductsView />}
          {activeTab === 'stock' && canAccess('stock') && <StockView />}
          {activeTab === 'history' && canAccess('history') && <SalesHistoryView />}
          {activeTab === 'sales' && canAccess('sales') && <SalesView />}
          {activeTab === 'users' && loggedInUser?.role === 'admin' && <UsersManagementView />}
        </div></main>
      </div>
    </div>
  );
}