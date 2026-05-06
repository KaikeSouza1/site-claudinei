// components/Footer.tsx
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full font-sans relative z-10">
      <div className="bg-[#020b18] text-white py-8 px-4 border-t border-gold/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-medium opacity-70">
          
          <div className="flex items-center gap-4">
            <p className="text-center md:text-left">© 2026 - CLAUDINEY W. OTTO JUNIOR<br className="md:hidden"/> CRECI 37016 • CNAI 45505</p>
            
            {/* Botão do Admin */}
            <Link 
              href="/admin" 
              className="opacity-50 hover:opacity-100 text-white hover:text-gold transition-all flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10" 
              title="Acesso Painel Admin"
            >
              <LayoutDashboard size={14} /> 
              <span className="text-[9px] uppercase tracking-widest font-black hidden sm:inline">ADMIN</span>
            </Link>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex gap-5">
              <Link
                href="https://www.facebook.com/groups/1029143904096852/user/100049462765865/"
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
            <div className="hidden md:block w-px h-5 bg-white/20"></div>
            <Link
              href="https://www.linkedin.com/in/kaike-de-souza-755595281/"
              target="_blank"
              className="hover:text-white transition-colors flex items-center gap-2 group"
            >
              Desenvolvido por{" "}
              <span className="font-bold text-gold group-hover:underline flex items-center gap-1">
                Kaike Souza <FaLinkedin size={14} />
              </span>{" "}
              - 2026
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}