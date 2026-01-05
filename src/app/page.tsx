'use client';

import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  ShoppingCart, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  Package, 
  UserCircle, 
  Home, 
  X, 
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  Search,
  Eye,
  EyeOff,
  ShieldAlert
} from 'lucide-react';

// Types

interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  password?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  image?: string;
  stock: number;
  userId?: string;
}

type View = 'LOGIN' | 'DASHBOARD' | 'PROFILE';

// Constants

const USER_API = 'https://aben.theokaitou.my.id/users';
const PRODUCT_API = 'https://nat.theokaitou.my.id/api/products';

export default function EMartApp() {
  const [view, setView] = useState<View>('LOGIN');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [authTab, setAuthTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', username: '', password: '' });

  // Smart field transfer between Login and Sign Up
  const switchAuthTab = (tab: 'LOGIN' | 'SIGNUP') => {
    if (tab === 'SIGNUP' && authTab === 'LOGIN') {
      const value = authForm.username || '';
      if (value.includes('@')) {
        setAuthForm(prev => ({ ...prev, email: value, username: '' }));
      } else {
        setAuthForm(prev => ({ ...prev, email: '' }));
      }
    } else if (tab === 'LOGIN' && authTab === 'SIGNUP') {
      if (authForm.email && !authForm.username) {
        setAuthForm(prev => ({ ...prev, username: prev.email }));
      }
    }
    setAuthTab(tab);
  };

  const [showPassword, setShowPassword] = useState(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({ title: '', price: 0, description: '', category: '', image: '', stock: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', password: '' });
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(PRODUCT_API);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      showToast('Failed to load products', 'error');
    }
  };

  useEffect(() => {
    if (view === 'DASHBOARD') fetchProducts();
  }, [view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(USER_API);
      if (!res.ok) throw new Error('Could not connect');
      const users: User[] = await res.json();
      const user = users.find(u => 
        (u.username === authForm.username || u.email === authForm.username) && 
        u.password === authForm.password
      );
      
      if (user) {
        setCurrentUser(user);
        setProfileForm({ 
          fullName: user.fullName || '', 
          email: user.email || user.username || '',
          password: user.password || '' 
        });
        setView('DASHBOARD');
        showToast(`Welcome back, ${user.fullName}`);
      } else {
        showToast('Invalid credentials. Check email/username or password.', 'error');
      }
    } catch (err) {
      showToast('Server error: Unable to verify credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(USER_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });
      if (res.ok) {
        showToast('Account created! Please login.');
        setAuthTab('LOGIN');
      } else {
        showToast('Registration failed. Username/Email might be taken.', 'error');
      }
    } catch (err) {
      showToast('Network error during registration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${PRODUCT_API}/${editingId}` : PRODUCT_API;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productForm, userId: 'admin' }),
      });
      if (res.ok) {
        showToast(editingId ? 'Product updated' : 'Product added');
        setProductForm({ title: '', price: 0, description: '', category: '', image: '', stock: 0 });
        setEditingId(null);
        fetchProducts();
      }
    } catch (err) {
      showToast('Error saving product', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      const res = await fetch(`${PRODUCT_API}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Product removed');
        fetchProducts();
      }
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`${USER_API}/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...currentUser, ...profileForm }),
      });
      if (res.ok) {
        setCurrentUser({ ...currentUser, ...profileForm });
        showToast('Profile updated');
      }
    } catch (err) {
      showToast('Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!currentUser || currentUser.username === 'admin') return;
    setLoading(true);
    try {
      const res = await fetch(`${USER_API}/${currentUser.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Account permanently deleted', 'success');
        setCurrentUser(null);
        setView('LOGIN');
        setShowDeleteModal(false);
      }
    } catch (err) {
      showToast('Deletion failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const itemCounts = cart.reduce((acc: any, item) => {
        acc[item.id] = (acc[item.id] || 0) + 1;
        return acc;
      }, {});

      const updatePromises = Object.keys(itemCounts).map(async (id) => {
        const product = products.find(p => p.id === id);
        if (!product) return;
        const newStock = Math.max(0, product.stock - itemCounts[id]);
        return fetch(`${PRODUCT_API}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...product, stock: newStock, userId: 'admin' }),
        });
      });

      await Promise.all(updatePromises);
      setCart([]);
      showToast('Order successful! Stock updated.');
      fetchProducts();
    } catch (err) {
      showToast('Transaction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-zinc-200 shadow-xl rounded-2xl overflow-hidden">
          <div className="flex border-b border-zinc-100">
            <button 
              type="button"
              onClick={() => switchAuthTab('LOGIN')}
              className={`flex-1 py-4 font-semibold transition-all ${authTab === 'LOGIN' ? 'text-zinc-900' : 'text-zinc-400 bg-zinc-50/50 hover:bg-zinc-50'}`}
            >
              Login
            </button>
            <button 
              type="button"
              onClick={() => switchAuthTab('SIGNUP')}
              className={`flex-1 py-4 font-semibold transition-all ${authTab === 'SIGNUP' ? 'text-zinc-900' : 'text-zinc-400 bg-zinc-50/50 hover:bg-zinc-50'}`}
            >
              Sign Up
            </button>
          </div>
          
          <form className="p-8 space-y-4" onSubmit={authTab === 'LOGIN' ? handleLogin : handleRegister}>
            <div className="text-center mb-8">
              <div className="inline-flex p-3 bg-zinc-900 rounded-xl mb-4 shadow-lg shadow-zinc-200">
                <ShoppingCart className="text-white size-8" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">e-mart</h1>
              <p className="text-zinc-500 text-sm mt-1 font-medium tracking-tight">Smart Integrated Systems</p>
            </div>

            {authTab === 'SIGNUP' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3.5 size-4 text-zinc-400" />
                  <input 
                    required
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-zinc-900 font-bold placeholder:text-zinc-300"
                    placeholder="John Doe"
                    value={authForm.fullName || ''}
                    onChange={e => setAuthForm({...authForm, fullName: e.target.value})}
                  />
                </div>
              </div>
            )}

            {authTab === 'SIGNUP' ? (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 size-4 text-zinc-400" />
                    <input 
                      required
                      type="email"
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-zinc-900 font-bold placeholder:text-zinc-300"
                      placeholder="name@email.com"
                      value={authForm.email || ''}
                      onChange={e => setAuthForm({...authForm, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Username</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 size-4 text-zinc-400" />
                    <input 
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-zinc-900 font-bold placeholder:text-zinc-300"
                      placeholder="choose_username"
                      value={authForm.username || ''}
                      onChange={e => setAuthForm({...authForm, username: e.target.value})}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Email or Username</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 size-4 text-zinc-400" />
                  <input 
                    required
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-zinc-900 font-bold placeholder:text-zinc-300"
                    placeholder="Enter email or username"
                    value={authForm.username || ''}
                    onChange={e => setAuthForm({...authForm, username: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 size-4 text-zinc-400" />
                <input 
                  required
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-zinc-900 font-bold placeholder:text-zinc-300"
                  placeholder="••••••••"
                  value={authForm.password || ''}
                  onChange={e => setAuthForm({...authForm, password: e.target.value})}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 p-1 text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full py-4 bg-zinc-900 text-white rounded-xl font-black hover:bg-zinc-800 transition-all disabled:opacity-50 mt-6 shadow-xl shadow-zinc-200 uppercase tracking-tighter text-lg"
            >
              {loading ? 'Processing...' : authTab === 'LOGIN' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
        {toast && (
          <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white font-bold animate-in slide-in-from-bottom-10 z-50 ${toast.type === 'success' ? 'bg-zinc-900' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  const isAdmin = currentUser?.username === 'admin';
  const cartTotal = cart.reduce((acc, item) => acc + Number(item.price), 0);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-zinc-900 p-1.5 rounded-lg shadow-sm">
              <ShoppingCart className="text-white size-5" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">e-mart</span>
          </div>

          <nav className="flex items-center gap-1 md:gap-8">
            <button onClick={() => setView('DASHBOARD')} className={`flex items-center gap-2 text-sm font-bold transition-all px-3 py-1.5 rounded-lg ${view === 'DASHBOARD' ? 'text-zinc-900 bg-zinc-100' : 'text-zinc-400 hover:text-zinc-900'}`}>
              <Home size={16} /> <span className="hidden md:inline">Dashboard</span>
            </button>
            <button onClick={() => setView('PROFILE')} className={`flex items-center gap-2 text-sm font-bold transition-all px-3 py-1.5 rounded-lg ${view === 'PROFILE' ? 'text-zinc-900 bg-zinc-100' : 'text-zinc-400 hover:text-zinc-900'}`}>
              <UserCircle size={16} /> <span className="hidden md:inline">Profile</span>
            </button>
            <div className="h-4 w-px bg-zinc-200 mx-2 hidden md:block" />
            <button 
              onClick={() => { setCurrentUser(null); setView('LOGIN'); }}
              className="flex items-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
            >
              <LogOut size={16} /> <span className="hidden md:inline">Logout</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'DASHBOARD' && (
          <div className="space-y-10">
            {isAdmin && (
              <section className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <Package className="text-zinc-900 size-6" />
                  <h2 className="text-xl font-black tracking-tight uppercase">Admin Inventory Control</h2>
                </div>
                <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <input 
                      required
                      placeholder="Product Title"
                      className="w-full px-5 py-3 rounded-2xl border border-zinc-200 bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-zinc-900 font-bold"
                      value={productForm.title || ''}
                      onChange={e => setProductForm({...productForm, title: e.target.value})}
                    />
                  </div>
                  <input 
                    required
                    type="number"
                    placeholder="Price ($)"
                    className="w-full px-5 py-3 rounded-2xl border border-zinc-200 bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-zinc-900 font-bold"
                    value={productForm.price ?? ''}
                    onChange={e => setProductForm({...productForm, price: e.target.value ? Number(e.target.value) : 0})}
                  />
                  <input 
                    required
                    placeholder="Category"
                    className="w-full px-5 py-3 rounded-2xl border border-zinc-200 bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-zinc-900 font-bold"
                    value={productForm.category || ''}
                    onChange={e => setProductForm({...productForm, category: e.target.value})}
                  />
                  <input 
                    required
                    type="number"
                    placeholder="Stock Qty"
                    className="w-full px-5 py-3 rounded-2xl border border-zinc-200 bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-zinc-900 font-bold"
                    value={productForm.stock ?? ''}
                    onChange={e => setProductForm({...productForm, stock: e.target.value ? Number(e.target.value) : 0})}
                  />
                  <div className="md:col-span-3">
                    <input 
                      placeholder="Image URL"
                      className="w-full px-5 py-3 rounded-2xl border border-zinc-200 bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-zinc-900 font-bold"
                      value={productForm.image || ''}
                      onChange={e => setProductForm({...productForm, image: e.target.value})}
                    />
                  </div>
                  <button className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-800 transition-all font-bold">
                    {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                    {editingId ? 'Update' : 'Add Item'}
                  </button>
                  <div className="md:col-span-4">
                    <textarea 
                      required
                      placeholder="Product Description"
                      className="w-full px-5 py-3 rounded-2xl border border-zinc-200 bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none transition-all text-zinc-900 font-bold"
                      rows={2}
                      value={productForm.description || ''}
                      onChange={e => setProductForm({...productForm, description: e.target.value})}
                    />
                  </div>
                </form>
              </section>
            )}

            <div className="flex flex-col lg:flex-row gap-12">
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-8">
                  <h3 className="text-2xl font-black tracking-tight">PRODUCT LIST</h3>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{products.length} Items Available</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                  {products.map(product => {
                    const isOutOfStock = product.stock <= 0;
                    return (
                      <div key={product.id} className="group flex flex-col bg-white border border-zinc-100 rounded-3xl p-5 hover:border-zinc-300 transition-all hover:shadow-xl hover:shadow-zinc-100 relative">
                        <div className="aspect-4/3 bg-zinc-50 rounded-2xl mb-5 flex items-center justify-center text-zinc-200 group-hover:scale-[1.02] transition-transform overflow-hidden relative border border-zinc-50">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.title || 'Product'} 
                              className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = ""; 
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Package size={48} />
                          )}
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-zinc-100">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{product.category}</span>
                          </div>
                          {isOutOfStock && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                              <span className="bg-white text-black text-xs font-black px-4 py-2 rounded-full shadow-xl uppercase">Sold Out</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-zinc-900 text-lg line-clamp-2 pr-2">{product.title}</h4>
                            <span className="font-black text-zinc-900 shrink-0">${product.price}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className={`size-2 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isOutOfStock ? 'text-red-500' : 'text-emerald-600'}`}>
                              {isOutOfStock ? 'No Stock' : `${product.stock} in stock`}
                            </span>
                          </div>
                          <p className="text-zinc-500 text-sm mb-6 line-clamp-3 leading-relaxed">{product.description}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          {isAdmin ? (
                            <>
                              <button 
                                onClick={() => { setEditingId(product.id); setProductForm(product); }}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-all text-sm font-bold"
                              >
                                <Edit2 size={16} /> Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="px-4 py-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <button 
                              disabled={isOutOfStock}
                              onClick={() => {
                                setCart([...cart, product]);
                                showToast('Added to cart');
                              }}
                              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl transition-all text-sm font-bold shadow-lg shadow-zinc-200 ${isOutOfStock ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
                            >
                              <ShoppingCart size={18} /> {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {!isAdmin && (
                <aside className="w-full lg:w-96">
                  <div className="sticky top-24 border-2 border-zinc-900 rounded-[2.5rem] p-8 bg-zinc-900 text-white shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-black tracking-tighter flex items-center gap-3">
                        <ShoppingCart size={24} /> MY CART
                      </h3>
                      <span className="bg-white text-zinc-900 text-xs font-black px-3 py-1 rounded-full">{cart.length}</span>
                    </div>
                    
                    {cart.length === 0 ? (
                      <div className="py-20 text-center opacity-30">
                        <ShoppingCart className="mx-auto mb-4" size={48} />
                        <p className="text-sm font-bold">Your cart is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="max-h-75 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                          {cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center group">
                              <div className="flex-1 min-w-0 pr-4">
                                <p className="font-bold truncate text-sm">{item.title}</p>
                                <p className="text-zinc-400 text-xs">${item.price}</p>
                              </div>
                              <button 
                                onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                                className="text-zinc-500 hover:text-white transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="pt-6 border-t border-zinc-800">
                          <div className="flex justify-between items-end mb-6">
                            <span className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Total Value</span>
                            <span className="text-3xl font-black tracking-tighter">${cartTotal.toFixed(2)}</span>
                          </div>
                          <button 
                            disabled={loading || cart.length === 0}
                            onClick={handleCheckout}
                            className="w-full py-5 bg-white text-zinc-900 rounded-2xl font-black hover:bg-zinc-100 transition-all disabled:opacity-50"
                          >
                            {loading ? 'PROCESSING...' : 'CHECKOUT NOW'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </aside>
              )}
            </div>
          </div>
        )}

        {view === 'PROFILE' && (
          <div className="max-w-2xl mx-auto py-12">
            <h2 className="text-4xl font-black tracking-tighter mb-10 text-center uppercase">ACCOUNT SECURITY</h2>

            <div className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-10 shadow-sm mb-10">
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      required
                      className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900/5 outline-none font-bold text-zinc-900"
                      value={profileForm.fullName || ''}
                      onChange={e => setProfileForm({...profileForm, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Email</label>
                    <input 
                      required
                      type="email"
                      className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900/5 outline-none font-bold text-zinc-900"
                      value={profileForm.email || ''}
                      onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <input 
                      required
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900/5 outline-none font-bold text-zinc-900"
                      value={profileForm.password || ''}
                      onChange={e => setProfileForm({...profileForm, password: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 p-1 text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <button 
                  disabled={loading}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-xl shadow-zinc-100"
                >
                  {loading ? 'Saving Changes...' : 'SECURE UPDATES'}
                </button>
              </form>
            </div>

            {!isAdmin && (
              <div className="bg-red-50 border-2 border-red-100 rounded-[2.5rem] p-10">
                <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                  <div className="p-5 bg-white text-red-500 rounded-3xl shadow-sm border border-red-50">
                    <Trash2 size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-red-900 tracking-tight mb-2 uppercase">Self-Destruct Sequence</h3>
                    <p className="text-red-700/70 text-sm font-medium leading-relaxed mb-6">
                      Deleting your account will purge all personal data. This action is irreversible.
                    </p>
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                    >
                      PERMANENT DELETE
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showDeleteModal && !isAdmin && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="p-5 bg-red-50 text-red-600 rounded-full mb-6">
                <ShieldAlert size={48} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black tracking-tighter uppercase mb-2">Security Confirmation</h3>
              <p className="text-zinc-500 font-medium text-sm leading-relaxed mb-8">
                You are about to permanently delete your account. This action will purge all your vault data and cannot be undone. Are you absolutely sure?
              </p>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={confirmDeleteAccount}
                  disabled={loading}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'PURGING DATA...' : 'CONFIRM SELF-DESTRUCT'}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-4 bg-zinc-100 text-zinc-900 rounded-2xl font-black hover:bg-zinc-200 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white font-bold animate-in slide-in-from-bottom-10 z-50 ${toast.type === 'success' ? 'bg-zinc-900' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
