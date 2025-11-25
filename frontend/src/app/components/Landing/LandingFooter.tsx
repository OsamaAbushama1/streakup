"use client";

import React from "react";
import Image from "next/image";
import { FaWhatsapp, FaFacebookF, FaInstagram } from "react-icons/fa";

const LandingFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-gray-200 py-5 px-3 sm:px-7 md:px-12 bg-white">
      <div className="container mx-auto xl:max-w-7xl">
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-xs sm:text-sm font-semibold text-center md:text-left text-black">
            © 2025 StreakUp. Built for creatives, by creatives. All rights
            reserved.
          </p>

          {/* Links */}
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500">
            <a href="#" className="text-[#8981FA] transition">
              Privacy Policy
            </a>
            <span className="text-[#8981FA] font-semibold text-lg">·</span>
            <a href="#" className="text-[#8981FA] transition">
              Terms & Conditions
            </a>
          </div>

          {/* Social Icons */}
          <div className="flex items-center justify-center gap-3">
            <a
              href="#"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-[#C173FF]/40 text-white bg-[#8981FA] transition"
            >
              <FaWhatsapp size={20} />
            </a>
            <a
              href="#"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-[#C173FF]/40 text-white bg-[#8981FA] transition"
            >
              <FaFacebookF size={20} />
            </a>
            <a
              href="#"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-[#C173FF]/40 text-white bg-[#8981FA] transition"
            >
              <FaInstagram size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
