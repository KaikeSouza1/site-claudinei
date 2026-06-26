// components/Footer.tsx
import { FaFacebook, FaInstagram } from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#0f2a40] text-slate-300 py-12 px-6 border-t border-slate-700/50">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-8 font-serif">
        
        {/* Nome e Registro */}
        <div className="text-center space-y-1">
          <h2 className="text-xl tracking-widest text-white uppercase font-bold">
            Claudiney W. Otto Junior
          </h2>
          <p className="text-xs tracking-[0.2em] opacity-70">
            CRECI 37016-PR • CNAI 45505
          </p>
        </div>

        {/* Linha divisória fina */}
        <div className="w-16 h-px bg-slate-600"></div>

        {/* Redes Sociais */}
        <div className="flex gap-8">
          <Link
            href="https://www.facebook.com/Ottojrcorretor/"
            target="_blank"
            className="hover:text-[#c5a059] transition-all duration-300 transform hover:-translate-y-1"
          >
            <FaFacebook size={24} />
          </Link>
          <Link
            href="https://www.instagram.com/claudineyotto_junior_corretor/"
            target="_blank"
            className="hover:text-[#c5a059] transition-all duration-300 transform hover:-translate-y-1"
          >
            <FaInstagram size={24} />
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-[10px] uppercase tracking-widest opacity-40">
          © {new Date().getFullYear()} Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}