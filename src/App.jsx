import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
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
  Download
} from 'lucide-react';

// --- FIREBASE CONFIGURATION (ของคุณชวนากร) ---
const firebaseConfig = {
  apiKey: "AIzaSyCgC0ikl147mwcC1-J36Qg27SPUNSz8Afw",
  authDomain: "the-royal-queen.firebaseapp.com",
  projectId: "the-royal-queen",
  storageBucket: "the-royal-queen.firebasestorage.app",
  messagingSenderId: "1070880208582",
  appId: "1:1070880208582:web:9530fdad63bab3454149c7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  // --- CHECK EXECUTIVE URL PARAMETER ---
  const isExecutiveView = new URLSearchParams(window.location.search).get('view') === 'dashboard';

  // --- STATE MANAGEMENT ---
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [activeTab, setActiveTab] = useState('sales');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);

  // --- CONNECT TO FIREBASE ---
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) {
        addDoc(collection(db, "users"), { username: 'admin', password: '123456', role: 'admin' });
        addDoc(collection(db, "users"), { username: 'user', password: '123456', role: 'staff' });
      } else {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
        setIsUsersLoaded(true);
      }
    });

    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
    });

    const unsubscribeSales = onSnapshot(collection(db, "sales"), (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSales(salesData);
      setIsLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeProducts();
      unsubscribeSales();
    };
  }, []);

  // --- HELPER FUNCTIONS ---
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
  };

  const getProduct = (id) => products.find(p => p.id === id);

  // ฟังก์ชันสำหรับ Export เป็น CSV (รองรับภาษาไทยใน Excel)
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

  // --- VIEWS ---

  // 0. LOGIN VIEW
  const LoginView = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
      e.preventDefault();
      const foundUser = users.find(u => u.username === username && u.password === password);
      if (foundUser) {
        setLoggedInUser(foundUser);
        setActiveTab(foundUser.role === 'admin' ? 'dashboard' : 'sales');
        setError('');
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Lock size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">The Royal Queen</h1>
            <p className="text-gray-500">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้งาน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={18} className="text-gray-400" /></div>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="admin หรือ user" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400" /></div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="••••••" required />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-medium transition-colors shadow-sm">เข้าสู่ระบบ</button>
          </form>
        </div>
      </div>
    );
  };

  // 1. DASHBOARD VIEW
  const DashboardView = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);
    const todaySales = sales.filter(s => s.date.startsWith(today));
    const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
    const monthSales = sales.filter(s => s.date.startsWith(currentMonth));
    const monthTotal = monthSales.reduce((sum, s) => sum + s.total, 0);

    const productSalesCount = {};
    sales.forEach(s => {
      productSalesCount[s.productId] = (productSalesCount[s.productId] || 0) + s.quantity;
    });
    
    const topProducts = Object.entries(productSalesCount)
      .map(([id, qty]) => ({ ...getProduct(id), qty }))
      .filter(p => p.name)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">สรุปภาพรวม (Dashboard)</h2>
          <button 
            onClick={exportSalesReport}
            className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download size={18} />
            <span>ส่งออกยอดขาย</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><DollarSign size={24} /></div>
            <div><p className="text-sm text-gray-500">ยอดขายวันนี้</p><p className="text-2xl font-bold text-gray-800">{formatMoney(todayTotal)}</p></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg"><Calendar size={24} /></div>
            <div><p className="text-sm text-gray-500">ยอดขายเดือนนี้</p><p className="text-2xl font-bold text-gray-800">{formatMoney(monthTotal)}</p></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><TrendingUp size={24} /></div>
            <div><p className="text-sm text-gray-500">ออเดอร์ (เดือนนี้)</p><p className="text-2xl font-bold text-gray-800">{monthSales.length}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-lg font-semibold text-gray-800">สินค้าขายดี (Top 5)</h3></div>
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.map((p, index) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3"><span className="text-gray-400 font-bold w-4">{index + 1}.</span><span className="font-medium text-gray-700">{p.name}</span></div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">ขายแล้ว {p.qty} ชิ้น</span>
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(p.qty / topProducts[0].qty) * 100}%` }}></div></div>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && <p className="text-gray-500 text-center py-4">ยังไม่มีข้อมูลการขาย</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 2. PRODUCTS VIEW
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
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">จัดการสินค้า</h2>
          <div className="flex space-x-3">
            <button 
              onClick={exportProductsReport}
              className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <Download size={18} />
              <span>ส่งออก Excel</span>
            </button>
            {!isAdding && (
              <button 
                onClick={() => { setIsAdding(true); setEditForm({name:'', cost:'', price:''}); setIsEditing(null); }}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus size={18} />
                <span>เพิ่มสินค้าใหม่</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <th className="p-4 font-medium">ชื่อสินค้า</th>
                <th className="p-4 font-medium">ราคาคลินิก</th>
                <th className="p-4 font-medium">ราคาขาย</th>
                <th className="p-4 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isAdding && (
                <tr className="border-b border-gray-50 bg-blue-50/50">
                  <td className="p-4"><input className="w-full p-2 border rounded" placeholder="ชื่อสินค้า..." value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                  <td className="p-4"><input type="number" className="w-full p-2 border rounded" placeholder="ราคาคลินิก..." value={editForm.cost} onChange={e => setEditForm({...editForm, cost: e.target.value})} /></td>
                  <td className="p-4"><input type="number" className="w-full p-2 border rounded" placeholder="ราคาขาย..." value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /></td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={handleAdd} className="text-green-600"><Save size={18} /></button>
                    <button onClick={() => setIsAdding(false)} className="text-red-600"><X size={18} /></button>
                  </td>
                </tr>
              )}
              {products.map(product => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4">{isEditing === product.id ? <input className="w-full p-2 border rounded" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /> : <span className="font-medium">{product.name}</span>}</td>
                  <td className="p-4">{isEditing === product.id ? <input type="number" className="w-full p-2 border rounded" value={editForm.cost} onChange={e => setEditForm({...editForm, cost: e.target.value})} /> : <span>{product.cost} ฿</span>}</td>
                  <td className="p-4">{isEditing === product.id ? <input type="number" className="w-full p-2 border rounded" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /> : <span>{product.price} ฿</span>}</td>
                  <td className="p-4 text-right space-x-2">
                    {isEditing === product.id ? <><button onClick={() => handleSave(product.id)} className="text-green-600"><Save size={18} /></button><button onClick={() => setIsEditing(null)} className="text-gray-500"><X size={18} /></button></> : <><button onClick={() => { setIsEditing(product.id); setEditForm({name: product.name, cost: product.cost, price: product.price}); }} className="text-blue-600"><Edit2 size={18} /></button><button onClick={async () => { if(confirm('ลบสินค้านี้?')) await deleteDoc(doc(db, "products", product.id)); }} className="text-red-600"><Trash2 size={18} /></button></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 2.5 STOCK VIEW
  const StockView = () => {
    const [editingStockId, setEditingStockId] = useState(null);
    const [newStock, setNewStock] = useState('');
    
    const handleSaveStock = async (id) => {
      await updateDoc(doc(db, "products", id), { stock: Number(newStock) });
      setEditingStockId(null);
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <h2 className="text-2xl font-bold text-gray-800">จัดการสต๊อกสินค้า</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <th className="p-4 font-medium">ชื่อสินค้า</th>
                <th className="p-4 font-medium text-center">คงเหลือ</th>
                <th className="p-4 font-medium text-right">อัปเดต</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4 text-center">{editingStockId === product.id ? <input type="number" className="w-24 p-2 border rounded text-center" value={newStock} onChange={e => setNewStock(e.target.value)} /> : <span className={`px-3 py-1 rounded-full text-sm font-medium ${product.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{product.stock || 0} ชิ้น</span>}</td>
                  <td className="p-4 text-right space-x-2">{editingStockId === product.id ? <><button onClick={() => handleSaveStock(product.id)} className="text-green-600"><Save size={18} /></button><button onClick={() => setEditingStockId(null)} className="text-gray-500"><X size={18} /></button></> : <button onClick={() => { setEditingStockId(product.id); setNewStock(product.stock || 0); }} className="text-blue-600"><Edit2 size={18} /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 2.8 USERS MANAGEMENT VIEW
  const UsersManagementView = () => {
    const [isEditing, setIsEditing] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', password: '', role: 'staff' });
    const [isAdding, setIsAdding] = useState(false);
    
    const handleAdd = async () => {
      if (users.find(u => u.username === editForm.username)) { alert('ชื่อนี้มีอยู่แล้ว'); return; }
      await addDoc(collection(db, "users"), { ...editForm });
      setIsAdding(false);
      setEditForm({ username: '', password: '', role: 'staff' });
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้งาน</h2>{!isAdding && <button onClick={() => { setIsAdding(true); setEditForm({username:'', password:'', role:'staff'}); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"><Plus size={18} /><span>เพิ่มผู้ใช้</span></button>}</div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-gray-50 text-gray-600 border-b border-gray-100"><th className="p-4 font-medium">Username</th><th className="p-4 font-medium">ระดับสิทธิ์</th><th className="p-4 font-medium text-right">จัดการ</th></tr></thead>
            <tbody>
              {isAdding && <tr className="bg-blue-50/50"><td className="p-4"><input className="p-2 border rounded" placeholder="ชื่อ..." value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} /></td><td className="p-4"><select className="p-2 border rounded" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}><option value="staff">Staff</option><option value="admin">Admin</option></select></td><td className="p-4 text-right"><button onClick={handleAdd} className="text-green-600 mr-2"><Save size={18} /></button><button onClick={() => setIsAdding(false)} className="text-red-600"><X size={18} /></button></td></tr>}
              {users.map(u => <tr key={u.id} className="border-b hover:bg-gray-50"><td className="p-4 font-medium">{u.username}</td><td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{u.role.toUpperCase()}</span></td><td className="p-4 text-right"><button onClick={async () => { if(confirm('ลบผู้ใช้?')) await deleteDoc(doc(db, "users", u.id)); }} className={`text-red-600 ${u.id === loggedInUser.id ? 'opacity-0 pointer-events-none' : ''}`}><Trash2 size={18} /></button></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 3. SALES VIEW
  const SalesView = () => {
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCheckout = async (e) => {
      e.preventDefault();
      if (!selectedProduct) return;
      const product = getProduct(selectedProduct);
      if (product.stock < quantity) { setIsError(true); setMessage('สต๊อกไม่พอ'); return; }
      setIsProcessing(true);
      try {
        await addDoc(collection(db, "sales"), { productId: selectedProduct, quantity, total: product.price * quantity, date: new Date().toISOString(), soldBy: loggedInUser.username });
        await updateDoc(doc(db, "products", product.id), { stock: product.stock - quantity });
        setSelectedProduct(''); setQuantity(1); setIsError(false); setMessage('บันทึกสำเร็จ');
        setTimeout(() => setMessage(''), 3000);
      } catch (err) { setMessage(err.message); setIsError(true); }
      setIsProcessing(false);
    };

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800">คีย์ข้อมูลการขาย (POS)</h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleCheckout} className="space-y-6">
            {message && <div className={`p-4 rounded-lg ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>}
            <div><label className="block text-sm font-medium mb-2">เลือกสินค้า</label><select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full p-3 border rounded-lg bg-white" required disabled={isProcessing}><option value="" disabled>-- เลือกสินค้า --</option>{products.map(p => <option key={p.id} value={p.id} disabled={p.stock === 0}>{p.name} ({p.price} ฿) - เหลือ {p.stock}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-2">จำนวน</label><div className="flex items-center space-x-4"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded bg-gray-100 font-bold">-</button><input type="number" value={quantity} readOnly className="w-full text-center p-3 border rounded-lg text-lg" /><button type="button" onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded bg-gray-100 font-bold">+</button></div></div>
            <div className="pt-4 border-t flex justify-between items-end"><div><p className="text-sm text-gray-500">ยอดรวม</p><p className="text-3xl font-bold text-blue-600">{formatMoney(selectedProduct ? getProduct(selectedProduct).price * quantity : 0)}</p></div><button type="submit" disabled={!selectedProduct || isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition disabled:bg-gray-300">บันทึกการขาย</button></div>
          </form>
        </div>
      </div>
    );
  };

  if (!isUsersLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">กำลังเตรียมระบบ The Royal Queen...</p>
      </div>
    );
  }

  if (isExecutiveView) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight flex items-center space-x-2"><ShoppingCart className="text-blue-600" /><span>The Royal Queen - ผู้บริหาร</span></h1>
            <button onClick={exportSalesReport} className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition"><Download size={18} /><span>ดาวน์โหลดรายงาน</span></button>
          </div>
          <DashboardView />
        </div>
      </div>
    );
  }

  if (!loggedInUser) return <LoginView />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <div className="w-full md:w-64 bg-white border-b md:border-r border-gray-200 flex-shrink-0">
        <div className="p-6"><h1 className="text-xl font-extrabold text-blue-600 tracking-tight flex items-center space-x-2"><ShoppingCart className="text-blue-600" /><span>The Royal Queen</span></h1></div>
        <nav className="px-4 pb-6 space-y-1 flex md:flex-col overflow-x-auto md:overflow-visible">
          {loggedInUser.role === 'admin' && (
            <>
              <button onClick={() => setActiveTab('dashboard')} className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}><LayoutDashboard size={20} /><span>แดชบอร์ด</span></button>
              <button onClick={() => setActiveTab('products')} className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-colors ${activeTab === 'products' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}><Package size={20} /><span>จัดการสินค้า</span></button>
              <button onClick={() => setActiveTab('stock')} className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-colors ${activeTab === 'stock' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}><Boxes size={20} /><span>สต๊อกสินค้า</span></button>
              <button onClick={() => setActiveTab('users')} className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}><Users size={20} /><span>จัดการผู้ใช้งาน</span></button>
            </>
          )}
          <button onClick={() => setActiveTab('sales')} className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-colors ${activeTab === 'sales' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}><ShoppingCart size={20} /><span>คีย์ยอดขาย (POS)</span></button>
        </nav>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="text-gray-500 font-medium hidden md:block">{activeTab === 'dashboard' ? 'ภาพรวมยอดขาย' : activeTab === 'products' ? 'ตั้งค่าข้อมูลสินค้า' : activeTab === 'stock' ? 'จัดการสต๊อกสินค้า' : activeTab === 'users' ? 'ตั้งค่าบัญชีผู้ใช้' : 'ระบบแคชเชียร์'}</div>
          <div className="flex items-center space-x-4 ml-auto">
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 py-1.5 px-3 rounded-full border border-gray-100"><User size={16} className="text-blue-500" /><span className="font-medium">{loggedInUser.username}</span><span className="text-gray-400">({loggedInUser.role === 'admin' ? 'Admin' : 'Staff'})</span></div>
            <button onClick={() => { setLoggedInUser(null); setActiveTab('sales'); }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><LogOut size={18} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'dashboard' && loggedInUser.role === 'admin' && <DashboardView />}
            {activeTab === 'products' && loggedInUser.role === 'admin' && <ProductsView />}
            {activeTab === 'stock' && loggedInUser.role === 'admin' && <StockView />}
            {activeTab === 'users' && loggedInUser.role === 'admin' && <UsersManagementView />}
            {activeTab === 'sales' && <SalesView />}
          </div>
        </main>
      </div>
    </div>
  );
}