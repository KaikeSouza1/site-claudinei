// components/Footer.tsx
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full font-sans relative z-10">
      <div className="bg-[#173a57]/80 text-slate-100 py-8 px-4 border-t border-slate-500/20 shadow-[0_-20px_40px_rgba(15,23,42,0.12)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-medium">
          
          <div className="flex items-center gap-4">
            <p className="text-center md:text-left text-slate-200">
              © 2026 - CLAUDINEY W. OTTO JUNIOR<br className="md:hidden"/> 
              CRECI 37016-PR • CNAI 45505
            </p>
            
            {/* Botão do Admin */}
            <Link 
              href="/admin" 
              className="opacity-70 hover:opacity-100 text-slate-100 hover:text-gold transition-all flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-lg border border-slate-400/20" 
              title="Acesso Painel Admin"
            >
              <LayoutDashboard size={14} /> 
              <span className="text-[9px] uppercase tracking-widest font-black hidden sm:inline">ADMIN</span>
            </Link>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex gap-5 text-slate-200">
              <Link
                href="https://www.facebook.com/Ottojrcorretor/"
                target="_blank"
                className="hover:text-gold transition-colors hover:scale-110 transform"
              >
                <FaFacebook size={20} />
              </Link>
              <Link
                href="https://www.instagram.com/claudineyotto_junior_corretor/"
                target="_blank"
                className="hover:text-gold transition-colors hover:scale-110 transform"
              >
                <FaInstagram size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}