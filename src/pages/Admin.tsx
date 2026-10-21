import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useReviews } from "../context/ReviewContext";
import type { Product } from "../data/products";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Navigate } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Plus,
  X,
  Save,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Shield,
  Fingerprint,
  Lock,
  Copy,
  Check,
  Wrench,
  Cpu,
  IndianRupee,
  Upload,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { LoginLog } from "../context/AuthContext";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalPrice: number;
  shippingInfo: {
    name: string;
    phone: string;
    address: string;
    notes?: string;
  };
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  paymentMethod: string;
  createdAt: string;
}

interface AdminService {
  id: string;
  name: string;
  price: string;
  description: string;
  icon: string;
  features: string[];
}

interface AdminComponent {
  id: string;
  name: string;
  price: number;
  brand: string;
  specs: string;
  category: string;
}

const statusConfig = {
  Pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  Processing: { icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
  Shipped: { icon: Truck, color: "text-purple-500", bg: "bg-purple-500/10" },
  Delivered: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  Cancelled: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
};

const Admin = () => {
  const { user, token, getAdminLoginLogs } = useAuth();
  const { products, updateProduct, deleteProduct, addProduct, fetchProducts } = useProducts();
  const { reviews, fetchReviews, deleteReview } = useReviews();

  const [activeTab, setActiveTab] = useState<
    "products" | "services" | "components" | "orders" | "reviews" | "security"
  >("products");

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Security Logs State
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Products Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ price: string; description: string; image: string }>({
    price: "",
    description: "",
    image: "",
  });
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    image: "",
  });

  const handleImageFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onSuccess(result);
        toast.success("Photo uploaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Services Edit State
  const [services, setServices] = useState<AdminService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceForm, setEditServiceForm] = useState({ name: "", price: "", description: "" });
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ name: "", price: "", description: "", icon: "Wrench" });

  // Components Edit State
  const [componentsGrouped, setComponentsGrouped] = useState<Record<string, AdminComponent[]>>({});
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);
  const [editComponentForm, setEditComponentForm] = useState({ name: "", price: "", specs: "" });

  useEffect(() => {
    if (activeTab === "reviews") fetchReviews();
    if (activeTab === "orders") fetchAllOrders();
    if (activeTab === "security") fetchSecurityLogs();
    if (activeTab === "services") fetchAdminServices();
    if (activeTab === "components") fetchAdminComponents();
  }, [activeTab]);

  const fetchAdminServices = async () => {
    setServicesLoading(true);
    try {
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      setServices(data);
    } catch {
      toast.error("Could not load services for editing.");
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchAdminComponents = async () => {
    setComponentsLoading(true);
    try {
      const res = await fetch("/api/components");
      if (!res.ok) throw new Error("Failed to fetch PC components");
      const data = await res.json();
      setComponentsGrouped(data);
    } catch {
      toast.error("Could not load PC components.");
    } finally {
      setComponentsLoading(false);
    }
  };

  const fetchSecurityLogs = async () => {
    setLogsLoading(true);
    try {
      const logs = await getAdminLoginLogs();
      setLoginLogs(logs);
    } catch {
      toast.error("Failed to load security login logs.");
    } finally {
      setLogsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    toast.success("Hashed signature copied to clipboard!");
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const fetchAllOrders = async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch all orders");
      const data = await res.json();
      setOrders(data);
    } catch {
      toast.error("Could not load administrative orders.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus as any } : o))
      );
      toast.success(`Order set to ${newStatus}`);
    } catch {
      toast.error("Failed to update order status.");
    }
  };

  if (!user?.isAdmin) return <Navigate to="/login" replace />;

  // --- Product Functions ---
  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditForm({ price: String(p.price), description: p.description, image: p.image || "" });
  };

  const saveEdit = async (id: string) => {
    try {
      await updateProduct(id, {
        price: Number(editForm.price),
        description: editForm.description,
        image: editForm.image,
      });
      setEditingId(null);
      toast.success("Product price, details, and photo updated.");
    } catch {
      toast.error("Failed to update product.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast.success("Product deleted.");
    } catch {
      toast.error("Failed to delete product.");
    }
  };

  const handleAdd = async () => {
    if (!newProduct.name.trim() || !newProduct.price) return;
    try {
      await addProduct({
        name: newProduct.name,
        category: newProduct.category || "Uncategorized",
        price: Number(newProduct.price),
        description: newProduct.description,
        image:
          newProduct.image ||
          "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
        rating: 0,
        reviewCount: 0,
        brand: "Unknown",
        stock: 10,
      });
      setNewProduct({ name: "", category: "", price: "", description: "", image: "" });
      setShowAdd(false);
      toast.success("Product added with set price.");
    } catch {
      toast.error("Failed to add product.");
    }
  };

  // --- Service Functions ---
  const startEditService = (s: AdminService) => {
    setEditingServiceId(s.id);
    setEditServiceForm({ name: s.name, price: s.price, description: s.description });
  };

  const saveServiceEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editServiceForm.name,
          price: editServiceForm.price,
          description: editServiceForm.description,
        }),
      });
      if (!res.ok) throw new Error("Failed to update service");
      toast.success("Service price and details updated.");
      setEditingServiceId(null);
      fetchAdminServices();
    } catch {
      toast.error("Failed to update service price.");
    }
  };

  const handleAddService = async () => {
    if (!newService.name.trim() || !newService.price) return;
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newService),
      });
      if (!res.ok) throw new Error("Failed to add service");
      toast.success("New Service created successfully.");
      setNewService({ name: "", price: "", description: "", icon: "Wrench" });
      setShowAddService(false);
      fetchAdminServices();
    } catch {
      toast.error("Failed to create new service.");
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete service");
      toast.success("Service deleted.");
      fetchAdminServices();
    } catch {
      toast.error("Failed to delete service.");
    }
  };

  // --- Component Functions ---
  const startEditComponent = (c: AdminComponent) => {
    setEditingComponentId(c.id);
    setEditComponentForm({ name: c.name, price: String(c.price), specs: c.specs });
  };

  const saveComponentEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/components/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editComponentForm.name,
          price: Number(editComponentForm.price),
          specs: editComponentForm.specs,
        }),
      });
      if (!res.ok) throw new Error("Failed to update component");
      toast.success("PC Component price updated.");
      setEditingComponentId(null);
      fetchAdminComponents();
    } catch {
      toast.error("Failed to update component price.");
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await deleteReview(id);
      toast.success("Review deleted.");
    } catch {
      toast.error("Failed to delete review.");
    }
  };

  return (
    <div className="container max-w-5xl 2xl:max-w-7xl pt-24 pb-16 px-4 sm:px-6 min-h-screen min-h-dvh">
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in-up"
        style={{ animationDelay: "0.1s" }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Pricing & Management Panel</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Edit pricing for products, services, and PC components
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "products" && (
            <Button
              onClick={() => setShowAdd(!showAdd)}
              variant={showAdd ? "outline" : "default"}
              size="sm"
            >
              {showAdd ? (
                <>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" /> Add Product
                </>
              )}
            </Button>
          )}
          {activeTab === "services" && (
            <Button
              onClick={() => setShowAddService(!showAddService)}
              variant={showAddService ? "outline" : "default"}
              size="sm"
            >
              {showAddService ? (
                <>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" /> Add Service
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-border mb-8 overflow-x-auto no-scrollbar gap-1 sm:gap-2 pb-1">
        {[
          { id: "products", label: "Products" },
          { id: "services", label: "Services", icon: Wrench },
          { id: "components", label: "PC Builder Components", icon: Cpu },
          { id: "orders", label: "Orders" },
          { id: "reviews", label: "Reviews" },
          { id: "security", label: "Security Logs", icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold capitalize transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PRODUCTS PRICING & EDITING */}
      {activeTab === "products" && (
        <>
          {showAdd && (
            <div className="rounded-xl border bg-card p-5 mb-6 space-y-4 animate-fade-in-up">
              <h2 className="font-semibold">New Product</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Name *</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Product name"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Input
                    value={newProduct.category}
                    onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                    placeholder="e.g. processors"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Price (₹) *</Label>
                  <Input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                    placeholder="45000"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="flex items-center justify-between text-xs font-semibold">
                    <span>Product Photo</span>
                    <span className="text-[11px] text-muted-foreground font-normal">Upload photo from device or paste image URL</span>
                  </Label>
                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-muted/20 p-3.5 rounded-xl border border-dashed border-border">
                    {newProduct.image ? (
                      <div className="relative group shrink-0">
                        <img src={newProduct.image} alt="Preview" className="h-16 w-16 object-cover rounded-xl border shadow-sm" />
                        <button
                          type="button"
                          onClick={() => setNewProduct(p => ({ ...p, image: "" }))}
                          className="absolute -top-2 -right-2 bg-destructive text-white p-1 rounded-full shadow hover:bg-destructive/90 transition-all"
                          title="Remove photo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-muted/50 flex flex-col items-center justify-center text-muted-foreground shrink-0 border border-border">
                        <Camera className="h-6 w-6 stroke-1" />
                        <span className="text-[9px] mt-0.5 font-medium">No Photo</span>
                      </div>
                    )}

                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 transition-all gap-1.5 cursor-pointer">
                            <Upload className="h-3.5 w-3.5" /> Upload Photo File
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageFileUpload(e, (dataUrl) => setNewProduct(p => ({ ...p, image: dataUrl })))}
                          />
                        </label>
                        <span className="text-xs text-muted-foreground">or</span>
                      </div>
                      <Input
                        value={newProduct.image}
                        onChange={(e) => setNewProduct((p) => ({ ...p, image: e.target.value }))}
                        placeholder="Paste image URL (https://...)"
                        className="text-xs h-8 bg-background rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Product description"
                  rows={3}
                />
              </div>
              <Button onClick={handleAdd}>
                <Save className="h-4 w-4 mr-1" /> Save Product
              </Button>
            </div>
          )}

          <div className="space-y-8">
            {Object.entries(
              products.reduce((acc, current) => {
                const cat = current.category || "Uncategorized";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(current);
                return acc;
              }, {} as Record<string, Product[]>)
            ).map(([category, catProducts]) => (
              <div key={category} className="space-y-3">
                <h2 className="text-xl font-bold uppercase tracking-wider text-muted-foreground mt-6 mb-3 px-2">
                  {category}
                </h2>
                {catProducts.map((p, idx) => (
                  <div
                    key={p.id}
                    className="rounded-xl border bg-card p-5 animate-fade-in-up"
                    style={{ animationDelay: `${0.05 * idx}s` }}
                  >
                    {editingId === p.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold flex-1">{p.name}</h3>
                          <Button size="sm" onClick={() => saveEdit(p.id)}>
                            <Save className="h-3.5 w-3.5 mr-1" /> Save Product
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="flex items-center gap-1">
                              <IndianRupee className="h-3.5 w-3.5 text-emerald-500" /> New Price
                              (₹)
                            </Label>
                            <Input
                              type="number"
                              value={editForm.price}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, price: e.target.value }))
                              }
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="flex items-center justify-between text-xs font-semibold">
                              <span>Product Photo</span>
                            </Label>
                            <div className="flex items-center gap-3 bg-muted/20 p-2.5 rounded-xl border border-dashed border-border">
                              {editForm.image ? (
                                <img src={editForm.image} alt="Preview" className="h-12 w-12 object-cover rounded-lg border shrink-0 shadow-sm" />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border">
                                  <Camera className="h-4 w-4" />
                                </div>
                              )}
                              <div className="flex-1 space-y-1">
                                <label className="cursor-pointer inline-block">
                                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 transition-all gap-1 cursor-pointer">
                                    <Upload className="h-3 w-3" /> Upload Photo
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageFileUpload(e, (dataUrl) => setEditForm(f => ({ ...f, image: dataUrl })))}
                                  />
                                </label>
                                <Input
                                  value={editForm.image}
                                  onChange={(e) => setEditForm((f) => ({ ...f, image: e.target.value }))}
                                  placeholder="Or paste URL"
                                  className="text-xs h-7 bg-background rounded-lg"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label>Description</Label>
                          <Textarea
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, description: e.target.value }))
                            }
                            rows={2}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-14 w-14 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{p.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {p.description}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-emerald-400 shrink-0 text-base">
                          ₹{p.price.toLocaleString()}
                        </span>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => startEdit(p)}
                            title="Edit Price"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(p.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* TAB 2: SERVICES PRICING & EDITING */}
      {activeTab === "services" && (
        <div className="space-y-6">
          {showAddService && (
            <div className="rounded-xl border bg-card p-5 mb-6 space-y-4 animate-fade-in-up">
              <h2 className="font-semibold">New Service</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Service Name *</Label>
                  <Input
                    value={newService.name}
                    onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Printer Repair & Service"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Pricing (e.g. From ₹799) *</Label>
                  <Input
                    value={newService.price}
                    onChange={(e) => setNewService((s) => ({ ...s, price: e.target.value }))}
                    placeholder="From ₹799"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={newService.description}
                  onChange={(e) =>
                    setNewService((s) => ({ ...s, description: e.target.value }))
                  }
                  placeholder="Service description"
                  rows={2}
                />
              </div>
              <Button onClick={handleAddService}>
                <Save className="h-4 w-4 mr-1" /> Create Service
              </Button>
            </div>
          )}

          {servicesLoading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Fetching services...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((s, idx) => (
                <div
                  key={s.id}
                  className="rounded-xl border bg-card p-5 animate-fade-in-up"
                  style={{ animationDelay: `${0.05 * idx}s` }}
                >
                  {editingServiceId === s.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={editServiceForm.name}
                          onChange={(e) =>
                            setEditServiceForm((f) => ({ ...f, name: e.target.value }))
                          }
                          className="font-bold flex-1"
                        />
                        <Button size="sm" onClick={() => saveServiceEdit(s.id)}>
                          <Save className="h-3.5 w-3.5 mr-1" /> Save Service
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingServiceId(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-emerald-400">
                          Pricing Text (e.g. From ₹1,999)
                        </Label>
                        <Input
                          value={editServiceForm.price}
                          onChange={(e) =>
                            setEditServiceForm((f) => ({ ...f, price: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Description</Label>
                        <Textarea
                          value={editServiceForm.description}
                          onChange={(e) =>
                            setEditServiceForm((f) => ({ ...f, description: e.target.value }))
                          }
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-bold text-base">{s.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {s.description}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 text-lg shrink-0">
                        {s.price}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEditService(s)}
                          title="Edit Service Price"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteService(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PC BUILDER COMPONENTS PRICING */}
      {activeTab === "components" && (
        <div className="space-y-6">
          {componentsLoading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Fetching components...</p>
            </div>
          ) : (
            Object.entries(componentsGrouped).map(([category, parts]) => (
              <div key={category} className="space-y-3">
                <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2">
                  {category}
                </h2>
                {parts.map((c, idx) => (
                  <div
                    key={c.id}
                    className="rounded-xl border bg-card p-4 animate-fade-in-up"
                    style={{ animationDelay: `${0.03 * idx}s` }}
                  >
                    {editingComponentId === c.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm flex-1">{c.name}</h3>
                          <Button size="sm" onClick={() => saveComponentEdit(c.id)}>
                            <Save className="h-3.5 w-3.5 mr-1" /> Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingComponentId(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Component Price (₹)</Label>
                            <Input
                              type="number"
                              value={editComponentForm.price}
                              onChange={(e) =>
                                setEditComponentForm((f) => ({ ...f, price: e.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Specifications</Label>
                            <Input
                              value={editComponentForm.specs}
                              onChange={(e) =>
                                setEditComponentForm((f) => ({ ...f, specs: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold">{c.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({c.specs})</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          ₹{c.price.toLocaleString()}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEditComponent(c)}
                          title="Edit Component Price"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: ORDERS FULFILLMENT */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {ordersLoading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Fetching all orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
              No orders found system-wide.
            </p>
          ) : (
            orders.map((order, idx) => {
              const StatusIcon = statusConfig[order.status].icon;
              return (
                <div
                  key={order._id}
                  className="bg-card rounded-2xl border border-border overflow-hidden p-6 animate-fade-in-up"
                  style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase text-muted-foreground">
                          ID:
                        </span>
                        <span className="font-mono text-xs font-semibold">{order._id}</span>
                      </div>
                      <h3 className="font-bold text-lg">{order.shippingInfo.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                          statusConfig[order.status].bg
                        }`}
                      >
                        <StatusIcon
                          className={`h-3.5 w-3.5 ${statusConfig[order.status].color}`}
                        />
                        <span
                          className={`text-xs font-bold ${statusConfig[order.status].color}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <select
                        className="text-xs bg-muted border-none rounded-lg px-2 py-1 focus:ring-1 focus:ring-primary h-8 font-semibold cursor-pointer"
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      >
                        {Object.keys(statusConfig).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-4 mb-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">
                      Shipping Details
                    </p>
                    <p className="text-sm font-medium">{order.shippingInfo.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.shippingInfo.phone}
                    </p>
                    {order.shippingInfo.notes && (
                      <p className="text-xs italic text-muted-foreground mt-2">
                        "{order.shippingInfo.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-end border-t border-border pt-4">
                    <div className="text-xs text-muted-foreground">
                      {order.items.length} items •{" "}
                      <span className="font-bold text-foreground">
                        ₹{order.totalPrice.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      {order.paymentMethod}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 5: REVIEWS MODERATION */}
      {activeTab === "reviews" && (
        <>
          <div className="mt-4 mb-6">
            <h2 className="text-xl font-bold">Manage Reviews</h2>
            <p className="text-sm text-muted-foreground">Delete inappropriate or spam reviews</p>
          </div>
          <div className="space-y-3">
            {reviews.map((r, idx) => (
              <div
                key={r.id}
                className="rounded-xl border bg-card p-4 flex items-start gap-4 animate-fade-in-up"
                style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{r.userName}</span>
                    <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {r.rating} ★
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">{r.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">"{r.comment}"</p>
                  {r.productId && (
                    <p className="text-xs text-muted-foreground/60">Product ID: {r.productId}</p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive shrink-0"
                  onClick={() => handleDeleteReview(r.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No reviews to manage.
              </p>
            )}
          </div>
        </>
      )}

      {/* TAB 6: SECURITY & HASHED LOGS */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-6 rounded-2xl border border-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Hashed Security & Login Audit Logs</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Every login attempt is processed into an immutable SHA-256 cryptographic signature
                and stored in MongoDB.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> SHA-256 Enabled
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                Total Logs: {loginLogs.length}
              </span>
            </div>
          </div>

          {logsLoading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Fetching encrypted login records...</p>
            </div>
          ) : loginLogs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
              <Fingerprint className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No login audit logs recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {loginLogs.map((log, idx) => (
                <div
                  key={log._id}
                  className="bg-card rounded-2xl border border-border p-5 space-y-3 animate-fade-in-up hover:border-primary/40 transition-colors"
                  style={{ animationDelay: `${0.05 * idx}s` }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="font-bold text-sm">{log.email}</span>
                      {log.userId?.isAdmin && (
                        <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-xl">
                    <div>
                      <span className="font-semibold text-muted-foreground uppercase text-[10px] block mb-0.5">
                        Client IP Address:
                      </span>
                      <span className="font-mono text-foreground">{log.ipAddress}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-muted-foreground uppercase text-[10px] block mb-0.5">
                        User Agent:
                      </span>
                      <span className="font-mono text-foreground truncate block">
                        {log.userAgent}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-primary" /> SHA-256 Login Signature:
                      </span>
                      <button
                        onClick={() => copyToClipboard(log.hashedDetails)}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        {copiedHash === log.hashedDetails ? (
                          <>
                            <Check className="h-3 w-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy Hash
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-zinc-950 text-zinc-300 font-mono text-[11px] p-2.5 rounded-xl overflow-x-auto select-all break-all border border-zinc-800">
                      {log.hashedDetails}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
