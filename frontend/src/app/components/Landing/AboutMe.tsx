"use client";

import React from "react";
import Image from "next/image";

const AboutMe: React.FC = () => {
  return (
    <section className="relative bg-[#FFFFFF] text-left px-4 sm:px-6 md:px-12 lg:px-8 py-6 sm:py-8">
      <div className="container mx-auto xl:max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
        <div className="flex-1 max-w-full md:max-w-md lg:max-w-xl">
          <h1 className="text-3xl sm:text-3xl md:text-4xl font-extrabold text-[#2E2E38] mb-6">
            The Story of StreakUp
          </h1>
          <p className="text-[#6d6f72] text-sm sm:text-base md:text-base leading-relaxed">
            We created StreakUp as a dedicated space for creatives — from
            designers and developers to graphic artists — to level up their
            skills through structured challenges and real community support.
            Unlike scattered exercises, our challenges guide you step by step to
            build complete projects you can be proud of. Along the way,
            you&apos;ll receive feedback, earn streaks and points, and showcase
            your growth inside a vibrant community. Whether you&apos;re just
            starting out or already a senior, StreakUp supports you at every
            stage of your journey. Build your portfolio, stay consistent, and
            grow with the power of practice, gamification, and collaboration.
          </p>
        </div>

        <div className="flex-1 flex justify-center md:justify-end mt-8 md:mt-0 mr-[50px] md:mr-0">
          <Image
            src="/imgs/about-me.png"
            alt="Decorative circle illustration"
            width={320}
            height={320}
            className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain"
          />
        </div>
      </div>
    </section>
  );
};

export default AboutMe;
