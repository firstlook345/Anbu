import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, Youtube } from "lucide-react";
import { PCLogo } from "./PCLogo";

const WhatsappIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 2.15.68 4.14 1.838 5.776L2.5 21.5l3.864-1.309A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.068-1.116l-.292-.174-2.29.776.787-2.234-.19-.303A7.957 7.957 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
  </svg>
);

const Footer = () => (
  <footer className="bg-zinc-950 text-zinc-100 border-t border-zinc-800 shadow-2xl">
    <div className="container mx-auto px-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
        {/* Brand Column */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <PCLogo className="h-6 w-6 brightness-125 drop-shadow-md" />
            <span className="font-display text-base font-black tracking-wider uppercase flex items-center gap-1.5">
              <span className="text-sky-400">GADGET</span>
              <span className="text-orange-500">ZONE</span>
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-normal max-w-xs font-normal">
            Your premier destination for custom gaming rigs, PC hardware, and technical repairs.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-2 pt-1">
            <a
              href="https://wa.me/919345600128"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
              title="Chat on WhatsApp"
            >
              <WhatsappIcon className="h-4 w-4" />
            </a>
            <a
              href="https://www.instagram.com/gadgetzone223?utm_source=qr&igsh=aDRkaGVjdXkwbzI1"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all shadow-sm"
              title="Follow on Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://youtube.com/@vjtechvlogs23?si=QNZ0vegdtb0vjTA4"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
              title="Subscribe on YouTube"
            >
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-white mb-2">
            Quick Links
          </h4>
          <div className="space-y-1 text-xs font-medium text-zinc-300">
            <Link to="/products" className="block hover:text-sky-300 transition-colors">Products</Link>
            <Link to="/services" className="block hover:text-sky-300 transition-colors">Services</Link>
            <Link to="/build-pc" className="block hover:text-sky-300 transition-colors">Build Your PC</Link>
            <Link to="/contact" className="block hover:text-sky-300 transition-colors">Contact Us</Link>
          </div>
        </div>

        {/* Policies */}
        <div>
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-white mb-2">
            Policies
          </h4>
          <div className="space-y-1 text-xs font-medium text-zinc-300 flex flex-col">
            <Link to="/policies?tab=shipping" className="hover:text-sky-300 transition-colors w-fit">Shipping Policy</Link>
            <Link to="/policies?tab=return" className="hover:text-sky-300 transition-colors w-fit">Return Policy</Link>
            <Link to="/policies?tab=warranty" className="hover:text-sky-300 transition-colors w-fit">Warranty Info</Link>
            <Link to="/policies?tab=privacy" className="hover:text-sky-300 transition-colors w-fit">Privacy Policy</Link>
          </div>
        </div>

        {/* Get in Touch */}
        <div>
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-white mb-2">
            Get In Touch
          </h4>
          <div className="space-y-1.5 text-xs font-medium text-zinc-200">
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <span>+91 9345600128</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <span>gadgetzone667@gmail.com</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
              <span className="leading-tight text-zinc-300">No.5, 1st Street, Jayaram Nagar, Nerkundram, Chennai - 600107</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800/80 pt-3 text-center text-xs font-medium text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-1">
        <p>© 2026 GADGET ZONE. All rights reserved.</p>
        <p className="text-zinc-400">Crafted for gamers & PC enthusiasts</p>
      </div>
    </div>
  </footer>
);

export default Footer;
