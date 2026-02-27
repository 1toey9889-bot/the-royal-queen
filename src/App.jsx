// ==========================================
// ENTERPRISE POS V2 - FINAL CLEAN VERSION
// ==========================================

import React, { useState, useEffect, useMemo } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  runTransaction,
  increment,
  setDoc,
  getDoc
} from "firebase/firestore";
import { Html5QrcodeScanner } from "html5-qrcode";

// ==========================================
// 🔥 Firebase Config
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

// ==========================================
// 🏪 Constants
// ==========================================
const STORE_OPTIONS = [
  "Shopee(Re)",
  "Shopee(Long)",
  "Lazada(Re)",
  "Lazada(Long)",
  "Walk-in"
];

// ==========================================
// 🧠 Helpers
// ==========================================
const formatMoney = (n) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2 }).format(n || 0);

const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

// ==========================================
// 🚀 MAIN APP
// ==========================================
export default function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [store, setStore] = useState(STORE_OPTIONS[0]);
  const [pid, setPid] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);

  // ==========================================
  // 🔄 Real-time Data
  // ==========================================
  useEffect(() => {
    onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    onSnapshot(collection(db, "orders"), (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const productMap = useMemo(() => {
    return products.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [products]);

  const getProduct = (id) => productMap[id];

  // ==========================================
  // 📱 QR Scanner
  // ==========================================
  useEffect(() => {
    let scanner;
    if (scanning) {
      scanner = new Html5QrcodeScanner("qr-reader", {
        fps: 10,
        qrbox: 250
      });

      scanner.render((decoded) => {
        if (productMap[decoded]) {
          const p = productMap[decoded];
          setPid(decoded);
          setPrice(p.price);
        } else {
          setOrderId(decoded);
        }
        scanner.clear();
        setScanning(false);
      });
    }
    return () => scanner?.clear().catch(() => null);
  }, [scanning, productMap]);

  // ==========================================
  // ➕ Add to Cart
  // ==========================================
  const addToCart = (e) => {
    e.preventDefault();
    if (!pid) return;

    const p = getProduct(pid);

    const item = {
      id: Date.now(),
      pid,
      name: p.name,
      qty: Number(qty),
      price: Number(price),
      cost: Number(p.cost),
      total: Number(price) * Number(qty)
    };

    setCart((prev) => [...prev, item]);
    setPid("");
    setQty(1);
  };

  // ==========================================
  // 💳 Confirm Order (FULL ENTERPRISE SAFE)
  // ==========================================
  const confirmOrder = async () => {
    const finalOrderId = orderId.trim();
    if (!finalOrderId || cart.length === 0)
      return alert("กรุณาระบุเลขบิลและสินค้า");

    setProcessing(true);

    try {
      await runTransaction(db, async (t) => {
        const orderRef = doc(db, "orders", finalOrderId);

        const existing = await t.get(orderRef);
        if (existing.exists())
          throw new Error("เลขบิลนี้ถูกใช้แล้ว");

        let totalAmount = 0;
        let totalCost = 0;
        let totalItems = 0;

        // 🔥 STOCK VALIDATION
        for (const item of cart) {
          const productRef = doc(db, "products", item.pid);
          const productDoc = await t.get(productRef);

          if (!productDoc.exists())
            throw new Error(`ไม่พบสินค้า ${item.name}`);

          const currentStock = Number(productDoc.data().stock) || 0;

          if (currentStock < item.qty)
            throw new Error(`สต๊อก ${item.name} ไม่พอ`);

          t.update(productRef, {
            stock: currentStock - item.qty
          });

          totalAmount += item.total;
          totalCost += item.cost * item.qty;
          totalItems += item.qty;
        }

        // ✅ CREATE ORDER
        t.set(orderRef, {
          store,
          items: cart,
          totalAmount,
          totalCost,
          totalProfit: totalAmount - totalCost,
          totalItems,
          status: "completed",
          createdAt: new Date().toISOString()
        });

        // ✅ DAILY SUMMARY CACHE
        const summaryRef = doc(db, "daily_summary", todayISO());
        t.set(
          summaryRef,
          {
            totalRevenue: increment(totalAmount),
            totalProfit: increment(totalAmount - totalCost),
            totalOrders: increment(1),
            totalItems: increment(totalItems)
          },
          { merge: true }
        );

        // ✅ AUDIT LOG
        const auditRef = doc(collection(db, "audit_logs"));
        t.set(auditRef, {
          action: "CREATE_ORDER",
          orderId: finalOrderId,
          totalAmount,
          timestamp: new Date().toISOString()
        });
      });

      setCart([]);
      setOrderId("");
      alert("บันทึกสำเร็จ");
    } catch (err) {
      alert(err.message);
    }

    setProcessing(false);
  };

  // ==========================================
  // ❌ Delete Order (คืน stock)
  // ==========================================
  const deleteOrder = async (id) => {
    if (!window.confirm("ลบออเดอร์นี้?")) return;

    await runTransaction(db, async (t) => {
      const orderRef = doc(db, "orders", id);
      const orderDoc = await t.get(orderRef);
      if (!orderDoc.exists()) return;

      const items = orderDoc.data().items || [];

      for (const item of items) {
        const productRef = doc(db, "products", item.pid);
        const productDoc = await t.get(productRef);

        if (productDoc.exists()) {
          const stock = Number(productDoc.data().stock) || 0;
          t.update(productRef, { stock: stock + item.qty });
        }
      }

      t.delete(orderRef);

      const auditRef = doc(collection(db, "audit_logs"));
      t.set(auditRef, {
        action: "DELETE_ORDER",
        orderId: id,
        timestamp: new Date().toISOString()
      });
    });
  };

  // ==========================================
  // 📊 Dashboard Summary
  // ==========================================
  const totalRevenue = orders.reduce(
    (s, o) => s + (o.totalAmount || 0),
    0
  );

  const totalProfit = orders.reduce(
    (s, o) => s + (o.totalProfit || 0),
    0
  );

  // ==========================================
  // 🖥️ UI
  // ==========================================
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>ENTERPRISE POS V2</h2>

      <h3>ยอดขายรวม: ฿{formatMoney(totalRevenue)}</h3>
      <h3>กำไรรวม: ฿{formatMoney(totalProfit)}</h3>

      <hr />

      {scanning && <div id="qr-reader" />}

      <input
        placeholder="เลขบิล"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
      />
      <button onClick={() => setScanning(true)}>Scan QR</button>

      <form onSubmit={addToCart}>
        <select
          value={pid}
          onChange={(e) => {
            const p = getProduct(e.target.value);
            setPid(e.target.value);
            setPrice(p?.price || "");
          }}
        >
          <option value="">เลือกสินค้า</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.stock})
            </option>
          ))}
        </select>

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <input
          type="number"
          value={qty}
          onChange={(e) =>
            setQty(Math.max(1, Number(e.target.value)))
          }
        />

        <button>เพิ่มสินค้า</button>
      </form>

      <h3>Cart</h3>
      {cart.map((c) => (
        <div key={c.id}>
          {c.name} - {c.qty} ชิ้น
        </div>
      ))}

      <button
        disabled={processing || cart.length === 0}
        onClick={confirmOrder}
      >
        Confirm Order
      </button>

      <hr />

      <h3>Orders</h3>
      {orders.map((o) => (
        <div key={o.id}>
          {o.id} - ฿{formatMoney(o.totalAmount)}
          <button onClick={() => deleteOrder(o.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}