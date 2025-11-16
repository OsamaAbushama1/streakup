"use client";

import React from "react";

const LandingBanner: React.FC = () => {
  return (
    <section className="bg-white w-full pt-0 pb-16 px-4">
      <div className="max-w-5xl mx-auto bg-[linear-gradient(135deg,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)] backdrop-blur-sm rounded-2xl text-center  px-4 sm:px-10 py-6 shadow-lg">
        <h2 className="text-2xl md:text-4xl font-extrabold text-black mb-4">
          Ready to Start Creating?
        </h2>

        <p className="text-[#2E2E38] text-base md:text-lg mb-4">
          Join to thousands of creatives and start your challenge journey today
        </p>

        <form className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg mx-auto">
          <input
            type="email"
            placeholder="Enter Your E-mail"
            className="w-full sm:flex-1 px-4 py-3 rounded-lg bg-[#FFFFFF] text-black placeholder-[#B0B0B8] focus:outline-none  border-none"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg font-semibold text-black bg-[#F5F5F7] hover:bg-[#e4e4e7] transition shadow-md border border-gray-300"
          >
            Get Started
          </button>
        </form>

        <p className="text-sm text-[#6F4FFF] mt-2 font-semibold">
          <span>No credit card required.</span> Start for free.
        </p>
      </div>
    </section>
  );
};

export default LandingBanner;
