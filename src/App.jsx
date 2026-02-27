// ==========================================
// 🚀 THE RESILIENT POS - ENTERPRISE EDITION (READY-TO-USE)
// ==========================================

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, doc, 
  runTransaction, increment, setDoc, deleteDoc 
} from "firebase/firestore";
import { 
  LayoutDashboard, Package, ShoppingCart, Trash2, 
  QrCode, ShoppingBag, History, LogOut, User, BarChart3, Boxes
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// ==========================================
// 🔥 1. CONFIG & INITIALIZATION
// ==========================================
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const STORE_OPTIONS = ['Shopee(Re)', 'Shopee(Long)', 'Lazada(Re)', 'Lazada(Long)', 'Walk-in'];

// ==========================================
// 🧠 2. HELPERS
// ==========================================
const formatMoney = (n) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n || 0);

const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

// ==========================================
// 🚀 3. MAIN COMPONENT
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('sales');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  
  // Form States
  const [orderId, setOrderId] = useState("");
  const [store, setStore] = useState(STORE_OPTIONS[0]);
  const [pid, setPid] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  
  // UI States
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);

  // --- Real-time Sync ---
  useEffect(() => {
    const unsubProd = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubProd(); unsubOrders(); };
  }, []);

  const productMap = useMemo(() => 
    products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}), [products]
  );

  // --- QR Scanner ---
  useEffect(() => {
    let scanner;
    if (scanning) {
      scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
      scanner.render((decoded) => {
        if (productMap[decoded]) {
          setPid(decoded);
          setPrice(productMap[decoded].price);
        } else {
          setOrderId(decoded);
        }
        setScanning(false);
        scanner.clear();
      });
    }
    return () => scanner?.clear().catch(() => null);
  }, [scanning, productMap]);

  // --- Actions ---
  const addToCart = (e) => {
    e.preventDefault();
    if (!pid) return;
    const p = productMap[pid];
    const item = {
      id: Date.now(),
      pid,
      name: p.name,
      qty: Number(qty),
      price: Number(price),
      cost: Number(p.cost || 0),
      total: Number(price) * Number(qty)
    };
    setCart([...cart, item]);
    setPid(""); setQty(1); setPrice("");
  };

  const confirmOrder = async () => {
    const finalId = orderId.trim();
    if (!finalId || cart.length === 0) return alert("ข้อมูลไม่ครบ!");
    setProcessing(true);

    try {
      await runTransaction(db, async (t) => {
        const orderRef = doc(db, "orders", finalId);
        if ((await t.get(orderRef)).exists()) throw new Error("เลขบิลซ้ำ!");

        let totalAmt = 0; let totalCst = 0;

        for (const item of cart) {
          const pRef = doc(db, "products", item.pid);
          const pDoc = await t.get(pRef);
          const currentStock = pDoc.data().stock || 0;
          if (currentStock < item.qty) throw new Error(`สต๊อก ${item.name} ไม่พอ!`);
          
          t.update(pRef, { stock: currentStock - item.qty });
          totalAmt += item.total;
          totalCst += item.cost * item.qty;
        }

        t.set(orderRef, {
          store, items: cart, totalAmount: totalAmt, 
          totalProfit: totalAmt - totalCst, createdAt: new Date().toISOString()
        });

        // Summary Cache
        const summaryRef = doc(db, "daily_summary", todayISO());
        t.set(summaryRef, {
          revenue: increment(totalAmt),
          profit: increment(totalAmt - totalCst)
        }, { merge: true });
      });

      setCart([]); setOrderId(""); alert("บันทึกสำเร็จ!");
    } catch (e) { alert(e.message); }
    setProcessing(false);
  };

  // ==========================================
  // 🎨 RENDER UI
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-[#0A142A] text-white p-6 space-y-4">
        <h1 className="text-xl font-black text-[#CEA85E] tracking-tighter">RESILIENT POS</h1>
        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveTab('sales')} className={`flex items-center gap-3 p-3 rounded-xl ${activeTab === 'sales' ? 'bg-[#CEA85E]' : 'hover:bg-white/5'}`}><ShoppingCart size={18}/> POS</button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center gap-3 p-3 rounded-xl ${activeTab === 'history' ? 'bg-[#CEA85E]' : 'hover:bg-white/5'}`}><History size={18}/> History</button>
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 p-3 rounded-xl ${activeTab === 'dashboard' ? 'bg-[#CEA85E]' : 'hover:bg-white/5'}`}><BarChart3 size={18}/> Dashboard</button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        {activeTab === 'sales' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border">
              <h2 className="text-2xl font-black mb-6">บันทึกการขาย</h2>
              {scanning && <div id="qr-reader" className="mb-4 rounded-xl overflow-hidden" />}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400">เลขที่บิล</label>
                  <div className="flex gap-2">
                    <input className="flex-1 p-3 border rounded-xl" value={orderId} onChange={e => setOrderId(e.target.value)} />
                    <button onClick={() => setScanning(true)} className="p-3 bg-slate-100 rounded-xl"><QrCode size={18}/></button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">ช่องทาง</label>
                  <select className="w-full p-3 border rounded-xl" value={store} onChange={e => setStore(e.target.value)}>
                    {STORE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <form onSubmit={addToCart} className="bg-slate-50 p-6 rounded-2xl space-y-4">
                <select className="w-full p-3 border rounded-xl font-bold" value={pid} onChange={e => {setPid(e.target.value); setPrice(productMap[e.target.value]?.price || "")}}>
                  <option value="">-- เลือกสินค้า --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (คงเหลือ {p.stock})</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="ราคา" className="p-3 border rounded-xl" value={price} onChange={e => setPrice(e.target.value)} />
                  <input type="number" placeholder="จำนวน" className="p-3 border rounded-xl" value={qty} onChange={e => setQty(e.target.value)} />
                </div>
                <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">เพิ่มลงตะกร้า</button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border flex flex-col">
              <h3 className="font-black mb-4 flex items-center gap-2"><ShoppingBag size={18}/> รายการสินค้า</h3>
              <div className="flex-1 space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm p-3 bg-slate-50 rounded-xl">
                    <span>{item.name} x {item.qty}</span>
                    <span className="font-bold">฿{formatMoney(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t">
                <p className="text-xs text-slate-400 font-bold uppercase">Total</p>
                <p className="text-3xl font-black text-blue-600">฿{formatMoney(cart.reduce((s,i) => s+i.total, 0))}</p>
                <button onClick={confirmOrder} disabled={processing || cart.length === 0} className="w-full mt-4 py-4 bg-green-500 text-white rounded-2xl font-black shadow-lg disabled:opacity-50">ยืนยันการขาย</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border shadow-sm p-6">
            <h2 className="text-xl font-black mb-4">ประวัติการขาย</h2>
            <table className="w-full text-left">
              <thead><tr className="text-slate-400 text-xs uppercase"><th className="p-3">บิล</th><th className="p-3">ยอดรวม</th><th className="p-3 text-right">จัดการ</th></tr></thead>
              <tbody className="divide-y">
                {orders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(o => (
                  <tr key={o.id}>
                    <td className="p-3 font-bold text-blue-600">{o.id}</td>
                    <td className="p-3 font-black">฿{formatMoney(o.totalAmount)}</td>
                    <td className="p-3 text-right"><button onClick={async () => {if(window.confirm('ลบ?')) await deleteDoc(doc(db,"orders",o.id))}} className="text-red-400"><Trash2 size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}