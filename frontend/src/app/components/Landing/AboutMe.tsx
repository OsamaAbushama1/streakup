"use client";

import React from "react";
import Image from "next/image";

const AboutMe: React.FC = () => {
  return (
    <section className="relative bg-[#FFFFFF] text-left px-4 sm:px-6 md:px-12 lg:px-8 py-6 sm:py-8">
      <div className="container mx-auto xl:max-w-7xl flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-3xl md:text-4xl font-extrabold text-[#8B7FF7] mb-2">
            The Story of StreakUp
          </h1>
          <h2 className="text-xl sm:text-xl md:text-2xl font-bold text-[#A8A8A8]">
            Streaks, Feedback, and More
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12 w-full">
          <div className="flex-1 max-w-full md:max-w-md lg:max-w-xl">
            <p className="text-[#6d6f72] text-sm sm:text-base md:text-base leading-relaxed whitespace-pre-line">
              StreakUp is a dedicated space for creatives, from designers and
              developers to artists, to grow their skills through structured
              challenges and real community support.
              <br />
              Each challenge guides you step by step to build a project you can
              be proud of, while earning feedback, streaks, and points that
              highlight your progress.
              Whether you&apos;re a beginner or a senior, StreakUp supports your
              journey to build a strong portfolio, stay consistent, and grow
              through practice, gamification, and collaboration.
            </p>
          </div>

          <div className="flex-1 flex justify-center md:justify-center mt-8 md:mt-0 mr-[50px] md:mr-0">
            <Image
              src="/imgs/aboutMe.png"
              alt="About StreakUp"
              width={320}
              height={320}
              className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutMe;
