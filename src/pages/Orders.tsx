import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { firestoreDb } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { motion } from "framer-motion";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ChevronRight,
  ShoppingBag,
  Loader2,
  AlertTriangle,
  CalendarDays,
  MapPin,
  UserRound,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

// Only this email can see every customer's orders.
// IMPORTANT: also enforce this in Firestore Security Rules.
const ADMIN_EMAIL = "anbuennumnan@gmail.com";

type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

interface PCBuildComponent {
  id: string;
  category: string;
  name: string;
  price: number;
  brand: string;
  specs: string;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  type?: "product" | "build";
  components?: PCBuildComponent[];
}

interface ShippingInfo {
  name?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

interface Order {
  _id: string;
  userId: string;
  userEmail?: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: string | null;
  paymentMethod?: string;
  trackingId?: string;
  courier?: string;
  estimatedDeliveryDate?: string;
  shippingInfo?: ShippingInfo;
}

const statusConfig: Record<
  OrderStatus,
  {
    icon: typeof Clock;
    color: string;
    bg: string;
    step: number;
  }
> = {
  Pending: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    step: 1,
  },
  Processing: {
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    step: 2,
  },
  Shipped: {
    icon: Truck,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    step: 3,
  },
  Delivered: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    step: 4,
  },
  Cancelled: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    step: 0,
  },
};

const trackingSteps = [
  { label: "Order Placed", step: 1 },
  { label: "Processing & Assembly", step: 2 },
  { label: "Shipped", step: 3 },
  { label: "Delivered", step: 4 },
];

const validStatuses: OrderStatus[] = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const formatDate = (value: string | null | undefined) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatPrice = (value: number | string | undefined) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

function parseOrder(id: string, data: DocumentData): Order {
  let createdAt: string | null = null;
  const rawDate = data.createdAt;

  if (rawDate instanceof Timestamp) {
    createdAt = rawDate.toDate().toISOString();
  } else if (typeof rawDate === "string") {
    createdAt = rawDate;
  } else if (rawDate && typeof rawDate.toDate === "function") {
    createdAt = rawDate.toDate().toISOString();
  }

  const status: OrderStatus =
    typeof data.status === "string" &&
    validStatuses.includes(data.status as OrderStatus)
      ? (data.status as OrderStatus)
      : "Pending";

  const items: OrderItem[] = Array.isArray(data.items)
    ? data.items.map((item: DocumentData, index: number) => ({
        productId: String(item.productId ?? item.id ?? index),
        name: String(item.name ?? "Unnamed item"),
        price: Number(item.price ?? 0),
        quantity: Math.max(1, Number(item.quantity ?? 1)),
        type: item.type === "build" ? "build" : "product",
        components: Array.isArray(item.components)
          ? item.components.map((component: DocumentData) => ({
              id: String(component.id ?? ""),
              category: String(component.category ?? ""),
              name: String(component.name ?? ""),
              price: Number(component.price ?? 0),
              brand: String(component.brand ?? ""),
              specs: String(component.specs ?? ""),
            }))
          : [],
      }))
    : [];

  return {
    _id: id,
    userId: String(data.userId ?? ""),
    userEmail:
      typeof data.userEmail === "string" ? data.userEmail : undefined,
    items,
    totalPrice: Number(data.totalPrice ?? 0),
    status,
    createdAt,
    paymentMethod: data.paymentMethod,
    trackingId: data.trackingId,
    courier: data.courier,
    estimatedDeliveryDate: data.estimatedDeliveryDate,
    shippingInfo: data.shippingInfo ?? undefined,
  };
}

