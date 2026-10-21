import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const tabs = [
  { id: "shipping", label: "Shipping Policy" },
  { id: "return", label: "Return Policy" },
  { id: "warranty", label: "Warranty Info" },
  { id: "privacy", label: "Privacy Policy" },
];

const Policies = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get("tab") || "shipping";

  const handleTabChange = (value: string) => {
    navigate(`/policies?tab=${value}`);
  };

  return (
    <div className="container mx-auto px-4 py-24 min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-display font-bold mb-2">Our Policies</h1>
        <p className="text-muted-foreground mb-10">Transparency and trust are at the core of our business.</p>
        
        <div className="flex border-b border-border mb-10 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-6 py-4 text-sm font-bold capitalize transition-all relative whitespace-nowrap ${
                activeTab === tab.id 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabPolicy"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-card text-card-foreground p-8 rounded-2xl border border-border shadow-sm min-h-[400px]"
          >
            {activeTab === "shipping" && (
              <>
                <h2 className="text-2xl font-bold mb-6">Shipping Policy</h2>
                <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
                  <p>
                    We offer fast and reliable shipping on all custom PCs and individual components.
                    Most orders are processed within 1-2 business days. Custom PC builds require an
                    additional 3-5 business days for assembly and rigorous testing before shipment.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-bold text-foreground mb-1">Standard Shipping</p>
                      <p className="text-sm">3-5 business days delivery</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-bold text-foreground mb-1">Express Shipping</p>
                      <p className="text-sm">1-2 business days delivery</p>
                    </div>
                  </div>
                  <p className="pt-4 italic text-sm">International Shipping available (customs fees may apply).</p>
                </div>
              </>
            )}
            
            {activeTab === "return" && (
              <>
                <h2 className="text-2xl font-bold mb-6">Return Policy</h2>
                <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
                  <p>
                    If you are not completely satisfied with your purchase, you may return it within
                    30 days of delivery for a full refund or exchange.
                  </p>
                  <p>
                    Returned items must be in their original packaging and condition. For custom-built
                    PCs, a 15% restocking fee may apply unless the return is due to a hardware failure
                    covered under our warranty.
                  </p>
                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl mt-6">
                    <p className="text-sm font-semibold text-destructive">Condition Requirements:</p>
                    <p className="text-sm">Items must include all original accessories, manuals, and protective films for a successful return.</p>
                  </div>
                </div>
              </>
            )}
            
            {activeTab === "warranty" && (
              <>
                <h2 className="text-2xl font-bold mb-6">Warranty Information</h2>
                <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
                  <p>
                    Every Custom PC built by GADGET ZONE comes with a comprehensive
                    3-year parts and labor warranty standard.
                  </p>
                  <ul className="space-y-4 mt-6">
                    <li className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">1</div>
                      <div>
                        <p className="font-bold text-foreground">3-Year Standard Warranty</p>
                        <p className="text-sm">Covers all custom system builds including labor.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">2</div>
                      <div>
                        <p className="font-bold text-foreground">Refurbished Parts</p>
                        <p className="text-sm">1-year warranty on certified pre-owned hardware.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">3</div>
                      <div>
                        <p className="font-bold text-foreground">Manufacturer Support</p>
                        <p className="text-sm">Individual components carry their own direct warranties.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </>
            )}
            
            {activeTab === "privacy" && (
              <>
                <h2 className="text-2xl font-bold mb-6">Privacy Policy</h2>
                <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
                  <p>
                    Your privacy is important to us. We collect personal information to process your
                    orders and improve your shopping experience. We do not sell your personal data
                    to third parties.
                  </p>
                  <p>
                    Secure Socket Layer (SSL) encryption is used for all sensitive transactions,
                    ensuring that your payment data is securely handled.
                  </p>
                  <div className="p-4 rounded-xl border border-border bg-muted/30">
                    <p className="text-xs italic leading-relaxed">
                      We comply with all relevant data protection standards to ensure your account 
                      and payment security remains compromised.
                    </p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Policies;
