"use client";

import React from "react";
import Image from "next/image";

import { motion } from "framer-motion";

const AboutMe: React.FC = () => {
  return (
    <section className="relative bg-[#FFFFFF] text-left px-4 sm:px-6 md:px-12 lg:px-8 py-6 sm:py-8">
      <div className="container mx-auto xl:max-w-7xl flex flex-col items-center gap-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#8B7FF7] mb-3">
            The Story of StreakUp
          </h1>
          <h2 className="text-xl sm:text-xl md:text-2xl font-bold text-[#A8A8A8]">
            Streaks, Feedback, and More
          </h2>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-[2] max-w-full"
          >
            <p className="text-[#383838] text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-line">
              StreakUp is a dedicated space for creatives, from designers and
              developers to artists, to grow their skills through structured
              challenges and real community support.
              <br />
              <br />
              Each challenge guides you step by step to build a project you can
              be proud of, while earning feedback, streaks, and points that
              highlight your progress.
              <br />
              <br />
              Whether you&apos;re a beginner or a senior, StreakUp supports your
              journey to build a strong portfolio, stay consistent, and grow
              through practice, gamification, and collaboration.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex-1 flex justify-center md:justify-end"
          >
            <Image
              src="/imgs/aboutMe.png"
              alt="About StreakUp"
              width={350}
              height={350}
              className="w-64 h-64 sm:w-80 sm:h-80 md:w-[350px] md:h-[350px] object-contain"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutMe;
