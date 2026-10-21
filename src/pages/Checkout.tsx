
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { firestoreDb } from "../firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Package,
  ArrowLeft,
  CreditCard,
  ShoppingBag,
  Loader2,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ShippingForm {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

interface SavedOrder {
  id: string;
  trackingId: string;
  paymentMethod: string;
  estimatedDeliveryDate: string;
  totalPrice: number;
  status: string;
}

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [placed, setPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<SavedOrder | null>(null);

  const [form, setForm] = useState<ShippingForm>({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const handlePlace = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in to place an order.");
      navigate("/login");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.address.trim()
    ) {
      toast.error("Please fill in all required shipping fields.");
      return;
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone.trim())) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setLoading(true);

    try {
      const trackingId = `TRK-GZ-${Math.floor(
        100000 + Math.random() * 900000
      )}`;

      const paymentMethod = "Cash on Delivery (COD)";

      const estimatedDeliveryDate = new Date(
        Date.now() + 4 * 24 * 60 * 60 * 1000
      ).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      // Preserve custom PC component details when saving each cart item.
      const orderItems = items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        type: item.type,
        components: item.components ?? [],
      }));

      const orderData = {
        userId: user.id,
        userEmail: user.email,

        items: orderItems,

        totalPrice: Number(totalPrice),

        shippingInfo: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          notes: form.notes.trim(),
        },

        paymentMethod,
        trackingId,
        courier: "SpeedPost Express",
        estimatedDeliveryDate,
        status: "Pending",
        createdAt: serverTimestamp(),
      };

      // Save the order to Firebase Firestore.
      const orderRef = await addDoc(
        collection(firestoreDb, "orders"),
        orderData
      );

      // Only clear the cart after Firestore successfully saves the order.
      setOrderDetails({
        id: orderRef.id,
        trackingId,
        paymentMethod,
        estimatedDeliveryDate,
        totalPrice: Number(totalPrice),
        status: "Pending",
      });

      clearCart();
      setPlaced(true);

      toast.success("Your order has been saved successfully!");
    } catch (error) {
      console.error("Checkout / Firestore error:", error);

      toast.error(
        "Unable to save your order. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Order confirmation screen
  if (placed && orderDetails) {
    return (
      <div className="min-h-screen min-h-dvh pt-24 pb-16 flex flex-col items-center justify-center bg-background px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card p-8 sm:p-10 rounded-3xl border border-border shadow-2xl flex flex-col items-center text-center max-w-lg w-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="bg-emerald-500/20 p-4 rounded-full mb-5 relative border border-emerald-500/30">
            <CheckCircle2 className="h-16 w-16 text-emerald-400" />
          </div>

          <h1 className="font-display text-3xl font-extrabold mb-2">
            Order Confirmed!
          </h1>

          <p className="text-muted-foreground text-sm mb-6 leading-relaxed relative z-10">
            Thank you,{" "}
            <span className="text-foreground font-bold">
              {form.name}
            </span>
            ! Your order has been saved successfully. You can view its
            status from your orders page.
          </p>

          <div className="w-full bg-muted/40 rounded-2xl p-5 mb-6 border border-border text-left space-y-3">
            <div className="flex justify-between items-center gap-3 pb-2 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Order ID
              </span>
              <span className="font-mono text-xs font-bold break-all text-right">
                {orderDetails.id}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3 pb-2 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tracking Number
              </span>
              <span className="font-mono text-xs font-bold text-sky-400">
                {orderDetails.trackingId}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3 pb-2 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Payment Method
              </span>
              <span className="text-xs font-semibold text-foreground text-right">
                {orderDetails.paymentMethod}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3 pb-2 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Order Status
              </span>
              <span className="text-xs font-semibold text-amber-400">
                {orderDetails.status}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Estimated Delivery
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                {orderDetails.estimatedDeliveryDate}
              </span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-sm font-bold">Total Paid at Delivery</span>
              <span className="font-display text-lg font-black text-primary">
                ₹{orderDetails.totalPrice.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <Link to="/orders" className="w-full">
              <Button
                size="lg"
                className="w-full h-12 font-bold rounded-xl bg-sky-500 text-white shadow-md hover:bg-sky-600"
              >
                <Truck className="h-4 w-4 mr-2" />
                Track Order Status
              </Button>
            </Link>

            <Link to="/products" className="w-full">
              <Button
                size="lg"
                variant="outline"
                className="w-full h-12 font-bold rounded-xl border-border"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Keep Shopping
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Empty cart screen
  if (items.length === 0) {
    return (
      <div className="min-h-screen min-h-dvh pt-32 pb-16 flex flex-col items-center justify-center bg-background px-4">
        <div className="bg-muted/30 p-10 rounded-full mb-6 border border-border/50">
          <Package className="h-16 w-16 text-muted-foreground stroke-1" />
        </div>

        <h2 className="font-display text-3xl font-bold mb-3 tracking-tight">
          Your Cart is Empty
        </h2>

        <p className="text-muted-foreground mb-8 text-center max-w-sm">
          You need items in your cart to proceed with checkout. Let's fix that!
        </p>

        <Link to="/products">
          <Button size="lg" className="rounded-xl px-8 shadow-md">
            Browse Hardware
          </Button>
        </Link>
      </div>
    );
  }

  // Checkout form and order summary
  return (
    <div className="min-h-screen min-h-dvh pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link
          to="/cart"
          className="inline-flex items-center font-medium text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl font-extrabold tracking-tight mb-8">
            Secure Checkout
          </h1>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Shipping information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 text-sm">
                  1
                </div>
                Shipping Information
              </h2>

              <form
                id="checkout-form"
                onSubmit={handlePlace}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-muted-foreground font-medium"
                    >
                      Full Name <span className="text-destructive">*</span>
                    </Label>

                    <Input
                      id="name"
                      required
                      maxLength={100}
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) =>
                        setForm((previous) => ({
                          ...previous,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Your full name"
                      className="h-12 bg-muted/30 rounded-xl border-border focus-visible:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-muted-foreground font-medium"
                    >
                      Phone Number <span className="text-destructive">*</span>
                    </Label>

                    <Input
                      id="phone"
                      required
                      type="tel"
                      maxLength={20}
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((previous) => ({
                          ...previous,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="+91 9876543210"
                      className="h-12 bg-muted/30 rounded-xl border-border focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="address"
                    className="text-muted-foreground font-medium"
                  >
                    Full Delivery Address{" "}
                    <span className="text-destructive">*</span>
                  </Label>

                  <Textarea
                    id="address"
                    required
                    maxLength={1000}
                    autoComplete="street-address"
                    value={form.address}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        address: e.target.value,
                      }))
                    }
                    placeholder="House/Flat No, Street, City, State, Pincode"
                    className="min-h-[100px] bg-muted/30 rounded-xl border-border focus-visible:ring-primary/20"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <Label
                    htmlFor="notes"
                    className="text-muted-foreground font-medium"
                  >
                    Order Notes{" "}
                    <span className="text-muted-foreground/50 font-normal">
                      (Optional)
                    </span>
                  </Label>

                  <Textarea
                    id="notes"
                    maxLength={1000}
                    value={form.notes}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Special delivery instructions, gate codes, etc."
                    className="min-h-[80px] bg-muted/30 rounded-xl border-border focus-visible:ring-primary/20"
                  />
                </div>
              </form>
            </div>

            {/* Payment method */}
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm mt-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 text-sm">
                  2
                </div>
                Payment Method
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-5 rounded-2xl border-2 border-sky-500 bg-sky-500/10 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard className="h-6 w-6 text-sky-400" />

                    <div className="w-5 h-5 rounded-full border border-sky-500 bg-sky-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  </div>

                  <p className="font-bold text-base text-foreground">
                    Cash on Delivery (COD)
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    Pay in cash when your order arrives. No advance online
                    payment is required.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Order summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sm sticky top-24">
              <h2 className="text-xl font-bold mb-6 border-b border-border pb-4">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="text-sm border-b border-border/60 pb-4 last:border-0"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-semibold text-foreground">
                          {item.name}
                        </p>

                        <p className="text-muted-foreground mt-1 text-xs">
                          Qty: {item.quantity} × ₹
                          {item.price.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <span className="font-bold text-right shrink-0">
                        ₹
                        {(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {item.type === "build" && item.components?.length ? (
                      <div className="mt-3 ml-2 pl-3 border-l-2 border-sky-500/40 space-y-2">
                        <p className="text-xs font-semibold text-sky-400">
                          PC components
                        </p>

                        {item.components.map((component) => (
                          <div
                            key={`${component.category}-${component.id}`}
                            className="flex justify-between gap-3 text-xs"
                          >
                            <span className="text-muted-foreground">
                              {component.category}: {component.name}
                            </span>

                            <span className="shrink-0">
                              ₹
                              {Number(component.price).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-border text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} units)</span>
                  <span className="font-medium text-foreground">
                    ₹{totalPrice.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-medium text-emerald-400">FREE</span>
                </div>

                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Payment</span>
                  <span className="font-semibold text-sky-400">
                    Cash on Delivery
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border flex justify-between items-center gap-3">
                <span className="text-lg font-bold">Total</span>

                <span className="font-display text-2xl font-black text-primary">
                  ₹{totalPrice.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="mt-8">
                <Button
                  type="submit"
                  form="checkout-form"
                  size="lg"
                  className="w-full h-14 text-base font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white"
                  disabled={loading || !user || items.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Saving Order...
                    </>
                  ) : (
                    "Confirm & Place Order"
                  )}
                </Button>

                {!user && (
                  <p className="text-xs text-amber-500 mt-3 text-center flex justify-center items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Please log in before placing your order.
                  </p>
                )}

                <p className="text-[11px] text-center text-muted-foreground mt-4 leading-relaxed max-w-[90%] mx-auto">
                  Your order and delivery details will be saved to your account.
                  Payment is due upon delivery.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
