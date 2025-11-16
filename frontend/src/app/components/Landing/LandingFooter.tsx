"use client";

import React from "react";
import Image from "next/image";
import { FaWhatsapp, FaFacebookF, FaInstagram } from "react-icons/fa";

const LandingFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-gray-200 py-5 px-3 sm:px-7 md:px-12 bg-white">
      <div className="container mx-auto xl:max-w-7xl">
        <div className="flex sm:flex-row items-center justify-between gap-4 h-20">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            {/* 👇 بدّل الصورة دي بمسار لوجو موقعك */}
            <Image
              src="/imgs/streakupPoster.png" // ضع هنا مسار الصورة بتاعتك
              alt="Pixel Bloom Logo"
              width={120} // تقدر تعدل العرض والارتفاع حسب حجم اللوجو
              height={40}
              className="object-contain"
            />
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3">
            <a
              href="#"
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border border-[#C173FF]/40 text-[#C173FF] hover:bg-[#C173FF]/10 transition"
            >
              <FaWhatsapp size={16} />
            </a>
            <a
              href="#"
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border border-[#C173FF]/40 text-[#C173FF] hover:bg-[#C173FF]/10 transition"
            >
              <FaFacebookF size={16} />
            </a>
            <a
              href="#"
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border border-[#C173FF]/40 text-[#C173FF] hover:bg-[#C173FF]/10 transition"
            >
              <FaInstagram size={16} />
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-2 text-xs sm:text-sm text-gray-600 text-center md:text-left mt-3">
          <p>
            © 2025 StreakUp. Built for creatives, by creatives. All rights
            reserved.
          </p>

          <div className="flex items-center justify-center gap-2 text-gray-500">
            <a href="#" className="hover:text-[#6F4FFF] transition">
              Privacy Policy
            </a>
            <span>·</span>
            <a href="#" className="hover:text-[#6F4FFF] transition">
              Terms & Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
