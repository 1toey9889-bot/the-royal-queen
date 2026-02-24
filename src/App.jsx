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
  User
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
  // เช็คว่า URL มี ?view=dashboard หรือไม่
  const isExecutiveView = new URLSearchParams(window.location.search).get('view') === 'dashboard';

  // --- STATE MANAGEMENT ---
  const [loggedInUser, setLoggedInUser] = useState(null); // เก็บข้อมูลผู้ใช้ที่ล็อกอิน
  const [activeTab, setActiveTab] = useState('sales');
  
  // State สำหรับเก็บข้อมูลจาก Firebase
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);

  // --- CONNECT TO FIREBASE ---
  useEffect(() => {
    // ดึงข้อมูล "ผู้ใช้งาน" (Users)
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) {
        // หากยังไม่มี User ในระบบเลย ให้สร้าง Admin และ User เริ่มต้น
        addDoc(collection(db, "users"), { username: 'admin', password: '123456', role: 'admin' });
        addDoc(collection(db, "users"), { username: 'user', password: '123456', role: 'staff' });
      } else {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
        setIsUsersLoaded(true);
      }
    }, (error) => {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", error);
    });

    // ดึงข้อมูล "สินค้า" (Products)
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    }, (error) => {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", error);
    });

    // ดึงข้อมูล "ยอดขาย" (Sales)
    const unsubscribeSales = onSnapshot(collection(db, "sales"), (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSales(salesData);
      setIsLoading(false);
    }, (error) => {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลยอดขาย:", error);
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
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Lock size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">The Royal Queen</h1>
            <p className="text-gray-500">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้งาน (Username)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    placeholder="admin หรือ user"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน (Password)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    placeholder="••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-medium transition-colors shadow-sm"
            >
              เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </div>
    );
  };

  // 1. DASHBOARD VIEW (Admin)
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
        <h2 className="text-2xl font-bold text-gray-800">สรุปภาพรวม (Dashboard)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">ยอดขายวันนี้</p>
              <p className="text-2xl font-bold text-gray-800">{formatMoney(todayTotal)}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">ยอดขายเดือนนี้</p>
              <p className="text-2xl font-bold text-gray-800">{formatMoney(monthTotal)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">จำนวนออเดอร์ (เดือนนี้)</p>
              <p className="text-2xl font-bold text-gray-800">{monthSales.length} รายการ</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">สินค้าขายดี (Top Products)</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.map((p, index) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 font-bold w-4">{index + 1}.</span>
                    <span className="font-medium text-gray-700">{p.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">ขายแล้ว {p.qty} ชิ้น</span>
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${(p.qty / topProducts[0].qty) * 100}%` }}
                      ></div>
                    </div>
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

  // 2. PRODUCTS VIEW (Admin)
  const ProductsView = () => {
    const [isEditing, setIsEditing] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', cost: '', price: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSave = async (id) => {
      setIsProcessing(true);
      try {
        await updateDoc(doc(db, "products", id), {
          name: editForm.name,
          cost: Number(editForm.cost),
          price: Number(editForm.price)
        });
        setIsEditing(null);
      } catch (error) {
        alert("เกิดข้อผิดพลาดในการแก้ไขสินค้า: " + error.message);
      }
      setIsProcessing(false);
    };

    const handleAdd = async () => {
      if (!editForm.name || !editForm.price || !editForm.cost) return;
      setIsProcessing(true);
      try {
        await addDoc(collection(db, "products"), {
          name: editForm.name,
          cost: Number(editForm.cost),
          price: Number(editForm.price),
          stock: 0
        });
        setIsAdding(false);
        setEditForm({ name: '', cost: '', price: '' });
      } catch (error) {
        alert("เกิดข้อผิดพลาดในการเพิ่มสินค้า: " + error.message);
      }
      setIsProcessing(false);
    };

    const handleDelete = async (id) => {
      if(window.confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?')) {
        try {
          await deleteDoc(doc(db, "products", id));
        } catch (error) {
          alert("เกิดข้อผิดพลาดในการลบสินค้า: " + error.message);
        }
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">จัดการสินค้า</h2>
          {!isAdding && (
            <button 
              onClick={() => { setIsAdding(true); setEditForm({name:'', cost:'', price:''}); setIsEditing(null); }}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={18} />
              <span>เพิ่มสินค้าใหม่</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <th className="p-4 font-medium">ชื่อสินค้า</th>
                <th className="p-4 font-medium">ต้นทุน (บาท)</th>
                <th className="p-4 font-medium">ราคาขาย (บาท)</th>
                <th className="p-4 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isAdding && (
                <tr className="border-b border-gray-50 bg-blue-50/50">
                  <td className="p-4">
                    <input 
                      autoFocus
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ชื่อสินค้า..."
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      disabled={isProcessing}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ต้นทุน..."
                      value={editForm.cost}
                      onChange={e => setEditForm({...editForm, cost: e.target.value})}
                      disabled={isProcessing}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ราคาขาย..."
                      value={editForm.price}
                      onChange={e => setEditForm({...editForm, price: e.target.value})}
                      disabled={isProcessing}
                    />
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={handleAdd} disabled={isProcessing} className="text-green-600 hover:bg-green-100 p-2 rounded-lg transition">
                      <Save size={18} />
                    </button>
                    <button onClick={() => setIsAdding(false)} disabled={isProcessing} className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition">
                      <X size={18} />
                    </button>
                  </td>
                </tr>
              )}

              {products.map(product => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    {isEditing === product.id ? (
                      <input 
                        autoFocus
                        className="w-full p-2 border border-gray-300 rounded"
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        disabled={isProcessing}
                      />
                    ) : (
                      <span className="font-medium text-gray-800">{product.name}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {isEditing === product.id ? (
                      <input 
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded"
                        value={editForm.cost}
                        onChange={e => setEditForm({...editForm, cost: e.target.value})}
                        disabled={isProcessing}
                      />
                    ) : (
                      <span className="text-gray-600">{product.cost} ฿</span>
                    )}
                  </td>
                  <td className="p-4">
                    {isEditing === product.id ? (
                      <input 
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded"
                        value={editForm.price}
                        onChange={e => setEditForm({...editForm, price: e.target.value})}
                        disabled={isProcessing}
                      />
                    ) : (
                      <span className="text-gray-600">{product.price} ฿</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {isEditing === product.id ? (
                      <>
                        <button onClick={() => handleSave(product.id)} disabled={isProcessing} className="text-green-600 hover:bg-green-100 p-2 rounded-lg transition">
                          <Save size={18} />
                        </button>
                        <button onClick={() => setIsEditing(null)} disabled={isProcessing} className="text-gray-500 hover:bg-gray-200 p-2 rounded-lg transition">
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => { setIsEditing(product.id); setEditForm({name: product.name, cost: product.cost, price: product.price}); setIsAdding(false); }} 
                          className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {products.length === 0 && !isAdding && (
                <tr>
                  <td colSpan="4" className="text-center p-8 text-gray-500">ยังไม่มีรายการสินค้า</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 2.5 STOCK VIEW (Admin)
  const StockView = () => {
    const [editingStockId, setEditingStockId] = useState(null);
    const [newStock, setNewStock] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSaveStock = async (id) => {
      setIsProcessing(true);
      try {
        await updateDoc(doc(db, "products", id), {
          stock: Number(newStock)
        });
        setEditingStockId(null);
      } catch (error) {
        alert("เกิดข้อผิดพลาดในการอัปเดตสต๊อก: " + error.message);
      }
      setIsProcessing(false);
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <h2 className="text-2xl font-bold text-gray-800">จัดการสต๊อกสินค้า</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <th className="p-4 font-medium">ชื่อสินค้า</th>
                <th className="p-4 font-medium text-center">จำนวนคงเหลือ</th>
                <th className="p-4 font-medium text-right">อัปเดตสต๊อก</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-800">{product.name}</td>
                  <td className="p-4 text-center">
                    {editingStockId === product.id ? (
                      <input 
                        type="number"
                        className="w-24 mx-auto p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        value={newStock}
                        onChange={e => setNewStock(e.target.value)}
                        disabled={isProcessing}
                      />
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${(product.stock || 0) <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {product.stock || 0} ชิ้น
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {editingStockId === product.id ? (
                      <>
                        <button onClick={() => handleSaveStock(product.id)} disabled={isProcessing} className="text-green-600 hover:bg-green-100 p-2 rounded-lg transition">
                          <Save size={18} />
                        </button>
                        <button onClick={() => setEditingStockId(null)} disabled={isProcessing} className="text-gray-500 hover:bg-gray-200 p-2 rounded-lg transition">
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => { setEditingStockId(product.id); setNewStock(product.stock || 0); }} 
                        className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center p-8 text-gray-500">ยังไม่มีรายการสินค้า</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 2.8 USERS MANAGEMENT VIEW (Admin Only)
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
      } catch (error) {
        alert("เกิดข้อผิดพลาดในการแก้ไขผู้ใช้: " + error.message);
      }
      setIsProcessing(false);
    };

    const handleAdd = async () => {
      if (!editForm.username || !editForm.password) return;
      // เช็คชื่อซ้ำ
      if (users.find(u => u.username === editForm.username)) {
        alert('ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว');
        return;
      }

      setIsProcessing(true);
      try {
        await addDoc(collection(db, "users"), {
          username: editForm.username,
          password: editForm.password,
          role: editForm.role
        });
        setIsAdding(false);
        setEditForm({ username: '', password: '', role: 'staff' });
      } catch (error) {
        alert("เกิดข้อผิดพลาดในการเพิ่มผู้ใช้: " + error.message);
      }
      setIsProcessing(false);
    };

    const handleDelete = async (id) => {
      if (id === loggedInUser.id) {
        alert('ไม่สามารถลบบัญชีที่คุณกำลังใช้งานอยู่ได้');
        return;
      }
      if(window.confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานนี้?')) {
        try {
          await deleteDoc(doc(db, "users", id));
        } catch (error) {
          alert("เกิดข้อผิดพลาดในการลบ: " + error.message);
        }
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้งานระบบ</h2>
          {!isAdding && (
            <button 
              onClick={() => { setIsAdding(true); setEditForm({username:'', password:'', role:'staff'}); setIsEditing(null); }}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={18} />
              <span>เพิ่มผู้ใช้ใหม่</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <th className="p-4 font-medium">ชื่อผู้ใช้งาน</th>
                <th className="p-4 font-medium">รหัสผ่าน</th>
                <th className="p-4 font-medium">ระดับสิทธิ์</th>
                <th className="p-4 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isAdding && (
                <tr className="border-b border-gray-50 bg-blue-50/50">
                  <td className="p-4">
                    <input 
                      autoFocus
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Username..."
                      value={editForm.username}
                      onChange={e => setEditForm({...editForm, username: e.target.value})}
                      disabled={isProcessing}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Password..."
                      value={editForm.password}
                      onChange={e => setEditForm({...editForm, password: e.target.value})}
                      disabled={isProcessing}
                    />
                  </td>
                  <td className="p-4">
                    <select 
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={editForm.role}
                      onChange={e => setEditForm({...editForm, role: e.target.value})}
                      disabled={isProcessing}
                    >
                      <option value="staff">พนักงาน (Staff)</option>
                      <option value="admin">ผู้ดูแล (Admin)</option>
                    </select>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={handleAdd} disabled={isProcessing} className="text-green-600 hover:bg-green-100 p-2 rounded-lg transition">
                      <Save size={18} />
                    </button>
                    <button onClick={() => setIsAdding(false)} disabled={isProcessing} className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition">
                      <X size={18} />
                    </button>
                  </td>
                </tr>
              )}

              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <span className="font-medium text-gray-800">{u.username}</span>
                  </td>
                  <td className="p-4">
                    {isEditing === u.id ? (
                      <input 
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded"
                        value={editForm.password}
                        onChange={e => setEditForm({...editForm, password: e.target.value})}
                        disabled={isProcessing}
                      />
                    ) : (
                      <span className="text-gray-500 tracking-widest">••••••</span>
                    )}
                  </td>
                  <td className="p-4">
                    {isEditing === u.id ? (
                      <select 
                        className="w-full p-2 border border-gray-300 rounded bg-white"
                        value={editForm.role}
                        onChange={e => setEditForm({...editForm, role: e.target.value})}
                        disabled={isProcessing}
                      >
                        <option value="staff">พนักงาน (Staff)</option>
                        <option value="admin">ผู้ดูแล (Admin)</option>
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u.role === 'admin' ? 'ผู้ดูแล (Admin)' : 'พนักงาน (Staff)'}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {isEditing === u.id ? (
                      <>
                        <button onClick={() => handleSave(u.id)} disabled={isProcessing} className="text-green-600 hover:bg-green-100 p-2 rounded-lg transition">
                          <Save size={18} />
                        </button>
                        <button onClick={() => setIsEditing(null)} disabled={isProcessing} className="text-gray-500 hover:bg-gray-200 p-2 rounded-lg transition">
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => { setIsEditing(u.id); setEditForm({username: u.username, password: u.password, role: u.role}); setIsAdding(false); }} 
                          className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id)}
                          className={`p-2 rounded-lg transition ${u.id === loggedInUser.id ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-100'}`}
                          disabled={u.id === loggedInUser.id}
                        >
                          <Trash2 size={18} />
                        </button>
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

  // 3. SALES VIEW (Staff)
  const SalesView = () => {
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCheckout = async (e) => {
      e.preventDefault();
      if (!selectedProduct || quantity < 1) return;

      const product = getProduct(selectedProduct);
      const currentStock = product.stock || 0;
      
      if (currentStock < quantity) {
        setIsError(true);
        setMessage(`สินค้าไม่พอ! (เหลือเพียง ${currentStock} ชิ้น)`);
        setTimeout(() => { setMessage(''); setIsError(false); }, 3000);
        return;
      }

      setIsProcessing(true);
      const total = product.price * quantity;

      try {
        await addDoc(collection(db, "sales"), {
          productId: selectedProduct,
          quantity: Number(quantity),
          total: total,
          date: new Date().toISOString(),
          soldBy: loggedInUser.username // บันทึกชื่อคนขาย
        });
        
        await updateDoc(doc(db, "products", product.id), {
          stock: currentStock - quantity
        });

        setSelectedProduct('');
        setQuantity(1);
        setIsError(false);
        setMessage(`บันทึกสำเร็จ! ยอดรวม ${formatMoney(total)}`);
        setTimeout(() => setMessage(''), 3000);

      } catch (error) {
        setIsError(true);
        setMessage(`เกิดข้อผิดพลาด: ${error.message}`);
        setTimeout(() => { setMessage(''); setIsError(false); }, 4000);
      }
      
      setIsProcessing(false);
    };

    const recentSales = sales
      .filter(s => s.date.startsWith(new Date().toISOString().split('T')[0]))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 text-center md:text-left">คีย์ข้อมูลการขาย (POS)</h2>
        
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleCheckout} className="space-y-6">
            
            {message && (
              <div className={`p-4 rounded-lg flex items-center justify-between ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                <span>{message}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เลือกสินค้า</label>
              <select 
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
                disabled={isProcessing}
              >
                <option value="" disabled>-- กรุณาเลือกสินค้า --</option>
                {products.map(p => {
                  const currentStock = p.stock || 0;
                  return (
                    <option key={p.id} value={p.id} disabled={currentStock === 0}>
                      {p.name} ({p.price} ฿) {currentStock === 0 ? '- สินค้าหมด' : `- เหลือ ${currentStock} ชิ้น`}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">จำนวน</label>
              <div className="flex items-center space-x-4">
                <button type="button" disabled={isProcessing} onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold">-</button>
                <input 
                  type="number" 
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full text-center p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  disabled={isProcessing}
                />
                <button type="button" disabled={isProcessing} onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold">+</button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-500">ยอดรวมทั้งสิ้น</p>
                <p className="text-3xl font-bold text-blue-600">
                  {selectedProduct && getProduct(selectedProduct) 
                    ? formatMoney(getProduct(selectedProduct).price * quantity) 
                    : '0.00 ฿'}
                </p>
              </div>
              <button 
                type="submit"
                disabled={!selectedProduct || isProcessing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                {isProcessing ? 'กำลังบันทึก...' : 'บันทึกการขาย'}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Sales for Staff */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">รายการขายล่าสุดของวันนี้</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                  <th className="p-4 font-medium">เวลา</th>
                  <th className="p-4 font-medium">สินค้า</th>
                  <th className="p-4 font-medium text-center">จำนวน</th>
                  <th className="p-4 font-medium text-right">ยอดรวม</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map(sale => (
                  <tr key={sale.id} className="border-b border-gray-50">
                    <td className="p-4 text-sm text-gray-500">{new Date(sale.date).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="p-4 font-medium">
                      {getProduct(sale.productId)?.name || 'สินค้าถูกลบ'}
                      {sale.soldBy && <span className="block text-xs text-gray-400 font-normal">โดย: {sale.soldBy}</span>}
                    </td>
                    <td className="p-4 text-center">{sale.quantity}</td>
                    <td className="p-4 text-right text-blue-600 font-medium">{formatMoney(sale.total)}</td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr><td colSpan="4" className="p-4 text-center text-gray-500">ยังไม่มีรายการขายในวันนี้</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };


  // --- MAIN RENDER ---
  if (!isUsersLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">กำลังเตรียมระบบ The Royal Queen...</p>
      </div>
    );
  }

  // หากเข้ามาจากลิงก์ผู้บริหาร (?view=dashboard)
  if (isExecutiveView) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight flex items-center space-x-2">
              <ShoppingCart className="text-blue-600" />
              <span>The Royal Queen - ผู้บริหาร</span>
            </h1>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full hidden md:inline-block">ข้อมูลออนไลน์ (Real-time)</span>
          </div>
          <DashboardView />
        </div>
      </div>
    );
  }

  // หากยังไม่ได้เข้าสู่ระบบ ให้แสดงหน้า Login
  if (!loggedInUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR (Desktop) / TOP NAV (Mobile) */}
      <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex-shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-extrabold text-blue-600 tracking-tight flex items-center space-x-2">
            <ShoppingCart className="text-blue-600" />
            <span>The Royal Queen</span>
          </h1>
        </div>
        
        <nav className="px-4 pb-6 space-y-1 flex md:flex-col overflow-x-auto md:overflow-visible">
          {loggedInUser.role === 'admin' && (
            <>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <LayoutDashboard size={20} />
                <span>แดชบอร์ด</span>
              </button>
              <button 
                onClick={() => setActiveTab('products')}
                className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'products' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Package size={20} />
                <span>จัดการสินค้า</span>
              </button>
              <button 
                onClick={() => setActiveTab('stock')}
                className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'stock' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Boxes size={20} />
                <span>สต๊อกสินค้า</span>
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'users' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Users size={20} />
                <span>จัดการผู้ใช้งาน</span>
              </button>
            </>
          )}
          
          <button 
            onClick={() => setActiveTab('sales')}
            className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'sales' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <ShoppingCart size={20} />
            <span>คีย์ยอดขาย (POS)</span>
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOPBAR */}
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="text-gray-500 font-medium hidden md:block">
            {activeTab === 'dashboard' && 'ภาพรวมยอดขาย'}
            {activeTab === 'products' && 'ตั้งค่าข้อมูลสินค้า'}
            {activeTab === 'stock' && 'จัดการสต๊อกสินค้า'}
            {activeTab === 'users' && 'ตั้งค่าบัญชีผู้ใช้'}
            {activeTab === 'sales' && 'ระบบแคชเชียร์'}
          </div>
          
          <div className="flex items-center space-x-4 ml-auto">
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 py-1.5 px-3 rounded-full border border-gray-100">
              <User size={16} className="text-blue-500" />
              <span className="font-medium">{loggedInUser.username}</span>
              <span className="text-gray-400">({loggedInUser.role === 'admin' ? 'Admin' : 'Staff'})</span>
            </div>
            <button 
              onClick={() => { setLoggedInUser(null); setActiveTab('sales'); }}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
              title="ออกจากระบบ"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* CONTENT VIEW */}
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
