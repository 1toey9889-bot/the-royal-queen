import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

--------------------------------------------

export interface Product {
  id: string;
  name: string;
  cost: number;
  price: number;
  stock: number;
  updatedAt?: string;
}


--------------------------------------------

export interface Sale {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  total: number;
  store: string;
  soldBy: string;
  createdAt: string;
}

--------------------------------------------

export interface User {
  id: string;
  username: string;
  role: "admin" | "staff";
  permissions?: Record<string, boolean>;
}

--------------------------------------------


export const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};
export const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

--------------------------------------------

import { db } from "../firebase/config";
import { collection, addDoc } from "firebase/firestore";

export const createAuditLog = async (data: any) => {
  await addDoc(collection(db, "audit_logs"), {
    ...data,
    createdAt: new Date().toISOString()
  });
};

--------------------------------------------

import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import { Product } from "../types/product";

export const subscribeProducts = (callback: (data: Product[]) => void) => {
  return onSnapshot(collection(db, "products"), (snap) => {
    const products = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];

    callback(products);
  });
};


import { db } from "../firebase/config";
import {
  doc,
  collection,
  runTransaction,
  increment
} from "firebase/firestore";
import { createAuditLog } from "./audit.service";

export const createSaleTransaction = async ({
  productId,
  quantity,
  unitPrice,
  store,
  soldBy
}: any) => {

  const productRef = doc(db, "products", productId);
  const salesRef = collection(db, "sales");

  await runTransaction(db, async (transaction) => {

    const productDoc = await transaction.get(productRef);

    if (!productDoc.exists()) throw new Error("ไม่พบสินค้า");

    const productData = productDoc.data();
    const currentStock = productData.stock || 0;

    if (currentStock < quantity)
      throw new Error("สต๊อกไม่พอ");

    transaction.update(productRef, {
      stock: currentStock - quantity,
      updatedAt: new Date().toISOString()
    });

    const newSaleRef = doc(salesRef);

    transaction.set(newSaleRef, {
      productId,
      quantity,
      unitPrice,
      unitCost: productData.cost,
      total: quantity * unitPrice,
      store,
      soldBy,
      createdAt: new Date().toISOString()
    });

    const today = new Date().toISOString().split("T")[0];
    const summaryRef = doc(db, "daily_summary", today);

    transaction.set(summaryRef, {
      totalRevenue: increment(quantity * unitPrice),
      totalProfit: increment((unitPrice - productData.cost) * quantity),
      totalOrders: increment(1)
    }, { merge: true });

  });

  await createAuditLog({
    action: "CREATE_SALE",
    user: soldBy,
    data: { productId, quantity, unitPrice }
  });
};

import { useState } from "react";
import { User } from "../types/user";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  const login = (u: User) => setUser(u);
  const logout = () => setUser(null);

  return { user, login, logout };
};

export const can = (user: any, permission: string) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return !!user.permissions?.[permission];
};
import { useState } from "react";
import { createSaleTransaction } from "../../services/sales.service";
import { formatMoney } from "../../utils/money";

export default function POS({ products, user }: any) {

  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const productMap = Object.fromEntries(
    products.map((p: any) => [p.id, p])
  );

  const handleSubmit = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await createSaleTransaction({
        productId,
        quantity: qty,
        unitPrice: price,
        store: "Main",
        soldBy: user.username
      });

      alert("สำเร็จ");
    } catch (e: any) {
      alert(e.message);
    }

    setIsProcessing(false);
  };

  const total = qty * price;

  return (
    <div>
      <h2>POS</h2>

      <select onChange={(e) => {
        const p = productMap[e.target.value];
        setProductId(e.target.value);
        setPrice(p?.price || 0);
      }}>
        <option>เลือกสินค้า</option>
        {products.map((p: any) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <input
        type="number"
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
      />

      <h3>รวม: ฿{formatMoney(total)}</h3>

      <button disabled={isProcessing} onClick={handleSubmit}>
        บันทึก
      </button>
    </div>
  );
}
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { todayISO } from "../../utils/date";
import { formatMoney } from "../../utils/money";

export default function Dashboard() {

  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const ref = doc(db, "daily_summary", todayISO());

    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setSummary(snap.data());
    });
  }, []);

  if (!summary) return <div>Loading...</div>;

  return (
    <div>
      <h2>Dashboard วันนี้</h2>
      <p>ยอดขาย: ฿{formatMoney(summary.totalRevenue)}</p>
      <p>กำไร: ฿{formatMoney(summary.totalProfit)}</p>
      <p>ออเดอร์: {summary.totalOrders}</p>
    </div>
  );
}
import { useEffect, useState } from "react";
import { subscribeProducts } from "./services/product.service";
import POS from "./features/pos/POS";
import Dashboard from "./features/dashboard/Dashboard";

export default function App() {

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    return subscribeProducts(setProducts);
  }, []);

  const mockUser = {
    username: "admin",
    role: "admin"
  };

  return (
    <div>
      <Dashboard />
      <POS products={products} user={mockUser} />
    </div>
  );
}
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /products/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /sales/{doc} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }

    match /audit_logs/{doc} {
      allow read: if request.auth.token.role == "admin";
      allow write: if request.auth != null;
    }

    match /daily_summary/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}