const Orders = () => {
  const { user, isLoading: authLoading } = useAuth();

  // Step 1: check the signed-in email first.
  // Admin email  -> sees ALL orders.
  // Anyone else  -> sees only orders whose userId equals their Firebase UID.
  const userEmail = user?.email?.trim().toLowerCase() ?? "";
  const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchOrders = async () => {
      if (authLoading) return;

      if (!user) {
        setOrders([]);
        setLoading(false);
        setLoadError("");
        return;
      }

      setLoading(true);
      setLoadError("");

      try {
        const ordersCollection = collection(firestoreDb, "orders");

        // Admin: every order from every user.
        // Customer: compare each order's userId with the Firebase UID.
        const ordersQuery = isAdmin
          ? query(ordersCollection)
          : query(ordersCollection, where("userId", "==", user.id));

        const snapshot = await getDocs(ordersQuery);

        const fetchedOrders = snapshot.docs.map((document) =>
          parseOrder(document.id, document.data())
        );

        fetchedOrders.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

          return dateB - dateA;
        });

        if (!cancelled) {
          setOrders(fetchedOrders);
        }
      } catch (error) {
        console.error("Failed to load orders:", error);

        if (!cancelled) {
          setOrders([]);
          setLoadError(
            "Could not load orders. Check your internet connection and Firestore Security Rules."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email, authLoading, isAdmin]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">
          Loading {isAdmin ? "all orders" : "your orders"}...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex flex-col items-center justify-center bg-background px-4">
        <Package className="h-16 w-16 text-muted-foreground mb-6" />

        <h2 className="font-display text-3xl font-bold mb-3">
          Login to View Orders
        </h2>

        <p className="text-muted-foreground mb-8 text-center">
          Sign in to view your order history and delivery tracking.
        </p>

        <Link to="/login">
          <Button size="lg" className="rounded-xl px-8">
            Login
          </Button>
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex flex-col items-center justify-center px-4">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-6" />

        <h2 className="font-display text-3xl font-bold mb-3">
          Unable to Load Orders
        </h2>

        <p className="text-muted-foreground text-center max-w-lg mb-6">
          {loadError}
        </p>

        <Button
          onClick={() => window.location.reload()}
          className="rounded-xl"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex flex-col items-center justify-center bg-background px-4">
        <div className="bg-muted/30 p-10 rounded-full mb-6 border border-border/50">
          <ShoppingBag className="h-16 w-16 text-muted-foreground stroke-1" />
        </div>

        <h2 className="font-display text-3xl font-bold mb-3 text-center">
          {isAdmin ? "No Customer Orders Yet" : "No Orders Yet"}
        </h2>

        <p className="text-muted-foreground mb-8 text-center max-w-md">
          {isAdmin
            ? "Orders placed by customers will appear here."
            : "You have not placed any orders yet. Start shopping to see your orders here."}
        </p>

        <Link to="/products">
          <Button size="lg" className="rounded-xl px-8">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            {isAdmin ? "All Customer Orders" : "Order History & Tracking"}
          </h1>

          <p className="text-muted-foreground font-medium">
            {isAdmin
              ? "View customer purchases, PC configurations, and delivery information."
              : "View your purchases and follow their order status."}
          </p>

          <p className="text-xs text-muted-foreground mt-2">
            {orders.length} {orders.length === 1 ? "order" : "orders"} found
            {isAdmin ? " across all customers." : " for your account."}
          </p>
        </motion.div>

        <div className="space-y-8">
          {orders.map((order, index) => {
            const statusInfo = statusConfig[order.status];
            const StatusIcon = statusInfo.icon;
            const currentStep = statusInfo.step;

            const trackingNumber =
              order.trackingId ||
              `TRK-GZ-${order._id.slice(-6).toUpperCase()}`;

            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                className="bg-card rounded-2xl border border-border overflow-hidden shadow-md hover:shadow-lg transition-all"
              >
                <div className="p-5 sm:p-6 md:p-8 space-y-6">
                  {/* Order summary */}
                  <div className="flex flex-wrap items-center justify-between gap-5 pb-6 border-b border-border">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Tracking Number
                      </span>

                      <span className="font-mono text-sm font-bold text-sky-400">
                        {trackingNumber}
                      </span>

                      {isAdmin && (
                        <span className="text-xs text-muted-foreground">
                          Order ID: {order._id}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Payment Method
                      </span>

                      <span className="text-sm font-semibold">
                        {order.paymentMethod || "Cash on Delivery (COD)"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Estimated Delivery
                      </span>

                      <span className="text-sm font-bold text-emerald-400">
                        {order.estimatedDeliveryDate || "3–5 Business Days"}
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.bg}`}
                    >
                      <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                      <span className={`text-sm font-bold ${statusInfo.color}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Ordered: {formatDate(order.createdAt)}
                    </div>
                  </div>

                  {/* Customer details for admin */}
                  {isAdmin && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Customer Account
                      </h3>

                      <div className="flex items-start gap-2 text-sm">
                        <UserRound className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />

                        <div className="min-w-0">
                          <p className="font-semibold">
                            {order.shippingInfo?.name || "Name not provided"}
                          </p>

                          <p className="text-muted-foreground break-all">
                            {order.userEmail || "Email not saved with this order"}
                          </p>

                          <p className="text-xs text-muted-foreground break-all mt-1">
                            User ID: {order.userId || "Not available"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tracking timeline */}
                  {order.status !== "Cancelled" ? (
                    <div className="py-4 px-4 sm:px-5 bg-secondary/40 rounded-2xl border border-border/50">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5">
                        Order Progress
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {trackingSteps.map((step) => {
                          const isDone = currentStep >= step.step;

                          return (
                            <div
                              key={step.step}
                              className="flex items-center gap-3"
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isDone
                                    ? "bg-sky-500 text-white"
                                    : "bg-muted text-muted-foreground border border-border"
                                }`}
                              >
                                {isDone ? "✓" : step.step}
                              </div>

                              <div>
                                <p
                                  className={`text-xs font-bold ${
                                    isDone
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {step.label}
                                </p>

                                <p className="text-[10px] text-muted-foreground">
                                  {isDone ? "Completed" : "Pending"}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
                      This order has been cancelled.
                    </div>
                  )}

                  {/* Items and PC components */}
                  <div className="grid md:grid-cols-2 gap-8 pt-2">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Purchased Items
                      </h3>

                      <div className="space-y-3">
                        {order.items.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No item details were saved for this order.
                          </p>
                        ) : (
                          order.items.map((item, itemIndex) => (
                            <div
                              key={`${item.productId}-${itemIndex}`}
                              className="text-sm bg-muted/20 p-3 rounded-xl border border-border/40"
                            >
                              <div className="flex flex-wrap justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">{item.name}</p>

                                  <p className="text-muted-foreground text-xs mt-1">
                                    Qty: {item.quantity} × ₹
                                    {formatPrice(item.price)}
                                  </p>
                                </div>

                                <span className="font-bold text-sky-400 shrink-0">
                                  ₹{formatPrice(item.price * item.quantity)}
                                </span>
                              </div>

                              {item.type === "build" &&
                                (item.components?.length ?? 0) > 0 && (
                                  <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                                    <p className="text-xs font-bold text-sky-400">
                                      PC Build Components
                                    </p>

                                    {item.components!.map(
                                      (component, componentIndex) => (
                                        <div
                                          key={`${component.category}-${
                                            component.id || componentIndex
                                          }`}
                                          className="flex flex-wrap justify-between gap-2 text-xs"
                                        >
                                          <div className="min-w-0">
                                            <p>
                                              {component.category}:{" "}
                                              {component.name}
                                            </p>

                                            <p className="text-muted-foreground mt-0.5">
                                              {[component.brand, component.specs]
                                                .filter(Boolean)
                                                .join(" · ")}
                                            </p>
                                          </div>

                                          <span className="text-muted-foreground shrink-0">
                                            ₹{formatPrice(component.price)}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Total and delivery information */}
                    <div className="flex flex-col justify-between gap-6">
                      <div className="text-left md:text-right">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Order Total
                        </p>

                        <p className="font-display text-3xl font-black text-sky-400">
                          ₹{formatPrice(order.totalPrice)}
                        </p>

                        <p className="text-xs text-muted-foreground mt-2">
                          Courier: {order.courier || "SpeedPost Express"}
                        </p>
                      </div>

                      {order.shippingInfo && (
                        <div className="bg-muted/20 border border-border/50 rounded-xl p-4 space-y-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                            Delivery Information
                          </h3>

                          {order.shippingInfo.name && (
                            <p className="text-sm font-semibold">
                              {order.shippingInfo.name}
                            </p>
                          )}

                          {order.shippingInfo.phone && (
                            <p className="text-sm text-muted-foreground">
                              {order.shippingInfo.phone}
                            </p>
                          )}

                          {order.shippingInfo.address && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>{order.shippingInfo.address}</span>
                            </div>
                          )}

                          {order.shippingInfo.notes && (
                            <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                              Notes: {order.shippingInfo.notes}
                            </p>
                          )}
                        </div>
                      )}

                      {!isAdmin && (
                        <Link to="/products" className="md:self-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full md:w-auto h-10 rounded-xl"
                          >
                            Continue Shopping
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Orders;