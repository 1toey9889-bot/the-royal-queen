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
import { Scanner } from '@yudiel/react-qr-scanner'; 
import Tesseract from 'tesseract.js';

// ==========================================
// 🎨 Brand & Identity
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
      <text x="105" y="38" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="500" fill="#FFFFFF" letterSpacing="1.5">THE</text>
      <text x="103" y="64" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="800" fill="#CEA85E" letterSpacing="1.5">RESILIENT</text>
      <text x="105" y="84" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="500" fill="#FFFFFF" letterSpacing="2.5">CLINIC</text>
    </svg>
  </div>
);

// ==========================================
// 🔥 Firebase Setup
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
// 🚀 Main Application
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
    return products.reduce((map, product) => { map[product.id] = product; return map; }, {});
  }, [products]);

  useEffect(() => {
    const connectionTimeout = setTimeout(() => {
      if (!isUsersLoaded || isLoading) setLoadError("การเชื่อมต่อฐานข้อมูลล่าช้า...");
    }, 15000);

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) {
        setDoc(doc(db, "users", "admin"), { username: 'admin', password: '123456', role: 'admin', permissions: defaultPermissions });
      } else {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setIsUsersLoaded(true); setLoadError('');
      }
    });

    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeSales = onSnapshot(collection(db, "sales"), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    return () => { clearTimeout(connectionTimeout); unsubscribeUsers(); unsubscribeProducts(); unsubscribeSales(); };
  }, []);

  // --- Helpers ---
  const formatMoney = (val) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(val || 0);
  const getProduct = (id) => productMap[id] || { name: 'สินค้าถูกลบ', cost: 0, price: 0 };
  const getLocalDate = (d) => {
    const date = d ? new Date(d) : new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().split('T')[0];
  };

  const canAccess = (tab) => {
    if (isExecutiveView) return tab === 'dashboard' || tab === 'stock';
    if (!loggedInUser) return false;
    return (loggedInUser.role === 'admin' || tab === 'sales' || !!loggedInUser.permissions?.[tab]);
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // 📈 View: Dashboard
  // ==========================================
  const DashboardView = () => {
    const [timeframe, setTimeframe] = useState('monthly'); 
    const [filterDate, setFilterDate] = useState(getLocalDate());
    const [filterMonth, setFilterMonth] = useState(getLocalDate().substring(0, 7));
    const [filterStore, setFilterStore] = useState('all');

    const filtered = sales.filter(s => {
      const sDate = getLocalDate(s.date);
      const isTime = timeframe === 'daily' ? sDate === filterDate : timeframe === 'monthly' ? sDate.startsWith(filterMonth) : true;
      const isStore = filterStore === 'all' || s.store === filterStore;
      return isTime && isStore;
    });

    let revenue = 0; let cost = 0;
    filtered.forEach(s => {
      const p = getProduct(s.productId);
      revenue += (s.total || 0);
      cost += (s.unitCost || p.cost || 0) * s.quantity;
    });

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-wrap gap-4 items-center justify-between border">
          <div className="flex items-center space-x-3"><div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-md"><BarChart3/></div><h2 className="text-xl font-black">Dashboard</h2></div>
          <div className="flex flex-wrap gap-2">
            <select value={filterStore} onChange={e => setFilterStore(e.target.value)} className="p-2.5 bg-slate-50 border rounded-xl text-sm outline-none">
              <option value="all">ทุกร้านค้า</option>{STORE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="p-2.5 bg-slate-50 border rounded-xl text-sm outline-none"><option value="daily">รายวัน</option><option value="monthly">รายเดือน</option><option value="all">ทั้งหมด</option></select>
            {timeframe === 'daily' && <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="p-2.5 border rounded-xl text-sm outline-none bg-white"/>}
            {timeframe === 'monthly' && <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="p-2.5 border rounded-xl text-sm outline-none bg-white"/>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border shadow-sm"><p className="text-slate-500 font-bold mb-1">ยอดขายรวม</p><p className="text-3xl font-black text-blue-600">฿{formatMoney(revenue)}</p></div>
          <div className="bg-white p-6 rounded-[2rem] border shadow-sm"><p className="text-slate-500 font-bold mb-1">ต้นทุนรวม</p><p className="text-3xl font-black text-orange-600">฿{formatMoney(cost)}</p></div>
          <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm"><p className="text-emerald-600 font-bold mb-1">กำไรสุทธิ</p><p className="text-3xl font-black text-emerald-700">฿{formatMoney(revenue - cost)}</p></div>
        </div>
      </div>
    );
  };

  // ==========================================
  // 🛒 View: บันทึกการขาย (POS)
  // ==========================================
  const SalesView = () => {
    const [selectedStore, setSelectedStore] = useState(STORE_OPTIONS[0]);
    const [orderId, setOrderId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [cart, setCart] = useState([]);
    const [scanMode, setScanMode] = useState(null);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [ocrStatus, setOcrStatus] = useState('');
    const [customTotal, setCustomTotal] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDropOpen, setIsDropOpen] = useState(false);
    const [searchP, setSearchP] = useState('');

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileRef = useRef(null);

    // AI OCR: ระบบสแกนและดึงข้อมูลภาษาไทย
    const runOCR = async (imgData) => {
      setIsOcrLoading(true);
      setOcrStatus('AI กำลังอ่านข้อมูล (ไทย/อังกฤษ)...');
      try {
        const worker = await Tesseract.createWorker('tha+eng');
        const { data: { text } } = await worker.recognize(imgData);
        await worker.terminate();

        // Regex กรองข้อมูลออเดอร์และชื่อ (Refactored)
        const orderIdMatch = text.match(/(?:ORD|260|ID)\s*[:\s]*([A-Z0-9-]{6,})/i);
        const nameMatch = text.match(/(?:ผู้รับ|To|ชื่อ|Name)\s*[:\s]*([\u0E00-\u0E7F A-Za-z.]+)/i);

        if (orderIdMatch) setOrderId(orderIdMatch[1].trim());
        if (nameMatch) setCustomerName(nameMatch[1].trim().replace(/[\n\r]/g, ' '));
        
        setScanMode('text'); // แสดงหน้าตรวจทานข้อมูล
      } catch (err) { alert('OCR Error: กรุณาลองใหม่'); }
      setIsOcrLoading(false);
    };

    const captureImg = () => {
      const cv = canvasRef.current;
      cv.width = videoRef.current.videoWidth;
      cv.height = videoRef.current.videoHeight;
      cv.getContext('2d').drawImage(videoRef.current, 0, 0);
      runOCR(cv.toDataURL('image/jpeg', 0.8));
    };

    const handleFile = (e) => {
      const file = e.target.files[0];
      if (file) {
        const r = new FileReader();
        r.onload = (ev) => runOCR(ev.target.result);
        r.readAsDataURL(file);
      }
    };

    const addToCart = (p) => {
      if (p.stock <= 0) return alert('สินค้าหมด!');
      const exist = cart.find(c => c.productId === p.id);
      if (exist) setCart(cart.map(c => c.productId === p.id ? {...c, quantity: c.quantity + 1} : c));
      else setCart([...cart, { productId: p.id, name: p.name, price: p.price, quantity: 1, stock: p.stock }]);
      setIsDropOpen(false); setSearchP('');
    };

    const subTotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const finalTotal = customTotal !== '' ? Number(customTotal) : subTotal;

    const onSave = async () => {
      if (cart.length === 0) return;
      setIsProcessing(true);
      try {
        await runTransaction(db, async (tx) => {
          for (const item of cart) {
            const pRef = doc(db, "products", item.productId);
            const pSnap = await tx.get(pRef);
            if (pSnap.data().stock < item.quantity) throw new Error(`${item.name} สต๊อกไม่พอ`);
            tx.update(pRef, { stock: increment(-item.quantity) });
            tx.set(doc(collection(db, "sales")), {
              orderId, customerName, store: selectedStore, productId: item.productId,
              quantity: item.quantity, total: (item.price * item.quantity) * (finalTotal / subTotal),
              unitPrice: item.price, unitCost: pSnap.data().cost, date: new Date().toISOString(), soldBy: loggedInUser.username
            });
          }
        });
        setCart([]); setOrderId(''); setCustomerName(''); setCustomTotal('');
        alert('✅ บันทึกยอดขายเรียบร้อย');
      } catch (e) { alert(e.message); }
      setIsProcessing(false);
    };

    return (
      <div className="space-y-6 animate-in fade-in pb-20">
        <h2 className="text-3xl font-black text-center text-slate-800">บันทึกการขาย (POS)</h2>
        
        {/* ✅ ปรับช่องกรอกข้อมูลให้กว้างขึ้น ไม่เบียดกัน */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-3xl border shadow-sm">
             <label className="text-orange-600 font-bold mb-3 flex items-center"><Store size={18} className="mr-2"/> เลือกร้านค้า</label>
             <div className="grid grid-cols-2 gap-2">
                {STORE_OPTIONS.map(s => (
                  <button key={s} onClick={() => setSelectedStore(s)} className={`p-3 rounded-xl text-xs font-black transition-all border-2 ${selectedStore === s ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}>{s}</button>
                ))}
             </div>
          </div>
          <div className="bg-white p-5 rounded-3xl border shadow-sm">
             <label className="text-blue-600 font-bold mb-3 flex items-center"><Barcode size={18} className="mr-2"/> รหัสออเดอร์</label>
             <div className="flex gap-2">
                <input type="text" value={orderId} onChange={e => setOrderId(e.target.value)} className="flex-1 p-3.5 bg-slate-50 border rounded-2xl outline-none font-bold text-lg" placeholder="ORD-XXXXX"/>
                <button onClick={() => setScanMode('camera')} className="p-3.5 bg-slate-800 text-white rounded-2xl shadow-md"><Scan/></button>
             </div>
          </div>
          <div className="bg-white p-5 rounded-3xl border shadow-sm">
             <label className="text-purple-600 font-bold mb-3 flex items-center"><UserCircle size={18} className="mr-2"/> ชื่อลูกค้า (ผู้รับ)</label>
             <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-3.5 bg-slate-50 border rounded-2xl outline-none font-bold text-lg" placeholder="ชื่อ-นามสกุล"/>
          </div>
        </div>

        <div className="flex justify-center">
          <button onClick={() => { setScanMode('camera'); setOcrStatus('เริ่มเปิดกล้อง AI...'); }} className="bg-teal-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-teal-600 transition-all flex items-center"><Camera className="mr-2"/> ดึงข้อมูลด้วย AI</button>
        </div>

        {/* ตะกร้าสินค้า */}
        <div className="relative">
           <div onClick={() => setIsDropOpen(!isDropOpen)} className="w-full p-6 border-4 border-dashed rounded-[2rem] text-center cursor-pointer hover:border-blue-400 text-slate-400 font-bold transition-all"><Search className="inline mr-2"/> คลิกเพื่อเพิ่มสินค้าลงตะกร้า...</div>
           {isDropOpen && (
             <div className="absolute w-full mt-2 bg-white border shadow-2xl rounded-3xl z-50 p-4 max-h-96 overflow-y-auto space-y-2">
                <input autoFocus placeholder="พิมพ์ค้นหาชื่อสินค้า..." className="w-full p-3 border rounded-xl mb-4" value={searchP} onChange={e => setSearchP(e.target.value)}/>
                {products.filter(p => p.name.includes(searchP)).map(p => (
                  <div key={p.id} onClick={() => addToCart(p)} className="p-4 border rounded-2xl flex justify-between hover:bg-blue-50 transition cursor-pointer">
                    <span className="font-bold">{p.name}</span>
                    <span className="text-blue-600 font-black">฿{formatMoney(p.price)} (คงเหลือ {p.stock})</span>
                  </div>
                ))}
             </div>
           )}
        </div>

        {cart.length > 0 && (
          <div className="bg-white rounded-[2rem] border overflow-hidden shadow-lg animate-in slide-in-from-bottom-5">
             <div className="p-5 bg-slate-50 border-b font-black flex items-center"><ShoppingCart className="mr-2"/> รายการสินค้าในตะกร้า</div>
             {cart.map(item => (
               <div key={item.productId} className="p-5 flex justify-between items-center border-b hover:bg-slate-50">
                  <div className="flex-1 font-bold text-lg">{item.name}</div>
                  <div className="flex items-center space-x-6">
                     <div className="flex bg-slate-100 rounded-2xl p-1.5 border">
                        <button onClick={() => setCart(cart.map(c => c.productId === item.productId ? {...c, quantity: Math.max(1, c.quantity-1)} : c))} className="p-2 hover:bg-white rounded-xl"><Minus size={18}/></button>
                        <span className="px-6 py-2 font-black text-xl">{item.quantity}</span>
                        <button onClick={() => setCart(cart.map(c => c.productId === item.productId ? {...c, quantity: c.quantity+1} : c))} className="p-2 hover:bg-white rounded-xl"><Plus size={18}/></button>
                     </div>
                     <span className="font-black text-2xl text-blue-600 min-w-[120px] text-right">฿{formatMoney(item.price * item.quantity)}</span>
                     <button onClick={() => setCart(cart.filter(c => c.productId !== item.productId))} className="text-red-500 hover:scale-110 transition"><Trash2/></button>
                  </div>
               </div>
             ))}
             <div className="p-10 bg-blue-600 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <p className="font-bold text-blue-100 mb-2">ยอดรวมที่ต้องการบันทึก (แก้ไขได้)</p>
                   <div className="flex items-center text-4xl font-black">฿<input type="number" value={customTotal} placeholder={subTotal} onChange={e => setCustomTotal(e.target.value)} className="bg-transparent border-b-4 border-blue-400 outline-none w-48 ml-2 placeholder:text-blue-400"/></div>
                </div>
                <button onClick={onSave} disabled={isProcessing} className="px-12 py-6 bg-white text-blue-600 rounded-3xl text-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all">บันทึกการขาย</button>
             </div>
          </div>
        )}

        {/* OCR / Camera Modal */}
        {scanMode && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-6 flex flex-col max-h-[90vh] shadow-2xl">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-4">
                   <button onClick={() => setScanMode('camera')} className={`flex-1 py-3 rounded-xl font-bold transition ${scanMode === 'camera' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>กล้อง / AI</button>
                   <button onClick={() => setScanMode('text')} className={`flex-1 py-3 rounded-xl font-bold transition ${scanMode === 'text' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>ตรวจข้อมูล</button>
                </div>

                {scanMode === 'camera' && (
                  <div className="space-y-4">
                     <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border-4 border-slate-100">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" onLoadedMetadata={() => videoRef.current.play()}/>
                        <canvas ref={canvasRef} className="hidden"/>
                        {isOcrLoading && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-6 text-center">
                             <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                             <p className="font-black text-lg">{ocrStatus}</p>
                          </div>
                        )}
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <button onClick={captureImg} className="p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg"><Aperture className="inline mr-2"/>ถ่ายภาพสด</button>
                        <button onClick={() => fileRef.current.click()} className="p-4 bg-slate-800 text-white rounded-2xl font-bold shadow-lg"><ImageIcon className="inline mr-2"/>เลือกรูปภาพ</button>
                        <input type="file" ref={fileRef} hidden accept="image/*" onChange={handleFile}/>
                     </div>
                  </div>
                )}

                {scanMode === 'text' && (
                  <div className="flex flex-col space-y-4">
                     <p className="text-center text-slate-500 font-bold">ข้อมูลที่ AI ตรวจพบ (แก้ไขได้ที่นี่)</p>
                     <textarea value={orderId} onChange={e => setOrderId(e.target.value)} className="p-4 border rounded-2xl font-bold" placeholder="รหัสออเดอร์"/>
                     <textarea value={customerName} onChange={e => setCustomerName(e.target.value)} className="p-4 border rounded-2xl font-bold" placeholder="ชื่อลูกค้า"/>
                     <button onClick={() => setScanMode(null)} className="p-4 bg-green-600 text-white rounded-2xl font-black shadow-lg">ยืนยันข้อมูลนี้</button>
                  </div>
                )}

                <button onClick={() => setScanMode(null)} className="mt-4 p-4 text-slate-400 font-bold">ปิดหน้าต่าง</button>
             </div>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // 📦 View: การจัดการสินค้า (Products)
  // ==========================================
  const ProductsView = () => {
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: '', cost: 0, price: 0 });
    const [isAdd, setIsAdd] = useState(false);

    const onAdd = async () => {
      await addDoc(collection(db, "products"), { ...form, stock: 0 });
      setIsAdd(false); setForm({ name: '', cost: 0, price: 0 });
    };

    const onUpdate = async (id) => {
      await updateDoc(doc(db, "products", id), form);
      setEditId(null);
    };

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
           <h2 className="text-2xl font-black">การจัดการสินค้า</h2>
           <button onClick={() => setIsAdd(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg"><Plus className="inline mr-2"/>เพิ่มสินค้าใหม่</button>
        </div>
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                 <tr className="text-slate-500 text-sm"><th className="p-4">ลำดับ</th><th className="p-4">ชื่อสินค้า</th><th className="p-4">ราคาคลินิก</th><th className="p-4">ราคาขาย</th><th className="p-4 text-right">จัดการ</th></tr>
              </thead>
              <tbody className="divide-y">
                 {isAdd && (
                   <tr className="bg-blue-50">
                      <td className="p-4 font-bold text-blue-600">*</td>
                      <td className="p-4"><input className="p-2 border rounded-lg w-full" placeholder="ชื่อสินค้า" onChange={e => setForm({...form, name: e.target.value})}/></td>
                      <td className="p-4"><input type="number" className="p-2 border rounded-lg w-full" placeholder="ต้นทุน" onChange={e => setForm({...form, cost: Number(e.target.value)})}/></td>
                      <td className="p-4"><input type="number" className="p-2 border rounded-lg w-full" placeholder="ราคาขาย" onChange={e => setForm({...form, price: Number(e.target.value)})}/></td>
                      <td className="p-4 text-right"><button onClick={onAdd} className="text-green-600 font-bold mr-3">บันทึก</button><button onClick={() => setIsAdd(false)}>ยกเลิก</button></td>
                   </tr>
                 )}
                 {products.map((p, i) => (
                   <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 text-slate-400 font-bold">{i+1}</td>
                      <td className="p-4 font-bold">{editId === p.id ? <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="p-2 border rounded-lg w-full"/> : p.name}</td>
                      <td className="p-4 text-orange-600 font-bold">{editId === p.id ? <input type="number" value={form.cost} onChange={e => setForm({...form, cost: Number(e.target.value)})} className="p-2 border rounded-lg w-full"/> : `฿${formatMoney(p.cost)}`}</td>
                      <td className="p-4 text-blue-600 font-black">{editId === p.id ? <input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="p-2 border rounded-lg w-full"/> : `฿${formatMoney(p.price)}`}</td>
                      <td className="p-4 text-right space-x-3">
                         {editId === p.id ? (<><button onClick={() => onUpdate(p.id)} className="text-green-600 font-black">ตกลง</button><button onClick={() => setEditId(null)}>ปิด</button></>) : (<><button onClick={() => {setEditId(p.id); setForm(p);}} className="text-blue-500"><Edit2 size={18}/></button><button onClick={async () => {if(confirm('ลบ?')) await deleteDoc(doc(db, "products", p.id));}} className="text-red-400"><Trash2 size={18}/></button></>)}
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
  // 📦 View: สต๊อกสินค้า
  // ==========================================
  const StockView = () => {
    const [editId, setEditId] = useState(null);
    const [newQty, setNewQty] = useState(0);

    const onUpdate = async (id) => {
      await updateDoc(doc(db, "products", id), { stock: Number(newQty) });
      setEditId(null);
    };

    return (
      <div className="space-y-6 animate-in fade-in">
        <h2 className="text-2xl font-black bg-white p-6 rounded-3xl border shadow-sm flex items-center"><Boxes className="mr-3 text-blue-600"/> สต๊อกสินค้า</h2>
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                 <tr className="text-slate-500 text-sm"><th className="p-4">ชื่อสินค้า</th><th className="p-4 text-center">คงเหลือ</th><th className="p-4 text-right">จัดการ</th></tr>
              </thead>
              <tbody className="divide-y">
                 {products.map(p => (
                   <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold">{p.name}</td>
                      <td className="p-4 text-center">
                         {editId === p.id ? <input type="number" value={newQty} onChange={e => setNewQty(e.target.value)} className="w-24 p-2 border rounded-xl text-center font-black"/> : <span className={`px-4 py-1.5 rounded-full font-black text-sm ${p.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>{p.stock} ชิ้น</span>}
                      </td>
                      <td className="p-4 text-right">
                         {editId === p.id ? <button onClick={() => onUpdate(p.id)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg">บันทึกตัวเลข</button> : <button onClick={() => {setEditId(p.id); setNewQty(p.stock);}} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition"><Edit2 size={18}/></button>}
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
  // 📜 View: ประวัติการขาย (History)
  // ==========================================
  const SalesHistoryView = () => {
    const [date, setDate] = useState(getLocalDate());
    const filtered = sales.filter(s => getLocalDate(s.date) === date).sort((a,b) => new Date(b.date) - new Date(a.date));

    const onDel = async (s) => {
      if (!confirm('ยืนยันลบออเดอร์ (สต๊อกจะถูกคืนอัตโนมัติ)?')) return;
      await runTransaction(db, async (tx) => {
        const pRef = doc(db, "products", s.productId);
        const pS = await tx.get(pRef);
        if (pS.exists()) tx.update(pRef, { stock: increment(s.quantity) });
        tx.delete(doc(db, "sales", s.id));
      });
    };

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-wrap gap-4 items-center justify-between">
           <h2 className="text-xl font-black flex items-center"><History className="mr-2 text-blue-600"/> ประวัติการขาย</h2>
           <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2.5 bg-slate-50 border rounded-xl outline-none font-bold"/>
        </div>
        <div className="bg-white rounded-3xl border shadow-sm overflow-x-auto">
           <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50 border-b">
                 <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">เวลา</th><th className="p-4">ออเดอร์/ลูกค้า</th><th className="p-4">ร้านค้า</th><th className="p-4">สินค้า</th><th className="p-4 text-center">จำนวน</th><th className="p-4 text-right">ยอดรวม</th><th className="p-4 text-right">จัดการ</th>
                 </tr>
              </thead>
              <tbody className="divide-y text-sm">
                 {filtered.map(s => (
                   <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 text-slate-400">{new Date(s.date).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})}</td>
                      <td className="p-4"><div><p className="font-black text-slate-700">{s.orderId || '-'}</p><p className="text-xs text-slate-400">{s.customerName || '-'}</p></div></td>
                      <td className="p-4"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${s.store?.includes('Shopee') ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{s.store}</span></td>
                      <td className="p-4 font-bold">{getProduct(s.productId).name}</td>
                      <td className="p-4 text-center font-black">{s.quantity}</td>
                      <td className="p-4 text-right font-black text-blue-600">฿{formatMoney(s.total)}</td>
                      <td className="p-4 text-right"><button onClick={() => onDel(s)} className="text-red-300 hover:text-red-500 transition"><Trash2 size={18}/></button></td>
                   </tr>
                 ))}
                 {filtered.length === 0 && <tr><td colSpan="7" className="p-20 text-center text-slate-300 font-bold">ไม่มีรายการขายในวันที่เลือก</td></tr>}
              </tbody>
           </table>
        </div>
      </div>
    );
  };

  // ==========================================
  // 👥 View: การจัดการผู้ใช้ (Users)
  // ==========================================
  const UsersManagementView = () => {
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ username: '', password: '', role: 'staff', permissions: defaultPermissions });
    const [isAdd, setIsAdd] = useState(false);

    const onAdd = async () => {
      if (!form.username || !form.password) return alert('กรุณาใส่รหัสผ่าน');
      await addDoc(collection(db, "users"), form);
      setIsAdd(false);
    };

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
           <h2 className="text-2xl font-black">การจัดการผู้ใช้</h2>
           <button onClick={() => setIsAdd(true)} className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg">เพิ่มผู้ใช้งาน</button>
        </div>
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-slate-50 border-b"><tr className="text-slate-500 text-sm"><th className="p-4">Username</th><th className="p-4">Role</th><th className="p-4">รหัสผ่าน</th><th className="p-4 text-right">จัดการ</th></tr></thead>
              <tbody className="divide-y">
                 {isAdd && (
                   <tr className="bg-blue-50">
                      <td className="p-4"><input className="p-2 border rounded-lg w-full" placeholder="ชื่อ" onChange={e => setForm({...form, username: e.target.value})}/></td>
                      <td className="p-4"><select className="p-2 border rounded-lg w-full" onChange={e => setForm({...form, role: e.target.value})}><option value="staff">Staff</option><option value="admin">Admin</option></select></td>
                      <td className="p-4"><input className="p-2 border rounded-lg w-full" placeholder="รหัสผ่าน" onChange={e => setForm({...form, password: e.target.value})}/></td>
                      <td className="p-4 text-right"><button onClick={onAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg">ตกลง</button></td>
                   </tr>
                 )}
                 {users.map(u => (
                   <tr key={u.id}>
                      <td className="p-4 font-black">{u.username}</td>
                      <td className="p-4"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>{u.role}</span></td>
                      <td className="p-4 text-slate-300">••••••</td>
                      <td className="p-4 text-right">
                         <button onClick={async () => {if(confirm('ลบ?')) await deleteDoc(doc(db, "users", u.id));}} className="text-red-300 hover:text-red-500"><Trash2 size={18}/></button>
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
  // 🎨 Main Layout & Navigation
  // ==========================================
  const LoginView = () => {
    const [u, setU] = useState(''); const [p, setP] = useState('');
    const doLogin = (e) => {
      e.preventDefault();
      const found = users.find(user => user.username === u && user.password === p);
      if (found) setLoggedInUser(found); else alert('รหัสผ่านไม่ถูกต้อง');
    };
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 space-y-8 border">
          <ResilientLogo className="h-24 w-full rounded-2xl shadow-lg"/>
          <form onSubmit={doLogin} className="space-y-4">
            <input type="text" placeholder="Username" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" onChange={e => setU(e.target.value)}/>
            <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" onChange={e => setP(e.target.value)}/>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl">เข้าสู่ระบบ</button>
          </form>
        </div>
      </div>
    );
  };

  if (!isUsersLoaded || isLoading) return <div className="h-screen flex flex-col items-center justify-center bg-slate-50 font-black text-blue-600 animate-pulse"><ResilientLogo className="h-20 w-64 mb-4 rounded-xl"/> กำลังเตรียมระบบ...</div>;
  if (!loggedInUser && !isExecutiveView) return <LoginView />;

  const NavItem = ({ tab, icon: Icon, label }) => {
    if (!canAccess(tab)) return null;
    return (
      <button onClick={() => setActiveTab(tab)} className={`flex items-center space-x-3 w-full p-4 rounded-2xl transition-all duration-300 ${activeTab === tab ? 'bg-blue-600 text-white font-black shadow-xl shadow-blue-500/30 scale-105' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600 font-bold'}`}>
        <Icon size={22}/> <span className="hidden md:block">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans overflow-hidden">
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 z-10 flex flex-col shadow-2xl">
        <div className="p-6 border-b"><ResilientLogo className="h-16 w-full rounded-2xl shadow-sm"/></div>
        <nav className="flex-1 p-4 space-y-2 overflow-x-auto md:overflow-y-auto flex md:flex-col items-center md:items-stretch scrollbar-hide">
          <NavItem tab="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem tab="products" icon={Package} label="การจัดการสินค้า" />
          <NavItem tab="stock" icon={Boxes} label="สต๊อกสินค้า" />
          <NavItem tab="users" icon={Users} label="การจัดการผู้ใช้" />
          <NavItem tab="history" icon={History} label="ประวัติการขาย" />
          <NavItem tab="sales" icon={ShoppingCart} label="บันทึกการขาย (POS)" />
        </nav>
        {!isExecutiveView && (
          <div className="p-6 border-t bg-slate-50/50">
             <div className="flex items-center space-x-3 mb-4 p-3 bg-white rounded-2xl border shadow-sm">
                <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><UserCircle size={20}/></div>
                <div><p className="text-xs text-slate-400 font-bold">User Online</p><p className="font-black text-slate-700">{loggedInUser?.username}</p></div>
             </div>
             <button onClick={() => setLoggedInUser(null)} className="w-full p-4 text-red-500 font-black hover:bg-red-50 rounded-2xl transition-all flex items-center justify-center border-2 border-transparent hover:border-red-100"><LogOut className="mr-2"/> ออกจากระบบ</button>
          </div>
        )}
      </aside>

      <main className="flex-1 h-screen overflow-y-auto p-4 md:p-10 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 blur-[100px] -z-10 rounded-full"></div>
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'stock' && <StockView />}
          {activeTab === 'users' && <UsersManagementView />}
          {activeTab === 'history' && <SalesHistoryView />}
          {activeTab === 'sales' && <SalesView />}
        </div>
      </main>
    </div>
  );
}