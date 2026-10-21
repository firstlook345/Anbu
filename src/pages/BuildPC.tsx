
import { useState, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  AlertTriangle,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { pcComponents as initialPcComponents } from "../data/products";

interface PCComponent {
  id: string;
  category: string;
  name: string;
  price: number;
  brand: string;
  specs: string;
}

const categoryLabels: Record<string, string> = {
  processor: "Processor (CPU)",
  motherboard: "Motherboard",
  ram: "Memory (RAM)",
  storage: "Storage",
  gpu: "Graphics Card (GPU)",
  psu: "Power Supply (PSU)",
  cooling: "CPU Cooler",
  case: "Case",
};

const REQUIRED_CATEGORIES = Object.keys(categoryLabels);

const BuildPC = () => {
  const { addItem } = useCart();

  const [pcComponents, setPcComponents] = useState<
    Record<string, PCComponent[]>
  >({});
  const [selections, setSelections] = useState<
    Record<string, PCComponent | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchComponents = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/api/components");

        if (!response.ok) {
          throw new Error("Could not load components from the server.");
        }

        const data: Record<string, PCComponent[]> = await response.json();

        if (!cancelled) {
          if (data && Object.keys(data).length > 0) {
            setPcComponents(data);
          } else {
            setPcComponents(initialPcComponents);
          }
        }
      } catch (error) {
        console.warn(
          "BuildPC: Using local component data because the API is unavailable.",
          error
        );

        if (!cancelled) {
          setPcComponents(initialPcComponents);
          setLoadError(
            "Live component data is unavailable. Showing the available local component list."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchComponents();

    return () => {
      cancelled = true;
    };
  }, []);

  const select = (category: string, id: string) => {
    const component =
      pcComponents[category]?.find((item) => item.id === id) ?? null;

    setSelections((previous) => ({
      ...previous,
      [category]: component,
    }));
  };

  const selectedComponents = useMemo(
    () =>
      REQUIRED_CATEGORIES
        .map((category) => selections[category])
        .filter((component): component is PCComponent => component !== null && component !== undefined),
    [selections]
  );

  const selectedCount = selectedComponents.length;
  const isComplete = REQUIRED_CATEGORIES.every(
    (category) => selections[category] !== null && selections[category] !== undefined
  );

  const totalPrice = useMemo(
    () =>
      selectedComponents.reduce(
        (sum, component) => sum + Number(component.price || 0),
        0
      ),
    [selectedComponents]
  );

  const addBuildToCart = () => {
    const missingCategories = REQUIRED_CATEGORIES.filter(
      (category) => !selections[category]
    );

    if (missingCategories.length > 0) {
      toast.error("Please select all 8 PC components before adding to cart.");
      return;
    }

    // Keep components in the same order as the form.
    const parts = REQUIRED_CATEGORIES.map(
      (category) => selections[category]!
    );

    const buildPrice = parts.reduce(
      (sum, component) => sum + Number(component.price),
      0
    );

    const buildId = `build-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    addItem({
      id: buildId,
      name: "Custom PC Build",
      price: buildPrice,
      type: "build",
      components: parts,
    });

    toast.success("Complete PC build added to cart!");
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">
          Loading hardware database...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3">
            Build Your PC
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            Select all eight components to build your dream machine. Review
            every component and its price before adding your PC to the cart.
          </p>
        </motion.div>

        {loadError && (
          <div className="max-w-4xl mx-auto mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <p className="text-muted-foreground">{loadError}</p>
          </div>
        )}

        <div className="max-w-4xl 2xl:max-w-5xl mx-auto">
          <div className="space-y-3 sm:space-y-4 mb-8">
            {REQUIRED_CATEGORIES.map((category, index) => {
              const componentOptions = pcComponents[category] || [];
              const selected = selections[category];

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl border border-border p-4 sm:p-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="sm:w-48 shrink-0">
                      <label
                        htmlFor={`component-${category}`}
                        className="font-display font-semibold text-xs sm:text-sm text-foreground"
                      >
                        {categoryLabels[category]}
                      </label>
                    </div>

                    <select
                      id={`component-${category}`}
                      value={selected?.id || ""}
                      onChange={(event) =>
                        select(category, event.target.value)
                      }
                      className="flex-1 min-w-0 px-3.5 py-2.5 rounded-lg bg-secondary text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">
                        Select {categoryLabels[category]}
                      </option>

                      {componentOptions.map((component) => (
                        <option key={component.id} value={component.id}>
                          {component.name} — ₹
                          {Number(component.price).toLocaleString()} (
                          {component.specs})
                        </option>
                      ))}
                    </select>

                    <div className="sm:w-28 text-left sm:text-right font-display font-bold text-xs sm:text-sm text-primary">
                      {selected
                        ? `₹${Number(selected.price).toLocaleString()}`
                        : "—"}
                    </div>
                  </div>

                  {selected && (
                    <div className="mt-3 sm:ml-48 text-xs text-muted-foreground">
                      <span>{selected.brand}</span>
                      <span className="mx-2">·</span>
                      <span>{selected.specs}</span>
                    </div>
                  )}

                  {componentOptions.length === 0 && (
                    <p className="mt-2 text-xs text-amber-500 sm:ml-48">
                      No components are currently available in this category.
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Selected component summary */}
          {selectedComponents.length > 0 && (
            <div className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="font-display font-bold text-sm sm:text-base mb-3">
                Your Selected Components ({selectedCount}/8)
              </h2>

              <div className="space-y-2">
                {REQUIRED_CATEGORIES.map((category) => {
                  const component = selections[category];

                  if (!component) return null;

                  return (
                    <div
                      key={category}
                      className="flex flex-wrap justify-between gap-2 text-xs sm:text-sm"
                    >
                      <span className="text-muted-foreground">
                        {categoryLabels[category]}: {component.name}
                      </span>

                      <span className="font-semibold">
                        ₹{Number(component.price).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sticky total and Add to Cart */}
          <div className="sticky bottom-4 z-40 bg-card/95 backdrop-blur rounded-xl border border-border p-4 sm:p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {isComplete ? (
                    <Check className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                  )}

                  <span className="font-display font-semibold text-sm sm:text-base">
                    {isComplete
                      ? "Build Complete!"
                      : `${selectedCount}/8 components selected`}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isComplete
                    ? "Your build is ready to add to the cart."
                    : "Select all eight components to continue."}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-semibold">
                    Total Price
                  </p>

                  <p className="font-display text-xl sm:text-2xl font-black text-primary">
                    ₹{totalPrice.toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={addBuildToCart}
                  disabled={!isComplete}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildPC;
