"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import LandingHeader from "./LandingHeader";

import { motion } from "framer-motion";

const HeroSection: React.FC = () => {
  const handleScroll = () => {
    const nextSection = document.getElementById("next-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }
  };
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center h-[100vh] overflow-hidden"
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover -z-1"
      >
        <source src="/vid/HeroSct.mp4" type="video/mp4" />
      </video>
      <LandingHeader />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center -mt-[70px]"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.8, ease: "easeInOut" } },
          }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full text-white font-semibold shadow pt-2 pr-4.5 pb-2 pl-2.25 bg-white/32 border border-white/12 text-sm sm:text-base mt-8">
            <span className="bg-white/12 border border-white/30 backdrop-blur-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.2),inset_0_0_10px_rgba(255,255,255,0.1)] rounded-full flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 ">
              <Image
                src="/imgs/star.png"
                alt="star icon"
                width={24}
                height={24}
                className="w-4 h-4 sm:w-6 sm:h-6 md:w-4 md:h-4"
              />
            </span>
            Challenges that Build Skills
          </span>
        </motion.div>

        <motion.h1
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
          }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-8xl font-bold text-white mt-4 mb-4 sm:mb-6"
        >
          Level Up Your<br />Creative Skills
        </motion.h1>

        <motion.p
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
          }}
          className="text-[#ffffff] max-w-md sm:max-w-lg md:max-w-2xl mb-6 sm:mb-8 text-sm sm:text-base md:text-lg"
        >
          Join to challenges for designers, developers, and Graphic Designers.
          Build your portfolio, earn points, and grow with a vibrant creative
          community.
        </motion.p>

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
          }}
        >
          <Link
            href="/challenge-center"
            className="px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-3 text-[#ffffff] font-semibold rounded-full hover:bg-white/20 transition bg-white/40 border border-white/30 backdrop-blur-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.2),inset_0_0_10px_rgba(255,255,255,0.1)] text-sm sm:text-base"
          >
            Start the Challenge for Free
          </Link>
        </motion.div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute bottom-4 flex flex-col items-center "
        onClick={handleScroll}
      >
        <div className="w-6 h-10 sm:w-7 sm:h-12 border-2 border-white rounded-full flex items-start justify-center">
          <div className="w-1.5 h-3 sm:h-4 bg-white rounded-full mt-2 animate-bounce"></div>
        </div>
        <span className="text-base sm:text-lg text-white mt-2">
          Scroll down
        </span>

        <span className="animate-bounce text-3xl sm:text-4xl text-white">
          ↓
        </span>
      </motion.button>
    </section>
  );
};

export default HeroSection;
